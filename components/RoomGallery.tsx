'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, ImageOff } from 'lucide-react'

export function RoomGallery({ photos, altBase }: { photos: string[]; altBase: string }) {
  const [index, setIndex] = useState(0)
  const [interacted, setInteracted] = useState(false)
  const touchStartX = useRef<number | null>(null)

  const count = photos.length

  const go = useCallback(
    (next: number) => {
      setInteracted(true)
      setIndex(((next % count) + count) % count)
    },
    [count]
  )

  // Arrow keys work even before the gallery itself is focused.
  useEffect(() => {
    if (count < 2) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') go(index - 1)
      else if (e.key === 'ArrowRight') go(index + 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [count, go, index])

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const delta = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (Math.abs(delta) < 50) return
    go(delta > 0 ? index - 1 : index + 1)
  }

  if (count === 0) {
    return (
      <div className="mb-8 flex aspect-[4/3] items-center justify-center gap-2 rounded-3xl border border-line bg-soft text-muted-ink">
        <ImageOff size={20} />
        No photos
      </div>
    )
  }

  return (
    <div className="animate-fade-up mb-8">
      {/* Main photo */}
      <div
        role="region"
        aria-label="Room photo gallery"
        tabIndex={0}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className="group relative aspect-[4/3] overflow-hidden rounded-3xl border border-line bg-soft shadow-md shadow-brand/5 outline-none focus-visible:ring-2 focus-visible:ring-gold/60 md:aspect-[16/9]"
      >
        <Image
          key={photos[index]}
          src={photos[index]}
          alt={`${altBase} — photo ${index + 1} of ${count}`}
          fill
          priority={index === 0}
          className="animate-fade-up object-cover"
        />

        {/* Prev / next arrows */}
        {count > 1 && (
          <>
            <button
              onClick={() => go(index - 1)}
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-black/45 text-white backdrop-blur-sm transition-all hover:bg-black/65 active:scale-95 md:opacity-0 md:group-hover:opacity-100"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => go(index + 1)}
              aria-label="Next photo"
              className="absolute right-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-black/45 text-white backdrop-blur-sm transition-all hover:bg-black/65 active:scale-95 md:opacity-0 md:group-hover:opacity-100"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        {/* Counter badge */}
        <span className="absolute bottom-3 right-3 rounded-full bg-black/55 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
          {index + 1} / {count}
        </span>

        {/* Swipe hint (mobile, until first interaction) */}
        {count > 1 && !interacted && (
          <span className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-black/55 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm md:hidden">
            ‹ swipe ›
          </span>
        )}
      </div>

      {/* Thumbnails */}
      {count > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {photos.map((photo, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              aria-label={`Show photo ${i + 1}`}
              className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-xl border transition-all active:scale-95 ${
                i === index
                  ? 'border-gold ring-2 ring-gold/50'
                  : 'border-line opacity-60 hover:opacity-100'
              }`}
            >
              <Image
                src={photo}
                alt=""
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
