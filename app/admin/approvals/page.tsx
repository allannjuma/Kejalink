'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  ClipboardCheck,
  Check,
  X,
  MapPin,
  Loader2,
  ImageIcon,
  BedDouble,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Filter,
  CheckSquare,
  Square,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { timeAgo } from '@/lib/time'

/* ─── Types ──────────────────────────────────────────────────────────── */

type PendingRoom = {
  id: string
  name: string
  type: string | null
  rent: number
  description: string | null
  photos: string[]
  created_at: string
  buildings: { name: string; area: string; town: string } | null
  demo?: boolean
}

/* ─── Demo data ──────────────────────────────────────────────────────── */

const DEMO_ROOMS: PendingRoom[] = [
  {
    id: 'demo-1',
    name: 'Spacious 1-bedroom near Junction Mall',
    type: '1 bedroom',
    rent: 18500,
    description: 'Bright one-bedroom with balcony, built-in wardrobes, and a modern kitchen. Water included, parking available.',
    photos: ['https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&q=80'],
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    buildings: { name: 'Maple Heights', area: 'Ngong Road', town: 'Nairobi' },
    demo: true,
  },
  {
    id: 'demo-2',
    name: 'Cozy bedsitter with high-speed Wi-Fi',
    type: 'Bedsitter',
    rent: 8500,
    description: 'Furnished bedsitter in a secure compound. Prepaid meter, shared rooftop, and 24/7 water supply.',
    photos: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80'],
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    buildings: { name: 'Sunrise Court', area: 'Kahawa West', town: 'Nairobi' },
    demo: true,
  },
  {
    id: 'demo-3',
    name: '2-bedroom apartment with master ensuite',
    type: '2 bedroom',
    rent: 32000,
    description: 'Newly renovated two-bedroom with master ensuite, separate dining area, and a private balcony.',
    photos: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80'],
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    buildings: { name: 'Greenview Residency', area: 'Ruiru', town: 'Kiambu' },
    demo: true,
  },
  {
    id: 'demo-4',
    name: 'Single room with private bathroom',
    type: 'Single room',
    rent: 5500,
    description: 'Clean single room with own bathroom. Close to public transport and local shops.',
    photos: ['https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800&q=80'],
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    buildings: { name: 'Mwangi Plaza', area: 'Pipeline', town: 'Nairobi' },
    demo: true,
  },
]

/* ─── Components ─────────────────────────────────────────────────────── */

function PhotoStrip({ photos, name }: { photos: string[]; name: string }) {
  if (photos.length === 0) {
    return (
      <div className="flex h-44 w-full items-center justify-center rounded-xl bg-zinc-100 text-zinc-300">
        <ImageIcon size={32} />
      </div>
    )
  }
  return (
    <div className="relative h-44 overflow-hidden rounded-xl">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photos[0]}
        alt={name}
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      {photos.length > 1 && (
        <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
          +{photos.length - 1}
        </span>
      )}
    </div>
  )
}

function RoomCard({
  room,
  acting,
  selected,
  onSelect,
  onApprove,
  onReject,
}: {
  room: PendingRoom
  acting: string | null
  selected: boolean
  onSelect: (id: string) => void
  onApprove: (id: string) => void
  onReject: (id: string) => void
}) {
  const isActing = acting === room.id
  return (
    <div
      className={`group relative flex flex-col rounded-2xl border bg-white shadow-sm transition-all hover:shadow-md ${
        room.demo
          ? 'border-amber-200 bg-amber-50/30'
          : selected
          ? 'border-emerald-300 ring-1 ring-emerald-200'
          : 'border-zinc-100'
      }`}
    >
      {/* Select checkbox */}
      {!room.demo && (
        <button
          onClick={() => onSelect(room.id)}
          className="absolute left-3 top-3 z-10 rounded-lg bg-white/80 p-1 shadow backdrop-blur-sm transition-colors hover:bg-white"
        >
          {selected ? (
            <CheckSquare size={16} className="text-emerald-600" />
          ) : (
            <Square size={16} className="text-zinc-400" />
          )}
        </button>
      )}

      <div className="p-4">
        <PhotoStrip photos={room.photos} name={room.name} />

        <div className="mt-4 flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="font-bold text-zinc-900 line-clamp-2 leading-tight">
              {room.name}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              {room.type && (
                <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                  <BedDouble size={11} />
                  {room.type}
                </span>
              )}
              {room.demo && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                  <Sparkles size={11} />
                  Demo
                </span>
              )}
            </div>
          </div>
          <p className="shrink-0 text-lg font-bold text-emerald-700">
            KSh {room.rent.toLocaleString()}
          </p>
        </div>

        {room.buildings && (
          <p className="mt-2 flex items-center gap-1 text-xs text-zinc-500">
            <MapPin size={11} />
            {room.buildings.name} · {room.buildings.area}, {room.buildings.town}
          </p>
        )}

        {room.description && (
          <p className="mt-2 line-clamp-2 text-xs text-zinc-500">
            {room.description}
          </p>
        )}

        <p className="mt-3 text-xs text-zinc-400">
          Submitted {timeAgo(room.created_at)}
        </p>
      </div>

      <div className="flex gap-2 border-t border-zinc-50 p-4 pt-3">
        <button
          onClick={() => onApprove(room.id)}
          disabled={isActing}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white transition-all hover:bg-emerald-700 disabled:opacity-50"
        >
          {isActing ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
          Approve
        </button>
        <button
          onClick={() => onReject(room.id)}
          disabled={isActing}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-white py-2.5 text-sm font-semibold text-red-600 transition-all hover:bg-red-50 disabled:opacity-50"
        >
          <X size={15} />
          Reject
        </button>
      </div>
    </div>
  )
}

/* ─── Main ───────────────────────────────────────────────────────────── */

export default function ApprovalsPage() {
  const [rooms, setRooms] = useState<PendingRoom[]>([])
  const [fetchError, setFetchError] = useState('')
  const [actionError, setActionError] = useState('')
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<string | null>(null)
  const [showDemo, setShowDemo] = useState(false)
  const [actedDemoIds, setActedDemoIds] = useState<Set<string>>(new Set())
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [batchActing, setBatchActing] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setFetchError('')
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('id, name, type, rent, description, photos, created_at, buildings(name, area, town)')
        .eq('state', 'pending_approval')
        .order('created_at', { ascending: true })
      if (error) throw new Error(error.message)
      const fetched = (data as unknown as PendingRoom[]) ?? []
      setRooms(fetched)
      if (fetched.length === 0) setShowDemo(true)
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount; state updates happen in async continuations
    load()
  }, [load])

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectAll() {
    setSelected(new Set(displayedRooms.filter((r) => !r.demo).map((r) => r.id)))
  }

  function clearSelection() {
    setSelected(new Set())
  }

  async function setRoomState(id: string, state: 'live' | 'hidden') {
    setActionError('')
    if (id.startsWith('demo-')) {
      setActing(id)
      setTimeout(() => {
        setActedDemoIds((prev) => new Set(prev).add(id))
        setActing(null)
      }, 600)
      return
    }
    setActing(id)
    const { error } = await supabase
      .from('rooms')
      .update({ state, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) {
      setActionError(error.message)
    } else {
      await load()
      setSelected((prev) => { const n = new Set(prev); n.delete(id); return n })
    }
    setActing(null)
  }

  async function batchApprove() {
    if (selected.size === 0) return
    setBatchActing(true)
    setActionError('')
    const ids = Array.from(selected)
    const { error } = await supabase
      .from('rooms')
      .update({ state: 'live', updated_at: new Date().toISOString() })
      .in('id', ids)
    if (error) setActionError(error.message)
    else {
      clearSelection()
      await load()
    }
    setBatchActing(false)
  }

  const displayedRooms =
    rooms.length === 0 && showDemo
      ? DEMO_ROOMS.filter((r) => !actedDemoIds.has(r.id))
      : rooms

  const realSelected = Array.from(selected).filter((id) => !id.startsWith('demo-'))

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
            Room Approvals
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Nothing reaches the public without passing here first.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {rooms.length === 0 && !loading && (
            <button
              onClick={() => setShowDemo((s) => !s)}
              className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-100"
            >
              <Sparkles size={15} />
              {showDemo ? 'Hide demo' : 'Preview demo'}
            </button>
          )}
          <button
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 disabled:opacity-50"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
            <ClipboardCheck size={20} />
          </div>
          <div>
            <p className="text-2xl font-bold text-zinc-900">{displayedRooms.length}</p>
            <p className="text-xs text-zinc-500">
              room{displayedRooms.length !== 1 ? 's' : ''} pending
            </p>
          </div>
        </div>

        {realSelected.length > 0 && (
          <>
            <div className="mx-2 h-8 w-px bg-zinc-200" />
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-zinc-700">
                {realSelected.length} selected
              </span>
              <button
                onClick={batchApprove}
                disabled={batchActing}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white transition-all hover:bg-emerald-700 disabled:opacity-50"
              >
                {batchActing ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Check size={13} />
                )}
                Approve all
              </button>
              <button
                onClick={clearSelection}
                className="rounded-xl border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50"
              >
                Clear
              </button>
            </div>
          </>
        )}

        {displayedRooms.filter((r) => !r.demo).length > 1 && realSelected.length === 0 && (
          <button
            onClick={selectAll}
            className="ml-auto flex items-center gap-1.5 text-sm font-medium text-zinc-500 transition-colors hover:text-emerald-600"
          >
            <Filter size={14} />
            Select all
          </button>
        )}
      </div>

      {/* Errors */}
      {(fetchError || actionError) && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{fetchError || actionError}</span>
        </div>
      )}

      {/* Room grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-80 animate-pulse rounded-2xl border border-zinc-100 bg-zinc-100" />
          ))}
        </div>
      ) : displayedRooms.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-14 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
            <Check size={28} />
          </div>
          <p className="mt-4 text-lg font-bold text-zinc-900">Queue is empty</p>
          <p className="mt-1 text-sm text-zinc-500">
            No rooms are waiting for approval right now.
          </p>
          <button
            onClick={() => setShowDemo(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
          >
            <Sparkles size={15} />
            Preview demo rooms
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {displayedRooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              acting={acting}
              selected={selected.has(room.id)}
              onSelect={toggleSelect}
              onApprove={(id) => setRoomState(id, 'live')}
              onReject={(id) => setRoomState(id, 'hidden')}
            />
          ))}
        </div>
      )}
    </div>
  )
}
