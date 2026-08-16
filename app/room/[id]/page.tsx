import { supabase } from '@/lib/supabase'
import { createAdminClient } from '@/lib/supabase-admin'
import { getTenantPhoneSession } from '@/lib/session'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MapPin, ShieldCheck, Lock, CheckCircle2, Navigation, Phone, AlertTriangle, ArrowLeft, BadgeCheck, Home as HomeIcon, Timer, MessageCircle } from 'lucide-react'
import { RoomClientView } from './RoomClientView'
import { Map, MapRoom } from '@/components/Map'
import { LockedLocation } from '@/components/LockedLocation'
import { RoomGallery } from '@/components/RoomGallery'

export const dynamic = 'force-dynamic'

async function getRoom(id: string) {
  const { data, error } = await supabase
    .from('rooms')
    .select(`
      *,
      buildings (name, area, town, exact_location, lat, lng),
      users:buildings(users(name, phone, whatsapp))
    `)
    .eq('id', id)
    .single()

  if (error || !data) return null
  return data
}

/** Returns the visitor's active paid pass (matched by phone cookie), if any. */
async function getActivePass(): Promise<{ active: boolean; expiresAt: string | null }> {
  const phone = await getTenantPhoneSession()
  if (!phone) return { active: false, expiresAt: null }

  const supabaseAdmin = createAdminClient()
  const { data, error } = await supabaseAdmin
    .from('passes')
    .select('id, expires_at')
    .eq('phone', phone)
    .eq('status', 'paid')
    .gt('expires_at', new Date().toISOString())
    .order('expires_at', { ascending: false })
    .limit(1)

  if (error) {
    console.error('Pass check failed:', error)
    return { active: false, expiresAt: null }
  }
  const pass = data?.[0]
  return { active: !!pass, expiresAt: pass?.expires_at ?? null }
}

export default async function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const room = await getRoom(resolvedParams.id)

  if (!room) return notFound()

  // Locked by default — only an active paid pass reveals the map, pin and caretaker.
  const pass = await getActivePass()
  const unlocked = pass.active

  // Human-readable remaining pass time, e.g. "23h 12m"
  const passTimeLeft = pass.expiresAt
    ? (() => {
        // eslint-disable-next-line react-hooks/purity -- server component: rendered once per request, Date.now() is stable here
        const ms = new Date(pass.expiresAt).getTime() - Date.now()
        const totalMin = Math.max(0, Math.floor(ms / 60000))
        const h = Math.floor(totalMin / 60)
        const m = totalMin % 60
        return h > 0 ? `${h}h ${m}m` : `${m}m`
      })()
    : null

  const usersData = room.buildings?.users
  const caretaker =
    (Array.isArray(usersData) ? usersData[0] : usersData) ||
    { name: 'Unknown', phone: 'Unknown', whatsapp: null }

  // Contact action links (only rendered when unlocked)
  const callNumber = (caretaker.phone || '').replace(/\D/g, '')
  const waRaw = (caretaker.whatsapp || caretaker.phone || '').replace(/\D/g, '')
  const waNumber = waRaw.startsWith('0') ? `254${waRaw.slice(1)}` : waRaw

  // Extract amenities securely (fallback to empty array)
  const amenities = Array.isArray(room.amenities) ? room.amenities : []

  const hasCoords = room.buildings?.lat != null && room.buildings?.lng != null
  const mapRooms: MapRoom[] = hasCoords
    ? [{
        id: room.id,
        name: room.name,
        type: room.type,
        rent: room.rent,
        lat: room.buildings.lat,
        lng: room.buildings.lng,
        buildingName: room.buildings.name,
        buildingArea: room.buildings.area,
        buildingTown: room.buildings.town,
      }]
    : []
  const directionsUrl = hasCoords
    ? `https://www.google.com/maps/dir/?api=1&destination=${room.buildings.lat},${room.buildings.lng}`
    : null

  return (
    <div className="min-h-screen bg-paper pb-24 font-sans text-ink">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-paper/80 px-4 py-4 backdrop-blur-xl md:px-8">
        <div className="flex items-center gap-4">
          <Link
            href="/search"
            className="flex items-center gap-2 rounded-full border border-line bg-card px-4 py-2 text-sm font-semibold text-muted-ink transition-all hover:border-brand/40 hover:text-ink active:scale-95"
          >
            <ArrowLeft size={16} />
            Back
          </Link>
          <Link href="/" className="group hidden items-center gap-2 sm:flex">
            <span className="grid size-8 place-items-center rounded-lg bg-brand text-brand-ink shadow-md shadow-brand/25 transition-transform duration-300 group-hover:-rotate-6">
              <HomeIcon size={15} />
            </span>
            <span className="font-display text-lg font-semibold tracking-tight">
              Keja<span className="text-gold">link</span>
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          {unlocked ? (
            <span className="flex items-center gap-1 rounded-full border border-emerald-600/20 bg-emerald-600/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 size={14} /> Unlocked
            </span>
          ) : (
            <span className="flex items-center gap-1 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-semibold text-gold">
              <Lock size={14} /> Locked
            </span>
          )}
        </div>
      </header>

      <main className="mx-auto mt-8 max-w-4xl px-4 md:px-8">
        {/* Gallery */}
        <RoomGallery photos={room.photos ?? []} altBase={`${room.type} at ${room.buildings.name}`} />

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="space-y-8 md:col-span-2">
            {/* Title & Basics */}
            <div className="animate-fade-up" style={{ animationDelay: '100ms' }}>
              <div className="mb-2 flex items-center gap-3">
                <span className="rounded-full bg-gold/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-gold">
                  {room.type}
                </span>
                <span className="flex items-center gap-1 text-xs font-semibold text-muted-ink">
                  <BadgeCheck size={14} className="text-gold" /> Verified by Kejalink
                </span>
              </div>
              <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight text-ink">
                {room.type} at {room.buildings.name}
              </h1>
              <p className="mt-3 flex items-center gap-2 text-lg text-muted-ink">
                <MapPin size={18} className="text-gold" />
                {room.buildings.area}, {room.buildings.town}
              </p>
            </div>

            <div className="animate-fade-up flex gap-4 rounded-3xl border border-line bg-card p-5 shadow-md shadow-brand/5" style={{ animationDelay: '180ms' }}>
              <div className="flex-1">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-ink">Rent</p>
                <p className="mt-1 font-display text-2xl font-semibold text-brand">
                  KES {room.rent.toLocaleString()}
                </p>
              </div>
              <div className="flex-1 border-l border-line pl-4">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-ink">Deposit</p>
                <p className="mt-1 font-display text-2xl font-semibold text-ink">
                  KES {(room.deposit || 0).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="animate-fade-up" style={{ animationDelay: '240ms' }}>
              <h2 className="mb-4 font-display text-2xl font-semibold text-ink">About this room</h2>
              <p className="whitespace-pre-wrap leading-relaxed text-muted-ink">
                {room.description || 'No description provided.'}
              </p>
            </div>

            {/* Amenities */}
            {amenities.length > 0 && (
              <div className="animate-fade-up" style={{ animationDelay: '300ms' }}>
                <h2 className="mb-4 font-display text-2xl font-semibold text-ink">Amenities</h2>
                <div className="flex flex-wrap gap-2">
                  {amenities.map((am: string, i: number) => (
                    <span
                      key={i}
                      className="rounded-full border border-line bg-soft px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-gold/50 hover:text-gold"
                    >
                      {am}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Location */}
            <div className="animate-fade-up" style={{ animationDelay: '360ms' }}>
              <h2 className="mb-4 font-display text-2xl font-semibold text-ink">Location</h2>
              <div className="overflow-hidden rounded-3xl border border-line bg-card shadow-md shadow-brand/5">
                {hasCoords ? (
                  unlocked ? (
                    <>
                      <div className="h-[320px]">
                        <Map
                          rooms={mapRooms}
                          center={{ lat: room.buildings.lat, lng: room.buildings.lng }}
                          zoom={16}
                        />
                      </div>
                      <div className="flex flex-col gap-3 p-4">
                        <div>
                          <p className="font-semibold text-ink">{room.buildings.name}</p>
                          <p className="mt-1 flex items-center gap-1 text-sm text-muted-ink">
                            <MapPin size={14} className="text-gold" />
                            {room.buildings.area}, {room.buildings.town}
                          </p>
                          {room.buildings.exact_location && (
                            <p className="mt-1 text-sm text-muted-ink">
                              {room.buildings.exact_location}
                            </p>
                          )}
                        </div>
                        <a
                          href={directionsUrl!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shine inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-semibold text-brand-ink shadow-lg shadow-brand/25 transition-transform active:scale-[0.98]"
                        >
                          <Navigation size={16} />
                          Get Directions
                        </a>
                      </div>
                    </>
                  ) : (
                    <LockedLocation area={room.buildings.area} town={room.buildings.town} />
                  )
                ) : (
                  <div className="p-6 text-center">
                    <MapPin size={24} className="mx-auto mb-2 text-muted-ink" />
                    <p className="text-sm font-medium text-ink">
                      {room.buildings.name} — {room.buildings.area}, {room.buildings.town}
                    </p>
                    <p className="mt-1 text-sm text-muted-ink">
                      {unlocked
                        ? (room.buildings.exact_location || 'Exact map location not yet available for this building.')
                        : 'Unlock your pass to view the exact location.'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Report */}
            <div className="border-t border-line pt-8">
              <button className="flex items-center gap-2 text-sm font-semibold text-red-600 transition-colors hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
                <AlertTriangle size={16} />
                Report this listing (Fake / Taken)
              </button>
            </div>
          </div>

          {/* Sidebar (Locked/Unlocked Context) */}
          <div className="md:col-span-1">
            <div className="animate-fade-up sticky top-24 rounded-3xl border border-line bg-card p-6 shadow-xl shadow-brand/10" style={{ animationDelay: '200ms' }}>
              {/* Caretaker Info */}
              <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-ink">
                Caretaker Contact
              </h3>

              {unlocked && passTimeLeft && (
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-600/20 bg-emerald-600/10 px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  <Timer size={14} />
                  Pass active · {passTimeLeft} remaining
                </div>
              )}

              <div className="mb-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-full bg-gold/15 text-gold">
                    <ShieldCheck size={20} />
                  </div>
                  <div className={unlocked ? '' : 'select-none blur-[6px] filter'}>
                    <p className="font-semibold text-ink">{unlocked ? caretaker.name : 'Hidden Name'}</p>
                    <p className="flex items-center gap-1 text-sm text-muted-ink">
                      <Phone size={12} /> {unlocked ? caretaker.phone : '07XX XXX XXX'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex w-10 justify-center text-muted-ink">
                    <Navigation size={20} />
                  </div>
                  <div className={unlocked ? '' : 'select-none blur-[6px] filter'}>
                    <p className="text-sm font-semibold text-ink">Exact Location / Pin</p>
                    <p className="mt-1 text-xs text-muted-ink">
                      {unlocked ? (room.buildings.exact_location || 'Not provided') : 'Locked behind pass'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact actions — real links only exist when unlocked */}
              {unlocked ? (
                <div className="mb-6 grid grid-cols-2 gap-2.5">
                  <a
                    href={`tel:${callNumber}`}
                    className="flex items-center justify-center gap-2 rounded-xl border border-line bg-paper py-3 text-sm font-semibold text-ink transition-all duration-150 hover:border-brand/50 active:scale-[0.97]"
                  >
                    <Phone size={15} className="text-gold" />
                    Call
                  </a>
                  <a
                    href={`https://wa.me/${waNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3 text-sm font-semibold text-white shadow-lg shadow-[#25D366]/25 transition-all duration-150 hover:brightness-105 active:scale-[0.97]"
                  >
                    <MessageCircle size={15} />
                    WhatsApp
                  </a>
                </div>
              ) : (
                <div className="mb-6 grid grid-cols-2 gap-2.5" aria-hidden="true">
                  <span className="flex cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-line bg-soft py-3 text-sm font-semibold text-muted-ink">
                    <Lock size={14} />
                    Call
                  </span>
                  <span className="flex cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-line bg-soft py-3 text-sm font-semibold text-muted-ink">
                    <Lock size={14} />
                    WhatsApp
                  </span>
                </div>
              )}

              {/* Client interactivity injected here */}
              <RoomClientView unlocked={unlocked} roomId={room.id} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
