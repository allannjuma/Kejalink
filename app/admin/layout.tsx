'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Building2,
  ClipboardCheck,
  Flag,
  ShieldCheck,
  Menu,
  X,
  ChevronRight,
  Bell,
  LogOut,
  Zap,
} from 'lucide-react'
import { SuperAdminProvider, useSuperAdmin } from '@/lib/super-admin'

const navItems = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/admin/buildings', label: 'Buildings', icon: Building2, exact: false },
  { href: '/admin/approvals', label: 'Approvals', icon: ClipboardCheck, exact: false },
  { href: '/admin/reports', label: 'Reports', icon: Flag, exact: false },
]

type NavItemDef = (typeof navItems)[0]

function SidebarNavItem({
  item,
  pathname,
  onClick,
}: {
  item: NavItemDef
  pathname: string
  onClick?: () => void
}) {
  const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
        active
          ? 'bg-emerald-500/15 text-emerald-400'
          : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
      }`}
    >
      <Icon
        size={18}
        className={
          active ? 'text-emerald-400' : 'text-zinc-500 group-hover:text-zinc-300'
        }
      />
      <span className="flex-1">{item.label}</span>
      {active && (
        <ChevronRight size={14} className="text-emerald-500/50" />
      )}
    </Link>
  )
}

function Sidebar({ isMobile, onClose }: { isMobile?: boolean; onClose?: () => void }) {
  const pathname = usePathname()
  const admin = useSuperAdmin()
  const initial = admin?.name?.trim().charAt(0).toUpperCase() || 'A'

  return (
    <aside className="flex h-full w-64 flex-col bg-zinc-950 border-r border-white/[0.06]">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500 shadow-lg shadow-emerald-500/30">
          <ShieldCheck size={20} className="text-white" strokeWidth={2.5} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-white tracking-tight">Kejalink</p>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-400">
            Admin Panel
          </p>
        </div>
        {isMobile && (
          <button
            onClick={onClose}
            className="ml-auto rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-white/10 hover:text-zinc-200"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 px-3 py-4">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
          Navigation
        </p>
        {navItems.map((item) => (
          <SidebarNavItem
            key={item.href}
            item={item}
            pathname={pathname}
            onClick={isMobile ? onClose : undefined}
          />
        ))}
      </nav>

      {/* Bottom user section */}
      <div className="border-t border-white/[0.06] p-3">
        <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-sm font-bold text-emerald-400 ring-1 ring-emerald-500/30">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-zinc-200">{admin?.name ?? 'Super Admin'}</p>
            <p className="truncate text-xs text-zinc-500">{admin?.email ?? ''}</p>
          </div>
          <button
            className="shrink-0 rounded-lg p-1.5 text-zinc-600 transition-colors hover:bg-red-500/10 hover:text-red-400"
            title="Sign out"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Close the mobile nav on navigation — adjust state during render instead of
  // in an effect (https://react.dev/learn/you-might-not-need-an-effect).
  const [prevPathname, setPrevPathname] = useState(pathname)
  if (prevPathname !== pathname) {
    setPrevPathname(pathname)
    setMobileOpen(false)
  }

  // Get current page title for the top bar
  const currentNav = navItems.find((item) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href)
  )

  return (
    <SuperAdminProvider>
    <div className="flex min-h-screen bg-zinc-50">
      {/* Desktop sidebar — fixed */}
      <div className="hidden md:fixed md:inset-y-0 md:left-0 md:z-30 md:flex md:w-64 md:flex-col">
        <Sidebar />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 z-10 flex w-64 flex-col shadow-2xl">
            <Sidebar isMobile onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content area */}
      <div className="flex flex-1 flex-col md:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-14 items-center gap-4 border-b border-zinc-200 bg-white/90 px-4 backdrop-blur-md sm:px-6">
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-100 md:hidden"
          >
            <Menu size={20} />
          </button>

          {/* Page title */}
          <div className="flex-1">
            <p className="text-sm font-semibold text-zinc-800">
              {currentNav?.label ?? 'Admin'}
            </p>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              <Zap size={11} />
              Live
            </div>
            <button className="relative rounded-full p-2 text-zinc-500 transition-colors hover:bg-zinc-100">
              <Bell size={18} />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
    </SuperAdminProvider>
  )
}
