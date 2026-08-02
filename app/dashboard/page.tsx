'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useBuildingAdmin } from '@/lib/building-admin'

const TWELVE_DAYS_MS = 12 * 24 * 60 * 60 * 1000

type Room = {
  id: string
  name: string
  type: string | null
  rent: number
  photos: string[]
  state: string
  available_date: string | null
  last_confirmed_at: string
}

const stateBadge: Record<string, { label: string; className: string }> = {
  live: { label: 'Vacant', className: 'bg-emerald-100 text-emerald-800' },
  taken: { label: 'Taken', className: 'bg-zinc-200 text-zinc-600' },
  pending_approval: {
    label: 'Awaiting approval',
    className: 'bg-amber-100 text-amber-800',
  },
  hidden: { label: 'Hidden', className: 'bg-red-100 text-red-700' },
}

export default function DashboardPage() {
  const admin = useBuildingAdmin()
  const [rooms, setRooms] = useState<Room[]>([])
  const [inquiries, setInquiries] = useState(0)
  const [error, setError] = useState('')
  const [confirming, setConfirming] = useState(false)

  // EVERY query in this file is filtered by the caretaker's own building_id.
  const load = useCallback(async () => {
    if (!admin) return

    const { data, error } = await supabase
      .from('rooms')
      .select(
        'id, name, type, rent, photos, state, available_date, last_confirmed_at'
      )
      .eq('building_id', admin.buildingId)
      .order('created_at', { ascending: true })

    if (error) setError(error.message)
    else setRooms((data as Room[]) ?? [])

    const { count } = await supabase
      .from('bookings')
      .select('*, rooms!inner(building_id)', { count: 'exact', head: true })
      .eq('rooms.building_id', admin.buildingId)
      .eq('status', 'pending')

    setInquiries(count ?? 0)
  }, [admin])

  useEffect(() => {
    load()
  }, [load])

  async function updateRoom(id: string, updates: Record<string, unknown>) {
    const { error } = await supabase
      .from('rooms')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('building_id', admin?.buildingId ?? '')

    if (error) setError(error.message)
    else load()
  }

  async function confirmStillVacant() {
    if (!admin) return
    setConfirming(true)
    const { error } = await supabase
      .from('rooms')
      .update({ last_confirmed_at: new Date().toISOString() })
      .eq('building_id', admin.buildingId)
      .eq('state', 'live')

    setConfirming(false)
    if (error) setError(error.message)
    else load()
  }

  const liveRooms = rooms.filter((r) => r.state === 'live')
  const staleRooms = liveRooms.filter(
    (r) => Date.now() - new Date(r.last_confirmed_at).getTime() > TWELVE_DAYS_MS
  )

  return (
    <div className="flex flex-col gap-6">
      {/* Mini stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
          <p className="text-3xl font-bold text-emerald-600">
            {liveRooms.length}/{rooms.length}
          </p>
          <p className="mt-1 text-sm text-zinc-500">Rooms vacant</p>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
          <p className="text-3xl font-bold text-zinc-900">{inquiries}</p>
          <p className="mt-1 text-sm text-zinc-500">Open inquiries</p>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
          <p className="text-3xl font-bold text-zinc-400">—</p>
          <p className="mt-1 text-sm text-zinc-500">
            Views this week (tracked once the public site is live)
          </p>
        </div>
      </div>

      {/* Renewal banner */}
      {staleRooms.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-5">
          <p className="font-medium text-amber-900">
            {staleRooms.length} room{staleRooms.length === 1 ? '' : 's'} not
            confirmed in over 12 days — confirm or they will be hidden.
          </p>
          <button
            onClick={confirmStillVacant}
            disabled={confirming}
            className="min-h-11 rounded-xl bg-amber-600 px-5 font-medium text-white transition-colors hover:bg-amber-700 disabled:opacity-50"
          >
            {confirming ? 'Confirming…' : 'Still vacant ✓'}
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Room list */}
      {rooms.length === 0 && !error && (
        <p className="text-sm text-zinc-500">
          No rooms yet — add your first one from the Add room tab.
        </p>
      )}

      <ul className="flex flex-col gap-4">
        {rooms.map((room) => (
          <RoomRow
            key={room.id}
            room={room}
            onUpdate={updateRoom}
          />
        ))}
      </ul>
    </div>
  )
}

function RoomRow({
  room,
  onUpdate,
}: {
  room: Room
  onUpdate: (id: string, updates: Record<string, unknown>) => void
}) {
  const [pickingDate, setPickingDate] = useState(false)
  const badge = stateBadge[room.state] ?? stateBadge.hidden
  const actionable = room.state === 'live' || room.state === 'taken'

  return (
    <li className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-4">
        {room.photos[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={room.photos[0]}
            alt={room.name}
            className="h-16 w-16 rounded-xl object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-emerald-50 text-2xl">
            🏠
          </div>
        )}
        <div className="mr-auto">
          <p className="font-semibold text-zinc-900">
            {room.name}
            {room.type && (
              <span className="ml-2 text-sm font-normal text-zinc-500">
                {room.type}
              </span>
            )}
          </p>
          <p className="text-sm font-medium text-emerald-700">
            KSh {room.rent.toLocaleString()}/mo
          </p>
          {room.available_date && room.state === 'live' && (
            <p className="text-xs text-zinc-500">
              Vacant from {room.available_date}
            </p>
          )}
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}
        >
          {badge.label}
        </span>
      </div>

      {actionable && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            onClick={() =>
              onUpdate(room.id, {
                state: 'live',
                available_date: null,
                last_confirmed_at: new Date().toISOString(),
              })
            }
            disabled={room.state === 'live' && !room.available_date}
            className="min-h-11 rounded-xl bg-emerald-600 px-4 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-40"
          >
            ✅ Vacant
          </button>
          <button
            onClick={() => onUpdate(room.id, { state: 'taken' })}
            disabled={room.state === 'taken'}
            className="min-h-11 rounded-xl border border-zinc-300 px-4 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-40"
          >
            ❌ Taken
          </button>
          <button
            onClick={() => setPickingDate((v) => !v)}
            className="min-h-11 rounded-xl border border-zinc-300 px-4 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            📅 Vacant soon
          </button>
          {pickingDate && (
            <input
              type="date"
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => {
                if (!e.target.value) return
                onUpdate(room.id, {
                  state: 'live',
                  available_date: e.target.value,
                  last_confirmed_at: new Date().toISOString(),
                })
                setPickingDate(false)
              }}
              className="min-h-11 rounded-xl border border-zinc-300 px-3 text-sm text-zinc-900"
            />
          )}
        </div>
      )}
    </li>
  )
}
