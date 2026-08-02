import { supabase } from '@/lib/supabase'
import { ListingCard } from '@/components/ListingCard'
import Link from 'next/link'
import { Filter } from 'lucide-react'

export const dynamic = 'force-dynamic'

async function searchRooms(area: string, type: string, max: string) {
  let query = supabase
    .from('rooms')
    .select(`
      id, name, type, rent, photos, last_confirmed_at, available_date,
      buildings!inner(name, area, town)
    `)
    .eq('state', 'live')
    .neq('state', 'taken')
    .gt('last_confirmed_at', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString())
    .order('last_confirmed_at', { ascending: false })

  if (type) {
    query = query.eq('type', type)
  }
  if (max) {
    query = query.lte('rent', parseInt(max, 10))
  }
  if (area) {
    query = query.ilike('buildings.area', `%${area}%`)
  }

  const { data, error } = await query

  if (error) {
    console.error('Search error:', error)
    return []
  }
  return data
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await searchParams
  const area = typeof resolvedParams.area === 'string' ? resolvedParams.area : ''
  const type = typeof resolvedParams.type === 'string' ? resolvedParams.type : ''
  const max = typeof resolvedParams.max === 'string' ? resolvedParams.max : ''

  const rooms = await searchRooms(area, type, max)

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans pb-24">
      {/* Header / Search bar */}
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-10 px-4 py-4 md:px-8">
        <form className="max-w-6xl mx-auto flex gap-4 items-center overflow-x-auto pb-2 md:pb-0">
          <Link href="/" className="font-bold text-xl text-emerald-600 dark:text-emerald-400 shrink-0 mr-4">
            Kejalink
          </Link>
          
          <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-full px-4 py-2 flex-1 min-w-[200px]">
            <input 
              name="area" 
              defaultValue={area} 
              placeholder="Area (e.g. Roysambu)" 
              className="bg-transparent border-none outline-none text-sm w-full dark:text-white"
            />
          </div>
          
          <select name="type" defaultValue={type} className="bg-zinc-100 dark:bg-zinc-800 rounded-full px-4 py-2 border-none outline-none text-sm shrink-0 dark:text-white">
            <option value="">Any Type</option>
            <option value="Single Room">Single Room</option>
            <option value="Bedsitter">Bedsitter</option>
            <option value="1 Bedroom">1 Bedroom</option>
            <option value="2 Bedroom">2 Bedroom</option>
          </select>
          
          <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-full px-4 py-2 w-32 shrink-0">
            <input 
              name="max" 
              type="number" 
              defaultValue={max} 
              placeholder="Max Rent" 
              className="bg-transparent border-none outline-none text-sm w-full dark:text-white"
            />
          </div>
          
          <button type="submit" className="bg-emerald-600 text-white rounded-full p-2 shrink-0 flex items-center justify-center">
            <Filter size={20} />
          </button>
        </form>
      </div>

      {/* Results */}
      <main className="max-w-6xl mx-auto px-4 md:px-8 mt-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            {rooms.length} {rooms.length === 1 ? 'Room' : 'Rooms'} Found
          </h1>
          <p className="text-zinc-500 text-sm">
            {area ? `in ${area}` : 'across all locations'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <ListingCard key={room.id} room={room as any} />
          ))}
        </div>
        
        {rooms.length === 0 && (
          <div className="text-center py-24">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">No exact matches</h3>
            <p className="text-zinc-500 mt-2">Try adjusting your filters to see more results.</p>
          </div>
        )}
      </main>
    </div>
  )
}
