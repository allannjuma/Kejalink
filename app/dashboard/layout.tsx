'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { BuildingAdminProvider, useBuildingAdmin } from '@/lib/building-admin'
import NotificationBell from '@/components/NotificationBell'
import {
  Building2,
  PlusCircle,
  CalendarDays,
  Settings,
  LogOut,
  User,
  MapPin,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'My building', icon: Building2 },
  { href: '/dashboard/add-room', label: 'Add room', icon: PlusCircle },
  { href: '/dashboard/bookings', label: 'Bookings', icon: CalendarDays },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const admin = useBuildingAdmin()

  return (
    <div className="flex min-h-full flex-col bg-[#f8fafb]">
      <header className="sticky top-0 z-30 border-b border-emerald-100/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
              <Building2 size={20} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-base font-bold leading-tight text-zinc-900">
                {admin?.buildingName ?? 'My Building'}
              </p>
              <p className="flex items-center gap-1 text-xs text-zinc-500">
                <MapPin size={11} />
                {admin ? `${admin.area}, ${admin.town}` : 'Loading…'}
              </p>
            </div>
          </div>

          <nav className="hidden flex-wrap gap-1 md:flex">
            {navItems.map((item) => {
              const active =
                item.href === '/dashboard'
                  ? pathname === '/dashboard'
                  : pathname.startsWith(item.href)
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                    active
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                      : 'text-zinc-600 hover:bg-emerald-50 hover:text-emerald-700'
                  }`}
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-2">
            <NotificationBell />
            <div className="hidden items-center gap-2 pr-2 sm:flex">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                {admin?.name?.charAt(0).toUpperCase() ?? <User size={16} />}
              </div>
            </div>
            <button
              onClick={async () => {
                await supabase.auth.signOut()
                router.replace('/login')
              }}
              className="rounded-full p-2 text-zinc-500 transition-colors hover:bg-red-50 hover:text-red-600"
              title="Sign out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        <nav className="flex gap-1 overflow-x-auto border-t border-emerald-50 px-4 py-2 md:hidden">
          {navItems.map((item) => {
            const active =
              item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-xs font-medium transition-all ${
                  active
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'text-zinc-600 hover:bg-emerald-50 hover:text-emerald-700'
                }`}
              >
                <Icon size={14} />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-8">
        {children}
      </main>
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
