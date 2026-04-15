import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { platformApi } from '../../api/index.js'
import { useAuth } from '../../contexts/AuthContext.jsx'
import {
  BuildingOfficeIcon, UsersIcon, UserGroupIcon, ArrowRightIcon,
  MagnifyingGlassIcon, CheckCircleIcon, XCircleIcon, ChartBarIcon,
  PlusCircleIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

const StatCard = ({ icon: Icon, label, value, color = 'primary' }) => (
  <div className="rounded-xl bg-white shadow-sm border border-gray-100 p-5 flex items-center gap-4">
    <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-${color}-50`}>
      <Icon className={`h-6 w-6 text-${color}-600`} />
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  </div>
)

export default function PlatformDashboardPage() {
  const { enterOrg } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data: statsData } = useQuery({
    queryKey: ['platform-stats'],
    queryFn: platformApi.stats,
  })

  const { data: orgsData, isLoading } = useQuery({
    queryKey: ['platform-orgs', page, search],
    queryFn: () => platformApi.listOrgs({ page, limit: 15, search }),
  })

  const toggleMut = useMutation({
    mutationFn: platformApi.toggleOrg,
    onSuccess: () => { qc.invalidateQueries(['platform-orgs']); qc.invalidateQueries(['platform-stats']) },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  })

  const stats = statsData?.data?.data
  const orgs = orgsData?.data?.data || []
  const pagination = orgsData?.data?.pagination

  const handleEnter = (org) => {
    enterOrg({ id: org.id, name: org.name })
    navigate('/')
    toast.success(`Viewing: ${org.name}`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Platform Dashboard</h1>
        <p className="text-sm text-gray-500">Manage all organisations across the platform</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={BuildingOfficeIcon} label="Total Companies" value={stats?.totalOrgs} color="primary" />
        <StatCard icon={UsersIcon} label="Active Employees" value={stats?.totalEmployees} color="green" />
        <StatCard icon={UserGroupIcon} label="Total Users" value={stats?.totalUsers} color="purple" />
        <StatCard icon={ChartBarIcon} label="New This Month" value={stats?.newOrgsThisMonth} color="amber" />
      </div>

      {/* Org table */}
      <div className="rounded-xl bg-white shadow-sm border border-gray-100">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">All Organisations</h2>
          <div className="relative w-64">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search by name or email…"
              className="block w-full rounded-md border-0 py-1.5 pl-9 pr-3 text-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                {['Company', 'Industry', 'Super Admin', 'Employees', 'Status', 'Registered', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {isLoading ? (
                <tr><td colSpan={7} className="py-8 text-center text-sm text-gray-400">Loading…</td></tr>
              ) : orgs.length === 0 ? (
                <tr><td colSpan={7} className="py-8 text-center text-sm text-gray-400">No organisations found</td></tr>
              ) : orgs.map(org => (
                <tr key={org.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-100 text-primary-700 font-bold text-sm">
                        {org.name[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{org.name}</p>
                        <p className="text-xs text-gray-400">{org.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{org.industry || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{org.superAdminEmail || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                      <UsersIcon className="h-3 w-3" />
                      {org.activeEmployees} / {org.totalEmployees}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {org.isActive
                      ? <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600"><CheckCircleIcon className="h-4 w-4" /> Active</span>
                      : <span className="inline-flex items-center gap-1 text-xs font-medium text-red-500"><XCircleIcon className="h-4 w-4" /> Suspended</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {new Date(org.createdAt).toLocaleDateString('en-IN')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEnter(org)}
                        className="inline-flex items-center gap-1 rounded-md bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-500 transition-colors"
                      >
                        Enter <ArrowRightIcon className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => toggleMut.mutate(org.id)}
                        className={`rounded-md px-3 py-1.5 text-xs font-semibold ring-1 transition-colors ${org.isActive ? 'ring-red-300 text-red-600 hover:bg-red-50' : 'ring-green-300 text-green-600 hover:bg-green-50'}`}
                      >
                        {org.isActive ? 'Suspend' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">{pagination.total} organisations</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="rounded px-3 py-1 text-sm ring-1 ring-gray-300 disabled:opacity-40 hover:bg-gray-50">Prev</button>
              <span className="px-2 py-1 text-sm text-gray-600">{page} / {pagination.totalPages}</span>
              <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page === pagination.totalPages} className="rounded px-3 py-1 text-sm ring-1 ring-gray-300 disabled:opacity-40 hover:bg-gray-50">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
