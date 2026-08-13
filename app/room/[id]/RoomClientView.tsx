'use client'

import { useState } from 'react'
import { UnlockModal } from '@/components/UnlockModal'
import { BookingModal } from '@/components/BookingModal'
import { Lock, Calendar } from 'lucide-react'

export function RoomClientView({ unlocked, roomId }: { unlocked: boolean, roomId: string }) {
  const [showUnlock, setShowUnlock] = useState(false)
  const [showBooking, setShowBooking] = useState(false)

  return (
    <>
      {unlocked ? (
        <button
          onClick={() => setShowBooking(true)}
          className="shine flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-4 font-semibold text-brand-ink shadow-lg shadow-brand/25 transition-all hover:brightness-110 active:scale-[0.98]"
        >
          <Calendar size={18} />
          Book this room
        </button>
      ) : (
        <button
          onClick={() => setShowUnlock(true)}
          className="shine flex w-full items-center justify-center gap-2 rounded-xl bg-gold py-4 font-semibold text-gold-ink shadow-lg shadow-gold/25 transition-all hover:brightness-105 active:scale-[0.98]"
        >
          <Lock size={18} />
          Unlock — 48hr pass · KES 200
        </button>
      )}

      {showUnlock && <UnlockModal onClose={() => setShowUnlock(false)} />}
      {showBooking && <BookingModal roomId={roomId} onClose={() => setShowBooking(false)} />}
    </>
  )
}
