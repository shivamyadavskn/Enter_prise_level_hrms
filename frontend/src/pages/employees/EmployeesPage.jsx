import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { employeesApi, departmentsApi } from '../../api/index.js'
import Badge from '../../components/common/Badge.jsx'
import Pagination from '../../components/common/Pagination.jsx'
import { PageLoader } from '../../components/common/LoadingSpinner.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import { MagnifyingGlassIcon, PlusIcon, FunnelIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../../contexts/AuthContext.jsx'

export default function EmployeesPage() {
  const { isAdmin } = useAuth()
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['employees', page, search, deptFilter, statusFilter],
    queryFn: () => employeesApi.getAll({ page, limit: 10, search, departmentId: deptFilter || undefined, employmentStatus: statusFilter || undefined }),
  })

  const { data: depts } = useQuery({
    queryKey: ['departments-list'],
    queryFn: () => departmentsApi.getAll({ limit: 100 }),
  })

  const employees = data?.data?.data || []
  const pagination = data?.data?.pagination
  const departments = depts?.data?.data || []

  if (isLoading && page === 1 && !search) return <PageLoader />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
          <p className="text-sm text-gray-500">Manage your workforce</p>
        </div>
        {isAdmin() && (
          <Link to="/employees/new" className="inline-flex items-center gap-x-2 rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500">
            <PlusIcon className="h-4 w-4" /> Add Employee
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text" placeholder="Search by name, code, email…"
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="block w-full rounded-md border-0 py-1.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-primary-600 sm:text-sm"
          />
        </div>
        <select value={deptFilter} onChange={(e) => { setDeptFilter(e.target.value); setPage(1) }}
          className="rounded-md border-0 py-1.5 pl-3 pr-8 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm">
          <option value="">All Departments</option>
          {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="rounded-md border-0 py-1.5 pl-3 pr-8 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm">
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="PROBATION">Probation</option>
          <option value="RESIGNED">Resigned</option>
          <option value="TERMINATED">Terminated</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg bg-white shadow">
        {isLoading ? <PageLoader /> : employees.length === 0 ? (
          <EmptyState title="No employees found" description="Try adjusting your search or filters." />
        ) : (
          <>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Employee', 'Department', 'Designation', 'Joining Date', 'Status', ''].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-semibold text-sm">
                          {emp.firstName?.[0]}{emp.lastName?.[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{emp.firstName} {emp.lastName}</p>
                          <p className="text-xs text-gray-500">{emp.employeeCode} · {emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{emp.department?.name || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{emp.designation?.name || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {emp.dateOfJoining ? new Date(emp.dateOfJoining).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td className="px-6 py-4"><Badge status={emp.employmentStatus} label={emp.employmentStatus} /></td>
                    <td className="px-6 py-4 text-right">
                      <Link to={`/employees/${emp.id}`} className="text-sm font-medium text-primary-600 hover:text-primary-500">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pagination && (
              <Pagination page={pagination.page} totalPages={pagination.totalPages} total={pagination.total} limit={10} onPageChange={setPage} />
            )}
          </>
        )}
      </div>
    </div>
  )
}
