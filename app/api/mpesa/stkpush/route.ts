import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { setTenantPhoneSession } from '@/lib/session'

// Normalize Kenyan phone numbers (07..., 01..., +254..., 254...) to 254XXXXXXXXX.
function normalizePhone(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  let digits = raw.replace(/[^\d+]/g, '')
  if (digits.startsWith('+')) digits = digits.slice(1)
  if (digits.startsWith('0')) digits = `254${digits.slice(1)}`
  if (!/^254[17]\d{8}$/.test(digits)) return null
  return digits
}

function darajaBaseUrl(): string {
  return process.env.MPESA_ENV === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke'
}

async function getAccessToken(): Promise<string> {
  const key = process.env.MPESA_CONSUMER_KEY!
  const secret = process.env.MPESA_CONSUMER_SECRET!
  const auth = Buffer.from(`${key}:${secret}`).toString('base64')

  const res = await fetch(`${darajaBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${auth}` },
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    console.error('Daraja OAuth failed:', res.status, body)
    throw new Error('oauth_failed')
  }
  const data = await res.json()
  return data.access_token as string
}

async function sendStkPush(phone: string, amount: number): Promise<string> {
  const shortcode = process.env.MPESA_SHORTCODE!
  const passkey = process.env.MPESA_PASSKEY!
  const callbackUrl = process.env.MPESA_CALLBACK_URL!

  const now = new Date()
  const pad = (n: number) => n.toString().padStart(2, '0')
  const timestamp =
    `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
    `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64')

  const token = await getAccessToken()

  const res = await fetch(`${darajaBaseUrl()}/mpesa/stkpush/v1/processrequest`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: phone,
      PartyB: shortcode,
      PhoneNumber: phone,
      CallBackURL: callbackUrl,
      AccountReference: 'KejaLink',
      TransactionDesc: 'KejaLink Pass',
    }),
  })

  const data = await res.json().catch(() => null)
  if (!res.ok || !data?.CheckoutRequestID) {
    console.error('Daraja STK push failed:', res.status, data)
    throw new Error('stkpush_failed')
  }
  return data.CheckoutRequestID as string
}

export async function POST(req: Request) {
  try {
    const { phone, hours } = await req.json()

    const normalizedPhone = normalizePhone(phone)
    if (!normalizedPhone) {
      return NextResponse.json({ error: 'Enter a valid Kenyan phone number (e.g. 0712 345 678)' }, { status: 400 })
    }
    if (hours !== 24 && hours !== 48) {
      return NextResponse.json({ error: 'Pass duration must be 24 or 48 hours' }, { status: 400 })
    }

    const amount = hours === 24 ? 150 : 200
    const hasDarajaCreds =
      process.env.MPESA_CONSUMER_KEY &&
      process.env.MPESA_CONSUMER_SECRET &&
      process.env.MPESA_SHORTCODE &&
      process.env.MPESA_PASSKEY &&
      process.env.MPESA_CALLBACK_URL
    const mock = process.env.MPESA_MOCK === 'true' || !hasDarajaCreds

    const supabaseAdmin = createAdminClient()

    if (mock) {
      // Mock mode: no M-Pesa call, mark the pass as paid instantly.
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + hours)

      const { error } = await supabaseAdmin
        .from('passes')
        .insert({
          phone: normalizedPhone,
          amount,
          hours,
          status: 'paid',
          checkout_request_id: `MOCK-${Date.now()}`,
          expires_at: expiresAt.toISOString(),
        })
        .select('id')
        .single()

      if (error) {
        console.error('Failed to create pass:', error)
        return NextResponse.json({ error: 'Failed to initiate payment' }, { status: 500 })
      }

      await setTenantPhoneSession(normalizedPhone)
      return NextResponse.json({ success: true, checkoutRequestId: null, mock: true })
    }

    const checkoutRequestId = await sendStkPush(normalizedPhone, amount)

    const { error } = await supabaseAdmin.from('passes').insert({
      phone: normalizedPhone,
      amount,
      hours,
      status: 'pending',
      checkout_request_id: checkoutRequestId,
    })

    if (error) {
      console.error('Failed to create pass:', error)
      return NextResponse.json({ error: 'Failed to initiate payment' }, { status: 500 })
    }

    await setTenantPhoneSession(normalizedPhone)
    return NextResponse.json({ success: true, checkoutRequestId, mock: false })
  } catch (error) {
    console.error('STK push error:', error)
    return NextResponse.json({ error: 'Failed to initiate payment. Please try again.' }, { status: 500 })
  }
}
