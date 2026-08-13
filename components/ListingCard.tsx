import Image from 'next/image'
import Link from 'next/link'
import { MapPin, ShieldCheck, KeyRound, Clock, Star } from 'lucide-react'
import { timeAgo } from '@/lib/time'

type RoomSummary = {
  id: string
  name: string
  type: string
  rent: number
  photos: string[]
  last_confirmed_at: string
  available_date: string | null
  rating_average?: number | null
  rating_count?: number
  buildings: {
    name: string
    area: string
    town: string
  }
}

export function ListingCard({ room, index = 0 }: { room: RoomSummary; index?: number }) {
  const photoUrl = room.photos.length > 0 ? room.photos[0] : 'https://placehold.co/600x400?text=No+Photo'
  const isVacant = !room.available_date || new Date(room.available_date) <= new Date()

  return (
    <Link
      href={`/room/${room.id}`}
      style={{ animationDelay: `${Math.min(index * 70, 500)}ms` }}
      className="animate-fade-up group flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-card shadow-md shadow-brand/5 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-brand/15"
    >
      {/* Image Section */}
      <div className="shine relative aspect-[4/3] overflow-hidden bg-soft">
        <Image
          src={photoUrl}
          alt={room.name}
          fill
          className="object-cover transition-transform duration-700 ease-spring-enter group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

        <div className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#111827] shadow">
          {room.type || 'Any Type'}
        </div>
        <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white shadow backdrop-blur">
          <ShieldCheck size={13} className="text-gold" />
          Verified
        </div>

        <span
          className={`absolute bottom-3 left-3 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide shadow ${
            isVacant ? 'bg-gold text-gold-ink' : 'bg-black/60 text-white/85'
          }`}
        >
          {isVacant ? 'Vacant' : `From ${new Date(room.available_date!).toLocaleDateString()}`}
        </span>
      </div>

      {/* Details Section */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-lg font-semibold leading-snug text-ink">
          {room.buildings.name}
        </h3>
        <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-ink">
          <MapPin size={14} className="shrink-0 text-gold" />
          {room.buildings.area}, {room.buildings.town}
          <span className="ml-auto flex items-center gap-1 text-xs">
            <Clock size={12} />
            {timeAgo(room.last_confirmed_at)}
          </span>
        </p>

        {room.rating_count != null && room.rating_count > 0 && room.rating_average != null && (
          <p className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-ink">
            <Star size={13} className="fill-gold text-gold" />
            {room.rating_average.toFixed(1)}
            <span className="font-normal text-muted-ink">
              · {room.rating_count} {room.rating_count === 1 ? 'review' : 'reviews'}
            </span>
          </p>
        )}

        <div className="mt-4 flex items-end justify-between border-t border-line pt-4">
          <div>
            <p className="font-display text-2xl font-semibold text-brand">
              KES {room.rent.toLocaleString()}
            </p>
            <p className="text-xs text-muted-ink">/ month</p>
          </div>
          <span className="flex items-center gap-1.5 rounded-xl bg-brand px-3.5 py-2 text-[11px] font-bold text-brand-ink shadow-lg shadow-brand/25 transition-transform duration-300 group-hover:scale-105">
            <KeyRound size={13} />
            Unlock · KES 150
          </span>
        </div>
      </div>
    </Link>
  )
}
