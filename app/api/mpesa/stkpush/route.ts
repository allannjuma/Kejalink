import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { setTenantPhoneSession } from '@/lib/session'

export async function POST(req: Request) {
  try {
    const { phone, hours } = await req.json()
    if (!phone || !hours) {
      return NextResponse.json({ error: 'Phone and hours are required' }, { status: 400 })
    }

    const amount = hours === 24 ? 150 : 200
    const supabaseAdmin = createAdminClient()

    // Since we are mocking M-Pesa for now, we immediately mark it as 'paid'
    // In a real integration, this would be 'pending', and Safaricom's webhook would mark it 'paid'
    
    // Calculate expiration
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + hours)

    const { data, error } = await supabaseAdmin
      .from('passes')
      .insert({
        phone,
        amount,
        hours,
        status: 'paid', // Mocked as paid instantly
        checkout_request_id: `MOCK-${Date.now()}`,
        expires_at: expiresAt.toISOString()
      })
      .select('id')
      .single()

    if (error) {
      console.error('Failed to create pass:', error)
      return NextResponse.json({ error: 'Failed to initiate pass' }, { status: 500 })
    }

    // Set a cookie so the user remains unlocked for this session
    await setTenantPhoneSession(phone)

    return NextResponse.json({ success: true, passId: data.id })
  } catch (error: any) {
    console.error('STK push error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
