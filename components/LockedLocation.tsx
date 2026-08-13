'use client'

import { useState } from 'react'
import { Lock, MapPin, KeyRound } from 'lucide-react'
import { UnlockModal } from '@/components/UnlockModal'

/**
 * Shown in place of the real map until the visitor has an active paid pass.
 * The real coordinates are never rendered while locked.
 */
export function LockedLocation({ area, town }: { area: string; town: string }) {
  const [showUnlock, setShowUnlock] = useState(false)

  return (
    <>
      <div className="relative flex h-[320px] flex-col items-center justify-center overflow-hidden bg-soft">
        {/* Fake map grid — deliberately not the real location */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              'linear-gradient(var(--line) 1px, transparent 1px), linear-gradient(90deg, var(--line) 1px, transparent 1px)',
            backgroundSize: '36px 36px',
          }}
        />
        <div aria-hidden className="animate-blob absolute -left-10 top-6 size-48 rounded-full bg-[#FF385C]/10 blur-3xl" />

        <div className="relative flex flex-col items-center px-6 text-center">
          <span className="grid size-14 place-items-center rounded-full bg-[#111827] text-white shadow-lg dark:bg-white dark:text-[#111827]">
            <Lock size={22} />
          </span>
          <p className="mt-4 font-display text-lg font-semibold text-ink">
            Exact location is locked
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-ink">
            <MapPin size={14} className="text-gold" />
            {area}, {town} — unlock to reveal the map pin & directions
          </p>
          <button
            onClick={() => setShowUnlock(true)}
            className="shine mt-5 flex items-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-bold text-brand-ink shadow-lg shadow-brand/25 transition-transform duration-150 hover:scale-[1.02] active:scale-[0.97]"
          >
            <KeyRound size={16} />
            Unlock location · from KES 150
          </button>
        </div>
      </div>
      {showUnlock && <UnlockModal onClose={() => setShowUnlock(false)} />}
    </>
  )
}
