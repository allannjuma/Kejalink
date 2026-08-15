'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Building2,
  MapPin,
  User,
  Phone,
  Mail,
  Lock,
  Plus,
  Copy,
  Check,
  Eye,
  EyeOff,
  AlertCircle,
  RefreshCw,
  Calendar,
  Search,
  X,
} from 'lucide-react'
import { LocationPicker, LatLng } from '@/components/LocationPicker'

/* ─── Styles ─────────────────────────────────────────────────────────── */

const inputClass =
  'min-h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 pl-10 text-sm text-zinc-900 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 placeholder:text-zinc-400'
const labelClass = 'mb-1.5 block text-sm font-medium text-zinc-700'

/* ─── Types ──────────────────────────────────────────────────────────── */

type Caretaker = {
  name: string
  email: string
  phone: string | null
}

type Building = {
  id: string
  name: string
  area: string
  town: string
  created_at: string
  admin_user_id: string | null
  users: Caretaker | Caretaker[] | null
}

type CreatedBuilding = Building & {
  tempPassword?: string
  isNew?: boolean
}

/* ─── Helpers ────────────────────────────────────────────────────────── */

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/* ─── Credential Row ─────────────────────────────────────────────────── */

function CredentialRow({
  label,
  value,
  isPassword,
}: {
  label: string
  value: string
  isPassword?: boolean
}) {
  const [copied, setCopied] = useState(false)
  const [show, setShow] = useState(!isPassword)

  async function copy() {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-zinc-50 px-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
          {label}
        </p>
        <p className="truncate font-mono text-sm text-zinc-900">
          {isPassword && !show ? '•'.repeat(Math.min(value.length, 12)) : value}
        </p>
      </div>
      <div className="flex items-center gap-1">
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-700"
          >
            {show ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        )}
        <button
          type="button"
          onClick={copy}
          className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-emerald-100 hover:text-emerald-700"
        >
          {copied ? (
            <Check size={14} className="text-emerald-600" />
          ) : (
            <Copy size={14} />
          )}
        </button>
      </div>
    </div>
  )
}

/* ─── Building Card (in list) ────────────────────────────────────────── */

function BuildingListCard({ building }: { building: CreatedBuilding }) {
  const caretaker = Array.isArray(building.users)
    ? building.users[0]
    : building.users

  const [resetPassword, setResetPassword] = useState<string | null>(null)
  const [resetting, setResetting] = useState(false)
  const [resetError, setResetError] = useState('')

  // Passwords are hashed in Auth and can never be displayed after creation —
  // resetting generates a fresh temp password and shows it here once.
  async function handleResetPassword() {
    if (!building.admin_user_id) return
    setResetting(true)
    setResetError('')
    try {
      const res = await fetch(
        `/api/admin/users/${building.admin_user_id}/reset-password`,
        { method: 'POST' }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `Reset failed (status ${res.status})`)
      setResetPassword(data.tempPassword)
    } catch (err) {
      setResetError(err instanceof Error ? err.message : 'Reset failed')
    } finally {
      setResetting(false)
    }
  }

  const visiblePassword = building.tempPassword ?? resetPassword

  return (
    <div
      className={`rounded-2xl border bg-white p-5 shadow-sm transition-all hover:shadow-md ${
        building.isNew
          ? 'border-emerald-300 ring-1 ring-emerald-200/70'
          : 'border-zinc-100'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow">
            <Building2 size={17} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-zinc-900 leading-tight">{building.name}</p>
            <p className="flex items-center gap-1 text-xs text-zinc-500">
              <MapPin size={10} />
              {building.area}, {building.town}
            </p>
          </div>
        </div>
        {building.isNew && (
          <span className="shrink-0 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white">
            NEW
          </span>
        )}
      </div>

      {caretaker && (
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-zinc-600">
          <span className="flex items-center gap-1">
            <User size={11} className="text-zinc-400" />
            {caretaker.name}
          </span>
          {caretaker.phone && (
            <span className="flex items-center gap-1">
              <Phone size={11} className="text-zinc-400" />
              {caretaker.phone}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Calendar size={11} className="text-zinc-400" />
            {formatDate(building.created_at)}
          </span>
        </div>
      )}

      {/* Credentials section */}
      <div className="mt-4 rounded-xl border border-zinc-100 bg-zinc-50/60 p-3">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
          Caretaker Login
        </p>
        <div className="flex flex-col gap-2">
          <CredentialRow label="Email" value={caretaker?.email ?? '—'} />
          {visiblePassword ? (
            <CredentialRow
              label="Password (copy now)"
              value={visiblePassword}
              isPassword
            />
          ) : (
            <div className="rounded-xl bg-zinc-50 px-3 py-2">
              <p className="text-[10px] font-medium text-zinc-400">Password</p>
              <p className="text-xs text-zinc-400">
                Stored as a hash — not viewable. Reset to generate a new one.
              </p>
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={resetting || !building.admin_user_id}
                className="mt-2 flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
              >
                {resetting ? (
                  <RefreshCw size={12} className="animate-spin" />
                ) : (
                  <Lock size={12} />
                )}
                {resetting ? 'Resetting…' : 'Reset password'}
              </button>
              {resetError && (
                <p className="mt-1.5 text-xs text-red-600">{resetError}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Main Page ──────────────────────────────────────────────────────── */

export default function BuildingsPage() {
  const [form, setForm] = useState({
    buildingName: '',
    area: '',
    town: '',
    caretakerName: '',
    phone: '',
    email: '',
    tempPassword: '',
  })
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [buildings, setBuildings] = useState<CreatedBuilding[]>([])
  const [search, setSearch] = useState('')
  const [pin, setPin] = useState<LatLng | null>(null)

  const loadBuildings = useCallback(async () => {
    setFetching(true)
    setError('')
    try {
      const res = await fetch('/api/admin/buildings')
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? `Failed to load (status ${res.status})`)
      } else {
        const serverBuildings = (data.buildings as Building[]) ?? []
        setBuildings((prev) => {
          const localSecrets = new Map(
            prev
              .filter((b) => b.tempPassword)
              .map((b) => [b.id, { tempPassword: b.tempPassword, isNew: b.isNew }])
          )
          return serverBuildings.map((b) => {
            const secret = localSecrets.get(b.id)
            return secret ? { ...b, ...secret } : b
          })
        })
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error loading buildings')
    } finally {
      setFetching(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount; state updates happen in async continuations
    loadBuildings()
  }, [loadBuildings])

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/admin/buildings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          lat: pin?.lat ?? null,
          lng: pin?.lng ?? null,
        }),
      })
      const data = await res.json()
      setLoading(false)

      if (!res.ok) {
        setError(data.error ?? `Create failed (status ${res.status})`)
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }

      const created: CreatedBuilding = {
        ...data.building,
        users: {
          name: form.caretakerName,
          email: form.email,
          phone: form.phone || null,
        },
        tempPassword: data.caretaker.tempPassword,
        isNew: true,
      }

      setBuildings((prev) => [created, ...prev])
      setSuccess(`✅ "${data.building.name}" created! Copy the caretaker credentials below.`)
      setForm({
        buildingName: '',
        area: '',
        town: '',
        caretakerName: '',
        phone: '',
        email: '',
        tempPassword: '',
      })
      setPin(null)

      loadBuildings()
    } catch (err) {
      setLoading(false)
      setError(
        err instanceof Error
          ? err.message
          : 'Network error — check your connection.'
      )
    }
  }

  const filtered = buildings.filter((b) => {
    if (!search) return true
    const q = search.toLowerCase()
    const caretaker = Array.isArray(b.users) ? b.users[0] : b.users
    return (
      b.name.toLowerCase().includes(q) ||
      b.area.toLowerCase().includes(q) ||
      b.town.toLowerCase().includes(q) ||
      caretaker?.name.toLowerCase().includes(q) ||
      caretaker?.email.toLowerCase().includes(q)
    )
  })

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
            Buildings
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Create and manage caretaker-run properties.
          </p>
        </div>
        <button
          type="button"
          onClick={loadBuildings}
          disabled={fetching}
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-all hover:bg-zinc-50 disabled:opacity-50"
        >
          <RefreshCw size={15} className={fetching ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Error / Success banners */}
      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError('')} className="shrink-0 text-red-400 hover:text-red-600">
            <X size={16} />
          </button>
        </div>
      )}
      {success && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        {/* ── Create Form ── */}
        <div className="lg:col-span-2">
          <div className="sticky top-20">
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm"
            >
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <Building2 size={18} />
                </div>
                <h2 className="text-base font-bold text-zinc-900">New building</h2>
              </div>

              <div className="space-y-4">
                {/* Building name */}
                <div>
                  <label className={labelClass}>Building name</label>
                  <div className="relative">
                    <Building2 size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      placeholder="e.g. Sunrise Apartments"
                      value={form.buildingName}
                      onChange={update('buildingName')}
                      required
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Area / estate</label>
                    <div className="relative">
                      <MapPin size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        placeholder="Kahawa West"
                        value={form.area}
                        onChange={update('area')}
                        required
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Town</label>
                    <div className="relative">
                      <MapPin size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        placeholder="Nairobi"
                        value={form.town}
                        onChange={update('town')}
                        required
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>

                {/* Exact location pin */}
                <div>
                  <label className={labelClass}>Exact location (optional)</label>
                  <LocationPicker value={pin} onChange={setPin} />
                </div>

                <div className="pt-1">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="h-px flex-1 bg-zinc-100" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      Caretaker
                    </span>
                    <div className="h-px flex-1 bg-zinc-100" />
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className={labelClass}>Full name</label>
                      <div className="relative">
                        <User size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input
                          placeholder="e.g. John Kamau"
                          value={form.caretakerName}
                          onChange={update('caretakerName')}
                          required
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>Phone (optional)</label>
                      <div className="relative">
                        <Phone size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input
                          placeholder="0712 345 678"
                          value={form.phone}
                          onChange={update('phone')}
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>Login email</label>
                      <div className="relative">
                        <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input
                          type="email"
                          placeholder="caretaker@example.com"
                          value={form.email}
                          onChange={update('email')}
                          required
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>Temporary password</label>
                      <div className="relative">
                        <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input
                          type="text"
                          placeholder="At least 6 characters"
                          value={form.tempPassword}
                          onChange={update('tempPassword')}
                          required
                          minLength={6}
                          className={inputClass}
                        />
                      </div>
                      <p className="mt-1.5 text-xs text-zinc-400">
                        Copy this before leaving — it cannot be retrieved later.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white shadow shadow-emerald-600/20 transition-all hover:bg-emerald-700 disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <Plus size={16} />
                )}
                {loading ? 'Creating…' : 'Create building + caretaker'}
              </button>
            </form>
          </div>
        </div>

        {/* ── Buildings List ── */}
        <div className="lg:col-span-3">
          {/* Search bar */}
          <div className="mb-4 relative">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              placeholder="Search buildings, areas, caretakers…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-9 pr-4 text-sm text-zinc-900 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 placeholder:text-zinc-400"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Header */}
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500">
              {search
                ? `${filtered.length} result${filtered.length !== 1 ? 's' : ''}`
                : `All buildings (${buildings.length})`}
            </h2>
          </div>

          {/* List */}
          {fetching && buildings.length === 0 ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-40 animate-pulse rounded-2xl border border-zinc-100 bg-zinc-100"
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-10 text-center">
              <Building2 size={36} className="mx-auto text-zinc-300" />
              <p className="mt-3 font-medium text-zinc-900">
                {search ? 'No matches found' : 'No buildings yet'}
              </p>
              <p className="text-sm text-zinc-500">
                {search
                  ? 'Try a different search term.'
                  : 'Create your first building using the form.'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {filtered.map((b) => (
                <BuildingListCard key={b.id} building={b} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
