import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

type StkCallback = {
  MerchantRequestID?: string
  CheckoutRequestID?: string
  ResultCode?: number
  ResultDesc?: string
}

export async function POST(req: Request) {
  // Always ack Safaricom, even on internal errors, so they stop retrying.
  const ack = () => NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' })

  try {
    const body = await req.json()
    const callback: StkCallback | undefined = body?.Body?.stkCallback

    if (!callback?.CheckoutRequestID) {
      console.error('M-Pesa callback missing stkCallback payload:', body)
      return ack()
    }

    const supabaseAdmin = createAdminClient()
    const checkoutRequestId = callback.CheckoutRequestID

    const { data: pass, error: lookupError } = await supabaseAdmin
      .from('passes')
      .select('id, hours, status')
      .eq('checkout_request_id', checkoutRequestId)
      .single()

    if (lookupError || !pass) {
      console.error('M-Pesa callback: no pass for CheckoutRequestID:', checkoutRequestId, lookupError)
      return ack()
    }

    // Already finalized (e.g. duplicate callback) — nothing to do.
    if (pass.status !== 'pending') return ack()

    if (callback.ResultCode === 0) {
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + pass.hours)

      const { error } = await supabaseAdmin
        .from('passes')
        .update({ status: 'paid', expires_at: expiresAt.toISOString() })
        .eq('id', pass.id)

      if (error) console.error('M-Pesa callback: failed to mark pass paid:', error)
    } else {
      console.log(`M-Pesa payment failed for ${checkoutRequestId}: ${callback.ResultCode} ${callback.ResultDesc}`)
      const { error } = await supabaseAdmin
        .from('passes')
        .update({ status: 'failed' })
        .eq('id', pass.id)

      if (error) console.error('M-Pesa callback: failed to mark pass failed:', error)
    }

    return ack()
  } catch (error) {
    console.error('M-Pesa callback error:', error)
    return ack()
  }
}
