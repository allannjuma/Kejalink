import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

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

    // Create user directly via admin API — NO email confirmation needed
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // skip email confirmation step
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    // Insert into public.users with super_admin role
    const { error: profileError } = await adminClient.from('users').insert({
      id: authData.user.id,
      name,
      email,
      role: role || 'building_admin',
      verified: true,
    })

    if (profileError) {
      // Clean up auth user if profile insert fails
      await adminClient.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
