import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function POST(req: Request) {
  try {
    const data = await req.json()
    // In a real scenario, you parse Daraja callback body
    // verify the result code, and update the pass.
    // For now, this is just a placeholder.
    console.log('M-Pesa Callback received:', data)
    
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Success" })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
