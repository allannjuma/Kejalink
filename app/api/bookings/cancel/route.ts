import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { getTenantPhoneSession } from '@/lib/session'

// POST { refCode } — tenant cancels their own pending booking.
export async function POST(req: Request) {
  try {
    const { refCode } = await req.json()

    if (typeof refCode !== 'string' || !refCode.trim()) {
      return NextResponse.json({ error: 'Booking reference is required' }, { status: 400 })
    }

    const sessionPhone = await getTenantPhoneSession()
    if (!sessionPhone) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseAdmin = createAdminClient()

    const { data: booking } = await supabaseAdmin
      .from('bookings')
      .select('id, phone, status')
      .eq('ref_code', refCode.trim().toUpperCase())
      .single()

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }
    if (booking.phone !== sessionPhone) {
      return NextResponse.json({ error: 'You can only cancel your own bookings' }, { status: 403 })
    }
    if (booking.status !== 'pending') {
      return NextResponse.json({ error: 'Only pending bookings can be cancelled' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', booking.id)

    if (error) {
      console.error('Booking cancel error:', error)
      return NextResponse.json({ error: 'Failed to cancel booking' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Booking cancel error:', error)
    return NextResponse.json({ error: 'Failed to cancel booking' }, { status: 500 })
  }
}
