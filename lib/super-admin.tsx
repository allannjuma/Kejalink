'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from './supabase'

export type SuperAdmin = {
  userId: string
  name: string
  email: string
}

const SuperAdminContext = createContext<SuperAdmin | null>(null)

// Every /admin page reads the super admin from this hook.
export function useSuperAdmin() {
  return useContext(SuperAdminContext)
}

export function SuperAdminProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [admin, setAdmin] = useState<SuperAdmin | null>(null)
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
        .select('id, name, email, role')
        .eq('id', user.id)
        .single()

      if (error) {
        setError(`DB error: ${error.message}`)
        return
      }
      if (!data) {
        setError('No profile row found in public.users for this auth user.')
        return
      }
      if (data.role !== 'super_admin') {
        setError(`Wrong role: "${data.role}" — expected "super_admin".`)
        return
      }

      setAdmin({
        userId: data.id,
        name: data.name,
        email: data.email,
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
    <SuperAdminContext.Provider value={admin}>
      {children}
    </SuperAdminContext.Provider>
  )
}
