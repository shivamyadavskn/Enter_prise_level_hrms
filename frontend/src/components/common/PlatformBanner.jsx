import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { ShieldCheckIcon, ArrowLeftIcon, BuildingOfficeIcon } from '@heroicons/react/24/solid'

export default function PlatformBanner() {
  const { isPlatformAdmin, activeOrg, exitOrg } = useAuth()
  const navigate = useNavigate()

  if (!isPlatformAdmin() || !activeOrg) return null

  const handleExit = () => {
    exitOrg()
    navigate('/platform')
  }

  return (
    <div className="flex items-center justify-between bg-gray-900 px-4 py-2.5 text-white text-sm sticky top-0 z-50 shadow-lg">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 rounded-md bg-primary-600/20 border border-primary-500/30 px-2.5 py-1">
          <ShieldCheckIcon className="h-3.5 w-3.5 text-primary-400" />
          <span className="text-xs font-semibold text-primary-300 uppercase tracking-wide">Platform Admin</span>
        </div>
        <div className="flex items-center gap-2 text-gray-300">
          <BuildingOfficeIcon className="h-4 w-4 text-gray-400" />
          <span className="font-semibold text-white">{activeOrg.name}</span>
          <span className="text-gray-500 text-xs">— Org ID: {activeOrg.id}</span>
        </div>
      </div>
      <button
        onClick={handleExit}
        className="flex items-center gap-1.5 rounded-md bg-gray-700 hover:bg-red-600 px-3 py-1.5 text-xs font-semibold transition-colors border border-gray-600 hover:border-red-500"
      >
        <ArrowLeftIcon className="h-3 w-3" /> Back to All Companies
      </button>
    </div>
  )
}
