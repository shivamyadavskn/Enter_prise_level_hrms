import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { permissionsApi, usersApi } from '../../api/index.js'
import { useAuth } from '../../contexts/AuthContext.jsx'
import toast from 'react-hot-toast'
import {
  ShieldCheckIcon, UserGroupIcon, ChevronDownIcon, ChevronUpIcon,
  CheckIcon, XMarkIcon, ArrowPathIcon
} from '@heroicons/react/24/outline'

const ALL_ROLES = ['SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER', 'FINANCE', 'EMPLOYEE']

const ROLE_COLORS = {
  SUPER_ADMIN: 'bg-purple-100 text-purple-800 border-purple-200',
  ADMIN: 'bg-blue-100 text-blue-800 border-blue-200',
  HR: 'bg-pink-100 text-pink-800 border-pink-200',
  MANAGER: 'bg-green-100 text-green-800 border-green-200',
  FINANCE: 'bg-amber-100 text-amber-800 border-amber-200',
  EMPLOYEE: 'bg-gray-100 text-gray-800 border-gray-200',
}

export default function RolesPermissionsPage() {
  const [activeTab, setActiveTab] = useState('matrix')
  const [selectedRole, setSelectedRole] = useState(null)
  const [editingUser, setEditingUser] = useState(null)
  const [newRole, setNewRole] = useState('')
  const qc = useQueryClient()
  const { user: currentUser } = useAuth()

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data: matrixRes, isLoading: matrixLoading } = useQuery({
    queryKey: ['role-matrix'],
    queryFn: permissionsApi.getRoleMatrix,
  })

  const { data: usersRes, isLoading: usersLoading } = useQuery({
    queryKey: ['users-list-roles'],
    queryFn: () => usersApi.getAll({ limit: 200 }),
  })

  const matrix = matrixRes?.data?.data?.matrix || {}
  const users = usersRes?.data?.data || []

  // ── Mutations ────────────────────────────────────────────────────────────
  const updateRoleMut = useMutation({
    mutationFn: ({ userId, data }) => usersApi.update(userId, data),
    onSuccess: () => {
      qc.invalidateQueries(['users-list-roles'])
      toast.success('Role updated successfully')
      setEditingUser(null)
      setNewRole('')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update role'),
  })

  const seedMut = useMutation({
    mutationFn: permissionsApi.seedDefaults,
    onSuccess: () => {
      qc.invalidateQueries(['role-matrix'])
      toast.success('Default permissions seeded')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to seed permissions'),
  })

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleRoleChange = (userId) => {
    if (!newRole) return
    updateRoleMut.mutate({ userId, data: { role: newRole } })
  }

  const tabs = [
    { id: 'matrix', label: 'Role Access Matrix', icon: ShieldCheckIcon },
    { id: 'users', label: 'User Role Assignment', icon: UserGroupIcon },
  ]

  if (matrixLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Roles & Permissions</h1>
          <p className="text-sm text-gray-500 mt-1">Manage role access levels and assign roles to users</p>
        </div>
        {currentUser?.role === 'SUPER_ADMIN' && (
          <button
            onClick={() => seedMut.mutate()}
            disabled={seedMut.isPending}
            className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-500 disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-4 w-4 ${seedMut.isPending ? 'animate-spin' : ''}`} />
            Seed Default Permissions
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              <tab.icon className="h-5 w-5" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'matrix' && (
        <RoleMatrixTab matrix={matrix} selectedRole={selectedRole} setSelectedRole={setSelectedRole} />
      )}

      {activeTab === 'users' && (
        <UserRoleTab
          users={users}
          usersLoading={usersLoading}
          editingUser={editingUser}
          setEditingUser={setEditingUser}
          newRole={newRole}
          setNewRole={setNewRole}
          handleRoleChange={handleRoleChange}
          updateRoleMut={updateRoleMut}
          currentUser={currentUser}
        />
      )}
    </div>
  )
}

// ── Role Matrix Tab ────────────────────────────────────────────────────────
function RoleMatrixTab({ matrix, selectedRole, setSelectedRole }) {
  return (
    <div className="space-y-4">
      {/* Role Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ALL_ROLES.map((role) => {
          const info = matrix[role]
          if (!info) return null
          const isExpanded = selectedRole === role
          return (
            <div
              key={role}
              className={`rounded-xl border transition-all duration-200 ${
                isExpanded ? 'ring-2 ring-primary-500 shadow-lg' : 'hover:shadow-md'
              } bg-white`}
            >
              {/* Role Header */}
              <button
                onClick={() => setSelectedRole(isExpanded ? null : role)}
                className="flex w-full items-center justify-between p-4"
              >
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${ROLE_COLORS[role]}`}>
                    {role.replace('_', ' ')}
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronUpIcon className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                )}
              </button>

              {/* Description */}
              <div className="px-4 pb-2">
                <p className="text-sm text-gray-600">{info.description}</p>
                <p className="text-xs text-gray-400 mt-1">Scope: {info.scope}</p>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="border-t px-4 py-3 space-y-3">
                  {/* Capabilities */}
                  <div>
                    <p className="text-xs font-semibold text-green-700 uppercase mb-1.5">
                      ✅ Capabilities ({info.capabilities?.length || 0})
                    </p>
                    <ul className="space-y-1">
                      {info.capabilities?.map((cap, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
                          <CheckIcon className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" />
                          {cap}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Restrictions */}
                  {info.restrictions?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-red-700 uppercase mb-1.5">
                        🚫 Restrictions ({info.restrictions.length})
                      </p>
                      <ul className="space-y-1">
                        {info.restrictions.map((r, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-gray-500">
                            <XMarkIcon className="h-3.5 w-3.5 text-red-400 mt-0.5 shrink-0" />
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Comparison Table */}
      <div className="rounded-xl bg-white shadow overflow-hidden mt-6">
        <div className="px-6 py-4 border-b">
          <h3 className="text-base font-semibold text-gray-900">Quick Comparison</h3>
          <p className="text-xs text-gray-500 mt-0.5">Overview of access levels across modules</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-xs">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 uppercase tracking-wider">Module</th>
                {ALL_ROLES.map((r) => (
                  <th key={r} className="px-3 py-3 text-center font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                    {r.replace('_', ' ')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                { module: 'Employee Management', access: { SUPER_ADMIN: 'Full', ADMIN: 'Full', HR: 'Full', MANAGER: 'Team', FINANCE: 'View', EMPLOYEE: 'Self' } },
                { module: 'Leave Management', access: { SUPER_ADMIN: 'Full', ADMIN: 'Full', HR: 'Full', MANAGER: 'Approve', FINANCE: 'Self', EMPLOYEE: 'Self' } },
                { module: 'Payroll', access: { SUPER_ADMIN: 'Full', ADMIN: 'Full', HR: 'Full', MANAGER: '—', FINANCE: 'Full', EMPLOYEE: 'View' } },
                { module: 'Attendance', access: { SUPER_ADMIN: 'Full', ADMIN: 'Full', HR: 'Full', MANAGER: 'Team', FINANCE: 'Self', EMPLOYEE: 'Self' } },
                { module: 'Performance', access: { SUPER_ADMIN: 'Full', ADMIN: 'Full', HR: 'Full', MANAGER: 'Team', FINANCE: 'View', EMPLOYEE: 'Self' } },
                { module: 'Reports', access: { SUPER_ADMIN: 'Full', ADMIN: 'Full', HR: 'Full', MANAGER: 'Team', FINANCE: 'Full', EMPLOYEE: '—' } },
                { module: 'Departments', access: { SUPER_ADMIN: 'Full', ADMIN: 'Full', HR: 'Full', MANAGER: '—', FINANCE: '—', EMPLOYEE: '—' } },
                { module: 'Settings', access: { SUPER_ADMIN: 'Full', ADMIN: 'Full', HR: '—', MANAGER: '—', FINANCE: '—', EMPLOYEE: '—' } },
                { module: 'Permissions', access: { SUPER_ADMIN: 'Full', ADMIN: 'View', HR: '—', MANAGER: '—', FINANCE: '—', EMPLOYEE: '—' } },
                { module: 'Reimbursements', access: { SUPER_ADMIN: 'Full', ADMIN: 'Full', HR: 'Full', MANAGER: 'Approve', FINANCE: 'Approve', EMPLOYEE: 'Self' } },
                { module: 'Announcements', access: { SUPER_ADMIN: 'Full', ADMIN: 'Full', HR: 'Create', MANAGER: 'Create', FINANCE: 'View', EMPLOYEE: 'View' } },
              ].map((row) => (
                <tr key={row.module} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-medium text-gray-900 whitespace-nowrap">{row.module}</td>
                  {ALL_ROLES.map((r) => {
                    const val = row.access[r]
                    const color =
                      val === 'Full' ? 'text-green-700 bg-green-50' :
                      val === 'Team' || val === 'Approve' || val === 'Create' ? 'text-blue-700 bg-blue-50' :
                      val === 'View' || val === 'Self' ? 'text-amber-700 bg-amber-50' :
                      'text-gray-400 bg-gray-50'
                    return (
                      <td key={r} className="px-3 py-2.5 text-center">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>
                          {val}
                        </span>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ── User Role Assignment Tab ───────────────────────────────────────────────
function UserRoleTab({ users, usersLoading, editingUser, setEditingUser, newRole, setNewRole, handleRoleChange, updateRoleMut, currentUser }) {
  const [filter, setFilter] = useState('')
  const [roleFilter, setRoleFilter] = useState('')

  const filtered = users.filter((u) => {
    if (roleFilter && u.role !== roleFilter) return false
    if (filter) {
      const q = filter.toLowerCase()
      return u.email.toLowerCase().includes(q) ||
        u.employee?.firstName?.toLowerCase().includes(q) ||
        u.employee?.lastName?.toLowerCase().includes(q)
    }
    return true
  })

  if (usersLoading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="flex-1 rounded-lg border-0 py-2 px-4 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 text-sm"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-lg border-0 py-2 pl-3 pr-8 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 text-sm"
        >
          <option value="">All Roles</option>
          {ALL_ROLES.map((r) => (
            <option key={r} value={r}>{r.replace('_', ' ')}</option>
          ))}
        </select>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {ALL_ROLES.map((role) => {
          const count = users.filter((u) => u.role === role).length
          return (
            <button
              key={role}
              onClick={() => setRoleFilter(roleFilter === role ? '' : role)}
              className={`rounded-lg border p-3 text-center transition-all ${
                roleFilter === role ? 'ring-2 ring-primary-500' : 'hover:shadow-sm'
              } bg-white`}
            >
              <p className="text-lg font-bold text-gray-900">{count}</p>
              <p className="text-xs text-gray-500">{role.replace('_', ' ')}</p>
            </button>
          )
        })}
      </div>

      {/* Users Table */}
      <div className="rounded-xl bg-white shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase">User</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Current Role</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((u) => {
              const isEditing = editingUser === u.id
              const name = u.employee ? `${u.employee.firstName} ${u.employee.lastName || ''}`.trim() : u.username || '—'
              const isSelf = u.id === currentUser?.id
              return (
                <tr key={u.id} className={`hover:bg-gray-50 ${isSelf ? 'bg-primary-50/30' : ''}`}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-700 text-sm font-semibold">
                        {name[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{name}</p>
                        {u.employee?.employeeCode && (
                          <p className="text-xs text-gray-400">{u.employee.employeeCode}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-600">{u.email}</td>
                  <td className="px-5 py-3">
                    {isEditing ? (
                      <select
                        value={newRole || u.role}
                        onChange={(e) => setNewRole(e.target.value)}
                        className="rounded-md border-0 py-1 pl-2 pr-6 ring-1 ring-gray-300 focus:ring-2 focus:ring-primary-600 text-sm"
                      >
                        {ALL_ROLES.map((r) => (
                          <option key={r} value={r}>{r.replace('_', ' ')}</option>
                        ))}
                      </select>
                    ) : (
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${ROLE_COLORS[u.role]}`}>
                        {u.role.replace('_', ' ')}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {isSelf ? (
                      <span className="text-xs text-gray-400 italic">You</span>
                    ) : isEditing ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleRoleChange(u.id)}
                          disabled={updateRoleMut.isPending || !newRole || newRole === u.role}
                          className="rounded-md bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-500 disabled:opacity-50"
                        >
                          {updateRoleMut.isPending ? '...' : 'Save'}
                        </button>
                        <button
                          onClick={() => { setEditingUser(null); setNewRole('') }}
                          className="rounded-md px-3 py-1 text-xs font-semibold text-gray-600 ring-1 ring-gray-300 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setEditingUser(u.id); setNewRole(u.role) }}
                        className="rounded-md px-3 py-1 text-xs font-semibold text-primary-600 ring-1 ring-primary-300 hover:bg-primary-50"
                      >
                        Change Role
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-sm text-gray-500">No users found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
