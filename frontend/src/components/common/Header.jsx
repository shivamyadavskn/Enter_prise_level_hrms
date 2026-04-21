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
    <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200/60 bg-white/80 backdrop-blur-xl px-4 sm:gap-x-6 sm:px-6 lg:px-8">
      <button type="button" className="-m-2.5 p-2.5 text-gray-500 hover:text-gray-700 lg:hidden" onClick={onMenuClick}>
        <Bars3Icon className="h-6 w-6" />
      </button>
      <div className="h-6 w-px bg-gray-200 lg:hidden" />

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex flex-1 items-center">
          <p className="text-sm text-gray-500 hidden sm:block font-medium">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="flex items-center gap-x-2 lg:gap-x-3">
          {/* Notification Bell */}
          <div className="relative" ref={notifRef}>
            <button onClick={() => setNotifOpen(!notifOpen)} className="relative flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
              <BellIcon className="h-5 w-5" />
              {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-12 w-80 rounded-xl bg-white shadow-dropdown ring-1 ring-gray-200/50 z-50 animate-scale-in overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50/80 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900">Notifications {unread > 0 && <span className="ml-1.5 text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold">{unread} new</span>}</p>
                  {unread > 0 && <button onClick={() => markAllMut.mutate()} className="text-xs text-primary-600 hover:text-primary-700 font-medium">Mark all read</button>}
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-gray-50 scrollbar-thin">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <BellIcon className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">No notifications</p>
                    </div>
                  ) : notifications.map((n) => (
                    <div key={n.id} onClick={() => !n.isRead && markReadMut.mutate(n.id)}
                      className={`flex gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${!n.isRead ? 'bg-primary-50/30' : ''}`}>
                      {!n.isRead && <span className="mt-1.5 h-2 w-2 rounded-full bg-primary-500 shrink-0 animate-pulse-soft" />}
                      {n.isRead && <span className="mt-1.5 h-2 w-2 shrink-0" />}
                      <div className="min-w-0">
                        <p className={`text-sm leading-snug ${!n.isRead ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>{n.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                        <p className="text-[11px] text-gray-400 mt-1">{format(new Date(n.createdAt), 'dd MMM, h:mm a')}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50/50">
                  <Link to="/notifications" onClick={() => setNotifOpen(false)} className="block text-center text-xs text-primary-600 hover:text-primary-700 font-semibold py-0.5">
                    View all notifications
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" />

          {/* Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button onClick={() => setProfileOpen(!profileOpen)} className="flex items-center gap-x-3 rounded-lg px-2 py-1.5 hover:bg-gray-50 transition-colors">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 text-white font-semibold text-sm shadow-sm">
                {user?.employee?.firstName?.[0] || user?.email?.[0]?.toUpperCase()}
              </div>
              <div className="hidden lg:flex lg:flex-col text-left">
                <span className="text-sm font-semibold text-gray-900 leading-tight">
                  {user?.employee ? `${user.employee.firstName} ${user.employee.lastName || ''}` : user?.email}
                </span>
                <span className="text-[11px] text-gray-400 font-medium">{user?.employee?.employeeCode || user?.role}</span>
              </div>
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-12 w-52 rounded-xl bg-white shadow-dropdown ring-1 ring-gray-200/50 z-50 py-1.5 animate-scale-in">
                <div className="px-4 py-2 border-b border-gray-100 mb-1">
                  <p className="text-xs font-medium text-gray-400 truncate">{user?.email}</p>
                </div>
                <Link to="/profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 font-medium">
                  <UserCircleIcon className="h-4 w-4 text-gray-400" /> My Profile
                </Link>
                <div className="border-t border-gray-100 my-1" />
                <button onClick={handleLogout} className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium">
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
