'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { MapPin, ShieldCheck, Clock, Heart, KeyRound } from 'lucide-react'
import { timeAgo } from '@/lib/time'

export type RoomSummary = {
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

type ResidenceCardProps = {
  room: RoomSummary
  index?: number
  isFavorite?: boolean
  onToggleFavorite?: (id: string) => void
}

/* Skill: animation.md — ease-out entrances, scale never below 0.95, exit ≈75% of enter */
const EASE_OUT = [0.23, 1, 0.32, 1] as const

export function ResidenceCard({ room, index = 0, isFavorite, onToggleFavorite }: ResidenceCardProps) {
  const photoUrl =
    room.photos.length > 0
      ? room.photos[0]
      : 'https://placehold.co/600x400?text=No+Photo'
  const isVacant = !room.available_date || new Date(room.available_date) <= new Date()

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.15 } }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.06, 0.36), ease: EASE_OUT }}
      whileHover={{ y: -6 }}
      className="group relative"
    >
      <Link
        href={`/room/${room.id}`}
        className="flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-card shadow-md shadow-brand/5 transition-shadow duration-300 group-hover:shadow-xl group-hover:shadow-brand/15"
      >
        {/* Photo — price lives on the image, Airbnb-style */}
        <div className="shine relative aspect-[4/3] overflow-hidden bg-soft">
          <Image
            src={photoUrl}
            alt={room.name}
            fill
            className="object-cover transition-transform duration-500 ease-spring-enter group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/10" />

          <div className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#111827] shadow">
            {room.type || 'Residence'}
          </div>
          <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white shadow backdrop-blur">
            <ShieldCheck size={13} className="text-gold" />
            Verified
          </div>

          <div className="absolute bottom-3 left-3 flex items-center gap-2">
            <span className="rounded-full bg-white/95 px-3 py-1.5 font-display text-base font-semibold text-[#111827] shadow">
              KES {room.rent.toLocaleString()}
              <span className="ml-1 text-[11px] font-normal text-[#9CA3AF]">/ mo</span>
            </span>
          </div>
          <span
            className={`absolute bottom-3 right-3 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide shadow ${
              isVacant ? 'bg-gold text-gold-ink' : 'bg-black/60 text-white/85'
            }`}
          >
            {isVacant ? 'Vacant' : `From ${new Date(room.available_date!).toLocaleDateString()}`}
          </span>
        </div>

        {/* Body — name, location, then one quiet meta row */}
        <div className="flex flex-1 flex-col p-5">
          <h3 className="font-display text-lg font-semibold leading-snug text-ink">
            {room.buildings.name}
          </h3>
          <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-ink">
            <MapPin size={14} className="shrink-0 text-gold" />
            {room.buildings.area}, {room.buildings.town}
          </p>

          <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
            <span className="flex items-center gap-1 text-xs text-muted-ink">
              <Clock size={12} />
              updated {timeAgo(room.last_confirmed_at)}
            </span>
            <span className="flex items-center gap-1.5 rounded-xl bg-brand px-3.5 py-2 text-[11px] font-bold text-brand-ink shadow-lg shadow-brand/25 transition-transform duration-150 group-hover:scale-[1.02]">
              <KeyRound size={13} />
              Unlock · KES 150
            </span>
          </div>
        </div>
      </Link>

      {/* Favorite */}
      {onToggleFavorite && (
        <motion.button
          whileTap={{ scale: 0.9 }}
          transition={{ duration: 0.12 }}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onToggleFavorite(room.id)
          }}
          aria-label={isFavorite ? 'Remove from favorites' : 'Save to favorites'}
          aria-pressed={isFavorite}
          className={`absolute right-4 top-14 z-10 grid size-9 place-items-center rounded-full shadow-lg backdrop-blur transition-colors duration-150 ${
            isFavorite ? 'bg-gold text-gold-ink' : 'bg-white/85 text-zinc-500 hover:text-[#FF385C]'
          }`}
        >
          <Heart size={16} className={isFavorite ? 'fill-current' : ''} />
        </motion.button>
      )}
    </motion.div>
  )
}
