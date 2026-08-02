'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from './supabase'

export type BuildingAdmin = {
  userId: string
  name: string
  email: string
  phone: string | null
  whatsapp: string | null
  buildingId: string
  buildingName: string
  area: string
  town: string
}

const BuildingAdminContext = createContext<BuildingAdmin | null>(null)

// Every dashboard page reads the caretaker + building from this hook.
// buildingId from here is the ONLY id allowed in dashboard queries.
export function useBuildingAdmin() {
  return useContext(BuildingAdminContext)
}

export function BuildingAdminProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [admin, setAdmin] = useState<BuildingAdmin | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.replace('/login')
        return
      }

      const { data, error } = await supabase
        .from('users')
        .select(
          'id, name, email, phone, whatsapp, role, building_id, buildings(name, area, town)'
        )
        .eq('id', user.id)
        .single()

      const building = data?.buildings as unknown as {
        name: string
        area: string
        town: string
      } | null

      if (
        error ||
        !data ||
        data.role !== 'building_admin' ||
        !data.building_id ||
        !building
      ) {
        setError('This account is not linked to a building admin account.')
        return
      }

      setAdmin({
        userId: data.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        whatsapp: data.whatsapp,
        buildingId: data.building_id,
        buildingName: building.name,
        area: building.area,
        town: building.town,
      })
    }
    load()
  }, [router])

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
        <p className="text-red-600">{error}</p>
        <button
          onClick={async () => {
            await supabase.auth.signOut()
            router.replace('/login')
          }}
          className="min-h-11 rounded-xl border border-zinc-300 px-5 font-medium text-zinc-700"
        >
          Sign out
        </button>
      </div>
    )
  }

  if (!admin) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-zinc-500">
        Loading…
      </div>
    )
  }

  return (
    <BuildingAdminContext.Provider value={admin}>
      {children}
    </BuildingAdminContext.Provider>
  )
}
