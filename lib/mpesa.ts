/**
 * Safaricom M-Pesa (Daraja) helpers.
 * Sandbox: https://sandbox.safaricom.co.ke · Production: https://api.safaricom.co.ke
 */

const BASE =
  process.env.MPESA_ENV === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke'

/** True only when every variable needed for a real (non-mock) STK flow exists. */
export function darajaConfigured(): boolean {
  return Boolean(
    process.env.MPESA_CONSUMER_KEY &&
      process.env.MPESA_CONSUMER_SECRET &&
      process.env.MPESA_SHORTCODE &&
      process.env.MPESA_PASSKEY &&
      process.env.MPESA_CALLBACK_URL
  )
}

/** Accepts 0712…, 712…, +254712…, 254712… and returns 2547XXXXXXXX. */
export function normalizeKenyanPhone(raw: string): string {
  const digits = String(raw).replace(/\D/g, '')
  if (/^0[17]\d{8}$/.test(digits)) return `254${digits.slice(1)}`
  if (/^254[17]\d{8}$/.test(digits)) return digits
  if (/^[17]\d{8}$/.test(digits)) return `254${digits}`
  throw new Error('Enter a valid Kenyan phone number (e.g. 0712 345 678)')
}

/** Daraja timestamp format: YYYYMMDDHHmmss */
function darajaTimestamp(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return (
    `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}` +
    `${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`
  )
}

async function getAccessToken(): Promise<string> {
  const auth = Buffer.from(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
  ).toString('base64')

  const res = await fetch(`${BASE}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${auth}` },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Daraja auth failed (HTTP ${res.status})`)
  const data = await res.json()
  if (!data.access_token) throw new Error('Daraja auth returned no access token')
  return data.access_token
}

export interface StkPushResult {
  checkoutRequestId: string
  merchantRequestId: string
  customerMessage: string
}

export type StkQueryOutcome = 'paid' | 'failed' | 'processing'

/**
 * Asks Safaricom directly about an STK push. Used as a fallback when the
 * callback is slow or unreachable (e.g. local dev without a public URL).
 */
export async function stkPushQuery(checkoutRequestId: string): Promise<StkQueryOutcome> {
  const shortcode = process.env.MPESA_SHORTCODE!
  const timestamp = darajaTimestamp()
  const password = Buffer.from(
    `${shortcode}${process.env.MPESA_PASSKEY}${timestamp}`
  ).toString('base64')
  const token = await getAccessToken()

  const res = await fetch(`${BASE}/mpesa/stkpushquery/v1/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    }),
  })

  const data = await res.json().catch(() => ({}))

  // Error envelope (e.g. 500.001.1001 "transaction is being processed") → still waiting
  if (data.errorCode) return 'processing'
  if (String(data.ResultCode) === '0') return 'paid'
  // Any settled non-zero ResultCode (1032 cancelled, 1037 timeout, 1 balance…) → failed
  if (data.ResultCode !== undefined) return 'failed'
  return 'processing'
}

/** Sends a real STK push (CustomerPayBillOnline) to the subscriber's phone. */
export async function stkPush(opts: {
  phone: string
  amount: number
  accountReference: string
  description: string
}): Promise<StkPushResult> {
  const shortcode = process.env.MPESA_SHORTCODE!
  const timestamp = darajaTimestamp()
  const password = Buffer.from(
    `${shortcode}${process.env.MPESA_PASSKEY}${timestamp}`
  ).toString('base64')
  const token = await getAccessToken()

  const res = await fetch(`${BASE}/mpesa/stkpush/v1/processrequest`, {
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
      Amount: opts.amount,
      PartyA: opts.phone,
      PartyB: shortcode,
      PhoneNumber: opts.phone,
      CallBackURL: process.env.MPESA_CALLBACK_URL,
      AccountReference: opts.accountReference,
      TransactionDesc: opts.description,
    }),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok || data.ResponseCode !== '0') {
    throw new Error(
      data.errorMessage || data.ResponseDescription || 'Safaricom rejected the STK push'
    )
  }

  return {
    checkoutRequestId: data.CheckoutRequestID,
    merchantRequestId: data.MerchantRequestID,
    customerMessage: data.CustomerMessage ?? 'STK push sent',
  }
}
