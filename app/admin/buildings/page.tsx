'use client'

import { useState } from 'react'

const inputClass =
  'min-h-11 rounded-xl border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-emerald-500 focus:outline-none'

type CreatedBuilding = {
  id: string
  name: string
  area: string
  town: string
  caretakerEmail: string
  caretakerPass: string
}

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
  const [error, setError] = useState('')
  const [createdList, setCreatedList] = useState<CreatedBuilding[]>([])

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

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
      setCreatedList((prev) => [
        ...prev,
        {
          id: data.building.id,
          name: data.building.name,
          area: data.building.area,
          town: data.building.town,
          caretakerEmail: data.caretaker.email,
          caretakerPass: data.caretaker.tempPassword,
        },
      ])
      setForm({
        buildingName: '',
        area: '',
        town: '',
        caretakerName: '',
        phone: '',
        email: '',
        tempPassword: '',
      })
    }
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">
          Create building admin
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          This is the only way caretaker accounts are created — building admins
          never self-register.
        </p>
      </div>

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
        <div className="grid grid-cols-2 gap-4">
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
        </div>
        <div className="grid grid-cols-2 gap-4">
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
        </div>
        <input
          type="email"
          placeholder="Caretaker email (used to log in)"
          value={form.email}
          onChange={update('email')}
          required
          className={inputClass}
        />
        <input
          type="text"
          placeholder="Temporary Password"
          value={form.tempPassword}
          onChange={update('tempPassword')}
          required
          minLength={6}
          className={inputClass}
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="min-h-11 rounded-xl bg-emerald-600 font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50 mt-2"
        >
          {loading ? 'Creating…' : 'Create building admin'}
        </button>
      </form>

      {/* List newly created buildings */}
      {createdList.length > 0 && (
        <div className="mt-4 flex flex-col gap-4">
          <h2 className="font-bold text-zinc-900 text-lg">Newly Created Buildings</h2>
          {createdList.map((cb, idx) => (
            <div key={idx} className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
              <p className="font-bold text-emerald-900 text-lg mb-1">{cb.name}</p>
              <p className="text-sm text-emerald-800 mb-3">{cb.area}, {cb.town}</p>
              
              <div className="bg-white rounded-xl border border-emerald-100 p-4">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Caretaker Credentials</p>
                <div className="flex flex-col gap-1">
                  <p className="font-mono text-sm text-zinc-900"><span className="text-zinc-500 inline-block w-20">Email:</span> {cb.caretakerEmail}</p>
                  <p className="font-mono text-sm text-zinc-900"><span className="text-zinc-500 inline-block w-20">Password:</span> {cb.caretakerPass}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
