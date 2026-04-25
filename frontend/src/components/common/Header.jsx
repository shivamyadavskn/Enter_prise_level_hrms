import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bars3Icon, BellIcon, ArrowRightOnRectangleIcon, UserCircleIcon } from '@heroicons/react/24/outline'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationsApi } from '../../api/index.js'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { format } from 'date-fns'

function useClickOutside(ref, handler) {
  useEffect(() => {
    const listener = (e) => { if (!ref.current || ref.current.contains(e.target)) return; handler() }
    document.addEventListener('mousedown', listener)
    return () => document.removeEventListener('mousedown', listener)
  }, [ref, handler])
}

export default function Header({ onMenuClick }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const notifRef = useRef(null)
  const profileRef = useRef(null)

  useClickOutside(notifRef, () => setNotifOpen(false))
  useClickOutside(profileRef, () => setProfileOpen(false))

  const { data: countData } = useQuery({
    queryKey: ['notif-count'],
    queryFn: notificationsApi.getUnreadCount,
    refetchInterval: 30_000,
  })
  const { data: notifData } = useQuery({
    queryKey: ['notif-recent'],
    queryFn: () => notificationsApi.getAll({ limit: 8 }),
    enabled: notifOpen,
  })

  const markReadMut = useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: () => { qc.invalidateQueries(['notif-count']); qc.invalidateQueries(['notif-recent']) },
  })
  const markAllMut = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => { qc.invalidateQueries(['notif-count']); qc.invalidateQueries(['notif-recent']) },
  })

  const unread = countData?.data?.data?.count || 0
  const notifications = notifData?.data?.data || []

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-x-3 border-b border-ink-200/70 bg-white/85 backdrop-blur-xl px-4 sm:gap-x-4 sm:px-6 lg:px-8">
      <button type="button" className="-m-2.5 p-2.5 text-ink-500 hover:text-ink-700 lg:hidden" onClick={onMenuClick}>
        <Bars3Icon className="h-5 w-5" />
      </button>
      <div className="h-5 w-px bg-ink-200 lg:hidden" />

      <div className="flex flex-1 items-center gap-x-3 self-stretch">
        <div className="flex-1">
          <p className="text-2xs font-semibold uppercase tracking-widest text-ink-400 hidden sm:block">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        <div className="flex items-center gap-x-2 lg:gap-x-3">
          {/* Notification Bell */}
          <div className="relative" ref={notifRef}>
            <button onClick={() => setNotifOpen(!notifOpen)} className="relative flex h-8 w-8 items-center justify-center rounded-md text-ink-500 hover:text-ink-900 hover:bg-ink-100 transition-colors">
              <BellIcon className="h-[18px] w-[18px]" />
              {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-2xs font-bold text-white ring-2 ring-white">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-11 w-80 rounded-lg bg-white shadow-dropdown ring-1 ring-ink-200 z-50 animate-scale-in overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-ink-50/60 border-b border-ink-100">
                  <p className="font-display text-sm font-semibold tracking-tight text-ink-900">Notifications {unread > 0 && <span className="ml-1.5 text-2xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">{unread}</span>}</p>
                  {unread > 0 && <button onClick={() => markAllMut.mutate()} className="text-xs text-primary-600 hover:text-primary-700 font-semibold">Mark all read</button>}
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-ink-100 scrollbar-thin">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-10 text-center">
                      <BellIcon className="h-7 w-7 text-ink-200 mx-auto mb-2" />
                      <p className="text-sm text-ink-400">No notifications</p>
                    </div>
                  ) : notifications.map((n) => (
                    <div key={n.id} onClick={() => !n.isRead && markReadMut.mutate(n.id)}
                      className={`flex gap-3 px-4 py-3 cursor-pointer hover:bg-ink-50 transition-colors ${!n.isRead ? 'bg-primary-50/40' : ''}`}>
                      {!n.isRead && <span className="mt-1.5 h-2 w-2 rounded-full bg-primary-500 shrink-0 animate-pulse-soft" />}
                      {n.isRead && <span className="mt-1.5 h-2 w-2 shrink-0" />}
                      <div className="min-w-0">
                        <p className={`text-sm leading-snug ${!n.isRead ? 'font-semibold text-ink-900' : 'text-ink-700'}`}>{n.title}</p>
                        <p className="text-xs text-ink-500 mt-0.5 line-clamp-2">{n.message}</p>
                        <p className="text-2xs text-ink-400 mt-1 num-tabular">{format(new Date(n.createdAt), 'dd MMM · h:mm a')}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2.5 border-t border-ink-100 bg-ink-50/40">
                  <Link to="/notifications" onClick={() => setNotifOpen(false)} className="block text-center text-xs text-primary-600 hover:text-primary-700 font-semibold">
                    View all notifications
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="hidden lg:block lg:h-5 lg:w-px lg:bg-ink-200" />

          {/* Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button onClick={() => setProfileOpen(!profileOpen)} className="flex items-center gap-x-2.5 rounded-md px-1.5 py-1 hover:bg-ink-100 transition-colors">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-primary-500 to-primary-700 text-white font-semibold text-xs shadow-sm">
                {user?.employee?.firstName?.[0] || user?.email?.[0]?.toUpperCase()}
              </div>
              <div className="hidden lg:flex lg:flex-col text-left">
                <span className="text-xs font-semibold text-ink-900 leading-tight">
                  {user?.employee ? `${user.employee.firstName} ${user.employee.lastName || ''}` : user?.email}
                </span>
                <span className="text-2xs text-ink-400 font-medium">{user?.employee?.employeeCode || user?.role}</span>
              </div>
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-11 w-56 rounded-lg bg-white shadow-dropdown ring-1 ring-ink-200 z-50 py-1.5 animate-scale-in">
                <div className="px-4 py-2 border-b border-ink-100 mb-1">
                  <p className="text-xs font-medium text-ink-500 truncate">{user?.email}</p>
                </div>
                <Link to="/profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-ink-700 hover:bg-ink-50">
                  <UserCircleIcon className="h-4 w-4 text-ink-400" /> My Profile
                </Link>
                <div className="border-t border-ink-100 my-1" />
                <button onClick={handleLogout} className="flex w-full items-center gap-2.5 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50">
                  <ArrowRightOnRectangleIcon className="h-4 w-4" /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
