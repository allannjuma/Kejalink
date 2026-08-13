'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  DoorOpen,
  CalendarDays,
  Eye,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Calendar,
  Plus,
  Loader2,
  ImageIcon,
  BedDouble,
  Sparkles,
  EyeOff,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useBuildingAdmin } from '@/lib/building-admin'
import { timeAgo } from '@/lib/time'

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
  demo?: boolean
}

const DEMO_ROOMS: Room[] = [
  {
    id: 'demo-1',
    name: 'Bedsitter A3',
    type: 'Bedsitter',
    rent: 8500,
    photos: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80'],
    state: 'live',
    available_date: null,
    last_confirmed_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    demo: true,
  },
  {
    id: 'demo-2',
    name: '1 Bedroom B1',
    type: '1 Bedroom',
    rent: 18000,
    photos: ['https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&q=80'],
    state: 'taken',
    available_date: null,
    last_confirmed_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    demo: true,
  },
  {
    id: 'demo-3',
    name: 'Single room C2',
    type: 'Single room',
    rent: 5500,
    photos: [],
    state: 'pending_approval',
    available_date: null,
    last_confirmed_at: new Date().toISOString(),
    demo: true,
  },
]

const stateBadge: Record<string, { label: string; className: string }> = {
  live: { label: 'Vacant', className: 'bg-emerald-100 text-emerald-800' },
  taken: { label: 'Taken', className: 'bg-zinc-200 text-zinc-600' },
  pending_approval: {
    label: 'Awaiting approval',
    className: 'bg-amber-100 text-amber-800',
  },
  hidden: { label: 'Hidden', className: 'bg-red-100 text-red-700' },
}

async function fetchDashboard(buildingId: string) {
  const [roomsResult, inquiriesResult] = await Promise.all([
    supabase
      .from('rooms')
      .select(
        'id, name, type, rent, photos, state, available_date, last_confirmed_at'
      )
      .eq('building_id', buildingId)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => ({
        rooms: (data as Room[]) ?? [],
        error: error?.message ?? '',
      })),
    supabase
      .from('bookings')
      .select('*, rooms!inner(building_id)', { count: 'exact', head: true })
      .eq('rooms.building_id', buildingId)
      .eq('status', 'pending')
      .then(({ count, error }) => ({
        count: count ?? 0,
        error: error?.message ?? '',
      })),
  ])

  return {
    rooms: roomsResult.rooms,
    inquiries: inquiriesResult.count,
    error: roomsResult.error || inquiriesResult.error,
  }
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-2xl border border-zinc-100 bg-zinc-100"
          />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-2xl border border-zinc-100 bg-zinc-100" />
    </div>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string
  value: React.ReactNode
  icon: React.ElementType
  accent: 'emerald' | 'amber' | 'zinc'
}) {
  const accents: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    amber: 'bg-amber-50 text-amber-700 ring-amber-200',
    zinc: 'bg-zinc-100 text-zinc-700 ring-zinc-200',
  }
  return (
    <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ring-1 ${accents[accent]}`}
        >
          <Icon size={22} />
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-zinc-900">{value}</p>
          <p className="text-sm text-zinc-500">{label}</p>
        </div>
      </div>
    </div>
  )
}

function RoomRow({
  room,
  onUpdate,
  acting,
}: {
  room: Room
  onUpdate: (id: string, updates: Record<string, unknown>) => void
  acting: boolean
}) {
  const [pickingDate, setPickingDate] = useState(false)
  const badge = stateBadge[room.state] ?? stateBadge.hidden
  const actionable = room.state === 'live' || room.state === 'taken'
  const [now] = useState(() => Date.now())
  const isStale =
    room.state === 'live' &&
    now - new Date(room.last_confirmed_at).getTime() > TWELVE_DAYS_MS

  return (
    <li
      className={`rounded-2xl border p-5 shadow-sm transition-shadow hover:shadow-md ${
        room.demo
          ? 'border-dashed border-amber-200 bg-amber-50/30'
          : isStale
            ? 'border-amber-200 bg-white'
            : 'border-zinc-100 bg-white'
      }`}
    >
      <div className="flex flex-wrap items-start gap-4">
        {room.photos[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={room.photos[0]}
            alt={room.name}
            className="h-20 w-20 rounded-xl object-cover"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-zinc-100 text-zinc-400">
            <ImageIcon size={28} />
          </div>
        )}
        <div className="mr-auto min-w-0">
          <p className="flex flex-wrap items-center gap-2 font-semibold text-zinc-900">
            {room.name}
            {room.type && (
              <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                <BedDouble size={12} />
                {room.type}
              </span>
            )}
            {room.demo && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                <Sparkles size={12} />
                Demo
              </span>
            )}
            {isStale && !room.demo && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                <AlertTriangle size={12} />
                Stale
              </span>
            )}
          </p>
          <p className="text-sm font-bold text-emerald-700">
            KSh {room.rent.toLocaleString()}/mo
          </p>
          {room.available_date && room.state === 'live' && (
            <p className="mt-1 flex items-center gap-1 text-xs text-zinc-500">
              <Calendar size={12} />
              Vacant from {room.available_date}
            </p>
          )}
          <p className="mt-1 flex items-center gap-1 text-xs text-zinc-400">
            <Eye size={12} />
            Updated {timeAgo(room.last_confirmed_at)}
          </p>
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
            disabled={acting}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-emerald-600 px-4 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-40"
          >
            <CheckCircle2 size={16} />
            Vacant now
          </button>
          <button
            onClick={() => onUpdate(room.id, { state: 'taken' })}
            disabled={acting || room.state === 'taken'}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-40"
          >
            <XCircle size={16} />
            Taken
          </button>
          <button
            onClick={() => setPickingDate((v) => !v)}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            <Calendar size={16} />
            {pickingDate ? 'Close' : 'Vacant soon'}
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
              className="min-h-10 rounded-xl border border-zinc-300 px-3 text-sm text-zinc-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
          )}
        </div>
      )}
    </li>
  )
}

function EmptyState({ onShowDemo }: { onShowDemo: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-12 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
        <DoorOpen size={28} />
      </div>
      <p className="mt-4 text-lg font-semibold text-zinc-900">No rooms yet</p>
      <p className="text-sm text-zinc-500">
        Add your first room to start getting inquiries.
      </p>
      <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link
          href="/dashboard/add-room"
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-emerald-600/20 transition-colors hover:bg-emerald-700"
        >
          <Plus size={18} />
          Add room
        </Link>
        <button
          onClick={onShowDemo}
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
        >
          <Sparkles size={16} />
          Preview demo rooms
        </button>
      </div>
    </div>
  )
}

function DashboardContent() {
  const admin = useBuildingAdmin()
  const [now] = useState(() => Date.now())
  const [rooms, setRooms] = useState<Room[]>([])
  const [inquiries, setInquiries] = useState(0)
  const [fetchError, setFetchError] = useState('')
  const [actionError, setActionError] = useState('')
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)
  const [showDemo, setShowDemo] = useState(false)

  useEffect(() => {
    if (!admin) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setFetchError('')
      try {
        const { rooms, inquiries, error } = await fetchDashboard(admin.buildingId)
        if (cancelled) return
        if (error) {
          console.error('[dashboard] fetch error:', error)
          setFetchError(error)
        }
        setRooms(rooms)
        setInquiries(inquiries)
        if (rooms.length === 0) {
          setShowDemo(true)
        }
      } catch (err) {
        if (cancelled) return
        const message = err instanceof Error ? err.message : String(err)
        console.error('[dashboard] fetch exception:', message)
        setFetchError(message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [admin])

  function showDemos() {
    setShowDemo(true)
  }

  async function updateRoom(id: string, updates: Record<string, unknown>) {
    setActionError('')

    if (id.startsWith('demo-')) {
      setActing(true)
      setTimeout(() => {
        setRooms((prev) =>
          prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
        )
        setActing(false)
      }, 400)
      return
    }

    if (!admin) return
    setActing(true)
    const { error } = await supabase
      .from('rooms')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('building_id', admin.buildingId)

    if (error) {
      console.error('[dashboard] update error:', error.message)
      setActionError(error.message)
    } else {
      const { data } = await supabase
        .from('rooms')
        .select(
          'id, name, type, rent, photos, state, available_date, last_confirmed_at'
        )
        .eq('id', id)
        .single()
      if (data) {
        setRooms((prev) =>
          prev.map((r) => (r.id === id ? { ...(data as Room) } : r))
        )
      }
    }
    setActing(false)
  }

  async function confirmStillVacant() {
    if (!admin) return
    setActing(true)
    setActionError('')
    const { error } = await supabase
      .from('rooms')
      .update({ last_confirmed_at: new Date().toISOString() })
      .eq('building_id', admin.buildingId)
      .eq('state', 'live')

    if (error) {
      console.error('[dashboard] confirm error:', error.message)
      setActionError(error.message)
    } else {
      setRooms((prev) =>
        prev.map((r) =>
          r.state === 'live'
            ? { ...r, last_confirmed_at: new Date().toISOString() }
            : r
        )
      )
    }
    setActing(false)
  }

  const displayedRooms =
    rooms.length === 0 && showDemo ? DEMO_ROOMS : rooms
  const liveRooms = displayedRooms.filter((r) => r.state === 'live')
  const staleRooms = liveRooms.filter(
    (r) => now - new Date(r.last_confirmed_at).getTime() > TWELVE_DAYS_MS
  )

  if (!admin) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-zinc-500">
        Loading…
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
            My building
          </h1>
          <p className="mt-1 text-zinc-500">
            Manage rooms, availability, and renewal status.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {rooms.length === 0 && !loading && (
            <button
              onClick={() => setShowDemo((s) => !s)}
              className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-800 transition-colors hover:bg-amber-100"
            >
              {showDemo ? <EyeOff size={16} /> : <Sparkles size={16} />}
              {showDemo ? 'Hide demo' : 'Show demo'}
            </button>
          )}
          <Link
            href="/dashboard/add-room"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-emerald-600/20 transition-colors hover:bg-emerald-700"
          >
            <Plus size={18} />
            Add room
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Rooms vacant"
          value={`${liveRooms.length}/${displayedRooms.length}`}
          icon={DoorOpen}
          accent="emerald"
        />
        <StatCard
          label="Open inquiries"
          value={inquiries}
          icon={CalendarDays}
          accent="amber"
        />
        <StatCard
          label="Views this week"
          value="—"
          icon={Eye}
          accent="zinc"
        />
      </div>

      {/* Renewal banner */}
      {staleRooms.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <AlertTriangle size={20} />
            </div>
            <div>
              <p className="font-semibold text-amber-900">
                {staleRooms.length} room{staleRooms.length === 1 ? '' : 's'} need
                confirmation
              </p>
              <p className="text-sm text-amber-800">
                Unconfirmed for over 12 days — they will be hidden soon.
              </p>
            </div>
          </div>
          <button
            onClick={confirmStillVacant}
            disabled={acting}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-amber-600 px-5 font-medium text-white transition-colors hover:bg-amber-700 disabled:opacity-50"
          >
            {acting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <CheckCircle2 size={16} />
            )}
            {acting ? 'Confirming…' : 'Still vacant'}
          </button>
        </div>
      )}

      {(fetchError || actionError) && (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          <p className="font-semibold">Something went wrong</p>
          <p className="mt-1">{fetchError || actionError}</p>
        </div>
      )}

      {/* Room list */}
      {loading ? (
        <DashboardSkeleton />
      ) : displayedRooms.length === 0 ? (
        <EmptyState onShowDemo={showDemos} />
      ) : (
        <ul className="flex flex-col gap-4">
          {displayedRooms.map((room) => (
            <RoomRow
              key={room.id}
              room={room}
              onUpdate={updateRoom}
              acting={acting}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

export default function DashboardPage() {
  return <DashboardContent />
}
