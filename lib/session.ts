import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'

const SESSION_COOKIE_NAME = 'kejalink_tenant_phone'

function sessionSecret(): string {
  const secret = process.env.SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!secret) {
    throw new Error(
      'Missing SESSION_SECRET. Add SESSION_SECRET=some-long-random-string to .env.local and restart the dev server.'
    )
  }
  return secret
}

function signPhone(phone: string): string {
  return createHmac('sha256', sessionSecret()).update(phone).digest('hex')
}

function isValidSignature(phone: string, signature: string): boolean {
  const expected = signPhone(phone)
  const a = Buffer.from(signature, 'utf8')
  const b = Buffer.from(expected, 'utf8')
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function setTenantPhoneSession(phone: string) {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, `${phone}.${signPhone(phone)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 48, // 48 hours
  })
}

export async function getTenantPhoneSession(): Promise<string | null> {
  const cookieStore = await cookies()
  const value = cookieStore.get(SESSION_COOKIE_NAME)?.value
  if (!value) return null

  const separatorIndex = value.lastIndexOf('.')
  if (separatorIndex <= 0) return null

  const phone = value.slice(0, separatorIndex)
  const signature = value.slice(separatorIndex + 1)
  if (!phone || !signature || !/^[0-9a-f]{64}$/.test(signature)) return null

  return isValidSignature(phone, signature) ? phone : null
}

export async function clearTenantPhoneSession() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}
