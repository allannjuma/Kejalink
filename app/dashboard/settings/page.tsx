'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useBuildingAdmin } from '@/lib/building-admin'

const inputClass =
  'min-h-11 rounded-xl border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-emerald-500 focus:outline-none'

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

    // Both updates are pinned to this caretaker's own rows only.
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
    <div className="flex max-w-lg flex-col gap-6">
      <h1 className="text-2xl font-bold text-zinc-900">Settings</h1>

      {saved && (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
          Saved.
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm"
      >
        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
          Building name
          <input
            value={form.buildingName}
            onChange={update('buildingName')}
            required
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
          Area / estate
          <input
            value={form.area}
            onChange={update('area')}
            required
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
          Town
          <input
            value={form.town}
            onChange={update('town')}
            required
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
          Your phone
          <input
            value={form.phone}
            onChange={update('phone')}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
          WhatsApp number
          <input
            value={form.whatsapp}
            onChange={update('whatsapp')}
            className={inputClass}
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="min-h-11 rounded-xl bg-emerald-600 font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </div>
  )
}
