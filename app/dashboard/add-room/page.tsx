'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useBuildingAdmin } from '@/lib/building-admin'

const inputClass =
  'min-h-11 rounded-xl border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-emerald-500 focus:outline-none'

const roomTypes = [
  'Single room',
  'Bedsitter',
  '1 Bedroom',
  '2 Bedroom',
  '3 Bedroom',
]

const amenityOptions = [
  { value: 'water_24_7', label: 'Water 24/7' },
  { value: 'token_meter', label: 'Token meter' },
  { value: 'wifi', label: 'WiFi' },
  { value: 'parking', label: 'Parking' },
  { value: 'cctv', label: 'CCTV' },
  { value: 'furnished', label: 'Furnished' },
  { value: 'balcony', label: 'Balcony' },
]

export default function AddRoomPage() {
  const admin = useBuildingAdmin()
  const [name, setName] = useState('')
  const [type, setType] = useState(roomTypes[0])
  const [rent, setRent] = useState('')
  const [deposit, setDeposit] = useState('')
  const [description, setDescription] = useState('')
  const [amenities, setAmenities] = useState<string[]>([])
  const [photos, setPhotos] = useState<FileList | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  function toggleAmenity(value: string) {
    setAmenities((prev) =>
      prev.includes(value)
        ? prev.filter((a) => a !== value)
        : [...prev, value]
    )
  }

  async function uploadPhotos(): Promise<string[]> {
    if (!photos || !admin) return []
    const urls: string[] = []

    for (const file of Array.from(photos)) {
      const path = `${admin.buildingId}/${crypto.randomUUID()}-${file.name}`
      const { error } = await supabase.storage
        .from('room-photos')
        .upload(path, file)

      if (error) throw new Error(`Photo upload failed: ${error.message}`)

      const {
        data: { publicUrl },
      } = supabase.storage.from('room-photos').getPublicUrl(path)
      urls.push(publicUrl)
    }
    return urls
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!admin) return
    setLoading(true)
    setError('')
    setDone(false)

    try {
      const photoUrls = await uploadPhotos()

      const { error } = await supabase.from('rooms').insert({
        building_id: admin.buildingId,
        name,
        type,
        rent: Number(rent),
        deposit: deposit ? Number(deposit) : null,
        description: description || null,
        amenities,
        photos: photoUrls,
        state: 'pending_approval',
        last_confirmed_at: new Date().toISOString(),
      })

      if (error) throw new Error(error.message)

      setDone(true)
      setName('')
      setRent('')
      setDeposit('')
      setDescription('')
      setAmenities([])
      setPhotos(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex max-w-lg flex-col gap-6">
      <h1 className="text-2xl font-bold text-zinc-900">Add a room</h1>

      {done && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="font-semibold text-emerald-800">Room submitted</p>
          <p className="mt-1 text-sm text-emerald-800">
            Goes live after KejaLink approval.
          </p>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm"
      >
        <input
          placeholder="Room name / number (e.g. Bedsitter A3)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className={inputClass}
        />

        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className={inputClass}
        >
          {roomTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <input
          type="number"
          min="0"
          placeholder="Rent per month (KSh)"
          value={rent}
          onChange={(e) => setRent(e.target.value)}
          required
          className={inputClass}
        />

        <input
          type="number"
          min="0"
          placeholder="Deposit (KSh, optional)"
          value={deposit}
          onChange={(e) => setDeposit(e.target.value)}
          className={inputClass}
        />

        <textarea
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="rounded-xl border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-emerald-500 focus:outline-none"
        />

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-zinc-700">
            Amenities
          </legend>
          <div className="flex flex-wrap gap-2">
            {amenityOptions.map((option) => {
              const checked = amenities.includes(option.value)
              return (
                <label
                  key={option.value}
                  className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-4 text-sm font-medium transition-colors ${
                    checked
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                      : 'border-zinc-300 text-zinc-600'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleAmenity(option.value)}
                    className="accent-emerald-600"
                  />
                  {option.label}
                </label>
              )
            })}
          </div>
        </fieldset>

        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
          Photos
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setPhotos(e.target.files)}
            className="text-sm text-zinc-600 file:mr-3 file:min-h-11 file:rounded-xl file:border-0 file:bg-emerald-50 file:px-4 file:font-medium file:text-emerald-700"
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="min-h-11 rounded-xl bg-emerald-600 font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? 'Submitting…' : 'Submit for approval'}
        </button>
      </form>
    </div>
  )
}
