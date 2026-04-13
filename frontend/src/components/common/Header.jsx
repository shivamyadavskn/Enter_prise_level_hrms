import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Bars3Icon, BellIcon } from '@heroicons/react/24/outline'
import { useQuery } from '@tanstack/react-query'
import { notificationsApi } from '../../api/index.js'
import { useAuth } from '../../contexts/AuthContext.jsx'

export default function Header({ onMenuClick }) {
  const { user } = useAuth()

  const { data } = useQuery({
    queryKey: ['notif-count'],
    queryFn: () => notificationsApi.getUnreadCount(),
    refetchInterval: 30_000,
  })

  const unread = data?.data?.data?.count || 0

  return (
    <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <button type="button" className="-m-2.5 p-2.5 text-gray-700 lg:hidden" onClick={onMenuClick}>
        <Bars3Icon className="h-6 w-6" />
      </button>

      <div className="h-6 w-px bg-gray-900/10 lg:hidden" />

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex flex-1 items-center">
          <p className="text-sm text-gray-500">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <Link to="/notifications" className="relative -m-2.5 p-2.5 text-gray-400 hover:text-gray-500">
            <BellIcon className="h-6 w-6" />
            {unread > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </Link>

          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-900/10" />

          <div className="flex items-center gap-x-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-white font-semibold text-sm">
              {user?.employee?.firstName?.[0] || user?.email?.[0]?.toUpperCase()}
            </div>
            <div className="hidden lg:flex lg:flex-col">
              <span className="text-sm font-semibold text-gray-900">
                {user?.employee ? `${user.employee.firstName} ${user.employee.lastName || ''}` : user?.email}
              </span>
              <span className="text-xs text-gray-500">{user?.employee?.employeeCode}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
