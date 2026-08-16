'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight,
  BadgeCheck,
  Ban,
  BedDouble,
  CalendarClock,
  Heart,
  MapPin,
  RotateCcw,
  Search,
  SearchX,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react'
import { ResidenceCard, RoomSummary } from './ResidenceCard'
import { Filters } from './FilterPanel'
import { Footer, HowItWorks, Navbar, WhyBanner } from './HomeSections'
import { Reveal } from './Reveal'
import { useCountUp } from '@/lib/useCountUp'

type HomeClientProps = {
  rooms: RoomSummary[]
}

const PROPERTY_TYPES = ['Single Room', 'Bedsitter', '1 Bedroom', '2 Bedroom']
const AMENITIES = ['Pool', 'Garden', 'Gym', 'Parking', 'Smart Home', 'Security']
const RENT_CAP = 150000
const FALLBACK_AREAS = [
  'Kilimani', 'Westlands', 'Ruiru', 'Karen', 'Kahawa Wendani',
  'Thika', 'Nyali', 'Juja', 'Kileleshwa', 'Ruaka',
]
const FAVS_KEY = 'kejalink-favorites'

/* Skill: animation.md — enter with ease-out, scale never below 0.95 */
const EASE_OUT = [0.23, 1, 0.32, 1] as const

const HEADLINE_A = 'Find your next home,'

function Stat({ target, suffix, label }: { target: number; suffix: string; label: string }) {
  const { ref, value } = useCountUp(target)
  return (
    <div>
      <p className="font-display text-3xl font-semibold text-brand">
        <span ref={ref}>{value.toLocaleString()}</span>
        {suffix}
      </p>
      <p className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-ink">{label}</p>
    </div>
  )
}

/** Floating hero card backed by a real listing photo (gradient fallback). */
function HeroFloatCard({
  room,
  label,
  className,
  delay,
  rotate,
  floatDelay,
}: {
  room: RoomSummary
  label: string
  className: string
  delay: number
  rotate: number
  floatDelay: string
}) {
  const photo = room.photos?.[0]
  return (
    <motion.div
      initial={{ opacity: 0, y: 48, scale: 0.95, rotate: rotate * 1.5 }}
      animate={{ opacity: 1, y: 0, scale: 1, rotate }}
      transition={{ delay, duration: 0.6, ease: EASE_OUT }}
      className={`animate-float absolute w-64 rounded-3xl border border-line bg-card p-3 shadow-2xl shadow-brand/15 ${className}`}
      style={{ animationDelay: floatDelay }}
    >
      <div className="relative h-36 overflow-hidden rounded-2xl bg-soft">
        {photo ? (
          <Image src={photo} alt={room.name} fill className="object-cover" />
        ) : (
          <div className="art-pattern size-full bg-gradient-to-br from-[#FF385C] to-[#9f1239]" />
        )}
        <span className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur">
          <BadgeCheck size={11} className="text-gold" />
          {label}
        </span>
        <span className="absolute bottom-2.5 left-2.5 rounded-full bg-white/95 px-2.5 py-1 font-display text-sm font-semibold text-[#111827] shadow">
          KES {room.rent.toLocaleString()}
          <span className="ml-1 text-[10px] font-normal text-[#9CA3AF]">/ mo</span>
        </span>
      </div>
      <p className="mt-2.5 truncate px-1 text-sm font-semibold text-ink">
        {room.type} · {room.buildings.area}
      </p>
      <p className="flex items-center gap-1 px-1 pb-1 text-xs text-muted-ink">
        <MapPin size={11} className="text-gold" />
        {room.buildings.town}
      </p>
    </motion.div>
  )
}

export function HomeClient({ rooms }: HomeClientProps) {
  const [filters, setFilters] = useState<Filters>({
    query: '',
    type: '',
    maxRent: '',
    amenities: [],
    availableOnly: false,
  })
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)

  // Load persisted favorites
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(FAVS_KEY) ?? '[]')
      if (Array.isArray(saved)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage hydration must run after mount to avoid an SSR mismatch
        setFavorites(new Set(saved))
      }
    } catch {
      /* ignore */
    }
  }, [])

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      try {
        localStorage.setItem(FAVS_KEY, JSON.stringify([...next]))
      } catch {
        /* ignore */
      }
      return next
    })
  }

  // ── Original filtering logic, unchanged ──────────────────────
  const filteredRooms = useMemo(() => {
    const max = filters.maxRent ? Number(filters.maxRent) : Infinity

    return rooms.filter((room) => {
      if (showFavoritesOnly && !favorites.has(room.id)) return false
      if (filters.type && room.type !== filters.type) return false
      if (room.rent > max) return false

      if (filters.availableOnly) {
        const isVacant =
          !room.available_date || new Date(room.available_date) <= new Date()
        if (!isVacant) return false
      }

      if (filters.query) {
        const q = filters.query.toLowerCase()
        const text = `${room.name} ${room.type} ${room.buildings.name} ${room.buildings.area} ${room.buildings.town}`.toLowerCase()
        if (!text.includes(q)) return false
      }

      return true
    })
  }, [rooms, filters, favorites, showFavoritesOnly])

  const isDefault =
    !filters.query &&
    !filters.type &&
    !filters.maxRent &&
    filters.amenities.length === 0 &&
    !filters.availableOnly &&
    !showFavoritesOnly

  const resetFilters = () => {
    setFilters({ query: '', type: '', maxRent: '', amenities: [], availableOnly: false })
    setShowFavoritesOnly(false)
  }

  const scrollToListings = () =>
    document.getElementById('listings')?.scrollIntoView({ behavior: 'smooth' })

  const toggleAmenity = (amenity: string) =>
    setFilters((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }))

  const towns = useMemo(() => {
    const unique = [...new Set(rooms.map((r) => r.buildings.town).filter(Boolean))]
    return unique.length >= 4 ? unique : [...unique, ...FALLBACK_AREAS]
  }, [rooms])
  const uniqueTownCount = useMemo(
    () => new Set(rooms.map((r) => r.buildings.town).filter(Boolean)).size,
    [rooms]
  )

  const heroRoomA = rooms.find((r) => r.photos?.length > 0) ?? rooms[0]
  const heroRoomB = rooms.filter((r) => r.photos?.length > 0)[1] ?? rooms[1] ?? rooms[0]

  return (
    <div className="flex min-h-screen flex-col bg-paper font-sans text-ink">
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pb-10 pt-32 sm:pt-36">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="animate-blob absolute -left-24 top-10 size-[420px] rounded-full bg-[#FF385C]/10 blur-3xl dark:bg-[#FF385C]/15" />
          <div className="animate-blob-slow absolute -right-32 top-40 size-[480px] rounded-full bg-rose-200/50 blur-3xl dark:bg-[#FF385C]/10" />
          <div className="animate-blob absolute bottom-0 left-1/3 size-[360px] rounded-full bg-gray-200/60 blur-3xl [animation-delay:-6s] dark:bg-white/5" />
        </div>

        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-[1.15fr_0.85fr]">
          {/* Copy */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: EASE_OUT }}
              className="inline-flex items-center gap-2 rounded-full border border-line bg-card/70 px-4 py-1.5 text-xs font-semibold text-muted-ink shadow-sm backdrop-blur"
            >
              <Sparkles size={14} className="text-gold" />
              Verified listings across Kenya
            </motion.div>

            <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              {HEADLINE_A.split(' ').map((word, i) => (
                <motion.span
                  key={i}
                  className="mr-3 inline-block"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 + i * 0.07, duration: 0.5, ease: EASE_OUT }}
                >
                  {word}
                </motion.span>
              ))}
              <br />
              <motion.span
                className="italic text-brand"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5, ease: EASE_OUT }}
              >
                zero broker fees.
              </motion.span>
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.62, duration: 0.45, ease: EASE_OUT }}
              className="mt-6 max-w-xl text-lg leading-relaxed text-muted-ink"
            >
              Browse verified rooms and apartments. Unlock exact locations and caretaker
              contacts instantly for just <span className="font-semibold text-ink">KES 150</span>.
            </motion.p>

            {/* Search */}
            <motion.form
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.72, duration: 0.45, ease: EASE_OUT }}
              className="mt-8 flex max-w-xl items-center gap-2 rounded-2xl border border-line bg-card p-2 shadow-xl shadow-brand/5 transition-shadow focus-within:shadow-brand/15 focus-within:ring-2 focus-within:ring-gold/50"
              onSubmit={(e) => {
                e.preventDefault()
                scrollToListings()
              }}
            >
              <Search size={20} className="ml-2 shrink-0 text-muted-ink" />
              <input
                value={filters.query}
                onChange={(e) => setFilters((f) => ({ ...f, query: e.target.value }))}
                placeholder="Try “Kilimani”, “bedsitter”, “Ruiru”…"
                className="h-11 w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted-ink/60"
              />
              <button
                type="submit"
                className="shine group flex h-11 shrink-0 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-brand-ink shadow-lg shadow-brand/25 transition-transform duration-150 active:scale-[0.97]"
              >
                Search
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </button>
            </motion.form>

            {/* Popular towns quick links */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.85, duration: 0.4 }}
              className="mt-4 flex max-w-xl flex-wrap items-center gap-2"
            >
              <span className="text-xs font-medium text-muted-ink">Popular:</span>
              {towns.slice(0, 5).map((town) => (
                <Link
                  key={town}
                  href={`/search?area=${encodeURIComponent(town)}`}
                  className="rounded-full border border-line bg-card px-3 py-1.5 text-xs font-medium text-muted-ink transition-all duration-150 hover:border-gold hover:text-ink active:scale-[0.97]"
                >
                  {town}
                </Link>
              ))}
            </motion.div>

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.95, duration: 0.4 }}
              className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium text-muted-ink"
            >
              <span className="flex items-center gap-1.5"><BadgeCheck size={16} className="text-gold" />100% Verified</span>
              <span className="flex items-center gap-1.5"><CalendarClock size={16} className="text-gold" />Updated Daily</span>
              <span className="flex items-center gap-1.5"><Ban size={16} className="text-gold" />No Broker Fees</span>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.05, duration: 0.45, ease: EASE_OUT }}
              className="mt-10 flex gap-10 border-t border-line pt-8"
            >
              <Stat target={rooms.length} suffix="" label="Fresh listings" />
              <Stat target={uniqueTownCount} suffix="" label="Towns covered" />
              <div>
                <p className="font-display text-3xl font-semibold text-brand">KES 0</p>
                <p className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-ink">
                  Broker fees, ever
                </p>
              </div>
            </motion.div>
          </div>

          {/* Floating preview cards — real listing photos */}
          <div className="relative hidden h-[480px] lg:block">
            {heroRoomA && (
              <HeroFloatCard
                room={heroRoomA}
                label="Verified"
                className="left-2 top-6"
                delay={0.45}
                rotate={-4}
                floatDelay="0s"
              />
            )}
            {heroRoomB && (
              <HeroFloatCard
                room={heroRoomB}
                label="Fresh"
                className="right-0 top-40"
                delay={0.6}
                rotate={3}
                floatDelay="-2.5s"
              />
            )}

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.85, duration: 0.4, ease: EASE_OUT }}
              className="animate-float absolute bottom-8 left-16 flex items-center gap-3 rounded-2xl border border-line bg-card/90 px-4 py-3 shadow-xl backdrop-blur [animation-delay:-1.2s]"
            >
              <span className="grid size-10 place-items-center rounded-full bg-gold/15 text-gold">
                <ShieldCheck size={20} />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">Caretaker unlocked</p>
                <p className="flex items-center gap-1 text-xs text-muted-ink">
                  <MapPin size={12} /> Exact location shared
                </p>
              </div>
              <BedDouble size={16} className="ml-2 text-muted-ink/50" />
            </motion.div>
          </div>
        </div>

        {/* Area ticker */}
        <div className="marquee-paused relative mt-16 overflow-hidden border-y border-line bg-card/50 py-3 backdrop-blur">
          <div className="animate-marquee flex w-max gap-10">
            {[...towns, ...towns].map((area, i) => (
              <span key={i} className="flex items-center gap-2 text-sm font-medium text-muted-ink">
                <MapPin size={14} className="text-gold" />
                {area}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Listings ─────────────────────────────────────────── */}
      <section id="listings" className="mx-auto w-full max-w-7xl scroll-mt-24 px-4 py-16 sm:px-6">
        <Reveal className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">Verified & fresh</p>
            <h2 className="mt-2 font-display text-4xl font-semibold tracking-tight text-ink">
              Recently confirmed homes
            </h2>
          </div>
          <button
            onClick={() => setShowFavoritesOnly((v) => !v)}
            aria-pressed={showFavoritesOnly}
            className={`flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition-all duration-150 active:scale-[0.97] ${
              showFavoritesOnly
                ? 'border-gold bg-gold text-gold-ink shadow-md'
                : 'border-line bg-card text-muted-ink hover:text-ink'
            }`}
          >
            <Heart size={16} className={showFavoritesOnly ? 'fill-current' : ''} />
            Favorites
            <span className="rounded-full bg-black/10 px-2 py-0.5 text-xs font-bold dark:bg-white/10">
              {favorites.size}
            </span>
          </button>
        </Reveal>

        {/* Filter bar */}
        <Reveal delay={100}>
          <div className="rounded-3xl border border-line bg-card/80 p-5 shadow-lg shadow-brand/5 backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                <SlidersHorizontal size={16} className="text-gold" />
                Refine search
                <AnimatePresence mode="popLayout">
                  <motion.span
                    key={filteredRooms.length}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.2, ease: EASE_OUT }}
                    className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-bold text-brand"
                  >
                    {filteredRooms.length} {filteredRooms.length === 1 ? 'home' : 'homes'}
                  </motion.span>
                </AnimatePresence>
              </p>
              <AnimatePresence>
                {!isDefault && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: EASE_OUT }}
                    onClick={resetFilters}
                    className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-muted-ink transition-colors hover:border-gold hover:text-gold"
                  >
                    <RotateCcw size={14} />
                    Reset all
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* Type chips */}
            <div className="mt-4 flex flex-wrap gap-2">
              {PROPERTY_TYPES.map((type) => {
                const active = filters.type === type
                return (
                  <button
                    key={type}
                    onClick={() => setFilters((f) => ({ ...f, type: active ? '' : type }))}
                    aria-pressed={active}
                    className={`rounded-full border px-4 py-2 text-xs font-semibold transition-all duration-150 active:scale-[0.97] ${
                      active
                        ? 'border-brand bg-brand text-brand-ink shadow-md shadow-brand/25'
                        : 'border-line bg-paper text-muted-ink hover:border-brand/40 hover:text-ink'
                    }`}
                  >
                    {type}
                  </button>
                )
              })}
            </div>

            <div className="mt-5 grid gap-6 md:grid-cols-[1fr_auto]">
              {/* Amenities */}
              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-ink">Amenities</p>
                <div className="flex flex-wrap gap-2">
                  {AMENITIES.map((amenity) => {
                    const active = filters.amenities.includes(amenity)
                    return (
                      <button
                        key={amenity}
                        onClick={() => toggleAmenity(amenity)}
                        aria-pressed={active}
                        className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all duration-150 active:scale-[0.97] ${
                          active
                            ? 'border-gold bg-gold/15 text-gold shadow-sm'
                            : 'border-line bg-paper text-muted-ink hover:border-gold/40 hover:text-ink'
                        }`}
                      >
                        {active ? '✓ ' : ''}
                        {amenity}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Max rent + available toggle */}
              <div className="flex min-w-64 flex-col gap-4">
                <div>
                  <p className="mb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-muted-ink">
                    Max rent
                    {filters.maxRent ? (
                      <button
                        onClick={() => setFilters((f) => ({ ...f, maxRent: '' }))}
                        className="rounded-md bg-soft px-2 py-0.5 text-xs font-bold normal-case tracking-normal text-ink transition-colors hover:text-gold"
                        title="Click to clear"
                      >
                        KES {Number(filters.maxRent).toLocaleString()} ✕
                      </button>
                    ) : (
                      <span className="rounded-md bg-soft px-2 py-0.5 text-xs font-bold normal-case tracking-normal text-muted-ink">
                        Any
                      </span>
                    )}
                  </p>
                  <input
                    type="range"
                    min={5000}
                    max={RENT_CAP}
                    step={1000}
                    value={filters.maxRent ? Number(filters.maxRent) : RENT_CAP}
                    onChange={(e) =>
                      setFilters((f) => ({
                        ...f,
                        maxRent: e.target.value === String(RENT_CAP) ? '' : e.target.value,
                      }))
                    }
                    className="w-full accent-[#FF385C]"
                  />
                </div>
                <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-line bg-paper px-3 py-2.5">
                  <span className="text-xs font-semibold text-ink">Available now only</span>
                  <button
                    type="button"
                    onClick={() => setFilters((f) => ({ ...f, availableOnly: !f.availableOnly }))}
                    className={`relative h-7 w-12 shrink-0 rounded-full border transition-colors duration-200 ${
                      filters.availableOnly ? 'border-brand bg-brand' : 'border-line bg-soft'
                    }`}
                    aria-pressed={filters.availableOnly}
                  >
                    <span
                      className={`absolute left-1 top-1 size-5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-toggle ${
                        filters.availableOnly ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </label>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Grid */}
        <motion.div layout className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filteredRooms.map((room, i) => (
              <ResidenceCard
                key={room.id}
                room={room}
                index={i}
                isFavorite={favorites.has(room.id)}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </AnimatePresence>
        </motion.div>

        <AnimatePresence>
          {filteredRooms.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: EASE_OUT }}
              className="mt-8 flex flex-col items-center rounded-3xl border border-dashed border-line py-16 text-center"
            >
              <span className="grid size-14 place-items-center rounded-full bg-soft text-muted-ink">
                <SearchX size={24} />
              </span>
              <p className="mt-4 font-display text-xl font-semibold text-ink">No homes match those filters</p>
              <p className="mt-1 text-sm text-muted-ink">Loosen a filter or two — your future home is hiding.</p>
              <button
                onClick={resetFilters}
                className="mt-5 rounded-full border border-line bg-card px-6 py-2.5 text-sm font-semibold text-ink transition-all duration-150 hover:border-gold hover:text-gold active:scale-[0.97]"
              >
                Clear all filters
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <HowItWorks />
      <WhyBanner />
      <Footer />
    </div>
  )
}
