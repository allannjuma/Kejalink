import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { getTenantPhoneSession } from '@/lib/session'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Public columns only — phone stays server-side (tenant PII).
const REVIEW_SELECT = 'id, room_id, tenant_name, rating, comment, created_at'

export async function GET(req: Request) {
  try {
    const roomId = new URL(req.url).searchParams.get('roomId')

    if (!roomId || !UUID_RE.test(roomId)) {
      return NextResponse.json({ error: 'A valid roomId is required' }, { status: 400 })
    }

    const supabaseAdmin = createAdminClient()
    const { data: reviews, error } = await supabaseAdmin
      .from('reviews')
      .select(REVIEW_SELECT)
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Reviews fetch error:', error)
      return NextResponse.json({ error: 'Failed to load reviews' }, { status: 500 })
    }

    const rows = reviews ?? []
    const count = rows.length
    const average =
      count > 0
        ? Math.round((rows.reduce((sum, r) => sum + r.rating, 0) / count) * 10) / 10
        : null

    return NextResponse.json({ reviews: rows, average, count })
  } catch (error) {
    console.error('Reviews GET error:', error)
    return NextResponse.json({ error: 'Failed to load reviews' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    // Spam gate: only tenants who unlocked a listing (paid pass sets the
    // session cookie) may review.
    const sessionPhone = await getTenantPhoneSession()
    if (!sessionPhone) {
      return NextResponse.json(
        { error: 'Unauthorized. Please unlock the listing first.' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { roomId, tenant_name, rating, comment } = body ?? {}

    if (!roomId || !UUID_RE.test(roomId)) {
      return NextResponse.json({ error: 'A valid roomId is required' }, { status: 400 })
    }

    const name = typeof tenant_name === 'string' ? tenant_name.trim() : ''
    if (name.length < 2 || name.length > 80) {
      return NextResponse.json({ error: 'Name must be 2–80 characters' }, { status: 400 })
    }

    const stars = Number(rating)
    if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
    }

    let text: string | null = null
    if (comment != null) {
      if (typeof comment !== 'string' || comment.length > 500) {
        return NextResponse.json({ error: 'Comment must be 500 characters or fewer' }, { status: 400 })
      }
      text = comment.trim() || null
    }

    const supabaseAdmin = createAdminClient()

    // Verify the room exists before writing.
    const { data: room } = await supabaseAdmin
      .from('rooms')
      .select('id')
      .eq('id', roomId)
      .single()

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    // One review per phone per room — re-posting updates the existing review.
    const { data: review, error } = await supabaseAdmin
      .from('reviews')
      .upsert(
        {
          room_id: roomId,
          phone: sessionPhone,
          tenant_name: name,
          rating: stars,
          comment: text,
        },
        { onConflict: 'room_id,phone' }
      )
      .select(REVIEW_SELECT)
      .single()

    if (error) {
      console.error('Review upsert error:', error)
      return NextResponse.json({ error: 'Failed to save review' }, { status: 500 })
    }

    return NextResponse.json({ success: true, review })
  } catch (error) {
    console.error('Reviews POST error:', error)
    return NextResponse.json({ error: 'Failed to save review' }, { status: 500 })
  }
}
