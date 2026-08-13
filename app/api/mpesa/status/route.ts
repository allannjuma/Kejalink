import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { getTenantPhoneSession } from '@/lib/session'

// GET /api/mpesa/status?checkoutRequestId=...  (or ?phone=... with a valid session)
// Used by the client to poll while waiting for the M-Pesa PIN prompt to complete.
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const checkoutRequestId = searchParams.get('checkoutRequestId')
    const phone = searchParams.get('phone')

    const supabaseAdmin = createAdminClient()

    if (checkoutRequestId) {
      const { data: pass } = await supabaseAdmin
        .from('passes')
        .select('status')
        .eq('checkout_request_id', checkoutRequestId)
        .single()

      return NextResponse.json({ status: pass?.status ?? 'not_found' })
    }

    if (phone) {
      const sessionPhone = await getTenantPhoneSession()
      if (!sessionPhone || sessionPhone !== phone) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const { data: pass } = await supabaseAdmin
        .from('passes')
        .select('status')
        .eq('phone', phone)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      return NextResponse.json({ status: pass?.status ?? 'not_found' })
    }

    return NextResponse.json({ error: 'checkoutRequestId or phone is required' }, { status: 400 })
  } catch (error) {
    console.error('M-Pesa status error:', error)
    return NextResponse.json({ error: 'Failed to check payment status' }, { status: 500 })
  }
}
