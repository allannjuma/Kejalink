import Link from 'next/link'
import { HomeIcon, Search, MapPin } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col bg-paper font-sans text-ink">
      {/* Ambient blobs matching hero */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-blob absolute -left-24 top-20 size-[420px] rounded-full bg-[#FF385C]/10 blur-3xl dark:bg-[#FF385C]/15" />
        <div className="animate-blob-slow absolute -right-32 top-48 size-[480px] rounded-full bg-rose-200/50 blur-3xl dark:bg-[#FF385C]/10" />
        <div className="animate-blob absolute bottom-20 left-1/3 size-[360px] rounded-full bg-gray-200/60 blur-3xl [animation-delay:-6s] dark:bg-white/5" />
      </div>

      {/* Simple top nav */}
      <header className="relative z-10 border-b border-line bg-paper/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="group flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-brand text-brand-ink shadow-lg shadow-brand/25 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">
              <HomeIcon size={18} />
            </span>
            <span className="font-display text-xl font-semibold tracking-tight text-ink">
              Keja<span className="text-gold">link</span>
            </span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <div className="animate-fade-up">
          <span className="grid size-20 place-items-center rounded-full bg-brand/10 text-brand">
            <MapPin size={36} />
          </span>
        </div>

        <h1 className="animate-fade-up mt-8 font-display text-8xl font-semibold tracking-tight text-ink" style={{ animationDelay: '80ms' }}>
          404
        </h1>

        <p className="animate-fade-up mt-4 font-display text-2xl font-semibold text-ink" style={{ animationDelay: '120ms' }}>
          Page not found
        </p>

        <p className="animate-fade-up mt-3 max-w-md text-sm leading-relaxed text-muted-ink" style={{ animationDelay: '160ms' }}>
          Looks like this address doesn&apos;t exist. Maybe it moved, or maybe the URL has a typo. Let&apos;s get you back on track.
        </p>

        <div className="animate-fade-up mt-8 flex flex-wrap items-center justify-center gap-3" style={{ animationDelay: '200ms' }}>
          <Link
            href="/"
            className="shine group flex items-center gap-2 rounded-2xl bg-brand px-6 py-3 text-sm font-semibold text-brand-ink shadow-lg shadow-brand/25 transition-transform hover:scale-105 active:scale-95"
          >
            <HomeIcon size={16} />
            Go home
          </Link>

          <Link
            href="/search"
            className="flex items-center gap-2 rounded-2xl border border-line bg-card px-6 py-3 text-sm font-semibold text-ink transition-all hover:border-gold hover:text-gold active:scale-95"
          >
            <Search size={16} />
            Search listings
          </Link>
        </div>

        {/* Popular areas quick links */}
        <div className="animate-fade-up mt-10" style={{ animationDelay: '260ms' }}>
          <p className="text-xs font-medium text-muted-ink">Popular areas:</p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            {['Kilimani', 'Westlands', 'Ruiru', 'Karen', 'Thika'].map((area) => (
              <Link
                key={area}
                href={`/search?area=${encodeURIComponent(area)}`}
                className="rounded-full border border-line bg-card px-3 py-1.5 text-xs font-medium text-muted-ink transition-all duration-150 hover:border-gold hover:text-ink active:scale-[0.97]"
              >
                {area}
              </Link>
            ))}
          </div>
        </div>
      </main>

      {/* Minimal footer */}
      <footer className="relative z-10 border-t border-line bg-card/60 py-8 text-center text-sm text-muted-ink backdrop-blur">
        <p className="font-display text-lg font-semibold text-ink">
          Keja<span className="text-gold">link</span>
        </p>
        <p className="mt-1 text-xs">Find your next home, zero broker fees.</p>
      </footer>
    </div>
  )
}
