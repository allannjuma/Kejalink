'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import {
  Building2,
  DoorOpen,
  Home,
  Flag,
  Users,
  Plus,
  ClipboardCheck,
  ArrowUpRight,
  RefreshCw,
  Mail,
  Phone,
  Pencil,
  Activity,
  TrendingUp,
  MapPin,
  Clock,
  AlertCircle,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { timeAgo } from '@/lib/time'
import { EditAdminModal, EditAdminForm } from '@/components/EditAdminModal'

/* ─── Types ──────────────────────────────────────────────────────────── */

type Stats = {
  buildings: number
  rooms: number
  vacant: number
  openReports: number
  pendingApprovals: number
}

type BuildingAdmin = {
  id: string
  name: string
  phone: string | null
  email: string
  updated_at: string
  buildings: { name: string } | null
}

type RecentBuilding = {
  id: string
  name: string
  area: string
  town: string
  created_at: string
  users:
    | { name: string; email: string; phone: string | null }
    | { name: string; email: string; phone: string | null }[]
    | null
}

/* ─── Animated Counter ───────────────────────────────────────────────── */

function useCountUp(target: number | undefined, duration = 900) {
  const [count, setCount] = useState(0)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    if (target === undefined) return
    const start = Date.now()
    const from = 0
    const tick = () => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(from + (target - from) * eased))
      if (progress < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [target, duration])

  return count
}

/* ─── KPI Card ───────────────────────────────────────────────────────── */

function KpiCard({
  label,
  value,
  icon: Icon,
  color,
  href,
  sub,
}: {
  label: string
  value: number | undefined
  icon: React.ElementType
  color: 'emerald' | 'blue' | 'amber' | 'red' | 'violet'
  href: string
  sub?: string
}) {
  const count = useCountUp(value)

  const palette: Record<string, string> = {
    emerald: 'from-emerald-500 to-emerald-600 shadow-emerald-500/30',
    blue:    'from-blue-500 to-blue-600 shadow-blue-500/30',
    amber:   'from-amber-500 to-amber-600 shadow-amber-500/30',
    red:     'from-red-500 to-red-600 shadow-red-500/30',
    violet:  'from-violet-500 to-violet-600 shadow-violet-500/30',
  }

  const bg: Record<string, string> = {
    emerald: 'bg-emerald-50 hover:bg-emerald-50/80',
    blue:    'bg-blue-50 hover:bg-blue-50/80',
    amber:   'bg-amber-50 hover:bg-amber-50/80',
    red:     'bg-red-50 hover:bg-red-50/80',
    violet:  'bg-violet-50 hover:bg-violet-50/80',
  }

  const text: Record<string, string> = {
    emerald: 'text-emerald-700',
    blue:    'text-blue-700',
    amber:   'text-amber-700',
    red:     'text-red-700',
    violet:  'text-violet-700',
  }

  return (
    <Link
      href={href}
      className={`group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${bg[color]}`}
    >
      <div className="flex items-start justify-between">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg ${palette[color]}`}
        >
          <Icon size={22} />
        </div>
        <ArrowUpRight
          size={16}
          className={`opacity-0 transition-opacity group-hover:opacity-100 ${text[color]}`}
        />
      </div>
      <div>
        <p className="text-3xl font-bold text-zinc-900">
          {value === undefined ? (
            <span className="inline-block h-8 w-16 animate-pulse rounded-lg bg-zinc-200" />
          ) : (
            count.toLocaleString()
          )}
        </p>
        <p className="mt-0.5 text-sm font-medium text-zinc-500">{label}</p>
        {sub && <p className={`mt-1 text-xs font-medium ${text[color]}`}>{sub}</p>}
      </div>
    </Link>
  )
}

/* ─── Quick Action ───────────────────────────────────────────────────── */

function QuickAction({
  href,
  icon: Icon,
  title,
  sub,
  badge,
}: {
  href: string
  icon: React.ElementType
  title: string
  sub: string
  badge?: number
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
        <Icon size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 font-semibold text-zinc-900">
          {title}
          {badge !== undefined && badge > 0 && (
            <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
              {badge}
            </span>
          )}
        </p>
        <p className="text-sm text-zinc-500">{sub}</p>
      </div>
      <ArrowUpRight
        size={16}
        className="shrink-0 text-zinc-300 transition-colors group-hover:text-emerald-600"
      />
    </Link>
  )
}

/* ─── Admin Card ─────────────────────────────────────────────────────── */

function AdminCard({
  admin,
  now,
  onEdit,
}: {
  admin: BuildingAdmin
  now: number
  onEdit: (admin: EditAdminForm) => void
}) {
  const quietDays = (now - new Date(admin.updated_at).getTime()) / 86_400_000
  const initials = admin.name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="group flex items-center gap-4 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm transition-all hover:shadow-md">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-sm font-bold text-white shadow">
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-zinc-900">{admin.name}</p>
          <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs text-zinc-500">
            {admin.buildings?.name ?? 'No building'}
          </span>
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
          <span className="flex items-center gap-1">
            <Mail size={11} />
            {admin.email}
          </span>
          {admin.phone && (
            <span className="flex items-center gap-1">
              <Phone size={11} />
              {admin.phone}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span
          className={`hidden rounded-full px-2.5 py-1 text-xs font-medium sm:inline-flex ${
            quietDays > 7
              ? 'bg-amber-100 text-amber-700'
              : 'bg-emerald-100 text-emerald-700'
          }`}
        >
          {quietDays > 7
            ? `${Math.floor(quietDays)}d quiet`
            : `updated ${timeAgo(admin.updated_at)}`}
        </span>
        <button
          onClick={() =>
            onEdit({
              id: admin.id,
              name: admin.name,
              phone: admin.phone,
              email: admin.email,
            })
          }
          className="rounded-lg p-2 text-zinc-400 opacity-0 transition-all group-hover:opacity-100 hover:bg-emerald-50 hover:text-emerald-600"
          title="Edit"
        >
          <Pencil size={15} />
        </button>
      </div>
    </div>
  )
}

/* ─── Building Card ──────────────────────────────────────────────────── */

function BuildingCard({ building }: { building: RecentBuilding }) {
  const caretaker = Array.isArray(building.users)
    ? building.users[0]
    : building.users

  return (
    <div className="group flex flex-col gap-3 rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow">
          <Building2 size={20} className="text-white" />
        </div>
        <span className="text-xs text-zinc-400">
          <Clock size={11} className="mr-1 inline" />
          {timeAgo(building.created_at)}
        </span>
      </div>
      <div>
        <p className="font-bold text-zinc-900">{building.name}</p>
        <p className="mt-0.5 flex items-center gap-1 text-sm text-zinc-500">
          <MapPin size={12} />
          {building.area}, {building.town}
        </p>
      </div>
      {caretaker && (
        <div className="rounded-xl bg-zinc-50 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
            Caretaker
          </p>
          <p className="mt-0.5 text-sm font-medium text-zinc-800">{caretaker.name}</p>
          <p className="text-xs text-zinc-500">{caretaker.email}</p>
        </div>
      )}
    </div>
  )
}

/* ─── Main Dashboard ─────────────────────────────────────────────────── */

async function countRows(
  table: string,
  filters?: { column: string; value: string }
): Promise<number> {
  let query = supabase.from(table).select('*', { count: 'exact', head: true })
  if (filters) query = query.eq(filters.column, filters.value)
  const { count } = await query
  return count ?? 0
}

export default function AdminOverview() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [admins, setAdmins] = useState<BuildingAdmin[]>([])
  const [buildings, setBuildings] = useState<RecentBuilding[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [editingAdmin, setEditingAdmin] = useState<EditAdminForm | null>(null)
  const [now] = useState(() => Date.now())

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [bldg, rooms, vacant, openReports, pendingApprovals] =
        await Promise.all([
          countRows('buildings'),
          countRows('rooms'),
          countRows('rooms', { column: 'state', value: 'live' }),
          countRows('reports', { column: 'state', value: 'open' }),
          countRows('rooms', { column: 'state', value: 'pending_approval' }),
        ])
      setStats({ buildings: bldg, rooms, vacant, openReports, pendingApprovals })

      const { data: adminsData, error: adminsErr } = await supabase
        .from('users')
        .select('id, name, phone, email, updated_at, buildings(name)')
        .eq('role', 'building_admin')
        .order('updated_at', { ascending: false })
      if (adminsErr) throw new Error(adminsErr.message)
      setAdmins((adminsData as unknown as BuildingAdmin[]) ?? [])

      const { data: bldgsData, error: bldgsErr } = await supabase
        .from('buildings')
        .select('id, name, area, town, created_at, users(name, email, phone)')
        .order('created_at', { ascending: false })
        .limit(6)
      if (bldgsErr) throw new Error(bldgsErr.message)
      setBuildings((bldgsData as unknown as RecentBuilding[]) ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount; state updates happen in async continuations
    load()
  }, [load])

  const occupancy =
    stats && stats.rooms > 0
      ? Math.round(((stats.rooms - stats.vacant) / stats.rooms) * 100)
      : 0

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="flex flex-col gap-8">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">
            {today}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
            Dashboard Overview
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Real-time snapshot of your property portfolio.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-all hover:bg-zinc-50 disabled:opacity-50"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <Link
            href="/admin/buildings"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-emerald-600/20 transition-all hover:bg-emerald-700"
          >
            <Plus size={16} />
            New building
          </Link>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <KpiCard
          label="Total buildings"
          value={stats?.buildings}
          icon={Building2}
          color="emerald"
          href="/admin/buildings"
          sub="All properties"
        />
        <KpiCard
          label="Total rooms"
          value={stats?.rooms}
          icon={DoorOpen}
          color="blue"
          href="/admin/approvals"
          sub="Across all buildings"
        />
        <KpiCard
          label="Live rooms"
          value={stats?.vacant}
          icon={Home}
          color="violet"
          href="/admin/approvals"
          sub={`${occupancy}% occupancy`}
        />
        <KpiCard
          label="Open reports"
          value={stats?.openReports}
          icon={Flag}
          color="red"
          href="/admin/reports"
          sub="Needs review"
        />
        <KpiCard
          label="Pending approval"
          value={stats?.pendingApprovals}
          icon={ClipboardCheck}
          color="amber"
          href="/admin/approvals"
          sub="Awaiting review"
        />
      </div>

      {/* Occupancy bar */}
      <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between text-sm">
          <p className="font-semibold text-zinc-900">Portfolio occupancy</p>
          <span className="font-bold text-emerald-700">{occupancy}%</span>
        </div>
        <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-zinc-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-1000"
            style={{ width: `${occupancy}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs text-zinc-500">
          <span>{stats?.vacant ?? 0} live rooms</span>
          <span>{(stats?.rooms ?? 0) - (stats?.vacant ?? 0)} others</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
        {/* Recent Buildings */}
        <section className="xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 size={18} className="text-emerald-600" />
              <h2 className="font-bold text-zinc-900">Recent Buildings</h2>
            </div>
            <Link
              href="/admin/buildings"
              className="flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700"
            >
              View all
              <ArrowUpRight size={14} />
            </Link>
          </div>

          {loading && buildings.length === 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-48 animate-pulse rounded-2xl border border-zinc-100 bg-zinc-100"
                />
              ))}
            </div>
          ) : buildings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-10 text-center">
              <Building2 size={36} className="mx-auto text-zinc-300" />
              <p className="mt-3 font-medium text-zinc-900">No buildings yet</p>
              <p className="text-sm text-zinc-500">
                Create your first building and it will appear here.
              </p>
              <Link
                href="/admin/buildings"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white"
              >
                <Plus size={16} />
                Add building
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {buildings.map((b) => (
                <BuildingCard key={b.id} building={b} />
              ))}
            </div>
          )}
        </section>

        {/* Sidebar */}
        <aside className="flex flex-col gap-6">
          {/* Quick Actions */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Activity size={16} className="text-zinc-400" />
              <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                Quick Actions
              </h2>
            </div>
            <div className="flex flex-col gap-2">
              <QuickAction
                href="/admin/buildings"
                icon={Plus}
                title="New building"
                sub="Add property + caretaker"
              />
              <QuickAction
                href="/admin/approvals"
                icon={ClipboardCheck}
                title="Approve rooms"
                sub="Review pending listings"
                badge={stats?.pendingApprovals}
              />
              <QuickAction
                href="/admin/reports"
                icon={Flag}
                title="Review reports"
                sub="Handle flagged content"
                badge={stats?.openReports}
              />
            </div>
          </div>

          {/* Stats summary */}
          <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-emerald-600" />
              <h3 className="text-sm font-bold text-zinc-900">At a glance</h3>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Buildings', value: stats?.buildings ?? '—', color: 'text-emerald-600' },
                { label: 'Total rooms', value: stats?.rooms ?? '—', color: 'text-blue-600' },
                { label: 'Pending approvals', value: stats?.pendingApprovals ?? '—', color: 'text-amber-600' },
                { label: 'Open reports', value: stats?.openReports ?? '—', color: 'text-red-600' },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between">
                  <span className="text-sm text-zinc-500">{row.label}</span>
                  <span className={`text-sm font-bold ${row.color}`}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* Building Admins */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-emerald-600" />
            <h2 className="font-bold text-zinc-900">Building Admins</h2>
            {admins.length > 0 && (
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                {admins.length}
              </span>
            )}
          </div>
        </div>

        {loading && admins.length === 0 ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-2xl border border-zinc-100 bg-zinc-100"
              />
            ))}
          </div>
        ) : admins.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-8 text-center">
            <Users size={36} className="mx-auto text-zinc-300" />
            <p className="mt-3 font-medium text-zinc-900">No building admins yet</p>
            <p className="text-sm text-zinc-500">
              Building admins are created when you add a new building.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {admins.map((admin) => (
              <AdminCard
                key={admin.id}
                admin={admin}
                now={now}
                onEdit={setEditingAdmin}
              />
            ))}
          </div>
        )}
      </section>

      {editingAdmin && (
        <EditAdminModal
          admin={editingAdmin}
          onClose={() => setEditingAdmin(null)}
          onSuccess={(updated) => {
            setAdmins((prev) =>
              prev.map((a) =>
                a.id === updated.id
                  ? { ...a, name: updated.name, phone: updated.phone, email: updated.email }
                  : a
              )
            )
            setEditingAdmin(null)
          }}
        />
      )}
    </div>
  )
}
