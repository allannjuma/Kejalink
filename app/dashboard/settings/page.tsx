'use client'

import { useState } from 'react'
import {
  Building2,
  MapPin,
  Phone,
  MessageCircle,
  Save,
  Check,
  Loader2,
  User,
  Mail,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useBuildingAdmin } from '@/lib/building-admin'

const inputClass =
  'min-h-11 w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 pl-10 text-zinc-900 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'

const labelClass = 'mb-1.5 block text-sm font-medium text-zinc-700'

export default function SettingsPage() {
  const admin = useBuildingAdmin()
  const [form, setForm] = useState({
    buildingName: admin?.buildingName ?? '',
    area: admin?.area ?? '',
    town: admin?.town ?? '',
    phone: admin?.phone ?? '',
    whatsapp: admin?.whatsapp ?? '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!admin) return
    setLoading(true)
    setError('')
    setSaved(false)

    const { error: buildingError } = await supabase
      .from('buildings')
      .update({ name: form.buildingName, area: form.area, town: form.town })
      .eq('id', admin.buildingId)

    if (buildingError) {
      setLoading(false)
      setError(buildingError.message)
      return
    }

    const { error: userError } = await supabase
      .from('users')
      .update({
        phone: form.phone || null,
        whatsapp: form.whatsapp || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', admin.userId)

    setLoading(false)

    if (userError) setError(userError.message)
    else setSaved(true)
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
          Settings
        </h1>
        <p className="mt-1 text-zinc-500">
          Update your building and contact details.
        </p>
      </div>

      {/* Profile card */}
      <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-2xl font-bold text-emerald-700">
            {admin?.name?.charAt(0).toUpperCase() ?? 'A'}
          </div>
          <div>
            <p className="text-lg font-bold text-zinc-900">
              {admin?.name ?? 'Caretaker'}
            </p>
            <p className="flex items-center gap-1 text-sm text-zinc-500">
              <Mail size={14} />
              {admin?.email ?? '—'}
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              Building ID: {admin?.buildingId ?? '—'}
            </p>
          </div>
        </div>
      </div>

      {saved && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
            <Check size={20} />
          </div>
          <p className="font-semibold text-emerald-900">Changes saved.</p>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm sm:p-8"
      >
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
            <Building2 size={18} />
          </div>
          <h2 className="text-lg font-bold text-zinc-900">Building details</h2>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className={labelClass}>Building name</label>
            <div className="relative">
              <Building2
                size={18}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
              />
              <input
                value={form.buildingName}
                onChange={update('buildingName')}
                required
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Area / estate</label>
            <div className="relative">
              <MapPin
                size={18}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
              />
              <input
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
              <MapPin
                size={18}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
              />
              <input
                value={form.town}
                onChange={update('town')}
                required
                className={inputClass}
              />
            </div>
          </div>
        </div>

        <div className="my-8 border-t border-zinc-100" />

        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
            <User size={18} />
          </div>
          <h2 className="text-lg font-bold text-zinc-900">Contact details</h2>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label className={labelClass}>Your phone</label>
            <div className="relative">
              <Phone
                size={18}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
              />
              <input
                value={form.phone}
                onChange={update('phone')}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>WhatsApp number</label>
            <div className="relative">
              <MessageCircle
                size={18}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
              />
              <input
                value={form.whatsapp}
                onChange={update('whatsapp')}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-5 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 font-medium text-white shadow-sm shadow-emerald-600/20 transition-all hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Save size={18} />
          )}
          {loading ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </div>
  )
}
