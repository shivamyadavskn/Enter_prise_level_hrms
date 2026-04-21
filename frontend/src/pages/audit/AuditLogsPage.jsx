import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { auditApi } from '../../api/index.js'
import Badge from '../../components/common/Badge.jsx'
import Pagination from '../../components/common/Pagination.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import { PageLoader } from '../../components/common/LoadingSpinner.jsx'
import { 
  ShieldCheckIcon, FunnelIcon, CalendarIcon, UserIcon,
  ClockIcon, DocumentTextIcon, ChevronDownIcon, ChevronUpIcon
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'

const ACTION_COLORS = {
  CREATE: 'green',
  UPDATE: 'blue',
  DELETE: 'red',
  LOGIN: 'purple',
  LOGOUT: 'gray',
  APPROVE: 'green',
  REJECT: 'red',
  SUBMIT: 'blue',
  ASSIGN: 'yellow',
  PROCESS: 'purple',
}

function AuditLogRow({ log }) {
  const [expanded, setExpanded] = useState(false)
  const actionColor = ACTION_COLORS[log.action] || 'gray'

  return (
    <div className="border-b border-gray-200 last:border-0">
      <div 
        className="p-4 hover:bg-gray-50 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <Badge color={actionColor}>{log.action}</Badge>
              <span className="text-sm font-medium text-gray-900">{log.module}</span>
              {log.entityType && (
                <span className="text-sm text-gray-500">
                  {log.entityType} #{log.entityId}
                </span>
              )}
            </div>
            
            <p className="text-sm text-gray-700 mb-2">{log.description}</p>
            
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <UserIcon className="h-3 w-3" />
                <span>{log.user?.email || 'System'}</span>
              </div>
              <div className="flex items-center gap-1">
                <ClockIcon className="h-3 w-3" />
                <span>{format(new Date(log.createdAt), 'MMM dd, yyyy HH:mm:ss')}</span>
              </div>
              {log.ipAddress && (
                <span>IP: {log.ipAddress}</span>
              )}
            </div>
          </div>

          <button className="ml-4 p-1 text-gray-400 hover:text-gray-600">
            {expanded ? (
              <ChevronUpIcon className="h-5 w-5" />
            ) : (
              <ChevronDownIcon className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {expanded && (log.oldValues || log.newValues) && (
        <div className="px-4 pb-4 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {log.oldValues && (
              <div>
                <h4 className="text-xs font-semibold text-gray-700 mb-2 uppercase">Old Values</h4>
                <pre className="text-xs bg-white rounded border border-gray-200 p-3 overflow-auto max-h-60">
                  {JSON.stringify(log.oldValues, null, 2)}
                </pre>
              </div>
            )}
            {log.newValues && (
              <div>
                <h4 className="text-xs font-semibold text-gray-700 mb-2 uppercase">New Values</h4>
                <pre className="text-xs bg-white rounded border border-gray-200 p-3 overflow-auto max-h-60">
                  {JSON.stringify(log.newValues, null, 2)}
                </pre>
              </div>
            )}
          </div>
          {log.userAgent && (
            <div className="mt-3">
              <h4 className="text-xs font-semibold text-gray-700 mb-1 uppercase">User Agent</h4>
              <p className="text-xs text-gray-600 bg-white rounded border border-gray-200 p-2">
                {log.userAgent}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function AuditLogsPage() {
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({
    module: '',
    action: '',
    userId: '',
    startDate: '',
    endDate: '',
  })
  const limit = 20

  const { data: modulesData } = useQuery({
    queryKey: ['audit-modules'],
    queryFn: auditApi.getModules,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', page, filters],
    queryFn: () => {
      const params = { page, limit }
      if (filters.module) params.module = filters.module
      if (filters.action) params.action = filters.action
      if (filters.userId) params.userId = filters.userId
      if (filters.startDate) params.startDate = filters.startDate
      if (filters.endDate) params.endDate = filters.endDate
      return auditApi.getAll(params)
    },
  })

  const handleFilterChange = (field) => (e) => {
    setFilters({ ...filters, [field]: e.target.value })
    setPage(1)
  }

  const handleClearFilters = () => {
    setFilters({
      module: '',
      action: '',
      userId: '',
      startDate: '',
      endDate: '',
    })
    setPage(1)
  }

  if (isLoading) return <PageLoader />

  const logs = data?.data?.data || []
  const pagination = data?.data?.pagination || {}
  const modules = modulesData?.data || []
  const actions = [...new Set(logs.map(log => log.action))].sort()

  const hasActiveFilters = Object.values(filters).some(v => v !== '')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track all system activities and changes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheckIcon className="h-6 w-6 text-gray-400" />
          <span className="text-sm text-gray-600">
            {pagination.total || 0} total logs
          </span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-700">Filters</h3>
          </div>
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Clear All
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Module</label>
            <select
              value={filters.module}
              onChange={handleFilterChange('module')}
              className="block w-full rounded-md border-0 py-1.5 pl-3 pr-8 text-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600"
            >
              <option value="">All Modules</option>
              {modules.map((module) => (
                <option key={module} value={module}>{module}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Action</label>
            <select
              value={filters.action}
              onChange={handleFilterChange('action')}
              className="block w-full rounded-md border-0 py-1.5 pl-3 pr-8 text-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600"
            >
              <option value="">All Actions</option>
              {actions.map((action) => (
                <option key={action} value={action}>{action}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">User ID</label>
            <input
              type="number"
              value={filters.userId}
              onChange={handleFilterChange('userId')}
              placeholder="Filter by user ID"
              className="block w-full rounded-md border-0 py-1.5 px-3 text-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={handleFilterChange('startDate')}
              className="block w-full rounded-md border-0 py-1.5 px-3 text-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={handleFilterChange('endDate')}
              min={filters.startDate}
              className="block w-full rounded-md border-0 py-1.5 px-3 text-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600"
            />
          </div>
        </div>
      </div>

      {logs.length === 0 ? (
        <EmptyState
          icon={DocumentTextIcon}
          title="No audit logs found"
          description={hasActiveFilters ? "Try adjusting your filters" : "No system activities recorded yet"}
        />
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="divide-y divide-gray-200">
              {logs.map((log) => (
                <AuditLogRow key={log.id} log={log} />
              ))}
            </div>
          </div>

          {pagination.totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={pagination.totalPages}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <ShieldCheckIcon className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-blue-900 mb-1">About Audit Logs</h3>
            <p className="text-sm text-blue-800">
              Audit logs track all critical system activities including user actions, data changes, and system events. 
              Click on any log entry to view detailed information including old and new values for updates.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
