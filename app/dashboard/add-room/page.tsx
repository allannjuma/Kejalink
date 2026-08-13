'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Plus,
  Tag,
  Home,
  Banknote,
  Receipt,
  FileText,
  ImagePlus,
  Check,
  Loader2,
  ArrowLeft,
  X,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useBuildingAdmin } from '@/lib/building-admin'

const inputClass =
  'min-h-11 w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-zinc-900 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'

const labelClass = 'mb-1.5 block text-sm font-medium text-zinc-700'

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
  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  const [photoUrls, setPhotoUrls] = useState<string[]>([])
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

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    setPhotoFiles((prev) => [...prev, ...files])
    setPhotoUrls((prev) => [
      ...prev,
      ...files.map((file) => URL.createObjectURL(file)),
    ])
  }

  function removePhoto(index: number) {
    setPhotoFiles((prev) => prev.filter((_, i) => i !== index))
    setPhotoUrls((prev) => {
      URL.revokeObjectURL(prev[index])
      return prev.filter((_, i) => i !== index)
    })
  }

  async function uploadPhotos(): Promise<string[]> {
    if (!admin || photoFiles.length === 0) return []
    const urls: string[] = []

    for (const file of photoFiles) {
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
      const uploadedUrls = await uploadPhotos()

      const { error } = await supabase.from('rooms').insert({
        building_id: admin.buildingId,
        name,
        type,
        rent: Number(rent),
        deposit: deposit ? Number(deposit) : null,
        description: description || null,
        amenities,
        photos: uploadedUrls,
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
      photoUrls.forEach(URL.revokeObjectURL)
      setPhotoFiles([])
      setPhotoUrls([])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="rounded-full p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
            Add a room
          </h1>
          <p className="text-zinc-500">
            Submit a room. It goes live after KejaLink approval.
          </p>
        </div>
      </div>

      {done && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
            <Check size={20} />
          </div>
          <div>
            <p className="font-semibold text-emerald-900">Room submitted</p>
            <p className="text-sm text-emerald-800">
              You will see it listed once it is approved.
            </p>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm sm:p-8"
      >
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className={labelClass}>Room name / number</label>
            <div className="relative">
              <Tag
                size={18}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
              />
              <input
                placeholder="e.g. Bedsitter A3"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className={`${inputClass} pl-10`}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Room type</label>
            <div className="relative">
              <Home
                size={18}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
              />
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className={`${inputClass} appearance-none pl-10`}
              >
                {roomTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Rent per month (KSh)</label>
            <div className="relative">
              <Banknote
                size={18}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
              />
              <input
                type="number"
                min="0"
                placeholder="e.g. 12000"
                value={rent}
                onChange={(e) => setRent(e.target.value)}
                required
                className={`${inputClass} pl-10`}
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className={labelClass}>Deposit (KSh, optional)</label>
            <div className="relative">
              <Receipt
                size={18}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
              />
              <input
                type="number"
                min="0"
                placeholder="e.g. 12000"
                value={deposit}
                onChange={(e) => setDeposit(e.target.value)}
                className={`${inputClass} pl-10`}
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className={labelClass}>Description</label>
            <div className="relative">
              <FileText
                size={18}
                className="pointer-events-none absolute left-3.5 top-3 text-zinc-400"
              />
              <textarea
                placeholder="What makes this room stand out?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className={`${inputClass} resize-none pl-10`}
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className={labelClass}>Amenities</label>
            <div className="flex flex-wrap gap-2">
              {amenityOptions.map((option) => {
                const checked = amenities.includes(option.value)
                return (
                  <label
                    key={option.value}
                    className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-4 text-sm font-medium transition-colors ${
                      checked
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-zinc-300 text-zinc-600 hover:bg-zinc-50'
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
          </div>

          <div className="md:col-span-2">
            <label className={labelClass}>Photos</label>
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/50 p-6 text-center transition-colors hover:border-emerald-300 hover:bg-emerald-50/30">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoSelect}
                className="hidden"
                id="photo-upload"
              />
              <label
                htmlFor="photo-upload"
                className="flex cursor-pointer flex-col items-center gap-2"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <ImagePlus size={22} />
                </div>
                <p className="font-medium text-zinc-900">Click to upload photos</p>
                <p className="text-xs text-zinc-500">
                  PNG, JPG up to 10MB each
                </p>
              </label>
            </div>

            {photoUrls.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-3">
                {photoUrls.map((url, idx) => (
                  <div
                    key={url}
                    className="group relative h-24 w-24 overflow-hidden rounded-xl"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`Preview ${idx + 1}`}
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(idx)}
                      className="absolute right-1 top-1 rounded-full bg-black/50 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
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
            <Plus size={18} />
          )}
          {loading ? 'Submitting…' : 'Submit for approval'}
        </button>
      </form>
    </div>
  )
}
