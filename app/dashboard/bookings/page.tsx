'use client'

import { useEffect, useState } from 'react'
import {
  CalendarDays,
  Phone,
  Calendar,
  Home,
  CheckCircle2,
  XCircle,
  Loader2,
  Sparkles,
  EyeOff,
  User,
  Hash,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useBuildingAdmin } from '@/lib/building-admin'
import { timeAgo } from '@/lib/time'

type Booking = {
  id: string
  tenant_name: string
  phone: string
  viewing_time: string | null
  move_in_date: string | null
  ref_code: string
  status: string
  created_at: string
  rooms: { name: string } | null
  demo?: boolean
}

const DEMO_BOOKINGS: Booking[] = [
  {
    id: 'demo-1',
    tenant_name: 'John Mwangi',
    phone: '0712 345 678',
    viewing_time: null,
    move_in_date: '2026-08-15',
    ref_code: 'KEJ-001',
    status: 'pending',
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    rooms: { name: 'Bedsitter A3' },
    demo: true,
  },
  {
    id: 'demo-2',
    tenant_name: 'Grace Wanjiku',
    phone: '0723 987 654',
    viewing_time: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    move_in_date: null,
    ref_code: 'KEJ-002',
    status: 'pending',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    rooms: { name: '1 Bedroom B1' },
    demo: true,
  },
  {
    id: 'demo-3',
    tenant_name: 'Peter Ochieng',
    phone: '0734 567 890',
    viewing_time: null,
    move_in_date: '2026-09-01',
    ref_code: 'KEJ-003',
    status: 'confirmed',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    rooms: { name: 'Single room C2' },
    demo: true,
  },
]

const statusBadge: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-zinc-200 text-zinc-600',
}

async function fetchBookings(buildingId: string) {
  const { data, error } = await supabase
    .from('bookings')
    .select(
      'id, tenant_name, phone, viewing_time, move_in_date, ref_code, status, created_at, rooms!inner(name, building_id)'
    )
    .eq('rooms.building_id', buildingId)
    .order('created_at', { ascending: false })

  return {
    bookings: (data as unknown as Booking[]) ?? [],
    error: error?.message ?? '',
  }
}

function BookingsSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-32 animate-pulse rounded-2xl border border-zinc-100 bg-zinc-100"
        />
      ))}
    </div>
  )
}

function BookingCard({
  booking,
  acting,
  onConfirm,
  onCancel,
}: {
  booking: Booking
  acting: string | null
  onConfirm: (id: string) => void
  onCancel: (id: string) => void
}) {
  return (
    <li
      className={`rounded-2xl border p-5 shadow-sm transition-shadow hover:shadow-md ${
        booking.demo
          ? 'border-dashed border-amber-200 bg-amber-50/30'
          : 'border-zinc-100 bg-white'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-lg font-bold text-emerald-700">
            {booking.tenant_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="flex flex-wrap items-center gap-2 font-semibold text-zinc-900">
              {booking.tenant_name}
              {booking.demo && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                  <Sparkles size={12} />
                  Demo
                </span>
              )}
            </p>
            <p className="flex items-center gap-1 text-sm text-zinc-500">
              <Home size={13} />
              {booking.rooms?.name ?? 'A room'}
            </p>
          </div>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge[booking.status] ?? statusBadge.pending}`}
        >
          {booking.status}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 text-sm text-zinc-600 sm:grid-cols-2">
        <a
          href={`tel:${booking.phone}`}
          className="inline-flex items-center gap-1.5 text-emerald-700 hover:underline"
        >
          <Phone size={14} />
          {booking.phone}
        </a>
        {booking.viewing_time && (
          <span className="inline-flex items-center gap-1.5">
            <Calendar size={14} />
            Viewing: {new Date(booking.viewing_time).toLocaleString()}
          </span>
        )}
        {booking.move_in_date && (
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays size={14} />
            Move-in: {booking.move_in_date}
          </span>
        )}
        <span className="inline-flex items-center gap-1.5 font-mono text-zinc-400">
          <Hash size={14} />
          {booking.ref_code}
        </span>
        <span className="inline-flex items-center gap-1.5 text-zinc-400 sm:col-span-2">
          <User size={14} />
          Received {timeAgo(booking.created_at)}
        </span>
      </div>

      {booking.status === 'pending' && (
        <div className="mt-4 flex gap-3">
          <button
            onClick={() => onConfirm(booking.id)}
            disabled={acting === booking.id}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-emerald-600 px-5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
          >
            {acting === booking.id ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <CheckCircle2 size={16} />
            )}
            Confirm
          </button>
          <button
            onClick={() => onCancel(booking.id)}
            disabled={acting === booking.id}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-red-200 bg-white px-5 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 disabled:opacity-50"
          >
            <XCircle size={16} />
            Cancel
          </button>
        </div>
      )}
    </li>
  )
}

function EmptyState({ onShowDemo }: { onShowDemo: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-12 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
        <CalendarDays size={28} />
      </div>
      <p className="mt-4 text-lg font-semibold text-zinc-900">
        No booking requests yet
      </p>
      <p className="text-sm text-zinc-500">
        Inquiries from tenants will show up here.
      </p>
      <button
        onClick={onShowDemo}
        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
      >
        <Sparkles size={16} />
        Preview demo bookings
      </button>
    </div>
  )
}

function BookingsContent() {
  const admin = useBuildingAdmin()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [fetchError, setFetchError] = useState('')
  const [actionError, setActionError] = useState('')
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<string | null>(null)
  const [showDemo, setShowDemo] = useState(false)

  useEffect(() => {
    if (!admin) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setFetchError('')
      try {
        const { bookings, error } = await fetchBookings(admin.buildingId)
        if (cancelled) return
        if (error) {
          console.error('[bookings] fetch error:', error)
          setFetchError(error)
        }
        setBookings(bookings)
        if (bookings.length === 0) {
          setShowDemo(true)
        }
      } catch (err) {
        if (cancelled) return
        const message = err instanceof Error ? err.message : String(err)
        console.error('[bookings] fetch exception:', message)
        setFetchError(message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [admin])

  async function refresh() {
    if (!admin) return
    setLoading(true)
    setFetchError('')
    try {
      const { bookings, error } = await fetchBookings(admin.buildingId)
      if (error) {
        console.error('[bookings] refresh error:', error)
        setFetchError(error)
      }
      setBookings(bookings)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error('[bookings] refresh exception:', message)
      setFetchError(message)
    } finally {
      setLoading(false)
    }
  }

  function showDemos() {
    setShowDemo(true)
  }

  async function setStatus(id: string, status: 'confirmed' | 'cancelled') {
    setActionError('')

    if (id.startsWith('demo-')) {
      setActing(id)
      setTimeout(() => {
        setBookings((prev) =>
          prev.map((b) => (b.id === id ? { ...b, status } : b))
        )
        setActing(null)
      }, 400)
      return
    }

    setActing(id)
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.access_token) {
      setActionError('Your session has expired. Please sign in again.')
      setActing(null)
      return
    }

    try {
      const res = await fetch('/api/bookings/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ bookingId: id, status }),
      })
      const data = await res.json()
      if (!res.ok) {
        console.error('[bookings] update error:', data.error)
        setActionError(data.error || 'Failed to update booking')
        setActing(null)
        return
      }
      await refresh()
      setActing(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error('[bookings] update exception:', message)
      setActionError('Failed to update booking')
      setActing(null)
    }
  }

  const displayedBookings =
    bookings.length === 0 && showDemo ? DEMO_BOOKINGS : bookings

  const pendingCount = displayedBookings.filter((b) => b.status === 'pending')
    .length

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
            Booking requests
          </h1>
          <p className="mt-1 text-zinc-500">
            {pendingCount} pending request{pendingCount === 1 ? '' : 's'} to
            review.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {bookings.length === 0 && !loading && (
            <button
              onClick={() => setShowDemo((s) => !s)}
              className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-800 transition-colors hover:bg-amber-100"
            >
              {showDemo ? <EyeOff size={16} /> : <Sparkles size={16} />}
              {showDemo ? 'Hide demo' : 'Show demo'}
            </button>
          )}
          <button
            onClick={refresh}
            disabled={acting !== null || loading}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 disabled:opacity-50"
          >
            {acting !== null || loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <CalendarDays size={16} />
            )}
            Refresh
          </button>
        </div>
      </div>

      {(fetchError || actionError) && (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          <p className="font-semibold">Something went wrong</p>
          <p className="mt-1">{fetchError || actionError}</p>
        </div>
      )}

      {loading ? (
        <BookingsSkeleton />
      ) : displayedBookings.length === 0 ? (
        <EmptyState onShowDemo={showDemos} />
      ) : (
        <ul className="flex flex-col gap-4">
          {displayedBookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              acting={acting}
              onConfirm={(id) => setStatus(id, 'confirmed')}
              onCancel={(id) => setStatus(id, 'cancelled')}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

export default function BookingsPage() {
  return <BookingsContent />
}
