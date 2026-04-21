import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { permissionsApi, usersApi, customRolesApi, employeesApi } from '../../api/index.js'
import { useAuth } from '../../contexts/AuthContext.jsx'
import toast from 'react-hot-toast'
import {
  ShieldCheckIcon, UserGroupIcon, ChevronDownIcon, ChevronUpIcon,
  CheckIcon, XMarkIcon, ArrowPathIcon, PlusIcon, PencilIcon, TrashIcon,
  UserPlusIcon, Squares2X2Icon,
} from '@heroicons/react/24/outline'

const ALL_ROLES = ['SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER', 'FINANCE', 'EMPLOYEE', 'INTERN']

const ROLE_COLORS = {
  SUPER_ADMIN: 'bg-purple-100 text-purple-800 border-purple-200',
  ADMIN: 'bg-blue-100 text-blue-800 border-blue-200',
  HR: 'bg-pink-100 text-pink-800 border-pink-200',
  MANAGER: 'bg-green-100 text-green-800 border-green-200',
  FINANCE: 'bg-amber-100 text-amber-800 border-amber-200',
  EMPLOYEE: 'bg-gray-100 text-gray-800 border-gray-200',
  INTERN: 'bg-teal-100 text-teal-800 border-teal-200',
}

const BASE_ROLE_OPTIONS = [
  { value: 'EMPLOYEE', label: 'Employee',  desc: 'Low access baseline' },
  { value: 'INTERN',   label: 'Intern',    desc: 'Intern baseline' },
  { value: 'MANAGER',  label: 'Manager',   desc: 'Team management baseline' },
  { value: 'HR',       label: 'HR',        desc: 'Full HR ops baseline' },
  { value: 'FINANCE',  label: 'Finance',   desc: 'Payroll baseline' },
]

const ALL_MODULE_ACTIONS = {
  employees:      ['view', 'view_self', 'create', 'update', 'delete'],
  departments:    ['view', 'create', 'update', 'delete'],
  designations:   ['view', 'create', 'update', 'delete'],
  leaves:         ['view', 'apply', 'approve', 'reject', 'manage_types', 'allocate'],
  attendance:     ['view', 'clock', 'approve', 'regularize'],
  wfh:            ['view', 'apply', 'approve', 'reject'],
  payroll:        ['view', 'view_self', 'process', 'salary_setup', 'payment_status'],
  performance:    ['view', 'view_self', 'create', 'appraise', 'appraise_self'],
  documents:      ['view', 'upload', 'delete', 'generate'],
  reports:        ['view', 'export'],
  holidays:       ['view', 'create', 'update', 'delete'],
  reimbursements: ['view', 'create', 'approve', 'reject', 'policies'],
  onboarding:     ['view', 'manage_tasks', 'assign'],
  announcements:  ['view', 'create', 'update', 'delete', 'pin'],
  assets:         ['view', 'view_self', 'create', 'update', 'delete', 'assign'],
  travel_claims:  ['view', 'create', 'approve', 'reject'],
  pulse:          ['view', 'create', 'manage', 'respond'],
}

const BASE_ROLE_DEFAULTS = {
  EMPLOYEE: { employees: ['view_self'], departments: ['view'], designations: ['view'], leaves: ['view','apply'], attendance: ['view','clock','regularize'], wfh: ['view','apply'], payroll: ['view_self'], performance: ['view_self','appraise_self'], documents: ['view','upload'], holidays: ['view'], reimbursements: ['view','create'], onboarding: ['view'], announcements: ['view'], assets: ['view_self'], travel_claims: ['view','create'], pulse: ['view','respond'] },
  INTERN:   { employees: ['view_self'], departments: ['view'], designations: ['view'], leaves: ['view','apply'], attendance: ['view','clock','regularize'], wfh: ['view','apply'], payroll: ['view_self'], performance: ['view_self'], documents: ['view','upload'], holidays: ['view'], reimbursements: ['view','create'], onboarding: ['view'], announcements: ['view'], assets: ['view_self'], travel_claims: ['view','create'], pulse: ['view','respond'] },
  MANAGER:  { employees: ['view'], departments: ['view'], designations: ['view'], leaves: ['view','apply','approve','reject'], attendance: ['view','clock','approve'], wfh: ['view','apply','approve','reject'], payroll: ['view'], performance: ['view','create','appraise'], documents: ['view','upload'], holidays: ['view'], reimbursements: ['view','create','approve','reject'], onboarding: ['view','assign'], announcements: ['view','create'], assets: ['view'], travel_claims: ['view','create','approve','reject'], pulse: ['view','respond'] },
  HR:       { employees: ['view','create','update'], departments: ['view','create','update'], designations: ['view','create','update'], leaves: ['view','apply','approve','reject','manage_types','allocate'], attendance: ['view','clock','approve','regularize'], wfh: ['view','apply','approve','reject'], payroll: ['view'], performance: ['view','create','appraise'], documents: ['view','upload','delete','generate'], holidays: ['view','create','update'], reimbursements: ['view','create','approve','reject'], onboarding: ['view','manage_tasks','assign'], announcements: ['view','create','update','pin'], assets: ['view','create','update','assign'], travel_claims: ['view','create','approve','reject'], pulse: ['view','create','manage'] },
  FINANCE:  { employees: ['view'], departments: ['view'], designations: ['view'], leaves: ['view','apply'], attendance: ['view','clock'], wfh: ['view','apply'], payroll: ['view','process','salary_setup','payment_status'], performance: ['view'], documents: ['view','upload','generate'], holidays: ['view'], reimbursements: ['view','create','approve','reject','policies'], onboarding: ['view'], announcements: ['view'], assets: ['view'], travel_claims: ['view','create','approve','reject'], pulse: ['view','respond'] },
}

export default function RolesPermissionsPage() {
  const [activeTab, setActiveTab] = useState('matrix')
  const [selectedRole, setSelectedRole] = useState(null)
  const [editingUser, setEditingUser] = useState(null)
  const [newRole, setNewRole] = useState('')
  const [showCustomRoleModal, setShowCustomRoleModal] = useState(false)
  const [editingCustomRole, setEditingCustomRole] = useState(null)
  const [showAssignModal, setShowAssignModal] = useState(null)
  const qc = useQueryClient()
  const { user: currentUser } = useAuth()

  const { data: matrixRes, isLoading: matrixLoading } = useQuery({ queryKey: ['role-matrix'], queryFn: permissionsApi.getRoleMatrix })
  const { data: usersRes, isLoading: usersLoading } = useQuery({ queryKey: ['users-list-roles'], queryFn: () => usersApi.getAll({ limit: 200 }) })
  const { data: customRolesRes, isLoading: customRolesLoading } = useQuery({ queryKey: ['custom-roles'], queryFn: customRolesApi.getAll })

  const matrix = matrixRes?.data?.data?.matrix || {}
  const users = usersRes?.data?.data || []
  const customRoles = customRolesRes?.data?.data || []

  const updateRoleMut = useMutation({
    mutationFn: ({ userId, data }) => usersApi.update(userId, data),
    onSuccess: () => { qc.invalidateQueries(['users-list-roles']); toast.success('Role updated'); setEditingUser(null); setNewRole('') },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update role'),
  })

  const seedMut = useMutation({
    mutationFn: permissionsApi.seedDefaults,
    onSuccess: () => { qc.invalidateQueries(['role-matrix']); toast.success('Default permissions seeded') },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  })

  const deleteCustomRoleMut = useMutation({
    mutationFn: customRolesApi.delete,
    onSuccess: () => { qc.invalidateQueries(['custom-roles']); toast.success('Custom role deleted') },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete'),
  })

  const tabs = [
    { id: 'matrix', label: 'Role Access Matrix', icon: ShieldCheckIcon },
    { id: 'custom', label: 'Custom Roles', icon: Squares2X2Icon },
    { id: 'users',  label: 'User Role Assignment', icon: UserGroupIcon },
  ]

  if (matrixLoading) return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Roles &amp; Permissions</h1>
          <p className="text-sm text-gray-500 mt-1">Manage role access levels, create custom roles, and assign roles to users</p>
        </div>
        {currentUser?.role === 'SUPER_ADMIN' && (
          <button onClick={() => seedMut.mutate()} disabled={seedMut.isPending} className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-500 disabled:opacity-50">
            <ArrowPathIcon className={`h-4 w-4 ${seedMut.isPending ? 'animate-spin' : ''}`} />
            Seed Default Permissions
          </button>
        )}
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${activeTab === tab.id ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}`}>
              <tab.icon className="h-5 w-5" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'matrix' && <RoleMatrixTab matrix={matrix} selectedRole={selectedRole} setSelectedRole={setSelectedRole} />}

      {activeTab === 'custom' && (
        <CustomRolesTab
          customRoles={customRoles}
          loading={customRolesLoading}
          onNew={() => { setEditingCustomRole(null); setShowCustomRoleModal(true) }}
          onEdit={(r) => { setEditingCustomRole(r); setShowCustomRoleModal(true) }}
          onDelete={(r) => { if (window.confirm(`Delete "${r.name}"? This cannot be undone.`)) deleteCustomRoleMut.mutate(r.id) }}
          onAssign={(r) => setShowAssignModal(r)}
          canManage={['SUPER_ADMIN', 'ADMIN'].includes(currentUser?.role)}
        />
      )}

      {activeTab === 'users' && (
        <UserRoleTab
          users={users} usersLoading={usersLoading}
          editingUser={editingUser} setEditingUser={setEditingUser}
          newRole={newRole} setNewRole={setNewRole}
          handleRoleChange={(id) => { if (newRole) updateRoleMut.mutate({ userId: id, data: { role: newRole } }) }}
          updateRoleMut={updateRoleMut} currentUser={currentUser}
        />
      )}

      {showCustomRoleModal && (
        <CustomRoleModal
          existing={editingCustomRole}
          onClose={() => setShowCustomRoleModal(false)}
          onSaved={() => { setShowCustomRoleModal(false); qc.invalidateQueries(['custom-roles']) }}
        />
      )}

      {showAssignModal && (
        <AssignCustomRoleModal
          customRole={showAssignModal}
          onClose={() => setShowAssignModal(null)}
          onSaved={() => { setShowAssignModal(null); qc.invalidateQueries(['custom-roles']) }}
        />
      )}
    </div>
  )
}

// ── Custom Roles Tab ───────────────────────────────────────────────────────────
function CustomRolesTab({ customRoles, loading, onNew, onEdit, onDelete, onAssign, canManage }) {
  if (loading) return <div className="flex h-32 items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" /></div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Custom Roles</h2>
          <p className="text-xs text-gray-500 mt-0.5">Create org-specific roles with fine-grained permissions — no code changes required.</p>
        </div>
        {canManage && (
          <button onClick={onNew} className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-500">
            <PlusIcon className="h-4 w-4" />
            New Custom Role
          </button>
        )}
      </div>

      {customRoles.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
          <Squares2X2Icon className="mx-auto h-10 w-10 text-gray-300 mb-3" />
          <p className="text-sm font-medium text-gray-900 mb-1">No custom roles yet</p>
          <p className="text-xs text-gray-500 mb-4">Create roles like &quot;HR Intern&quot;, &quot;Finance Intern&quot;, or &quot;Junior Manager&quot; with exact permissions.</p>
          {canManage && <button onClick={onNew} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-500">Create First Custom Role</button>}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {customRoles.map((role) => (
            <div key={role.id} className={`rounded-xl bg-white border shadow-sm flex flex-col ${!role.isActive ? 'opacity-60' : ''}`}>
              <div className="p-4 flex-1">
                <div className="flex items-start gap-2 mb-1">
                  <h3 className="text-sm font-bold text-gray-900 flex-1">{role.name}</h3>
                  {!role.isActive && <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-600 shrink-0">Inactive</span>}
                </div>
                <p className="text-xs text-gray-500 line-clamp-2">{role.description || 'No description'}</p>
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${ROLE_COLORS[role.baseRole] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                    Base: {role.baseRole}
                  </span>
                  <span className="text-xs text-gray-500">{role._count?.employees || 0} assigned</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-1">
                  {Object.keys(role.permissions || {}).slice(0, 5).map((mod) => (
                    <span key={mod} className="rounded-full bg-primary-50 px-2 py-0.5 text-xs text-primary-700">{mod.replace(/_/g,' ')}</span>
                  ))}
                  {Object.keys(role.permissions || {}).length > 5 && (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">+{Object.keys(role.permissions).length - 5} more</span>
                  )}
                </div>
              </div>
              <div className="border-t p-3 flex items-center justify-end gap-2">
                <button onClick={() => onAssign(role)} className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-primary-700 ring-1 ring-primary-200 hover:bg-primary-50">
                  <UserPlusIcon className="h-3.5 w-3.5" />Assign
                </button>
                {canManage && (
                  <>
                    <button onClick={() => onEdit(role)} className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50">
                      <PencilIcon className="h-3.5 w-3.5" />Edit
                    </button>
                    <button onClick={() => onDelete(role)} className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-red-700 ring-1 ring-red-200 hover:bg-red-50">
                      <TrashIcon className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Create / Edit Custom Role Modal ───────────────────────────────────────────
function CustomRoleModal({ existing, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: existing?.name || '',
    description: existing?.description || '',
    baseRole: existing?.baseRole || 'INTERN',
  })
  const [permissions, setPermissions] = useState(() => existing?.permissions || BASE_ROLE_DEFAULTS['INTERN'] || {})
  const [saving, setSaving] = useState(false)

  const handleBaseRoleChange = (role) => {
    setForm((f) => ({ ...f, baseRole: role }))
    if (!existing) setPermissions(BASE_ROLE_DEFAULTS[role] || {})
  }

  const toggleAction = (mod, action) => {
    setPermissions((prev) => {
      const current = prev[mod] || []
      const next = current.includes(action) ? current.filter((a) => a !== action) : [...current, action]
      return { ...prev, [mod]: next }
    })
  }

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Role name is required'); return }
    setSaving(true)
    try {
      if (existing) {
        await customRolesApi.update(existing.id, { ...form, permissions })
        toast.success('Custom role updated')
      } else {
        await customRolesApi.create({ ...form, permissions })
        toast.success(`Custom role "${form.name}" created`)
      }
      onSaved()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl my-6">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-bold text-gray-900">{existing ? 'Edit Custom Role' : 'New Custom Role'}</h2>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-gray-100"><XMarkIcon className="h-5 w-5 text-gray-500" /></button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role Name *</label>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. HR Intern" className="block w-full rounded-lg border-0 py-2 px-3 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="What does this role do?" className="block w-full rounded-lg border-0 py-2 px-3 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Base Role <span className="text-xs font-normal text-gray-500">(permissions pre-filled from base, customise below)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {BASE_ROLE_OPTIONS.map((opt) => (
                <button key={opt.value} type="button" onClick={() => handleBaseRoleChange(opt.value)}
                  className={`rounded-lg border-2 px-3 py-2 text-sm text-left transition-all ${form.baseRole === opt.value ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <div className="font-semibold text-gray-900">{opt.label}</div>
                  <div className="text-xs text-gray-500">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Permissions</label>
            <p className="text-xs text-gray-500 mb-3">Tick the actions this role can perform. Unticked = no access.</p>
            <div className="rounded-lg border overflow-hidden">
              <div className="max-h-80 overflow-y-auto">
                <table className="min-w-full text-xs">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold text-gray-600 uppercase w-36">Module</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-600 uppercase">Actions (click to toggle)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {Object.entries(ALL_MODULE_ACTIONS).map(([mod, actions]) => (
                      <tr key={mod} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 font-medium text-gray-700 capitalize align-top pt-3 whitespace-nowrap">
                          {mod.replace(/_/g, ' ')}
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex flex-wrap gap-1.5">
                            {actions.map((action) => {
                              const checked = (permissions[mod] || []).includes(action)
                              return (
                                <button key={action} type="button" onClick={() => toggleAction(mod, action)}
                                  className={`flex items-center gap-1 rounded-full px-2.5 py-1 border text-xs transition-all ${checked ? 'border-primary-400 bg-primary-50 text-primary-800 font-medium' : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300'}`}>
                                  {checked && <CheckIcon className="h-3 w-3 text-primary-600" />}
                                  {action.replace(/_/g, ' ')}
                                </button>
                              )
                            })}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50 rounded-b-2xl">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 ring-1 ring-gray-300 hover:bg-gray-100">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="rounded-lg bg-primary-600 px-6 py-2 text-sm font-semibold text-white hover:bg-primary-500 disabled:opacity-50">
            {saving ? 'Saving…' : existing ? 'Save Changes' : 'Create Role'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Assign Custom Role to Employee Modal ──────────────────────────────────────
function AssignCustomRoleModal({ customRole, onClose, onSaved }) {
  const [search, setSearch] = useState('')
  const [selectedEmpId, setSelectedEmpId] = useState(null)
  const [saving, setSaving] = useState(false)

  const { data: empRes } = useQuery({
    queryKey: ['employees-list-for-assign'],
    queryFn: () => employeesApi.getAll({ limit: 200 }),
  })
  const employees = empRes?.data?.data || []

  const filtered = useMemo(() => {
    if (!search) return employees
    const q = search.toLowerCase()
    return employees.filter((e) =>
      `${e.firstName} ${e.lastName || ''} ${e.employeeCode}`.toLowerCase().includes(q)
    )
  }, [employees, search])

  const handleAssign = async () => {
    if (!selectedEmpId) { toast.error('Select an employee'); return }
    setSaving(true)
    try {
      await customRolesApi.assignToEmployee({ employeeId: selectedEmpId, customRoleId: customRole.id })
      toast.success(`"${customRole.name}" assigned successfully`)
      onSaved()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h2 className="text-base font-bold text-gray-900">Assign &quot;{customRole.name}&quot;</h2>
            <p className="text-xs text-gray-500 mt-0.5">Pick an employee to assign this custom role</p>
          </div>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-gray-100"><XMarkIcon className="h-5 w-5 text-gray-500" /></button>
        </div>
        <div className="p-5 space-y-3">
          <input type="text" placeholder="Search by name or employee code…" value={search} onChange={(e) => setSearch(e.target.value)}
            className="block w-full rounded-lg border-0 py-2 px-3 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 text-sm" />
          <div className="max-h-64 overflow-y-auto rounded-lg border divide-y">
            {filtered.slice(0, 20).map((emp) => (
              <label key={emp.id} className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 ${selectedEmpId === emp.id ? 'bg-primary-50' : ''}`}>
                <input type="radio" name="emp" value={emp.id} checked={selectedEmpId === emp.id} onChange={() => setSelectedEmpId(emp.id)} className="text-primary-600" />
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700 text-sm font-bold">
                  {emp.firstName?.[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900">{emp.firstName} {emp.lastName || ''}</p>
                  <p className="text-xs text-gray-500">{emp.employeeCode}{emp.customRole ? ` · Currently: ${emp.customRole.name}` : ''}</p>
                </div>
              </label>
            ))}
            {filtered.length === 0 && <p className="p-4 text-center text-sm text-gray-500">No employees found</p>}
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 p-5 border-t bg-gray-50 rounded-b-2xl">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 ring-1 ring-gray-300 hover:bg-gray-100">Cancel</button>
          <button onClick={handleAssign} disabled={!selectedEmpId || saving} className="rounded-lg bg-primary-600 px-5 py-2 text-sm font-semibold text-white hover:bg-primary-500 disabled:opacity-50">
            {saving ? 'Assigning…' : 'Assign Role'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Role Matrix Tab ────────────────────────────────────────────────────────────
function RoleMatrixTab({ matrix, selectedRole, setSelectedRole }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {ALL_ROLES.map((role) => {
          const info = matrix[role]
          if (!info) return null
          const isExpanded = selectedRole === role
          return (
            <div key={role} className={`rounded-xl border transition-all duration-200 ${isExpanded ? 'ring-2 ring-primary-500 shadow-lg' : 'hover:shadow-md'} bg-white`}>
              <button onClick={() => setSelectedRole(isExpanded ? null : role)} className="flex w-full items-center justify-between p-4">
                <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${ROLE_COLORS[role] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>{role.replace('_', ' ')}</span>
                {isExpanded ? <ChevronUpIcon className="h-5 w-5 text-gray-400" /> : <ChevronDownIcon className="h-5 w-5 text-gray-400" />}
              </button>
              <div className="px-4 pb-2">
                <p className="text-sm text-gray-600">{info.description}</p>
                <p className="text-xs text-gray-400 mt-1">Scope: {info.scope}</p>
              </div>
              {isExpanded && (
                <div className="border-t px-4 py-3 space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-green-700 uppercase mb-1.5">✅ Capabilities ({info.capabilities?.length || 0})</p>
                    <ul className="space-y-1">{info.capabilities?.map((cap, i) => (<li key={i} className="flex items-start gap-2 text-xs text-gray-700"><CheckIcon className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" />{cap}</li>))}</ul>
                  </div>
                  {info.restrictions?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-red-700 uppercase mb-1.5">🚫 Restrictions ({info.restrictions.length})</p>
                      <ul className="space-y-1">{info.restrictions.map((r, i) => (<li key={i} className="flex items-start gap-2 text-xs text-gray-500"><XMarkIcon className="h-3.5 w-3.5 text-red-400 mt-0.5 shrink-0" />{r}</li>))}</ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

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
                {ALL_ROLES.map((r) => (<th key={r} className="px-3 py-3 text-center font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">{r.replace('_', ' ')}</th>))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                { module: 'Employee Mgmt',  access: { SUPER_ADMIN:'Full', ADMIN:'Full', HR:'Full',    MANAGER:'Team',   FINANCE:'View',    EMPLOYEE:'Self',  INTERN:'Self' } },
                { module: 'Leave Mgmt',     access: { SUPER_ADMIN:'Full', ADMIN:'Full', HR:'Full',    MANAGER:'Approve',FINANCE:'Self',    EMPLOYEE:'Self',  INTERN:'Self' } },
                { module: 'Payroll',        access: { SUPER_ADMIN:'Full', ADMIN:'Full', HR:'View',    MANAGER:'—',      FINANCE:'Full',    EMPLOYEE:'View',  INTERN:'View' } },
                { module: 'Attendance',     access: { SUPER_ADMIN:'Full', ADMIN:'Full', HR:'Full',    MANAGER:'Team',   FINANCE:'Self',    EMPLOYEE:'Self',  INTERN:'Self' } },
                { module: 'Performance',    access: { SUPER_ADMIN:'Full', ADMIN:'Full', HR:'Full',    MANAGER:'Team',   FINANCE:'View',    EMPLOYEE:'Self',  INTERN:'View' } },
                { module: 'Reports',        access: { SUPER_ADMIN:'Full', ADMIN:'Full', HR:'Full',    MANAGER:'Team',   FINANCE:'Full',    EMPLOYEE:'—',     INTERN:'—' } },
                { module: 'Departments',    access: { SUPER_ADMIN:'Full', ADMIN:'Full', HR:'Full',    MANAGER:'—',      FINANCE:'—',       EMPLOYEE:'—',     INTERN:'—' } },
                { module: 'Settings/Users', access: { SUPER_ADMIN:'Full', ADMIN:'Full', HR:'—',       MANAGER:'—',      FINANCE:'—',       EMPLOYEE:'—',     INTERN:'—' } },
                { module: 'Custom Role',    access: { SUPER_ADMIN:'—',    ADMIN:'—',    HR:'—',        MANAGER:'—',      FINANCE:'—',       EMPLOYEE:'—',     INTERN:'✨ Extend' } },
              ].map((row) => (
                <tr key={row.module} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-medium text-gray-900 whitespace-nowrap">{row.module}</td>
                  {ALL_ROLES.map((r) => {
                    const val = row.access[r]
                    const color = val === 'Full' ? 'text-green-700 bg-green-50' : val === 'Team' || val === 'Approve' ? 'text-blue-700 bg-blue-50' : val === 'View' || val === 'Self' ? 'text-amber-700 bg-amber-50' : val === '✨ Extend' ? 'text-teal-700 bg-teal-50' : 'text-gray-400 bg-gray-50'
                    return (<td key={r} className="px-3 py-2.5 text-center"><span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>{val}</span></td>)
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

// ── User Role Assignment Tab ───────────────────────────────────────────────────
function UserRoleTab({ users, usersLoading, editingUser, setEditingUser, newRole, setNewRole, handleRoleChange, updateRoleMut, currentUser }) {
  const [filter, setFilter] = useState('')
  const [roleFilter, setRoleFilter] = useState('')

  const filtered = users.filter((u) => {
    if (roleFilter && u.role !== roleFilter) return false
    if (filter) {
      const q = filter.toLowerCase()
      return u.email.toLowerCase().includes(q) || u.employee?.firstName?.toLowerCase().includes(q) || u.employee?.lastName?.toLowerCase().includes(q)
    }
    return true
  })

  if (usersLoading) return <div className="flex h-32 items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" /></div>

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <input type="text" placeholder="Search by name or email..." value={filter} onChange={(e) => setFilter(e.target.value)} className="flex-1 rounded-lg border-0 py-2 px-4 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 text-sm" />
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="rounded-lg border-0 py-2 pl-3 pr-8 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 text-sm">
          <option value="">All Roles</option>
          {ALL_ROLES.map((r) => (<option key={r} value={r}>{r.replace('_', ' ')}</option>))}
        </select>
      </div>

      <div className="grid grid-cols-4 gap-3 sm:grid-cols-7">
        {ALL_ROLES.map((role) => {
          const count = users.filter((u) => u.role === role).length
          return (
            <button key={role} onClick={() => setRoleFilter(roleFilter === role ? '' : role)}
              className={`rounded-lg border p-3 text-center transition-all ${roleFilter === role ? 'ring-2 ring-primary-500' : 'hover:shadow-sm'} bg-white`}>
              <p className="text-lg font-bold text-gray-900">{count}</p>
              <p className="text-xs text-gray-500">{role.replace('_', ' ')}</p>
            </button>
          )
        })}
      </div>

      <div className="rounded-xl bg-white shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase">User</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase">System Role</th>
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
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-700 text-sm font-semibold">{name[0]?.toUpperCase()}</div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{name}</p>
                        {u.employee?.employeeCode && <p className="text-xs text-gray-400">{u.employee.employeeCode}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-600">{u.email}</td>
                  <td className="px-5 py-3">
                    {isEditing ? (
                      <select value={newRole || u.role} onChange={(e) => setNewRole(e.target.value)} className="rounded-md border-0 py-1 pl-2 pr-6 ring-1 ring-gray-300 focus:ring-2 focus:ring-primary-600 text-sm">
                        {ALL_ROLES.map((r) => (<option key={r} value={r}>{r.replace('_', ' ')}</option>))}
                      </select>
                    ) : (
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${ROLE_COLORS[u.role] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>{u.role.replace('_', ' ')}</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{u.isActive ? 'Active' : 'Inactive'}</span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {isSelf ? (
                      <span className="text-xs text-gray-400 italic">You</span>
                    ) : isEditing ? (
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleRoleChange(u.id)} disabled={updateRoleMut.isPending || !newRole || newRole === u.role} className="rounded-md bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-500 disabled:opacity-50">{updateRoleMut.isPending ? '...' : 'Save'}</button>
                        <button onClick={() => { setEditingUser(null); setNewRole('') }} className="rounded-md px-3 py-1 text-xs font-semibold text-gray-600 ring-1 ring-gray-300 hover:bg-gray-50">Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => { setEditingUser(u.id); setNewRole(u.role) }} className="rounded-md px-3 py-1 text-xs font-semibold text-primary-600 ring-1 ring-primary-300 hover:bg-primary-50">Change Role</button>
                    )}
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (<tr><td colSpan={5} className="px-5 py-8 text-center text-sm text-gray-500">No users found</td></tr>)}
          </tbody>
        </table>
      </div>
    </div>
  )
}
