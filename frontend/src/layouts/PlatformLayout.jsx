import { Outlet, NavLink } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import {
  BuildingOfficeIcon, ShieldCheckIcon, ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline'

export default function PlatformLayout() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">
      {/* Sidebar */}
      <div className="w-56 shrink-0 flex flex-col border-r border-gray-800">
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-800">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600">
            <ShieldCheckIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Platform Admin</p>
            <p className="text-xs text-gray-400">God Mode 🔥</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          <NavLink to="/platform"
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`
            }>
            <BuildingOfficeIcon className="h-5 w-5" />
            Organisations
          </NavLink>
        </nav>

        {/* User info */}
        <div className="border-t border-gray-800 p-4">
          <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          <button onClick={logout} className="mt-2 flex items-center gap-2 text-xs text-gray-400 hover:text-red-400 transition-colors">
            <ArrowRightOnRectangleIcon className="h-4 w-4" /> Logout
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 overflow-auto bg-gray-50 text-gray-900">
        <div className="mx-auto max-w-7xl p-6">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
