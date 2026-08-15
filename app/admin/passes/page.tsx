'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  Wallet,
  Banknote,
  Clock3,
  XCircle,
  Loader2,
  RefreshCw,
  AlertCircle,
  X,
  Filter,
  ShieldCheck,
  Phone,
  Zap,
  TrendingUp,
  Download,
  Repeat,
} from 'lucide-react'
import { timeAgo } from '@/lib/time'

/* ─── Types ──────────────────────────────────────────────────────────── */

type Pass = {
  id: string
  phone: string
  amount: number
  hours: number
  status: 'pending' | 'paid' | 'failed'
  checkout_request_id: string | null
  expires_at: string | null
  created_at: string
}

type FilterType = 'all' | 'active' | 'paid' | 'pending' | 'failed' | 'regulars'

type DayFilter = { key: string; label: string }

const statusBadge: Record<string, string> = {
  paid: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  failed: 'bg-red-100 text-red-800 border-red-200',
}

function isActive(p: Pass): boolean {
  return p.status === 'paid' && !!p.expires_at && new Date(p.expires_at).getTime() > Date.now()
}

function formatKes(amount: number): string {
  return `KES ${amount.toLocaleString('en-KE')}`
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString('en-KE', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function formatKesCompact(amount: number): string {
  if (amount >= 1000) {
    const k = amount / 1000
    return `KES ${k % 1 === 0 ? k : k.toFixed(1)}k`
  }
  return `KES ${amount}`
}

function dayKeyOf(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

/* ─── Revenue chart (last 14 days, pure SVG, clickable days) ─────────── */

type DayTotal = { key: string; label: string; short: string; h24: number; h48: number }

function dayTotal(d: DayTotal): number {
  return d.h24 + d.h48
}

function RevenueChart({
  passes,
  selectedDay,
  onSelectDay,
}: {
  passes: Pass[]
  selectedDay: DayFilter | null
  onSelectDay: (day: DayFilter | null) => void
}) {
  const days: DayTotal[] = useMemo(() => {
    const out: DayTotal[] = []
    const now = new Date()
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
      out.push({
        key: `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`,
        label: d.toLocaleDateString('en-KE', { weekday: 'short', day: 'numeric', month: 'short' }),
        short: d.toLocaleDateString('en-KE', { day: 'numeric', month: 'short' }),
        h24: 0,
        h48: 0,
      })
    }
    passes
      .filter((p) => p.status === 'paid')
      .forEach((p) => {
        const slot = out.find((day) => day.key === dayKeyOf(p.created_at))
        if (!slot) return
        if (p.hours === 48) slot.h48 += p.amount ?? 0
        else slot.h24 += p.amount ?? 0
      })
    return out
  }, [passes])

  const max = Math.max(...days.map(dayTotal), 1)
  const periodTotal = days.reduce((sum, d) => sum + dayTotal(d), 0)
  const total24 = days.reduce((sum, d) => sum + d.h24, 0)
  const total48 = days.reduce((sum, d) => sum + d.h48, 0)
  const bestDay = days.reduce<DayTotal | null>(
    (best, d) => (dayTotal(d) > dayTotal(best ?? { key: '', label: '', short: '', h24: 0, h48: 0 }) ? d : best),
    null
  )
  const bestDayTotal = bestDay ? dayTotal(bestDay) : 0

  // Chart geometry
  const W = 700
  const H = 220
  const padL = 64
  const padR = 12
  const padT = 16
  const padB = 30
  const plotW = W - padL - padR
  const plotH = H - padT - padB
  const slot = plotW / days.length
  const barW = Math.min(28, slot * 0.55)
  const gridLines = [0, 0.25, 0.5, 0.75, 1]

  return (
    <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-bold text-zinc-900">
            <TrendingUp size={16} className="text-emerald-600" />
            Revenue — last 14 days
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500">
            Daily totals from paid passes, split by pass type. Click a day to filter the table below.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-xs font-medium text-zinc-600">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
              24h pass · {formatKes(total24)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-emerald-800" />
              48h pass · {formatKes(total48)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-right">
          <div>
            <p className="text-lg font-bold text-zinc-900">{formatKes(periodTotal)}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              14-day total
            </p>
          </div>
          <div>
            <p className="text-lg font-bold text-emerald-600">
              {bestDay ? formatKesCompact(bestDayTotal) : '—'}
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              Best day{bestDay ? ` · ${bestDay.short}` : ''}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full min-w-[560px]"
          role="img"
          aria-label="Daily revenue for the last 14 days, split by 24h and 48h passes"
        >
          {/* Grid lines + y labels */}
          {gridLines.map((frac) => {
            const y = padT + plotH * (1 - frac)
            return (
              <g key={frac}>
                <line
                  x1={padL}
                  x2={W - padR}
                  y1={y}
                  y2={y}
                  stroke="#f4f4f5"
                  strokeWidth={1}
                />
                <text
                  x={padL - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-zinc-400"
                  fontSize={9}
                >
                  {frac === 0 ? '0' : formatKesCompact(Math.round(max * frac))}
                </text>
              </g>
            )
          })}

          {/* Stacked bars: 24h on the bottom, 48h on top. Click to filter. */}
          {days.map((d, i) => {
            const total = dayTotal(d)
            const totalH = total > 0 ? Math.max(4, (total / max) * plotH) : 0
            const h24H = total > 0 ? (d.h24 / max) * plotH : 0
            const h48H = totalH - h24H
            const x = padL + i * slot + (slot - barW) / 2
            const yTop = padT + plotH - totalH
            const y48 = yTop
            const y24 = yTop + h48H
            const isBest = bestDay !== null && total === bestDayTotal && total > 0
            const isSelected = selectedDay?.key === d.key
            const tooltip = `${d.label}: ${formatKes(total)} (24h: ${formatKes(d.h24)} · 48h: ${formatKes(d.h48)})`
            return (
              <g
                key={d.key}
                className="cursor-pointer"
                onClick={() => onSelectDay(isSelected ? null : { key: d.key, label: d.label })}
              >
                {isSelected && (
                  <rect
                    x={padL + i * slot + 1}
                    y={padT}
                    width={slot - 2}
                    height={plotH}
                    rx={6}
                    className="fill-emerald-50"
                  />
                )}
                {d.h24 > 0 && (
                  <rect
                    x={x}
                    y={y24}
                    width={barW}
                    height={h24H}
                    rx={d.h48 > 0 ? 0 : 4}
                    className={isBest ? 'fill-emerald-500' : 'fill-emerald-500/70'}
                  >
                    <title>{tooltip}</title>
                  </rect>
                )}
                {d.h48 > 0 && (
                  <rect
                    x={x}
                    y={y48}
                    width={barW}
                    height={h48H}
                    rx={4}
                    className={isBest ? 'fill-emerald-800' : 'fill-emerald-800/80'}
                  >
                    <title>{tooltip}</title>
                  </rect>
                )}
                {total > 0 && (
                  <text
                    x={x + barW / 2}
                    y={yTop - 5}
                    textAnchor="middle"
                    className="fill-zinc-500"
                    fontSize={9}
                    fontWeight={600}
                  >
                    {formatKesCompact(total).replace('KES ', '')}
                  </text>
                )}
                {(i % 2 === 0 || isSelected) && (
                  <text
                    x={padL + i * slot + slot / 2}
                    y={H - 8}
                    textAnchor="middle"
                    className={isSelected ? 'fill-emerald-700' : 'fill-zinc-400'}
                    fontSize={9}
                    fontWeight={isSelected ? 700 : 400}
                  >
                    {d.short}
                  </text>
                )}
              </g>
            )
          })}

          {/* Baseline */}
          <line
            x1={padL}
            x2={W - padR}
            y1={padT + plotH}
            y2={padT + plotH}
            stroke="#e4e4e7"
            strokeWidth={1}
          />
        </svg>
      </div>
    </div>
  )
}

/* ─── Main ───────────────────────────────────────────────────────────── */

export default function PassesPage() {
  const [passes, setPasses] = useState<Pass[]>([])
  const [fetchError, setFetchError] = useState('')
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [selectedDay, setSelectedDay] = useState<DayFilter | null>(null)

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setFetchError('')
    try {
      const res = await fetch('/api/admin/passes', { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to load passes')
      setPasses((json.passes as Pass[]) ?? [])
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : String(err))
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount; state updates happen in async continuations
    load()
  }, [load])

  // Silent auto-refresh every 30s so the dashboard stays live without flashing skeletons
  useEffect(() => {
    const id = setInterval(() => load(true), 30000)
    return () => clearInterval(id)
  }, [load])

  /* ─── Stats ────────────────────────────────────────────────────────── */

  const paidPasses = passes.filter((p) => p.status === 'paid')
  const pendingCount = passes.filter((p) => p.status === 'pending').length
  const failedCount = passes.filter((p) => p.status === 'failed').length
  const activePasses = passes.filter(isActive)
  const totalRevenue = paidPasses.reduce((sum, p) => sum + (p.amount ?? 0), 0)

  // Repeat customers: phones with 2+ paid passes
  const paidCountByPhone = new Map<string, number>()
  paidPasses.forEach((p) => {
    paidCountByPhone.set(p.phone, (paidCountByPhone.get(p.phone) ?? 0) + 1)
  })
  const repeatPhones = new Set(
    [...paidCountByPhone.entries()].filter(([, n]) => n >= 2).map(([phone]) => phone)
  )
  const repeatPasses = passes.filter((p) => repeatPhones.has(p.phone))

  const statusFiltered =
    activeFilter === 'all'
      ? passes
      : activeFilter === 'active'
        ? activePasses
        : activeFilter === 'regulars'
          ? repeatPasses
          : passes.filter((p) => p.status === activeFilter)

  const displayed = selectedDay
    ? statusFiltered.filter((p) => dayKeyOf(p.created_at) === selectedDay.key)
    : statusFiltered

  const filterTabs: { key: FilterType; label: string; count?: number }[] = [
    { key: 'all', label: 'All', count: passes.length },
    { key: 'active', label: 'Active now', count: activePasses.length },
    { key: 'paid', label: 'Paid', count: paidPasses.length },
    { key: 'pending', label: 'Pending', count: pendingCount },
    { key: 'failed', label: 'Failed', count: failedCount },
    { key: 'regulars', label: 'Regulars', count: repeatPhones.size },
  ]

  function exportCsv() {
    const header = ['Phone', 'Pass', 'Amount (KES)', 'Status', 'Expires', 'Created', 'Checkout ref']
    const rows = displayed.map((p) => [
      p.phone,
      `${p.hours}h`,
      String(p.amount),
      p.status,
      p.expires_at ?? '',
      p.created_at,
      p.checkout_request_id ?? '',
    ])
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`
    const csv = [header, ...rows].map((r) => r.map(escape).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const stamp = new Date().toISOString().slice(0, 10)
    const dayPart = selectedDay ? `-day-${selectedDay.key}` : ''
    a.href = url
    a.download = `kejalink-passes-${activeFilter}${dayPart}-${stamp}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
            Passes &amp; Payments
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Track viewing-pass purchases, M-Pesa payment status, and revenue.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={exportCsv}
            disabled={loading || displayed.length === 0}
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-50"
          >
            <Download size={14} />
            Export CSV
          </button>
          <button
            onClick={() => load()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          {
            label: 'Total revenue',
            value: formatKes(totalRevenue),
            icon: Banknote,
            color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
          },
          {
            label: 'Active now',
            value: activePasses.length,
            icon: Zap,
            color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
          },
          {
            label: 'Paid',
            value: paidPasses.length,
            icon: ShieldCheck,
            color: 'text-blue-600 bg-blue-50 border-blue-100',
          },
          {
            label: 'Pending',
            value: pendingCount,
            icon: Clock3,
            color: 'text-amber-600 bg-amber-50 border-amber-100',
          },
          {
            label: 'Failed',
            value: failedCount,
            icon: XCircle,
            color: 'text-red-600 bg-red-50 border-red-100',
          },
          {
            label: 'Regulars',
            value: repeatPhones.size,
            icon: Repeat,
            color: 'text-violet-600 bg-violet-50 border-violet-100',
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className={`flex items-center gap-3 rounded-2xl border p-4 ${color}`}
          >
            <Icon size={18} className="shrink-0" />
            <div className="min-w-0">
              <p className="truncate text-lg font-bold">{value}</p>
              <p className="text-xs font-medium opacity-70">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      <RevenueChart passes={passes} selectedDay={selectedDay} onSelectDay={setSelectedDay} />

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
        {selectedDay && (
          <span className="ml-1 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
            Day: {selectedDay.label}
            <button
              onClick={() => setSelectedDay(null)}
              className="rounded-full p-0.5 transition-colors hover:bg-emerald-100"
              aria-label="Clear day filter"
            >
              <X size={12} />
            </button>
          </span>
        )}
      </div>

      {/* Errors */}
      {fetchError && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span className="flex-1">{fetchError}</span>
          <button onClick={() => setFetchError('')}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Passes table */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl border border-zinc-100 bg-zinc-100" />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-14 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
            <Wallet size={28} />
          </div>
          <p className="mt-4 text-lg font-bold text-zinc-900">
            {selectedDay
              ? `No passes on ${selectedDay.label}`
              : activeFilter === 'all'
                ? 'No passes yet'
                : 'No passes in this category'}
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            {selectedDay
              ? 'Click the highlighted day again or clear the day filter to see every pass.'
              : activeFilter === 'all'
                ? 'Passes appear here as soon as tenants start paying to unlock room locations.'
                : 'Try switching to "All" to see every pass.'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/60 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  <th className="px-5 py-3">Phone</th>
                  <th className="px-5 py-3">Pass</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Expires</th>
                  <th className="px-5 py-3">Checkout ref</th>
                  <th className="px-5 py-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {displayed.map((pass) => {
                  const active = isActive(pass)
                  return (
                    <tr key={pass.id} className="transition-colors hover:bg-zinc-50/60">
                      <td className="px-5 py-3.5">
                        <span className="inline-flex flex-wrap items-center gap-1.5 font-semibold text-zinc-900">
                          <Phone size={13} className="text-zinc-400" />
                          {pass.phone}
                          {repeatPhones.has(pass.phone) && (
                            <span
                              className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-700"
                              title={`Repeat customer — ${paidCountByPhone.get(pass.phone)} paid passes`}
                            >
                              <Repeat size={9} />
                              ×{paidCountByPhone.get(pass.phone)}
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-zinc-600">{pass.hours}h pass</td>
                      <td className="px-5 py-3.5 font-semibold text-zinc-900">
                        {formatKes(pass.amount)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1.5">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${
                              statusBadge[pass.status] ?? 'bg-zinc-100 text-zinc-700 border-zinc-200'
                            }`}
                          >
                            {pass.status === 'pending' && (
                              <Loader2 size={10} className="animate-spin" />
                            )}
                            {pass.status}
                          </span>
                          {active && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                              LIVE
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-zinc-600">
                        {formatDateTime(pass.expires_at)}
                      </td>
                      <td className="max-w-[140px] truncate px-5 py-3.5 font-mono text-xs text-zinc-400">
                        {pass.checkout_request_id ?? '—'}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-zinc-400">
                        {timeAgo(pass.created_at)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
