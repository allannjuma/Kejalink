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

// Find an auth user by email via the admin API (there is no direct
// get-by-email; the project is small enough to scan one page).
export async function findAuthUserByEmail(
  supabase: ReturnType<typeof createAdminClient>,
  email: string
) {
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  if (error) return { user: null, error }
  const user =
    data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase()) ?? null
  return { user, error: null }
}

// True when auth.admin.createUser failed because the email already exists.
export function isDuplicateEmailError(
  error: { message: string; code?: string } | null
): boolean {
  if (!error) return false
  return (
    error.code === 'user_already_exists' ||
    /already (been )?registered/i.test(error.message)
  )
}
