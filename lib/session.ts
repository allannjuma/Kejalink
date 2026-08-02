import { cookies } from 'next/headers'

const SESSION_COOKIE_NAME = 'kejalink_tenant_phone'

export async function setTenantPhoneSession(phone: string) {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, phone, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 48, // 48 hours
  })
}

export async function getTenantPhoneSession(): Promise<string | null> {
  const cookieStore = await cookies()
  const phoneCookie = cookieStore.get(SESSION_COOKIE_NAME)
  return phoneCookie?.value || null
}

export async function clearTenantPhoneSession() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}
