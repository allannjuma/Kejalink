'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useBuildingAdmin } from '@/lib/building-admin'

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
}

const statusBadge: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-zinc-200 text-zinc-600',
}

export default function BookingsPage() {
  const admin = useBuildingAdmin()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!admin) return
    setLoading(true)

    const { data, error } = await supabase
      .from('bookings')
      .select(
        'id, tenant_name, phone, viewing_time, move_in_date, ref_code, status, created_at, rooms!inner(name, building_id)'
      )
      .eq('rooms.building_id', admin.buildingId)
      .order('created_at', { ascending: false })

    if (error) setError(error.message)
    else setBookings((data as unknown as Booking[]) ?? [])
    setLoading(false)
  }, [admin])

  useEffect(() => {
    load()
  }, [load])

  async function setStatus(id: string, status: 'confirmed' | 'cancelled') {
    const { error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', id)

    if (error) setError(error.message)
    else load()
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-zinc-900">Booking requests</h1>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading && <p className="text-sm text-zinc-500">Loading…</p>}
      {!loading && bookings.length === 0 && (
        <p className="text-sm text-zinc-500">No booking requests yet.</p>
      )}

      <ul className="flex flex-col gap-4">
        {bookings.map((booking) => (
          <li
            key={booking.id}
            className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold text-zinc-900">
                {booking.tenant_name}
                <span className="ml-2 text-sm font-normal text-zinc-500">
                  for {booking.rooms?.name ?? 'a room'}
                </span>
              </p>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge[booking.status] ?? statusBadge.pending}`}
              >
                {booking.status}
              </span>
            </div>

            <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-zinc-600">
              <a href={`tel:${booking.phone}`} className="text-emerald-700">
                {booking.phone}
              </a>
              {booking.viewing_time && (
                <span>
                  Viewing: {new Date(booking.viewing_time).toLocaleString()}
                </span>
              )}
              {booking.move_in_date && (
                <span>Move-in: {booking.move_in_date}</span>
              )}
              <span className="font-mono text-zinc-400">
                ref {booking.ref_code}
              </span>
            </div>

            {booking.status === 'pending' && (
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => setStatus(booking.id, 'confirmed')}
                  className="min-h-11 rounded-xl bg-emerald-600 px-5 font-medium text-white transition-colors hover:bg-emerald-700"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setStatus(booking.id, 'cancelled')}
                  className="min-h-11 rounded-xl border border-red-200 px-5 font-medium text-red-700 transition-colors hover:bg-red-50"
                >
                  Cancel
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
