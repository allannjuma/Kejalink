import { NextResponse } from 'next/server'
import { createAdminClient, findAuthUserByEmail, isDuplicateEmailError } from '@/lib/supabase-admin'

export async function POST(req: Request) {
  try {
    const { name, email, password, role } = await req.json()
    const validRoles = ['super_admin', 'building_admin']

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 })
    }
    if (role && !validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role.' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    // Create user directly via admin API — NO email confirmation needed.
    // If the email already exists in Auth but has no public.users row (an
    // orphaned account from an earlier failed attempt), adopt it: reset its
    // password and attach the profile below.
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // skip email confirmation step
    })

    let authUserId: string
    let adoptedOrphan = false

    if (authError || !authData.user) {
      if (!isDuplicateEmailError(authError)) {
        return NextResponse.json(
          { error: authError?.message ?? 'Failed to create auth user' },
          { status: 400 }
        )
      }

      const { user: existing, error: lookupError } = await findAuthUserByEmail(adminClient, email)
      if (lookupError || !existing) {
        return NextResponse.json(
          { error: authError?.message ?? 'Failed to create auth user' },
          { status: 400 }
        )
      }

      const { data: existingProfile } = await adminClient
        .from('users')
        .select('id')
        .eq('id', existing.id)
        .maybeSingle()

      if (existingProfile) {
        return NextResponse.json(
          { error: 'An account with this email already exists.' },
          { status: 400 }
        )
      }

      const { error: adoptError } = await adminClient.auth.admin.updateUserById(existing.id, {
        password,
        email_confirm: true,
      })

      if (adoptError) {
        return NextResponse.json({ error: adoptError.message }, { status: 400 })
      }

      authUserId = existing.id
      adoptedOrphan = true
    } else {
      authUserId = authData.user.id
    }

    // Insert into public.users with the requested role
    const { error: profileError } = await adminClient.from('users').insert({
      id: authUserId,
      name,
      email,
      role: role || 'building_admin',
      verified: true,
    })

    if (profileError) {
      // Clean up auth user if profile insert fails — but never delete an
      // adopted orphan's pre-existing auth account.
      if (!adoptedOrphan) await adminClient.auth.admin.deleteUser(authUserId)
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}
