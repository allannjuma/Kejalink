'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { BuildingAdminProvider, useBuildingAdmin } from '@/lib/building-admin'

const navItems = [
  { href: '/dashboard', label: 'My building' },
  { href: '/dashboard/add-room', label: 'Add room' },
  { href: '/dashboard/bookings', label: 'Bookings' },
  { href: '/dashboard/settings', label: 'Settings' },
]

function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const admin = useBuildingAdmin()

  return (
    <div className="flex flex-1 flex-col bg-emerald-50/40">
      <header className="border-b border-emerald-100 bg-white">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-4">
          <div className="mr-auto">
            <p className="text-lg font-bold tracking-tight text-emerald-700">
              {admin?.buildingName}
            </p>
            <p className="text-xs text-zinc-500">
              {admin?.area}, {admin?.town} · {admin?.name}
            </p>
          </div>
          <nav className="flex flex-wrap gap-1">
            {navItems.map((item) => {
              const active =
                item.href === '/dashboard'
                  ? pathname === '/dashboard'
                  : pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-emerald-600 text-white'
                      : 'text-zinc-600 hover:bg-emerald-50 hover:text-emerald-700'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
          <button
            onClick={async () => {
              await supabase.auth.signOut()
              router.replace('/login')
            }}
            className="rounded-full px-3 py-2 text-sm text-zinc-400 hover:text-zinc-600"
          >
            Sign out
          </button>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
    </div>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <BuildingAdminProvider>
      <Shell>{children}</Shell>
    </BuildingAdminProvider>
  )
}
