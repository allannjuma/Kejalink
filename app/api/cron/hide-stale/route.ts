import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

// GET /api/cron/hide-stale?secret=YOUR_CRON_SECRET
// The stale-listing killer: any room left 'live' without a freshness
// confirmation for 14+ days is hidden from public search.
// Wire this to a daily scheduler (Vercel Cron, Supabase pg_cron, or any
// external pinger). Locally you can just open the URL in a browser.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET

  if (!secret) {
    return NextResponse.json(
      {
        error:
          'CRON_SECRET is not set. Add CRON_SECRET=some-long-random-string to .env.local and restart the dev server.',
      },
      { status: 500 }
    )
  }

  const { searchParams } = new URL(request.url)
  const authorized =
    request.headers.get('authorization') === `Bearer ${secret}` ||
    searchParams.get('secret') === secret

  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let supabase
  try {
    supabase = createAdminClient()
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Server configuration error' },
      { status: 500 }
    )
  }

  const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from('rooms')
    .update({ state: 'hidden', updated_at: new Date().toISOString() })
    .eq('state', 'live')
    .lt('last_confirmed_at', cutoff)
    .select('id')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ hidden: data?.length ?? 0, cutoff })
}
