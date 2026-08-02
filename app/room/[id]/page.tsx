import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getTenantPhoneSession } from '@/lib/session'
import { MapPin, ShieldCheck, Lock, CheckCircle2, Navigation, Phone, Calendar, Clock, AlertTriangle } from 'lucide-react'
import { RoomClientView } from './RoomClientView'

export const dynamic = 'force-dynamic'

async function getRoom(id: string) {
  const { data, error } = await supabase
    .from('rooms')
    .select(`
      *,
      buildings (name, area, town, exact_location),
      users:buildings(users(name, phone, whatsapp))
    `)
    .eq('id', id)
    .single()

  if (error || !data) return null
  return data
}

async function isUnlocked() {
  const phone = await getTenantPhoneSession()
  if (!phone) return false

  const { data } = await supabase
    .from('passes')
    .select('id')
    .eq('phone', phone)
    .eq('status', 'paid')
    .gt('expires_at', new Date().toISOString())
    .limit(1)

  return !!(data && data.length > 0)
}

export default async function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const room = await getRoom(resolvedParams.id)
  
  if (!room) return notFound()

  const unlocked = await isUnlocked()
  const caretaker = room.buildings?.users?.[0] || { name: 'Unknown', phone: 'Unknown', whatsapp: null }
  
  // Extract amenities securely (fallback to empty array)
  const amenities = Array.isArray(room.amenities) ? room.amenities : []

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans pb-24">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-10 px-4 py-4 md:px-8 flex items-center justify-between">
        <Link href="/search" className="font-bold text-xl text-emerald-600 dark:text-emerald-400">
          ← Back
        </Link>
        <div className="flex items-center gap-2">
          {unlocked ? (
            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800">
              <CheckCircle2 size={14} /> Unlocked
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-3 py-1 rounded-full dark:bg-amber-900/30 dark:text-amber-500 border border-amber-100 dark:border-amber-800">
              <Lock size={14} /> Locked
            </span>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-8 mt-8">
        {/* Gallery */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {room.photos.length > 0 ? (
            room.photos.slice(0, 2).map((photo: string, i: number) => (
              <div key={i} className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800">
                <Image src={photo} alt={`Room photo ${i+1}`} fill className="object-cover" />
              </div>
            ))
          ) : (
            <div className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-400">
              No Photos
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            {/* Title & Basics */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-white leading-tight">
                  {room.type} at {room.buildings.name}
                </h1>
              </div>
              <p className="text-zinc-500 dark:text-zinc-400 flex items-center gap-2 text-lg">
                <MapPin size={18} />
                {room.buildings.area}, {room.buildings.town}
              </p>
            </div>

            <div className="flex gap-4 p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
              <div className="flex-1">
                <p className="text-xs text-zinc-500 font-bold uppercase tracking-wide">Rent</p>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">KES {room.rent.toLocaleString()}</p>
              </div>
              <div className="flex-1 border-l pl-4 border-zinc-200 dark:border-zinc-800">
                <p className="text-xs text-zinc-500 font-bold uppercase tracking-wide">Deposit</p>
                <p className="text-xl font-bold text-zinc-900 dark:text-white mt-1">KES {(room.deposit || 0).toLocaleString()}</p>
              </div>
            </div>

            {/* Description */}
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">About this room</h2>
              <p className="text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap leading-relaxed">
                {room.description || 'No description provided.'}
              </p>
            </div>

            {/* Amenities */}
            {amenities.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">Amenities</h2>
                <div className="flex flex-wrap gap-2">
                  {amenities.map((am: string, i: number) => (
                    <span key={i} className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-full text-sm font-medium border border-zinc-200 dark:border-zinc-700">
                      {am}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Report */}
            <div className="pt-8 border-t border-zinc-200 dark:border-zinc-800">
              <button className="flex items-center gap-2 text-red-500 hover:text-red-600 text-sm font-semibold transition-colors">
                <AlertTriangle size={16} />
                Report this listing (Fake / Taken)
              </button>
            </div>
          </div>

          {/* Sidebar (Locked/Unlocked Context) */}
          <div className="md:col-span-1">
            <div className="sticky top-24 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-xl shadow-zinc-200/50 dark:shadow-none">
              
              {/* Caretaker Info */}
              <h3 className="font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                Caretaker Contact
              </h3>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                    <ShieldCheck size={20} />
                  </div>
                  <div className={unlocked ? "" : "filter blur-[6px] select-none"}>
                    <p className="font-semibold text-zinc-900 dark:text-white">{unlocked ? caretaker.name : 'Hidden Name'}</p>
                    <p className="text-sm text-zinc-500 flex items-center gap-1">
                      <Phone size={12} /> {unlocked ? caretaker.phone : '07XX XXX XXX'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-10 flex justify-center text-zinc-400">
                    <Navigation size={20} />
                  </div>
                  <div className={unlocked ? "" : "filter blur-[6px] select-none"}>
                    <p className="font-semibold text-zinc-900 dark:text-white text-sm">Exact Location / Pin</p>
                    <p className="text-xs text-zinc-500 mt-1">
                      {unlocked ? (room.buildings.exact_location || 'Not provided') : 'Locked behind pass'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Client interactivity injected here */}
              <RoomClientView unlocked={unlocked} roomId={room.id} />
              
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
