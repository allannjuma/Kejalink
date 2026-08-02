import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { getTenantPhoneSession } from '@/lib/session'

export async function POST(req: Request) {
  try {
    const { roomId, tenant_name, phone, viewing_time, move_in_date } = await req.json()

    if (!roomId || !tenant_name || !phone || !viewing_time || !move_in_date) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
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

    // Generate ref code e.g. BK-2041
    const refCode = `BK-${Math.floor(1000 + Math.random() * 9000)}`

    // Insert booking
    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .insert({
        room_id: roomId,
        tenant_name,
        phone,
        viewing_time,
        move_in_date,
        ref_code: refCode,
        status: 'pending'
      })
      .select('id')
      .single()

    if (error) {
      console.error('Booking insertion error:', error)
      return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })
    }

    return NextResponse.json({ success: true, bookingId: booking.id, ref_code: refCode })
  } catch (error: any) {
    console.error('Booking API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
