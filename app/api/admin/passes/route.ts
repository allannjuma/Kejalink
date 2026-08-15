import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

// GET /api/admin/passes
// Returns all viewing passes, newest first, plus aggregate revenue stats.
// Uses the service-role client so RLS on the passes table never blocks the admin view.
export async function GET() {
  let supabase
  try {
    supabase = createAdminClient()
  } catch (e) {
    console.error('[api/admin/passes GET] config error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Server configuration error' },
      { status: 500 }
    )
  }

  const { data, error } = await supabase
    .from('passes')
    .select('id, phone, amount, hours, status, checkout_request_id, expires_at, created_at')
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) {
    console.error('[api/admin/passes GET] query error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ passes: data ?? [] })
}
