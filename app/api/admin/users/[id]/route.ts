import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const id = resolvedParams.id
    
    const body = await request.json()
    const { name, phone, email } = body

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // 1. Check if the user exists and is actually a building_admin
    const { data: userRow, error: fetchError } = await supabase
      .from('users')
      .select('email, role')
      .eq('id', id)
      .single()

    if (fetchError || !userRow) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (userRow.role !== 'building_admin') {
      return NextResponse.json({ error: 'Cannot edit this user type' }, { status: 403 })
    }

    // 2. If email changed, update it in auth.users
    if (email !== userRow.email) {
      const { error: authUpdateError } = await supabase.auth.admin.updateUserById(id, {
        email: email,
      })

      if (authUpdateError) {
        return NextResponse.json(
          { error: `Auth email update failed: ${authUpdateError.message}` },
          { status: 400 }
        )
      }
    }

    // 3. Update public.users profile
    const { error: updateError } = await supabase
      .from('users')
      .update({
        name,
        phone: phone || null,
        email,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}
