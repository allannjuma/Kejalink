import Image from 'next/image'
import Link from 'next/link'
import { MapPin, ShieldCheck, Lock, Clock } from 'lucide-react'
import { timeAgo } from '@/lib/time'

type RoomSummary = {
  id: string
  name: string
  type: string
  rent: number
  photos: string[]
  last_confirmed_at: string
  available_date: string | null
  buildings: {
    name: string
    area: string
    town: string
  }
}

export function ListingCard({ room }: { room: RoomSummary }) {
  const photoUrl = room.photos.length > 0 ? room.photos[0] : 'https://placehold.co/600x400?text=No+Photo'
  const isVacant = !room.available_date || new Date(room.available_date) <= new Date()

  return (
    <Link href={`/room/${room.id}`} className="group flex flex-col bg-white rounded-2xl border border-zinc-200 overflow-hidden hover:shadow-lg transition-all dark:bg-zinc-900 dark:border-zinc-800">
      {/* Image Section */}
      <div className="relative aspect-[4/3] overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        <Image
          src={photoUrl}
          alt={room.name}
          fill
          className="object-cover transition-transform group-hover:scale-105"
        />
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur text-zinc-900 text-xs font-semibold px-2 py-1 rounded-md shadow-sm">
          {room.type || 'Any Type'}
        </div>
        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur text-white text-xs font-medium px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
          <ShieldCheck size={14} className="text-emerald-400" />
          Verified
        </div>
      </div>

      {/* Details Section */}
      <div className="p-4 flex flex-col gap-3">
        <div className="flex justify-between items-start gap-2">
          <div>
            <h3 className="font-semibold text-lg leading-tight text-zinc-900 dark:text-zinc-100">
              {room.buildings.name}
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 flex items-center gap-1 mt-1">
              <MapPin size={14} />
              {room.buildings.area}, {room.buildings.town}
            </p>
          </div>
          <div className="text-right">
            <p className="font-bold text-lg text-emerald-600 dark:text-emerald-400">
              KES {room.rent.toLocaleString()}
            </p>
            <p className="text-xs text-zinc-500">/ month</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium mt-1">
          {isVacant ? (
            <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full flex items-center gap-1 dark:bg-emerald-900/30 dark:text-emerald-400">
              ✅ Vacant
            </span>
          ) : (
            <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full flex items-center gap-1 dark:bg-amber-900/30 dark:text-amber-400">
              📅 Vacant from {new Date(room.available_date!).toLocaleDateString()}
            </span>
          )}
          <span className="text-zinc-400 flex items-center gap-1">
            <Clock size={12} />
            updated {timeAgo(room.last_confirmed_at)}
          </span>
        </div>

        {/* Lock Pill */}
        <div className="mt-2 flex items-center gap-2 text-xs font-medium text-amber-600 bg-amber-50 rounded-lg p-2 border border-amber-100 dark:bg-amber-950/30 dark:border-amber-900/50 dark:text-amber-500">
          <Lock size={14} />
          Contacts & Location Locked
        </div>
      </div>
    </Link>
  )
}
