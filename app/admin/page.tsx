'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { timeAgo } from '@/lib/time'
import { EditAdminModal, EditAdminForm } from '@/components/EditAdminModal'

type Stats = {
  buildings: number
  rooms: number
  vacant: number
  openReports: number
}

type BuildingAdmin = {
  id: string
  name: string
  phone: string | null
  email: string
  updated_at: string
  buildings: { name: string } | null
}

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
  const [error, setError] = useState('')
  const [editingAdmin, setEditingAdmin] = useState<EditAdminForm | null>(null)

  useEffect(() => {
    async function load() {
      const [buildings, rooms, vacant, openReports] = await Promise.all([
        countRows('buildings'),
        countRows('rooms'),
        countRows('rooms', { column: 'state', value: 'live' }),
        countRows('reports', { column: 'state', value: 'open' }),
      ])
      setStats({ buildings, rooms, vacant, openReports })

      const { data, error } = await supabase
        .from('users')
        .select('id, name, phone, email, updated_at, buildings(name)')
        .eq('role', 'building_admin')
        .order('updated_at', { ascending: false })

      if (error) setError(error.message)
      else setAdmins((data as unknown as BuildingAdmin[]) ?? [])
    }
    load()
  }, [])

  const cards = [
    { label: 'Total buildings', value: stats?.buildings },
    { label: 'Total rooms', value: stats?.rooms },
    { label: 'Vacant right now', value: stats?.vacant, highlight: true },
    { label: 'Open reports', value: stats?.openReports },
  ]

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold text-zinc-900">Overview</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm"
          >
            <p
              className={`text-3xl font-bold ${
                card.highlight ? 'text-emerald-600' : 'text-zinc-900'
              }`}
            >
              {card.value ?? '…'}
            </p>
            <p className="mt-1 text-sm text-zinc-500">{card.label}</p>
          </div>
        ))}
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-zinc-900">
          Building admins
        </h2>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {!error && admins.length === 0 && (
          <p className="text-sm text-zinc-500">
            No building admins yet — create one from the Buildings tab.
          </p>
        )}
        <ul className="flex flex-col gap-3">
          {admins.map((admin) => {
            const quietDays =
              (Date.now() - new Date(admin.updated_at).getTime()) / 86400000
            return (
              <li
                key={admin.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm"
              >
                <div>
                  <p className="font-medium text-zinc-900">
                    {admin.name}
                    <span className="ml-2 text-sm font-normal text-zinc-500">
                      {admin.buildings?.name ?? 'No building'}
                    </span>
                  </p>
                  <p className="text-sm text-zinc-500">
                    {admin.phone ?? admin.email}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    quietDays > 7
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {quietDays > 7
                    ? `quiet for ${Math.floor(quietDays)} days`
                    : `updated ${timeAgo(admin.updated_at)}`}
                </span>
                
                <button
                  onClick={() => setEditingAdmin({
                    id: admin.id,
                    name: admin.name,
                    phone: admin.phone,
                    email: admin.email
                  })}
                  className="ml-4 rounded-lg bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-200"
                >
                  Edit
                </button>
              </li>
            )
          })}
        </ul>
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
