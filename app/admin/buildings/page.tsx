'use client'

import { useState } from 'react'

const inputClass =
  'min-h-11 rounded-xl border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-emerald-500 focus:outline-none'

export default function BuildingsPage() {
  const [form, setForm] = useState({
    buildingName: '',
    area: '',
    town: '',
    caretakerName: '',
    phone: '',
    email: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [created, setCreated] = useState<{
    email: string
    tempPassword: string
  } | null>(null)

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setCreated(null)

    const res = await fetch('/api/admin/buildings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()

    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? 'Something went wrong')
    } else {
      setCreated(data.caretaker)
      setForm({
        buildingName: '',
        area: '',
        town: '',
        caretakerName: '',
        phone: '',
        email: '',
      })
    }
  }

  return (
    <div className="flex max-w-lg flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">
          Create building admin
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          This is the only way caretaker accounts are created — building admins
          never self-register.
        </p>
      </div>

      {created && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="font-semibold text-emerald-800">
            Building admin created
          </p>
          <p className="mt-1 text-sm text-emerald-800">
            Share these login details with the caretaker (shown once):
          </p>
          <p className="mt-2 rounded-lg bg-white px-3 py-2 font-mono text-sm text-zinc-900">
            {created.email}
            <br />
            {created.tempPassword}
          </p>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm"
      >
        <input
          placeholder="Building name (e.g. Sunrise Apartments)"
          value={form.buildingName}
          onChange={update('buildingName')}
          required
          className={inputClass}
        />
        <input
          placeholder="Area / estate (e.g. Kahawa West)"
          value={form.area}
          onChange={update('area')}
          required
          className={inputClass}
        />
        <input
          placeholder="Town (e.g. Nairobi)"
          value={form.town}
          onChange={update('town')}
          required
          className={inputClass}
        />
        <input
          placeholder="Caretaker name (e.g. Kamau)"
          value={form.caretakerName}
          onChange={update('caretakerName')}
          required
          className={inputClass}
        />
        <input
          placeholder="Caretaker phone (e.g. 0712 345 678)"
          value={form.phone}
          onChange={update('phone')}
          className={inputClass}
        />
        <input
          type="email"
          placeholder="Caretaker email (used to log in)"
          value={form.email}
          onChange={update('email')}
          required
          className={inputClass}
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="min-h-11 rounded-xl bg-emerald-600 font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? 'Creating…' : 'Create building admin'}
        </button>
      </form>
    </div>
  )
}
