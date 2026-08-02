import Link from 'next/link'
import { Search, MapPin, ShieldCheck, Zap } from 'lucide-react'
import { ListingCard } from '@/components/ListingCard'
import { supabase } from '@/lib/supabase'

export const revalidate = 3600 // revalidate every hour

async function getFeaturedRooms() {
  const { data, error } = await supabase
    .from('rooms')
    .select(`
      id, name, type, rent, photos, last_confirmed_at, available_date,
      buildings (name, area, town)
    `)
    .eq('state', 'live')
    .neq('state', 'taken') // status is 'taken' mapped to state='taken'
    .gt('last_confirmed_at', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString())
    .limit(6)
    .order('last_confirmed_at', { ascending: false })

  if (error) {
    console.error('Error fetching featured rooms:', error)
    return []
  }
  return data
}

export default async function Home() {
  const rooms = await getFeaturedRooms()

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-black font-sans">
      {/* Hero Section */}
      <section className="relative px-6 py-24 md:py-32 flex flex-col items-center justify-center overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/50 to-transparent dark:from-emerald-950/20 dark:to-transparent -z-10" />
        
        <div className="max-w-4xl w-full text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            Find your next home,<br />
            <span className="text-emerald-600 dark:text-emerald-400">zero broker fees.</span>
          </h1>
          <p className="text-lg md:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
            Browse verified listings across Kenya. Unlock exact locations and caretaker contacts instantly for just KES 150.
          </p>

          {/* Search Card */}
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-3xl shadow-xl shadow-zinc-200/50 dark:shadow-none border border-zinc-100 dark:border-zinc-800 max-w-3xl mx-auto flex flex-col md:flex-row gap-4">
            <div className="flex-1 text-left px-4 py-2 border-b md:border-b-0 md:border-r border-zinc-100 dark:border-zinc-800">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">Location</label>
              <input type="text" placeholder="e.g. Roysambu, Ruaka..." className="w-full bg-transparent border-none outline-none text-zinc-900 dark:text-white font-medium placeholder:font-normal placeholder:text-zinc-400" />
            </div>
            <div className="flex-1 text-left px-4 py-2 border-b md:border-b-0 md:border-r border-zinc-100 dark:border-zinc-800">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">House Type</label>
              <select className="w-full bg-transparent border-none outline-none text-zinc-900 dark:text-white font-medium appearance-none cursor-pointer">
                <option value="">Any Type</option>
                <option value="Single Room">Single Room</option>
                <option value="Bedsitter">Bedsitter</option>
                <option value="1 Bedroom">1 Bedroom</option>
                <option value="2 Bedroom">2 Bedroom</option>
              </select>
            </div>
            <div className="flex-1 text-left px-4 py-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">Max Rent (KES)</label>
              <input type="number" placeholder="e.g. 15000" className="w-full bg-transparent border-none outline-none text-zinc-900 dark:text-white font-medium placeholder:font-normal placeholder:text-zinc-400" />
            </div>
            <Link 
              href="/search"
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl px-8 py-4 flex items-center justify-center gap-2 font-semibold transition-colors shadow-lg shadow-emerald-200 dark:shadow-none"
            >
              <Search size={20} />
              <span className="md:hidden">Search</span>
            </Link>
          </div>

          {/* Trust Strip */}
          <div className="flex flex-wrap justify-center gap-6 pt-8 text-sm font-medium text-zinc-600 dark:text-zinc-400">
            <span className="flex items-center gap-2 bg-white dark:bg-zinc-900 px-4 py-2 rounded-full border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <ShieldCheck className="text-emerald-500" size={16} /> 100% Verified
            </span>
            <span className="flex items-center gap-2 bg-white dark:bg-zinc-900 px-4 py-2 rounded-full border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <Zap className="text-amber-500" size={16} /> Updated Daily
            </span>
            <span className="flex items-center gap-2 bg-white dark:bg-zinc-900 px-4 py-2 rounded-full border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <span className="text-rose-500 font-bold">🚫</span> No Broker Fees
            </span>
          </div>
        </div>
      </section>

      {/* Verified Near You */}
      <section className="px-6 py-16 max-w-6xl mx-auto w-full">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Verified & Fresh</h2>
            <p className="text-zinc-500 dark:text-zinc-400 mt-2">Recently confirmed listings across town.</p>
          </div>
          <Link href="/search" className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline hidden md:block">
            View all listings →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <ListingCard key={room.id} room={room as any} />
          ))}
          {rooms.length === 0 && (
            <div className="col-span-full text-center py-12 text-zinc-500">
              No rooms found matching the criteria.
            </div>
          )}
        </div>
        
        <div className="mt-8 text-center md:hidden">
          <Link href="/search" className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">
            View all listings →
          </Link>
        </div>
      </section>
    </div>
  )
}
