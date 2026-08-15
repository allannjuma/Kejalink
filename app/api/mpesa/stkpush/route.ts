import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { setTenantPhoneSession } from '@/lib/session'
import { darajaConfigured, normalizeKenyanPhone, stkPush } from '@/lib/mpesa'

export async function POST(req: Request) {
  try {
    const { phone, hours } = await req.json()
    if (!phone || !hours) {
      return NextResponse.json({ error: 'Phone and hours are required' }, { status: 400 })
    }

    const amount = hours === 24 ? 150 : 200
    const supabaseAdmin = createAdminClient()

    let normalizedPhone: string
    try {
      normalizedPhone = normalizeKenyanPhone(phone)
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : 'Invalid phone number' },
        { status: 400 }
      )
    }

    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + hours)

    // Rate limit: max 3 payment attempts per phone per 10 minutes,
    // so the endpoint can't be abused to spam M-Pesa prompts.
    const windowStart = new Date(Date.now() - 10 * 60 * 1000).toISOString()
    const { count, error: countError } = await supabaseAdmin
      .from('passes')
      .select('id', { count: 'exact', head: true })
      .eq('phone', normalizedPhone)
      .gte('created_at', windowStart)

    if (countError) {
      console.error('Rate-limit check failed (allowing request):', countError)
    } else if ((count ?? 0) >= 3) {
      return NextResponse.json(
        { error: 'Too many payment attempts. Please wait a few minutes and try again.' },
        { status: 429 }
      )
    }

    // ── Mock mode (no Daraja credentials configured): instant paid pass ──
    if (!darajaConfigured()) {
      const { data, error } = await supabaseAdmin
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
        return NextResponse.json({ error: 'Failed to initiate pass' }, { status: 500 })
      }

      await setTenantPhoneSession(normalizedPhone)
      return NextResponse.json({ success: true, mock: true, passId: data.id })
    }

    // ── Real Daraja STK push ──
    let push
    try {
      push = await stkPush({
        phone: normalizedPhone,
        amount,
        accountReference: 'Kejalink Pass',
        description: `Kejalink ${hours}hr unlock pass`,
      })
    } catch (err) {
      console.error('Daraja STK push failed:', err)
      return NextResponse.json(
        { error: err instanceof Error ? err.message : 'Could not send the M-Pesa prompt' },
        { status: 502 }
      )
    }

    // Pass stays 'pending' until the Daraja callback confirms payment.
    const { error } = await supabaseAdmin.from('passes').insert({
      phone: normalizedPhone,
      amount,
      hours,
      status: 'pending',
      checkout_request_id: push.checkoutRequestId,
      expires_at: expiresAt.toISOString(),
    })

    if (error) {
      console.error('Failed to create pending pass:', error)
      return NextResponse.json({ error: 'Failed to record payment attempt' }, { status: 500 })
    }

    // Remember the phone now; the room page unlocks once the pass flips to 'paid'.
    await setTenantPhoneSession(normalizedPhone)

    return NextResponse.json({
      success: true,
      mock: false,
      checkoutRequestId: push.checkoutRequestId,
      message: push.customerMessage,
    })
  } catch (error) {
    console.error('STK push error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Server error' },
      { status: 500 }
    )
  }
}
