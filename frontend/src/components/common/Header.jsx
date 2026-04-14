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
    <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <button type="button" className="-m-2.5 p-2.5 text-gray-700 lg:hidden" onClick={onMenuClick}>
        <Bars3Icon className="h-6 w-6" />
      </button>
      <div className="h-6 w-px bg-gray-900/10 lg:hidden" />

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex flex-1 items-center">
          <p className="text-sm text-gray-500 hidden sm:block">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="flex items-center gap-x-3 lg:gap-x-4">
          {/* Notification Bell */}
          <div className="relative" ref={notifRef}>
            <button onClick={() => setNotifOpen(!notifOpen)} className="relative -m-2.5 p-2.5 text-gray-400 hover:text-gray-600">
              <BellIcon className="h-6 w-6" />
              {unread > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-10 w-80 rounded-xl bg-white shadow-xl ring-1 ring-gray-200 z-50">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900">Notifications {unread > 0 && <span className="ml-1 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">{unread} new</span>}</p>
                  {unread > 0 && <button onClick={() => markAllMut.mutate()} className="text-xs text-primary-600 hover:underline">Mark all read</button>}
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                  {notifications.length === 0 ? (
                    <p className="px-4 py-6 text-sm text-center text-gray-400">No notifications</p>
                  ) : notifications.map((n) => (
                    <div key={n.id} onClick={() => !n.isRead && markReadMut.mutate(n.id)}
                      className={`flex gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${!n.isRead ? 'bg-primary-50/40' : ''}`}>
                      {!n.isRead && <span className="mt-1.5 h-2 w-2 rounded-full bg-primary-500 shrink-0" />}
                      {n.isRead && <span className="mt-1.5 h-2 w-2 shrink-0" />}
                      <div className="min-w-0">
                        <p className={`text-sm ${!n.isRead ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>{n.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                        <p className="text-xs text-gray-400 mt-1">{format(new Date(n.createdAt), 'dd MMM, h:mm a')}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2 border-t border-gray-100">
                  <Link to="/notifications" onClick={() => setNotifOpen(false)} className="block text-center text-xs text-primary-600 hover:underline py-1">
                    View all notifications →
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-900/10" />

          {/* Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button onClick={() => setProfileOpen(!profileOpen)} className="flex items-center gap-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-white font-semibold text-sm">
                {user?.employee?.firstName?.[0] || user?.email?.[0]?.toUpperCase()}
              </div>
              <div className="hidden lg:flex lg:flex-col text-left">
                <span className="text-sm font-semibold text-gray-900">
                  {user?.employee ? `${user.employee.firstName} ${user.employee.lastName || ''}` : user?.email}
                </span>
                <span className="text-xs text-gray-500">{user?.employee?.employeeCode || user?.role}</span>
              </div>
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-10 w-48 rounded-xl bg-white shadow-xl ring-1 ring-gray-200 z-50 py-1">
                <Link to="/profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                  <UserCircleIcon className="h-4 w-4 text-gray-400" /> My Profile
                </Link>
                <div className="border-t border-gray-100 my-1" />
                <button onClick={handleLogout} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
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
