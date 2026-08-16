'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Heart, Search, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { ResidenceCard, RoomSummary } from '@/components/ResidenceCard'
import { Navbar, Footer } from '@/components/HomeSections'
import { Reveal } from '@/components/Reveal'

const FAVS_KEY = 'kejalink-favorites'

export default function FavoritesPage() {
  const [mounted, setMounted] = useState(false)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [rooms, setRooms] = useState<RoomSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Load persisted favorites (client-only)
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(FAVS_KEY) ?? '[]')
      if (Array.isArray(saved)) setFavorites(new Set(saved))
    } catch {
      /* ignore */
    }
    setMounted(true)
  }, [])

  const toggleFavorite = useCallback((id: string) => {
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
    // Removing a favorite drops the card from this page immediately
    setRooms((prev) => prev.filter((r) => r.id !== id))
  }, [])

  // Fetch the saved rooms once favorites are known
  useEffect(() => {
    if (!mounted) return
    if (favorites.size === 0) {
      setRooms([])
      setLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError('')
      const { data, error: err } = await supabase
        .from('rooms')
        .select(`
          id, name, type, rent, photos, last_confirmed_at, available_date,
          buildings (name, area, town)
        `)
        .in('id', [...favorites])
      if (cancelled) return
      if (err) {
        setError(err.message)
      } else {
        setRooms((data ?? []) as unknown as RoomSummary[])
      }
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [mounted, favorites.size === 0]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="relative flex min-h-screen flex-col bg-paper font-sans text-ink">
      <Navbar />

      <main className="relative z-10 mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gold">
                <Heart size={13} className="fill-current" />
                Saved by you
              </p>
              <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                Your favorites
              </h1>
              <p className="mt-1 text-sm text-muted-ink">
                Rooms you saved while browsing. Tap the heart to remove one.
              </p>
            </div>
            <Link
              href="/search"
              className="flex items-center gap-2 rounded-2xl border border-line bg-card px-5 py-2.5 text-sm font-semibold text-ink transition-all hover:border-gold hover:text-gold active:scale-[0.97]"
            >
              <Search size={15} />
              Browse more rooms
            </Link>
          </div>
        </Reveal>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
            Couldn&apos;t load your favorites: {error}
          </div>
        )}

        {loading ? (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex h-80 items-center justify-center rounded-3xl border border-line bg-card"
              >
                <Loader2 size={22} className="animate-spin text-muted-ink" />
              </div>
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <Reveal delay={80}>
            <div className="mt-8 flex flex-col items-center rounded-3xl border border-dashed border-line bg-card/60 px-6 py-20 text-center">
              <span className="grid size-20 place-items-center rounded-full bg-brand/10 text-brand">
                <Heart size={34} />
              </span>
              <p className="mt-6 font-display text-2xl font-semibold text-ink">
                No favorites yet
              </p>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-ink">
                When you tap the heart on a room, it shows up here so you can compare your top picks side by side.
              </p>
              <Link
                href="/"
                className="shine mt-8 flex items-center gap-2 rounded-2xl bg-brand px-6 py-3 text-sm font-semibold text-brand-ink shadow-lg shadow-brand/25 transition-transform hover:scale-105 active:scale-95"
              >
                Start browsing
              </Link>
            </div>
          </Reveal>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room, i) => (
              <ResidenceCard
                key={room.id}
                room={room}
                index={i}
                isFavorite={favorites.has(room.id)}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
