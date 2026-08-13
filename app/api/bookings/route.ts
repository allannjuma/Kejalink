import { randomInt } from 'node:crypto'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { getTenantPhoneSession } from '@/lib/session'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const REF_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

function generateRefCode(): string {
  let suffix = ''
  for (let i = 0; i < 6; i++) {
    suffix += REF_ALPHABET[randomInt(REF_ALPHABET.length)]
  }
  return `BK-${suffix}`
}

export async function POST(req: Request) {
  try {
    const { roomId, tenant_name, viewing_time, move_in_date } = await req.json()

    if (!roomId || !tenant_name || !viewing_time || !move_in_date) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    if (typeof roomId !== 'string' || !UUID_RE.test(roomId)) {
      return NextResponse.json({ error: 'Invalid room' }, { status: 400 })
    }

    if (typeof tenant_name !== 'string' || tenant_name.trim().length < 2 || tenant_name.trim().length > 80) {
      return NextResponse.json({ error: 'Name must be between 2 and 80 characters' }, { status: 400 })
    }

    if (isNaN(Date.parse(viewing_time)) || isNaN(Date.parse(move_in_date))) {
      return NextResponse.json({ error: 'Invalid dates' }, { status: 400 })
    }

    // Verify user is unlocked
    const sessionPhone = await getTenantPhoneSession()
    if (!sessionPhone) {
      return NextResponse.json({ error: 'Unauthorized. Please unlock the listing first.' }, { status: 401 })
    }

    const supabaseAdmin = createAdminClient()

    // Check passes
    const { data: passes } = await supabaseAdmin
      .from('passes')
      .select('id')
      .eq('phone', sessionPhone)
      .eq('status', 'paid')
      .gt('expires_at', new Date().toISOString())
      .limit(1)

    if (!passes || passes.length === 0) {
      return NextResponse.json({ error: 'Your pass has expired or is invalid.' }, { status: 403 })
    }

    // Room must exist and be bookable
    const { data: room } = await supabaseAdmin
      .from('rooms')
      .select('id, state')
      .eq('id', roomId)
      .single()

    if (!room || room.state !== 'live') {
      return NextResponse.json({ error: 'This room is no longer available.' }, { status: 400 })
    }

    // Insert booking, retrying on ref_code unique-violation
    let bookingId: string | null = null
    let refCode = ''
    for (let attempt = 0; attempt < 3; attempt++) {
      refCode = generateRefCode()
      const { data: booking, error } = await supabaseAdmin
        .from('bookings')
        .insert({
          room_id: roomId,
          tenant_name: tenant_name.trim(),
          phone: sessionPhone,
          viewing_time,
          move_in_date,
          ref_code: refCode,
          status: 'pending',
        })
        .select('id')
        .single()

      if (!error && booking) {
        bookingId = booking.id
        break
      }
      if (error?.code !== '23505') {
        console.error('Booking insertion error:', error)
        return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })
      }
    }

    if (!bookingId) {
      console.error('Booking insertion error: ref_code collision after 3 attempts')
      return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })
    }

    return NextResponse.json({ success: true, bookingId, ref_code: refCode })
  } catch (error) {
    console.error('Booking API error:', error)
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })
  }
}
