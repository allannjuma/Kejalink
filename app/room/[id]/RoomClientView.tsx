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
          className="w-full py-4 bg-zinc-900 hover:bg-black text-white font-semibold rounded-xl transition-all shadow-xl shadow-zinc-200 dark:shadow-none flex items-center justify-center gap-2 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          <Calendar size={18} />
          Book this room
        </button>
      ) : (
        <button
          onClick={() => setShowUnlock(true)}
          className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all shadow-xl shadow-emerald-200 dark:shadow-none flex items-center justify-center gap-2"
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
