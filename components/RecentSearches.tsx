'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { History, X } from 'lucide-react'

type RecentSearch = { area: string; type: string; max: string }

const KEY = 'kejalink-recent-searches'
const MAX_ITEMS = 6

function labelOf(s: RecentSearch): string {
  const parts = [
    s.area,
    s.type,
    s.max ? `≤ KES ${Number(s.max).toLocaleString()}` : '',
  ].filter(Boolean)
  return parts.join(' · ')
}

function hrefOf(s: RecentSearch): string {
  const p = new URLSearchParams()
  if (s.area) p.set('area', s.area)
  if (s.type) p.set('type', s.type)
  if (s.max) p.set('max', s.max)
  const q = p.toString()
  return q ? `/search?${q}` : '/search'
}

function keyOf(s: RecentSearch): string {
  return `${s.area}::${s.type}::${s.max}`
}

export function RecentSearches({ area, type, max }: RecentSearch) {
  const [items, setItems] = useState<RecentSearch[]>([])

  useEffect(() => {
    let history: RecentSearch[] = []
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) ?? '[]')
      if (Array.isArray(raw)) {
        history = raw.filter(
          (h): h is RecentSearch =>
            h && typeof h === 'object' &&
            typeof h.area === 'string' &&
            typeof h.type === 'string' &&
            typeof h.max === 'string'
        )
      }
    } catch {
      /* ignore */
    }

    // Record the current search (only when it actually has parameters)
    if (area || type || max) {
      const current: RecentSearch = { area, type, max }
      history = [current, ...history.filter((h) => keyOf(h) !== keyOf(current))].slice(0, MAX_ITEMS)
      try {
        localStorage.setItem(KEY, JSON.stringify(history))
      } catch {
        /* ignore */
      }
    }
    setItems(history)
  }, [area, type, max])

  if (items.length === 0) return null

  const clearAll = () => {
    try {
      localStorage.removeItem(KEY)
    } catch {
      /* ignore */
    }
    setItems([])
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 pt-3">
      <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-ink">
        <History size={12} />
        Recent
      </span>
      {items.map((s) => (
        <Link
          key={keyOf(s)}
          href={hrefOf(s)}
          className="rounded-full border border-line bg-card px-3 py-1.5 text-xs font-medium text-muted-ink transition-all duration-150 hover:border-gold hover:text-ink active:scale-[0.97]"
        >
          {labelOf(s)}
        </Link>
      ))}
      <button
        onClick={clearAll}
        className="flex items-center gap-1 rounded-full px-2 py-1.5 text-xs font-medium text-muted-ink transition-colors hover:text-brand"
        aria-label="Clear recent searches"
      >
        <X size={12} />
        Clear
      </button>
    </div>
  )
}
