'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type PendingRoom = {
  id: string
  name: string
  type: string | null
  rent: number
  description: string | null
  photos: string[]
  created_at: string
  buildings: { name: string; area: string; town: string } | null
}

export default function ApprovalsPage() {
  const [rooms, setRooms] = useState<PendingRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('rooms')
      .select(
        'id, name, type, rent, description, photos, created_at, buildings(name, area, town)'
      )
      .eq('state', 'pending_approval')
      .order('created_at', { ascending: true })

    if (error) setError(error.message)
    else setRooms((data as unknown as PendingRoom[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function setState(id: string, state: 'live' | 'hidden') {
    const { error } = await supabase
      .from('rooms')
      .update({ state, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) setError(error.message)
    else setRooms((prev) => prev.filter((room) => room.id !== id))
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Room approvals</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Nothing reaches the public without passing here.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading && <p className="text-sm text-zinc-500">Loading…</p>}
      {!loading && rooms.length === 0 && (
        <p className="text-sm text-zinc-500">No rooms waiting for approval.</p>
      )}

      <ul className="flex flex-col gap-4">
        {rooms.map((room) => (
          <li
            key={room.id}
            className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-lg font-semibold text-zinc-900">
                  {room.name}
                  {room.type && (
                    <span className="ml-2 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                      {room.type}
                    </span>
                  )}
                </p>
                <p className="text-sm text-zinc-500">
                  {room.buildings
                    ? `${room.buildings.name} · ${room.buildings.area}, ${room.buildings.town}`
                    : 'Unknown building'}
                </p>
              </div>
              <p className="text-lg font-bold text-emerald-700">
                KSh {room.rent.toLocaleString()}
              </p>
            </div>

            {room.description && (
              <p className="mt-2 text-sm text-zinc-600">{room.description}</p>
            )}

            {room.photos.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {room.photos.map((url) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={url}
                    src={url}
                    alt={room.name}
                    className="h-24 w-24 rounded-xl object-cover"
                  />
                ))}
              </div>
            )}

            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setState(room.id, 'live')}
                className="min-h-11 flex-1 rounded-xl bg-emerald-600 font-medium text-white transition-colors hover:bg-emerald-700 sm:flex-none sm:px-6"
              >
                Approve
              </button>
              <button
                onClick={() => setState(room.id, 'hidden')}
                className="min-h-11 flex-1 rounded-xl border border-red-200 font-medium text-red-700 transition-colors hover:bg-red-50 sm:flex-none sm:px-6"
              >
                Reject
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
