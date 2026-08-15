import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

/**
 * Daraja STK callback. Safaricom POSTs the payment result here; we flip the
 * matching pass to 'paid' (or 'failed') so the user's next page load unlocks.
 */
export async function POST(req: Request) {
  try {
    const payload = await req.json()
    const callback = payload?.Body?.stkCallback

    if (!callback) {
      console.warn('M-Pesa callback: unexpected shape', payload)
      return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' })
    }

    const { CheckoutRequestID, ResultCode, ResultDesc } = callback
    const status = ResultCode === 0 ? 'paid' : 'failed'

    if (CheckoutRequestID) {
      const supabaseAdmin = createAdminClient()
      const { error } = await supabaseAdmin
        .from('passes')
        .update({ status })
        .eq('checkout_request_id', CheckoutRequestID)
        .eq('status', 'pending') // never overwrite a settled pass

      if (error) {
        console.error('Failed to update pass from callback:', error)
      } else {
        console.log(`Pass ${CheckoutRequestID} → ${status} (${ResultDesc})`)
      }
    }

    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Success' })
  } catch (err) {
    console.error('M-Pesa callback error:', err)
    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' })
  }
}
