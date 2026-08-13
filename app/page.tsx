import { HomeClient } from '@/components/HomeClient'
import { RoomSummary } from '@/components/ResidenceCard'
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
    .neq('state', 'taken')
    .gt('last_confirmed_at', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString())
    .limit(9)
    .order('last_confirmed_at', { ascending: false })

  if (error) {
    console.error('Error fetching featured rooms:', error)
    return []
  }
  return (data ?? []) as unknown as RoomSummary[]
}

export default async function Home() {
  const rooms = await getFeaturedRooms()

  return <HomeClient rooms={rooms} />
}
