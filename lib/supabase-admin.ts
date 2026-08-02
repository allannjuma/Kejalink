import { createClient } from '@supabase/supabase-js'

// Server-only client with the service role key. Never import this from
// client components — the service key bypasses RLS and must stay on the server.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY. Add it to .env.local from ' +
        'Supabase dashboard → Project Settings → API → service_role key, then restart the dev server.'
    )
  }

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
