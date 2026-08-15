import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { darajaConfigured, stkPushQuery } from '@/lib/mpesa'

/**
 * Polled by the unlock modal while the user is entering their M-Pesa PIN.
 * GET /api/mpesa/status?checkout_request_id=ws_CO_… → { status }
 *
 * If the pass is still 'pending' and Daraja is configured, we actively ask
 * Safaricom (stkpushquery) — so confirmation works even when the callback
 * URL is unreachable (local dev, tunnel down, etc.).
 */
export async function GET(req: Request) {
  const checkoutRequestId = new URL(req.url).searchParams.get('checkout_request_id')
  if (!checkoutRequestId) {
    return NextResponse.json({ error: 'checkout_request_id is required' }, { status: 400 })
  }

  const supabaseAdmin = createAdminClient()
  const { data, error } = await supabaseAdmin
    .from('passes')
    .select('status')
    .eq('checkout_request_id', checkoutRequestId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('Status check failed:', error)
    return NextResponse.json({ error: 'Status check failed' }, { status: 500 })
  }

  let status: string = data?.status ?? 'unknown'

  // Fallback: callback hasn't arrived — query Daraja directly.
  if (status === 'pending' && darajaConfigured()) {
    try {
      const outcome = await stkPushQuery(checkoutRequestId)
      if (outcome !== 'processing') {
        const { error: updateError } = await supabaseAdmin
          .from('passes')
          .update({ status: outcome })
          .eq('checkout_request_id', checkoutRequestId)
          .eq('status', 'pending') // never overwrite a settled pass

        if (updateError) {
          console.error('Failed to settle pass from query fallback:', updateError)
        } else {
          status = outcome
        }
      }
    } catch (err) {
      console.error('STK query fallback failed (keeping pending):', err)
    }
  }

  return NextResponse.json({ status })
}
