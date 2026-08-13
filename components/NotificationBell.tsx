'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, CheckCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { timeAgo } from '@/lib/time'

type Notification = {
  id: string
  type: string
  title: string
  body: string
  link: string | null
  read: boolean
  created_at: string
}

const POLL_INTERVAL_MS = 30_000

export default function NotificationBell() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const fetchNotifications = useCallback(async () => {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (!token) return
    try {
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      const json = await res.json()
      setNotifications(json.notifications ?? [])
      setUnreadCount(json.unreadCount ?? 0)
    } catch {
      // Transient network error — the next poll retries.
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch; state updates happen in async continuations
    fetchNotifications()
    const interval = setInterval(fetchNotifications, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  // Close the dropdown when clicking outside of it.
  useEffect(() => {
    if (!open) return
    const onClick = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const markRead = useCallback(
    async (payload: { ids?: string[]; all?: boolean }) => {
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      if (!token) return
      try {
        await fetch('/api/notifications', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        })
      } catch {
        // Optimistic UI already updated; the next poll re-syncs.
      }
    },
    []
  )

  const handleOpen = (notification: Notification) => {
    if (!notification.read) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
      )
      setUnreadCount((count) => Math.max(0, count - 1))
      markRead({ ids: [notification.id] })
    }
    setOpen(false)
    if (notification.link) router.push(notification.link)
  }

  const handleMarkAll = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
    markRead({ all: true })
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((value) => !value)}
        className="relative rounded-full p-2 text-zinc-500 transition-colors hover:bg-emerald-50 hover:text-emerald-700"
        title="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-40 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-2.5">
            <p className="text-sm font-semibold text-zinc-900">Notifications</p>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAll}
                className="flex items-center gap-1 text-xs font-medium text-emerald-600 transition-colors hover:text-emerald-700"
              >
                <CheckCheck size={13} />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-zinc-400">
                No notifications yet
              </p>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleOpen(notification)}
                  className={`flex w-full items-start gap-3 border-b border-zinc-50 px-4 py-3 text-left transition-colors hover:bg-emerald-50/60 ${
                    notification.read ? '' : 'bg-emerald-50/40'
                  }`}
                >
                  {!notification.read && (
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                  )}
                  <div className={notification.read ? 'pl-5' : ''}>
                    <p
                      className={`text-sm ${
                        notification.read
                          ? 'text-zinc-600'
                          : 'font-semibold text-zinc-900'
                      }`}
                    >
                      {notification.title}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-zinc-500">
                      {notification.body}
                    </p>
                    <p className="mt-1 text-[11px] text-zinc-400">
                      {timeAgo(notification.created_at)}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
