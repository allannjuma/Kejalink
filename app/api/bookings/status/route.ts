import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

// POST { bookingId, status: 'confirmed' | 'cancelled' } — caretaker updates a
// booking for a room in their own building. Auth: Supabase access token in
// the Authorization header.
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { bookingId, status } = await req.json()
    if (typeof bookingId !== 'string' || (status !== 'confirmed' && status !== 'cancelled')) {
      return NextResponse.json({ error: 'bookingId and a valid status are required' }, { status: 400 })
    }

    // Verify the token with a plain anon client
    const anon = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const {
      data: { user },
      error: authError,
    } = await anon.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseAdmin = createAdminClient()

    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('role, building_id')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'building_admin' || !profile.building_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: booking } = await supabaseAdmin
      .from('bookings')
      .select('id, rooms(building_id)')
      .eq('id', bookingId)
      .single()

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    const roomBuildingId = (booking.rooms as unknown as { building_id: string } | null)?.building_id
    if (roomBuildingId !== profile.building_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error } = await supabaseAdmin
      .from('bookings')
      .update({ status })
      .eq('id', bookingId)

    if (error) {
      console.error('Booking status update error:', error)
      return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Booking status update error:', error)
    return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 })
  }
}
