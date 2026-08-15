import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

// Readable temp password, e.g. "Keja-4f8k2m9xpw" — no ambiguous characters.
function generateTempPassword() {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789'
  const bytes = crypto.getRandomValues(new Uint8Array(12))
  let suffix = ''
  for (const b of bytes) suffix += chars[b % chars.length]
  return `Keja-${suffix}`
}

// POST /api/admin/users/[id]/reset-password
// Sets a new random temp password for a caretaker and returns it ONCE so the
// super admin can copy it. The password is never stored in the database.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createAdminClient()

    // Only caretakers (building_admin) can be reset through this route.
    const { data: userRow, error: fetchError } = await supabase
      .from('users')
      .select('role')
      .eq('id', id)
      .maybeSingle()

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }
    if (!userRow) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    if (userRow.role !== 'building_admin') {
      return NextResponse.json({ error: 'Cannot reset this user type' }, { status: 403 })
    }

    const tempPassword = generateTempPassword()
    const { error: updateError } = await supabase.auth.admin.updateUserById(id, {
      password: tempPassword,
    })

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 })
    }

    return NextResponse.json({ tempPassword })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}
