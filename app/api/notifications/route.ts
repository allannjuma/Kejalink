import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase-admin'

// Verifies the Bearer token from the Authorization header and returns the
// caller's user id, but only if they are a building_admin. Returns null for
// any failure (missing/invalid token, wrong role).
async function getCaretakerId(request: Request): Promise<string | null> {
  const authHeader = request.headers.get('authorization') ?? ''
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length)
    : null
  if (!token) return null

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) return null

  const anon = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data, error } = await anon.auth.getUser(token)
  if (error || !data.user) return null

  const admin = createAdminClient()
  const { data: userRow } = await admin
    .from('users')
    .select('role')
    .eq('id', data.user.id)
    .single()

  if (!userRow || userRow.role !== 'building_admin') return null
  return data.user.id
}

export async function GET(request: Request) {
  try {
    const userId = await getCaretakerId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()

    const { data, error } = await admin
      .from('notifications')
      .select('id, type, title, body, link, read, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      return NextResponse.json(
        { error: 'Failed to load notifications' },
        { status: 500 }
      )
    }

    const { count, error: countError } = await admin
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false)

    if (countError) {
      return NextResponse.json(
        { error: 'Failed to load notifications' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      notifications: data ?? [],
      unreadCount: count ?? 0,
    })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getCaretakerId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    const admin = createAdminClient()

    if (body?.all === true) {
      const { error } = await admin
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false)

      if (error) {
        return NextResponse.json(
          { error: 'Failed to update notifications' },
          { status: 500 }
        )
      }
    } else if (Array.isArray(body?.ids) && body.ids.length > 0) {
      const { error } = await admin
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .in('id', body.ids)

      if (error) {
        return NextResponse.json(
          { error: 'Failed to update notifications' },
          { status: 500 }
        )
      }
    } else {
      return NextResponse.json(
        { error: 'Provide ids or all: true' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
