'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { timeAgo } from '@/lib/time'

const reasonLabels: Record<string, string> = {
  already_taken: 'Already taken',
  fake: 'Fake listing',
  wrong_price: 'Wrong price',
  other: 'Other',
}

type Report = {
  id: string
  reason: string
  message: string | null
  state: string
  created_at: string
  rooms: {
    id: string
    name: string
    state: string
    buildings: { name: string } | null
  } | null
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('reports')
      .select('id, reason, message, state, created_at, rooms(id, name, state, buildings(name))')
      .eq('state', 'open')
      .order('created_at', { ascending: false })

    if (error) setError(error.message)
    else setReports((data as unknown as Report[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function hideRoom(report: Report) {
    if (!report.rooms) return
    const { error } = await supabase
      .from('rooms')
      .update({ state: 'hidden', updated_at: new Date().toISOString() })
      .eq('id', report.rooms.id)
    if (error) {
      setError(error.message)
      return
    }
    await resolveReport(report.id)
  }

  async function resolveReport(id: string) {
    const { error } = await supabase
      .from('reports')
      .update({ state: 'resolved' })
      .eq('id', id)
    if (error) setError(error.message)
    else setReports((prev) => prev.filter((r) => r.id !== id))
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Reports</h1>
        <p className="mt-1 text-sm text-zinc-500">
          3 &quot;already taken&quot; reports on one room auto-hides it.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading && <p className="text-sm text-zinc-500">Loading…</p>}
      {!loading && reports.length === 0 && (
        <p className="text-sm text-zinc-500">No open reports.</p>
      )}

      <ul className="flex flex-col gap-4">
        {reports.map((report) => (
          <li
            key={report.id}
            className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800">
                {reasonLabels[report.reason] ?? report.reason}
              </span>
              <span className="text-xs text-zinc-400">
                {timeAgo(report.created_at)}
              </span>
            </div>

            <p className="mt-2 font-medium text-zinc-900">
              {report.rooms?.name ?? 'Deleted room'}
              {report.rooms?.buildings && (
                <span className="ml-2 text-sm font-normal text-zinc-500">
                  {report.rooms.buildings.name}
                </span>
              )}
            </p>
            {report.rooms && (
              <p className="text-sm text-zinc-500">
                Room is currently {report.rooms.state}
              </p>
            )}
            {report.message && (
              <p className="mt-1 text-sm text-zinc-600">
                &quot;{report.message}&quot;
              </p>
            )}

            <div className="mt-4 flex flex-wrap gap-3">
              {report.rooms && report.rooms.state !== 'hidden' && (
                <button
                  onClick={() => hideRoom(report)}
                  className="min-h-11 rounded-xl bg-red-600 px-5 font-medium text-white transition-colors hover:bg-red-700"
                >
                  Hide room
                </button>
              )}
              <button
                onClick={() => resolveReport(report.id)}
                className="min-h-11 rounded-xl border border-emerald-200 px-5 font-medium text-emerald-700 transition-colors hover:bg-emerald-50"
              >
                Mark resolved
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
