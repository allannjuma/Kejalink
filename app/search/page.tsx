import { supabase } from '@/lib/supabase'
import { ListingCard } from '@/components/ListingCard'
import { Map, MapRoom } from '@/components/Map'
import { RecentSearches } from '@/components/RecentSearches'
import Link from 'next/link'
import { Search, MapPin, Home as HomeIcon, SearchX, BadgeCheck, CalendarClock, Ban } from 'lucide-react'

export const dynamic = 'force-dynamic'

async function searchRooms(area: string, type: string, max: string) {
  let query = supabase
    .from('rooms')
    .select(`
      id, name, type, rent, photos, last_confirmed_at, available_date,
      buildings!inner(name, area, town, lat, lng)
    `)
    .eq('state', 'live')
    .neq('state', 'taken')
    .gt('last_confirmed_at', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString())
    .order('last_confirmed_at', { ascending: false })

  if (type) {
    query = query.eq('type', type)
  }
  if (max) {
    query = query.lte('rent', parseInt(max, 10))
  }
  if (area) {
    query = query.ilike('buildings.area', `%${area}%`)
  }

  const { data, error } = await query

  if (error) {
    console.error('Search error:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    })
    return []
  }
  return data
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await searchParams
  const area = typeof resolvedParams.area === 'string' ? resolvedParams.area : ''
  const type = typeof resolvedParams.type === 'string' ? resolvedParams.type : ''
  const max = typeof resolvedParams.max === 'string' ? resolvedParams.max : ''

  const rooms = await searchRooms(area, type, max)

  const mapRooms: MapRoom[] = rooms.map((room: any) => ({
    id: room.id,
    name: room.name,
    type: room.type,
    rent: room.rent,
    lat: room.buildings?.lat ?? null,
    lng: room.buildings?.lng ?? null,
    buildingName: room.buildings?.name ?? '',
    buildingArea: room.buildings?.area ?? '',
    buildingTown: room.buildings?.town ?? '',
  }))

  const locatedRooms = mapRooms.filter((r) => r.lat !== null && r.lng !== null)

  return (
    <div className="min-h-screen bg-paper pb-24 font-sans text-ink">
      {/* Header / Search bar */}
      <div className="sticky top-0 z-10 border-b border-line bg-paper/80 px-4 py-4 backdrop-blur-xl md:px-8">
        <form className="mx-auto flex max-w-6xl items-center gap-3 overflow-x-auto pb-2 md:pb-0">
          <Link href="/" className="group mr-2 flex shrink-0 items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-brand text-brand-ink shadow-lg shadow-brand/25 transition-transform duration-300 group-hover:-rotate-6">
              <HomeIcon size={17} />
            </span>
            <span className="hidden font-display text-xl font-semibold tracking-tight sm:inline">
              Keja<span className="text-gold">link</span>
            </span>
          </Link>

          <div className="flex min-w-[200px] flex-1 items-center gap-2 rounded-full border border-line bg-card px-4 py-2.5 transition-shadow focus-within:ring-2 focus-within:ring-gold/50">
            <MapPin size={15} className="shrink-0 text-gold" />
            <input
              name="area"
              defaultValue={area}
              placeholder="Area (e.g. Roysambu)"
              className="w-full border-none bg-transparent text-sm text-ink outline-none placeholder:text-muted-ink/60"
            />
          </div>

          <select
            name="type"
            defaultValue={type}
            className="shrink-0 rounded-full border border-line bg-card px-4 py-2.5 text-sm text-ink outline-none transition-shadow focus:ring-2 focus:ring-gold/50"
          >
            <option value="">Any Type</option>
            <option value="Single Room">Single Room</option>
            <option value="Bedsitter">Bedsitter</option>
            <option value="1 Bedroom">1 Bedroom</option>
            <option value="2 Bedroom">2 Bedroom</option>
          </select>

          <div className="flex w-32 shrink-0 items-center rounded-full border border-line bg-card px-4 py-2.5 transition-shadow focus-within:ring-2 focus-within:ring-gold/50">
            <input
              name="max"
              type="number"
              defaultValue={max}
              placeholder="Max Rent"
              className="w-full border-none bg-transparent text-sm text-ink outline-none placeholder:text-muted-ink/60"
            />
          </div>

          <button
            type="submit"
            className="shine grid size-10 shrink-0 place-items-center rounded-full bg-brand text-brand-ink shadow-lg shadow-brand/25 transition-transform hover:scale-105 active:scale-95"
            aria-label="Search"
          >
            <Search size={18} />
          </button>
        </form>
        <RecentSearches area={area} type={type} max={max} />
      </div>

      {/* Results */}
      <main className="mx-auto mt-8 max-w-6xl px-4 md:px-8">
        <div className="animate-fade-up mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">
              {area ? `Homes in ${area}` : 'All verified homes'}
            </p>
            <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-ink">
              {rooms.length} {rooms.length === 1 ? 'room' : 'rooms'} found
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs font-medium text-muted-ink">
            <span className="flex items-center gap-1.5"><BadgeCheck size={14} className="text-gold" />100% Verified</span>
            <span className="flex items-center gap-1.5"><CalendarClock size={14} className="text-gold" />Updated Daily</span>
            <span className="flex items-center gap-1.5"><Ban size={14} className="text-gold" />No Broker Fees</span>
          </div>
        </div>

        {locatedRooms.length > 0 && (
          <section className="animate-fade-up mb-8" style={{ animationDelay: '120ms' }}>
            <div className="h-[320px] overflow-hidden rounded-3xl border border-line shadow-md shadow-brand/5 md:h-[400px]">
              <Map rooms={locatedRooms} zoom={13} />
            </div>
            <p className="mt-2 text-xs text-muted-ink">
              Showing {locatedRooms.length} mapped {locatedRooms.length === 1 ? 'listing' : 'listings'}.
            </p>
          </section>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room, i) => (
            <ListingCard key={(room as any).id} room={room as any} index={i} />
          ))}
        </div>

        {rooms.length === 0 && (
          <div className="animate-fade-up mt-8 flex flex-col items-center rounded-3xl border border-dashed border-line bg-card/60 px-6 py-20 text-center">
            <span className="grid size-20 place-items-center rounded-full bg-brand/10 text-brand">
              <SearchX size={34} />
            </span>
            <h3 className="mt-6 font-display text-2xl font-semibold text-ink">
              No rooms match your search
            </h3>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-ink">
              {area || type || max
                ? 'Nothing came up for these filters right now. Try widening your search — a nearby area, a different room type, or a higher budget.'
                : 'There are no verified rooms listed at the moment. New homes are added daily, so check back soon.'}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/search"
                className="shine flex items-center gap-2 rounded-2xl bg-brand px-6 py-3 text-sm font-semibold text-brand-ink shadow-lg shadow-brand/25 transition-transform hover:scale-105 active:scale-95"
              >
                Clear filters &amp; browse all
              </Link>
              <Link
                href="/"
                className="flex items-center gap-2 rounded-2xl border border-line bg-card px-6 py-3 text-sm font-semibold text-ink transition-all hover:border-gold hover:text-gold active:scale-[0.97]"
              >
                Back to homepage
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
