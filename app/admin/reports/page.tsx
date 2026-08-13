'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Flag,
  AlertTriangle,
  CheckCircle2,
  EyeOff,
  ShieldCheck,
  Loader2,
  MessageSquare,
  Sparkles,
  RefreshCw,
  AlertCircle,
  X,
  Filter,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { timeAgo } from '@/lib/time'

/* ─── Types ──────────────────────────────────────────────────────────── */

const reasonLabels: Record<string, string> = {
  already_taken: 'Already taken',
  fake: 'Fake listing',
  wrong_price: 'Wrong price',
  other: 'Other',
}

const reasonBadge: Record<string, string> = {
  already_taken: 'bg-amber-100 text-amber-800 border-amber-200',
  fake: 'bg-red-100 text-red-800 border-red-200',
  wrong_price: 'bg-blue-100 text-blue-800 border-blue-200',
  other: 'bg-zinc-100 text-zinc-700 border-zinc-200',
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
    photos: string[]
    buildings: { name: string } | null
  } | null
  demo?: boolean
}

const DEMO_REPORTS: Report[] = [
  {
    id: 'demo-1',
    reason: 'already_taken',
    message: 'I called the caretaker and they said this room was taken last week.',
    state: 'open',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    rooms: {
      id: 'demo-room-1',
      name: 'Bedsitter A3',
      state: 'live',
      photos: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80'],
      buildings: { name: 'Maple Heights' },
    },
    demo: true,
  },
  {
    id: 'demo-2',
    reason: 'fake',
    message: 'The photos do not match the actual room at all.',
    state: 'open',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    rooms: {
      id: 'demo-room-2',
      name: '1 Bedroom B1',
      state: 'live',
      photos: ['https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&q=80'],
      buildings: { name: 'Sunrise Court' },
    },
    demo: true,
  },
  {
    id: 'demo-3',
    reason: 'wrong_price',
    message: null,
    state: 'open',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    rooms: {
      id: 'demo-room-3',
      name: 'Single room C2',
      state: 'live',
      photos: [],
      buildings: { name: 'Greenview Residency' },
    },
    demo: true,
  },
]

type FilterType = 'all' | 'already_taken' | 'fake' | 'wrong_price' | 'other'

/* ─── Report Card ────────────────────────────────────────────────────── */

function ReportCard({
  report,
  resolving,
  onHide,
  onResolve,
}: {
  report: Report
  resolving: string | null
  onHide: (r: Report) => void
  onResolve: (id: string) => void
}) {
  const isActing = resolving === report.id

  return (
    <div
      className={`rounded-2xl border bg-white shadow-sm transition-all hover:shadow-md ${
        report.demo
          ? 'border-amber-200 bg-amber-50/20'
          : 'border-zinc-100'
      }`}
    >
      <div className="p-5">
        <div className="flex items-start gap-3">
          {/* Room photo */}
          {report.rooms?.photos?.[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={report.rooms.photos[0]}
              alt={report.rooms.name}
              className="h-14 w-14 shrink-0 rounded-xl object-cover"
            />
          ) : (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-400">
              <Flag size={22} />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-bold text-zinc-900">
                  {report.rooms?.name ?? 'Deleted room'}
                </p>
                {report.rooms?.buildings && (
                  <p className="text-xs text-zinc-500">
                    {report.rooms.buildings.name}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span
                  className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                    reasonBadge[report.reason] ?? reasonBadge.other
                  }`}
                >
                  {reasonLabels[report.reason] ?? report.reason}
                </span>
                {report.demo && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                    <Sparkles size={10} />
                    Demo
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {report.message && (
          <div className="mt-4 rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              User message
            </p>
            <p className="mt-1 text-sm text-zinc-700 italic">
              &ldquo;{report.message}&rdquo;
            </p>
          </div>
        )}

        <p className="mt-3 text-xs text-zinc-400">
          Reported {timeAgo(report.created_at)}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-zinc-50 px-5 py-3">
        {report.rooms && report.rooms.state !== 'hidden' && (
          <button
            onClick={() => onHide(report)}
            disabled={isActing}
            className="flex items-center gap-1.5 rounded-xl bg-red-600 px-3 py-2 text-sm font-semibold text-white transition-all hover:bg-red-700 disabled:opacity-50"
          >
            {isActing ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <EyeOff size={14} />
            )}
            Hide room
          </button>
        )}
        <button
          onClick={() => onResolve(report.id)}
          disabled={isActing}
          className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-emerald-700 transition-all hover:bg-emerald-50 disabled:opacity-50"
        >
          {isActing ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <CheckCircle2 size={14} />
          )}
          Mark resolved
        </button>
      </div>
    </div>
  )
}

/* ─── Main ───────────────────────────────────────────────────────────── */

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [fetchError, setFetchError] = useState('')
  const [actionError, setActionError] = useState('')
  const [loading, setLoading] = useState(true)
  const [resolving, setResolving] = useState<string | null>(null)
  const [showDemo, setShowDemo] = useState(false)
  const [demoReports, setDemoReports] = useState(DEMO_REPORTS)
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')

  const load = useCallback(async () => {
    setLoading(true)
    setFetchError('')
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('id, reason, message, state, created_at, rooms(id, name, state, photos, buildings(name))')
        .eq('state', 'open')
        .order('created_at', { ascending: false })
      if (error) throw new Error(error.message)
      const fetched = (data as unknown as Report[]) ?? []
      setReports(fetched)
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

  async function hideRoom(report: Report) {
    if (!report.rooms) return
    setActionError('')
    if (report.demo || report.id.startsWith('demo-')) {
      setResolving(report.id)
      setTimeout(() => {
        setDemoReports((prev) => prev.filter((r) => r.id !== report.id))
        setResolving(null)
      }, 400)
      return
    }
    setResolving(report.id)
    const { error } = await supabase
      .from('rooms')
      .update({ state: 'hidden', updated_at: new Date().toISOString() })
      .eq('id', report.rooms.id)
    if (error) {
      setActionError(error.message)
      setResolving(null)
      return
    }
    await resolveReport(report.id)
  }

  async function resolveReport(id: string) {
    setActionError('')
    if (id.startsWith('demo-')) {
      setResolving(id)
      setTimeout(() => {
        setDemoReports((prev) => prev.filter((r) => r.id !== id))
        setResolving(null)
      }, 400)
      return
    }
    setResolving(id)
    const { error } = await supabase
      .from('reports')
      .update({ state: 'resolved' })
      .eq('id', id)
    if (error) {
      setActionError(error.message)
      setResolving(null)
    } else {
      await load()
      setResolving(null)
    }
  }

  const rawDisplayed =
    reports.length === 0 && showDemo ? demoReports : reports

  const displayed =
    activeFilter === 'all'
      ? rawDisplayed
      : rawDisplayed.filter((r) => r.reason === activeFilter)

  // Counts per reason for filter badges
  const counts: Record<string, number> = {}
  rawDisplayed.forEach((r) => {
    counts[r.reason] = (counts[r.reason] ?? 0) + 1
  })

  const fakeCount = counts['fake'] ?? 0
  const takenCount = counts['already_taken'] ?? 0
  const priceCount = counts['wrong_price'] ?? 0
  const otherCount = counts['other'] ?? 0

  const filterTabs: { key: FilterType; label: string; count?: number }[] = [
    { key: 'all', label: 'All', count: rawDisplayed.length },
    { key: 'fake', label: 'Fake', count: fakeCount },
    { key: 'already_taken', label: 'Already taken', count: takenCount },
    { key: 'wrong_price', label: 'Wrong price', count: priceCount },
    { key: 'other', label: 'Other', count: otherCount },
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
            Reports
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Review and resolve user-flagged listings.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {reports.length === 0 && !loading && (
            <button
              onClick={() => setShowDemo((s) => !s)}
              className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-100"
            >
              <Sparkles size={14} />
              {showDemo ? 'Hide demo' : 'Show demo'}
            </button>
          )}
          <button
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Fake listings', count: fakeCount, icon: AlertTriangle, color: 'text-red-600 bg-red-50 border-red-100' },
          { label: 'Already taken', count: takenCount, icon: EyeOff, color: 'text-amber-600 bg-amber-50 border-amber-100' },
          { label: 'Wrong price', count: priceCount, icon: Flag, color: 'text-blue-600 bg-blue-50 border-blue-100' },
          { label: 'Other', count: otherCount, icon: MessageSquare, color: 'text-zinc-600 bg-zinc-50 border-zinc-100' },
        ].map(({ label, count, icon: Icon, color }) => (
          <div
            key={label}
            className={`flex items-center gap-3 rounded-2xl border p-4 ${color}`}
          >
            <Icon size={18} />
            <div>
              <p className="text-lg font-bold">{count}</p>
              <p className="text-xs font-medium opacity-70">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap items-center gap-1.5">
        <Filter size={14} className="text-zinc-400" />
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
              activeFilter === tab.key
                ? 'bg-zinc-900 text-white shadow'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            {tab.label}
            {(tab.count ?? 0) > 0 && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  activeFilter === tab.key
                    ? 'bg-white/20 text-white'
                    : 'bg-white text-zinc-700'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Errors */}
      {(fetchError || actionError) && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span className="flex-1">{fetchError || actionError}</span>
          <button onClick={() => { setFetchError(''); setActionError('') }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Reports */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-2xl border border-zinc-100 bg-zinc-100" />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-14 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
            <ShieldCheck size={28} />
          </div>
          <p className="mt-4 text-lg font-bold text-zinc-900">
            {activeFilter === 'all' ? 'All caught up' : 'No reports in this category'}
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            {activeFilter === 'all'
              ? 'There are no open reports to review right now.'
              : 'Try switching to "All" to see all open reports.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {displayed.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              resolving={resolving}
              onHide={hideRoom}
              onResolve={resolveReport}
            />
          ))}
        </div>
      )}
    </div>
  )
}
