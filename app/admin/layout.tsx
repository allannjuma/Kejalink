'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/buildings', label: 'Buildings' },
  { href: '/admin/approvals', label: 'Approvals' },
  { href: '/admin/reports', label: 'Reports' },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="flex flex-1 flex-col bg-emerald-50/40">
      <header className="border-b border-emerald-100 bg-white">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-4">
          <Link
            href="/admin"
            className="text-lg font-bold tracking-tight text-emerald-700"
          >
            Kejalink Admin
          </Link>
          <nav className="flex flex-wrap gap-1">
            {navItems.map((item) => {
              const active =
                item.href === '/admin'
                  ? pathname === '/admin'
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
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
    </div>
  )
}
