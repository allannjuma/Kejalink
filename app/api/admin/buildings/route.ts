import { NextResponse } from 'next/server'
import { createAdminClient, findAuthUserByEmail, isDuplicateEmailError } from '@/lib/supabase-admin'

function friendlyError(message: string): string {
  if (message.includes('users_phone_key')) {
    return 'This phone number is already assigned to another caretaker. Use a different phone number or leave it blank.'
  }
  if (message.includes('users_email_key') || message.includes('already registered')) {
    return 'This email is already registered. Use a different caretaker email.'
  }
  if (message.includes('users_pkey') || message.includes('duplicate key value violates unique constraint')) {
    return 'This user already exists. Use a different caretaker email.'
  }
  if (message.includes('buildings_admin_user_id_fkey')) {
    return 'Database link error: the admin_user_id column may be missing. Run supabase/fix-links.sql in the Supabase SQL editor.'
  }
  return message
}

// GET /api/admin/buildings
// Returns all buildings with their linked caretaker profile.
export async function GET() {
  let supabase
  try {
    supabase = createAdminClient()
  } catch (e) {
    console.error('[api/admin/buildings GET] config error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Server configuration error' },
      { status: 500 }
    )
  }

  const { data, error } = await supabase
    .from('buildings')
    .select('*, users(name, email, phone)')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[api/admin/buildings GET] query error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ buildings: data ?? [] })
}

// POST /api/admin/buildings
// Creates a building + a caretaker auth login + the linked users row.
// Building admins are ONLY ever created through this route — never self-register.
export async function POST(request: Request) {
  let body: {
    buildingName?: string
    area?: string
    town?: string
    lat?: number | null
    lng?: number | null
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

  const { buildingName, area, town, lat, lng, caretakerName, phone, email, tempPassword } = body

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
    console.error('[api/admin/buildings POST] config error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Server configuration error' },
      { status: 500 }
    )
  }

  console.log('[api/admin/buildings POST] creating auth user for:', email)

  // 1. Auth login for the caretaker. If the email already exists in Auth but
  // has no public.users row (an orphaned account from an earlier failed
  // attempt), adopt it: reset its password to the new temp password and link
  // the profile below. A registered email WITH a profile is still rejected.
  let authUserId: string
  let adoptedOrphan = false

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
  })

  if (authError || !authData.user) {
    if (!isDuplicateEmailError(authError)) {
      console.error('[api/admin/buildings POST] auth error:', authError)
      return NextResponse.json(
        { error: friendlyError(authError?.message ?? 'Failed to create auth user') },
        { status: 400 }
      )
    }

    const { user: existing, error: lookupError } = await findAuthUserByEmail(supabase, email)
    if (lookupError || !existing) {
      console.error('[api/admin/buildings POST] orphan lookup error:', lookupError)
      return NextResponse.json(
        { error: friendlyError(authError?.message ?? 'Failed to create auth user') },
        { status: 400 }
      )
    }

    const { data: existingProfile } = await supabase
      .from('users')
      .select('id')
      .eq('id', existing.id)
      .maybeSingle()

    if (existingProfile) {
      return NextResponse.json(
        { error: 'This email is already registered. Use a different caretaker email.' },
        { status: 400 }
      )
    }

    const { error: adoptError } = await supabase.auth.admin.updateUserById(existing.id, {
      password: tempPassword,
      email_confirm: true,
    })

    if (adoptError) {
      console.error('[api/admin/buildings POST] orphan adopt error:', adoptError)
      return NextResponse.json({ error: friendlyError(adoptError.message) }, { status: 400 })
    }

    authUserId = existing.id
    adoptedOrphan = true
    console.log('[api/admin/buildings POST] adopted orphaned auth user for:', email)
  } else {
    authUserId = authData.user.id
  }

  // 2. Building row
  const { data: building, error: buildingError } = await supabase
    .from('buildings')
    .insert({
      name: buildingName,
      area,
      town,
      lat: typeof lat === 'number' ? lat : null,
      lng: typeof lng === 'number' ? lng : null,
    })
    .select()
    .single()

  if (buildingError) {
    console.error('[api/admin/buildings POST] building insert error:', buildingError)
    // An adopted orphan pre-existed this request — leave its auth account alone.
    if (!adoptedOrphan) await supabase.auth.admin.deleteUser(authUserId)
    return NextResponse.json({ error: friendlyError(buildingError.message) }, { status: 400 })
  }

  // 3. users row linking caretaker to the building
  const { error: userError } = await supabase.from('users').insert({
    id: authUserId,
    name: caretakerName,
    email,
    phone: phone ?? null,
    role: 'building_admin',
    verified: true,
    building_id: building.id,
  })

  if (userError) {
    console.error('[api/admin/buildings POST] users insert error:', userError)
    await supabase.from('buildings').delete().eq('id', building.id)
    if (!adoptedOrphan) await supabase.auth.admin.deleteUser(authUserId)
    return NextResponse.json({ error: friendlyError(userError.message) }, { status: 400 })
  }

  // 4. Update the building with the admin_user_id (to complete bidirectional link)
  const { error: updateBuildingError } = await supabase
    .from('buildings')
    .update({ admin_user_id: authUserId })
    .eq('id', building.id)

  if (updateBuildingError) {
    console.error('[api/admin/buildings POST] building update error:', updateBuildingError)
    await supabase.from('users').delete().eq('id', authUserId)
    await supabase.from('buildings').delete().eq('id', building.id)
    if (!adoptedOrphan) await supabase.auth.admin.deleteUser(authUserId)
    return NextResponse.json(
      { error: friendlyError(updateBuildingError.message) },
      { status: 400 }
    )
  }

  // Fetch updated building just to be safe
  const { data: finalBuilding } = await supabase
    .from('buildings')
    .select('*')
    .eq('id', building.id)
    .single()

  console.log('[api/admin/buildings POST] success:', finalBuilding?.id)

  return NextResponse.json({
    building: finalBuilding,
    caretaker: { email, tempPassword },
  })
}
