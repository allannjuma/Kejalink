import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

// POST /api/admin/buildings
// Creates a building + a caretaker auth login + the linked users row.
// Building admins are ONLY ever created through this route — never self-register.
export async function POST(request: Request) {
  let body: {
    buildingName?: string
    area?: string
    town?: string
    caretakerName?: string
    phone?: string
    email?: string
    tempPassword?: string
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { buildingName, area, town, caretakerName, phone, email, tempPassword } = body

  if (!buildingName || !area || !town || !caretakerName || !email || !tempPassword) {
    return NextResponse.json(
      { error: 'buildingName, area, town, caretakerName, email and tempPassword are required' },
      { status: 400 }
    )
  }

  let supabase
  try {
    supabase = createAdminClient()
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Server configuration error' },
      { status: 500 }
    )
  }

  // 1. Auth login for the caretaker
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
  })

  if (authError || !authData.user) {
    return NextResponse.json(
      { error: authError?.message ?? 'Failed to create auth user' },
      { status: 400 }
    )
  }

  // 2. Building row
  const { data: building, error: buildingError } = await supabase
    .from('buildings')
    .insert({ name: buildingName, area, town })
    .select()
    .single()

  if (buildingError) {
    await supabase.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: buildingError.message }, { status: 400 })
  }

  // 3. users row linking caretaker to the building
  const { error: userError } = await supabase.from('users').insert({
    id: authData.user.id,
    name: caretakerName,
    email,
    phone: phone ?? null,
    role: 'building_admin',
    verified: true,
    building_id: building.id,
  })

  if (userError) {
    await supabase.from('buildings').delete().eq('id', building.id)
    await supabase.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: userError.message }, { status: 400 })
  }

  // 4. Update the building with the admin_user_id (to complete bidirectional link)
  const { error: updateBuildingError } = await supabase
    .from('buildings')
    .update({ admin_user_id: authData.user.id })
    .eq('id', building.id)

  if (updateBuildingError) {
    await supabase.from('users').delete().eq('id', authData.user.id)
    await supabase.from('buildings').delete().eq('id', building.id)
    await supabase.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: updateBuildingError.message }, { status: 400 })
  }

  // Fetch updated building just to be safe
  const { data: finalBuilding } = await supabase
    .from('buildings')
    .select('*')
    .eq('id', building.id)
    .single()

  return NextResponse.json({
    building: finalBuilding,
    caretaker: { email, tempPassword },
  })
}
