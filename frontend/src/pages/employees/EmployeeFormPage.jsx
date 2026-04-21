import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { usersApi, employeesApi, departmentsApi, designationsApi, payrollApi, customRolesApi } from '../../api/index.js'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { PageLoader } from '../../components/common/LoadingSpinner.jsx'
import { ArrowLeftIcon, CheckCircleIcon, InformationCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

const STEPS = [
  { n: 1, label: 'User Account' },
  { n: 2, label: 'Employee Details' },
  { n: 3, label: 'Salary & Bank' },
]

export default function EmployeeFormPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { user: currentUser } = useAuth()

  // Build the list of assignable roles based on who is currently logged in.
  // SUPER_ADMIN can assign any role. HR/ADMIN can only assign roles up to their level.
  const getAssignableRoles = () => {
    const role = currentUser?.role
    if (role === 'SUPER_ADMIN' || role === 'PLATFORM_ADMIN') {
      return ['EMPLOYEE', 'INTERN', 'HR', 'MANAGER', 'FINANCE', 'ADMIN', 'SUPER_ADMIN']
    }
    if (role === 'ADMIN') {
      return ['EMPLOYEE', 'INTERN', 'HR', 'MANAGER', 'FINANCE', 'ADMIN']
    }
    // HR, MANAGER
    return ['EMPLOYEE', 'INTERN', 'HR', 'MANAGER', 'FINANCE']
  }

  const [step, setStep] = useState(1)
  const [createdUserId, setCreatedUserId] = useState(null)
  const [createdEmpId, setCreatedEmpId] = useState(null)
  const [userForm, setUserForm] = useState({ email: '', password: '', role: 'EMPLOYEE' })
  const [empForm, setEmpForm] = useState({
    employeeCode: '', firstName: '', lastName: '', phone: '',
    gender: '', dateOfBirth: '', dateOfJoining: '',
    employmentStatus: 'PROBATION',
    departmentId: '', designationId: '', managerId: '', customRoleId: '',
    address: '', city: '', state: '', country: 'India', postalCode: '',
    emergencyContactName: '', emergencyContactPhone: '',
  })
  const [salaryForm, setSalaryForm] = useState({
    basicSalary: '', hra: '', conveyanceAllowance: '1600', medicalAllowance: '1250',
    specialAllowance: '', pfEmployee: '', pfEmployer: '', professionalTax: '200',
    tds: '', effectiveFrom: new Date().toISOString().split('T')[0],
  })
  const [bankForm, setBankForm] = useState({
    bankName: '', bankAccountNumber: '', bankIFSC: '', bankAccountHolder: '', panNumber: '',
  })
  const [errors, setErrors] = useState({})

  const orgId = currentUser?.organisationId ?? 'none'
  const { data: depts, isLoading: deptsLoading } = useQuery({ queryKey: ['departments-list', orgId], queryFn: () => departmentsApi.getAll({ limit: 100 }) })
  const { data: desigs, isLoading: desigsLoading } = useQuery({ queryKey: ['designations-list', orgId], queryFn: () => designationsApi.getAll({ limit: 100 }) })
  const { data: empList } = useQuery({ queryKey: ['employees-list', orgId], queryFn: () => employeesApi.getAll({ limit: 200, employmentStatus: 'ACTIVE' }) })
  const { data: customRolesRes } = useQuery({ queryKey: ['custom-roles', orgId], queryFn: customRolesApi.getAll })

  const departments = depts?.data?.data || []
  const designations = desigs?.data?.data || []
  const managers = empList?.data?.data || []
  const customRoles = (customRolesRes?.data?.data || []).filter((r) => r.isActive)
  const dropdownsReady = !deptsLoading && !desigsLoading

  const userMut = useMutation({
    mutationFn: usersApi.create,
    onSuccess: (res) => {
      setCreatedUserId(res.data.data.id)
      setStep(2)
      toast.success('User account created.')
    },
    onError: (err) => setErrors({ user: err.response?.data?.message || 'Failed to create user' }),
  })

  const empMut = useMutation({
    mutationFn: employeesApi.create,
    onSuccess: (res) => {
      qc.invalidateQueries(['employees'])
      setCreatedEmpId(res.data.data.id)
      setStep(3)
      toast.success('Employee profile saved. Now set up salary & bank details.')
    },
    onError: (err) => setErrors({ emp: err.response?.data?.message || 'Failed to create employee' }),
  })

  const salaryMut = useMutation({ mutationFn: payrollApi.upsertSalaryStructure })
  const bankMut = useMutation({ mutationFn: ({ id, data }) => employeesApi.update(id, data) })

  const uf = (k) => (e) => setUserForm({ ...userForm, [k]: e.target.value })
  const ef = (k) => (e) => setEmpForm({ ...empForm, [k]: e.target.value })
  const sf = (k) => (e) => setSalaryForm({ ...salaryForm, [k]: e.target.value })
  const bf = (k) => (e) => setBankForm({ ...bankForm, [k]: e.target.value })

  const handleUserSubmit = (e) => { e.preventDefault(); setErrors({}); userMut.mutate(userForm) }

  const handleEmpSubmit = (e) => {
    e.preventDefault()
    setErrors({})
    empMut.mutate({
      ...empForm,
      userId: createdUserId,
      departmentId: empForm.departmentId ? Number(empForm.departmentId) : undefined,
      designationId: empForm.designationId ? Number(empForm.designationId) : undefined,
      managerId: empForm.managerId ? Number(empForm.managerId) : undefined,
      customRoleId: empForm.customRoleId ? Number(empForm.customRoleId) : undefined,
      dateOfBirth: empForm.dateOfBirth ? new Date(empForm.dateOfBirth).toISOString() : undefined,
      dateOfJoining: empForm.dateOfJoining ? new Date(empForm.dateOfJoining).toISOString() : undefined,
      gender: empForm.gender || undefined,
    })
  }

  const calcGross = () => {
    const { basicSalary: b, hra: h, conveyanceAllowance: c, medicalAllowance: m, specialAllowance: s } = salaryForm
    return [b, h, c, m, s].reduce((a, v) => a + Number(v || 0), 0)
  }
  const gross = calcGross()
  const deductions = [salaryForm.pfEmployee, salaryForm.professionalTax, salaryForm.tds].reduce((a, v) => a + Number(v || 0), 0)
  const netPay = Math.max(0, gross - deductions)

  const handleStep3 = async (skip = false) => {
    if (!skip && salaryForm.basicSalary) {
      try {
        await salaryMut.mutateAsync({
          employeeId: createdEmpId,
          effectiveFrom: salaryForm.effectiveFrom,
          basicSalary: Number(salaryForm.basicSalary),
          hra: Number(salaryForm.hra || 0),
          conveyanceAllowance: Number(salaryForm.conveyanceAllowance || 0),
          medicalAllowance: Number(salaryForm.medicalAllowance || 0),
          specialAllowance: Number(salaryForm.specialAllowance || 0),
          pfEmployee: Number(salaryForm.pfEmployee || 0),
          pfEmployer: Number(salaryForm.pfEmployer || 0),
          professionalTax: Number(salaryForm.professionalTax || 0),
          tds: Number(salaryForm.tds || 0),
        })
        toast.success('Salary structure saved!')
      } catch { toast.error('Salary save failed — you can set it up later from Payroll.') }
    }

    const bankData = Object.fromEntries(Object.entries(bankForm).filter(([, v]) => v))
    if (Object.keys(bankData).length) {
      try {
        await bankMut.mutateAsync({ id: createdEmpId, data: bankData })
        toast.success('Bank details saved!')
      } catch { toast.error('Bank details save failed — you can update later from employee profile.') }
    }

    qc.invalidateQueries(['employees'])
    qc.invalidateQueries(['missing-salary'])
    navigate(`/employees/${createdEmpId}`)
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link to="/employees" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeftIcon className="h-4 w-4" /> Back to Employees
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Onboard New Employee</h1>
        <p className="text-sm text-gray-500">Step {step} of 3</p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map(({ n, label }) => (
          <div key={n} className="flex items-center gap-2">
            <div className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${n < step ? 'bg-green-500 text-white' : n === step ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
              {n < step ? <CheckCircleIcon className="h-4 w-4" /> : n}
            </div>
            <span className={`text-sm ${n === step ? 'font-medium text-gray-900' : n < step ? 'text-green-600' : 'text-gray-400'}`}>{label}</span>
            {n < 3 && <div className={`h-px w-12 ${step > n ? 'bg-green-500' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: Create User */}
      {step === 1 && (
        <div className="rounded-lg bg-white shadow p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Create Login Account</h2>
          {errors.user && <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{errors.user}</div>}
          <form onSubmit={handleUserSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Work Email *</label>
              <input type="email" required value={userForm.email} onChange={uf('email')} className="mt-1 block w-full rounded-md border-0 py-1.5 px-3 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Temporary Password *</label>
              <input type="password" required minLength={8} value={userForm.password} onChange={uf('password')} placeholder="Min 8 characters" className="mt-1 block w-full rounded-md border-0 py-1.5 px-3 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">System Role *</label>
              <p className="text-xs text-gray-500 mb-3 flex items-start gap-1">
                <InformationCircleIcon className="h-3.5 w-3.5 mt-0.5 shrink-0 text-blue-400" />
                <span><strong>System Role</strong> = login access level. It is <em>separate</em> from the job title (Designation set in Step 2). Pick the role that matches what they should be able to <em>do</em> in the system.</span>
              </p>
              {/* Hidden select for form requirement */}
              <input type="hidden" value={userForm.role} />
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {getAssignableRoles().map((r) => {
                  const meta = {
                    EMPLOYEE: { color: 'gray', label: 'Employee', desc: 'View own profile, apply leaves & WFH, clock attendance. No management access.' },
                    HR: { color: 'violet', label: 'HR / HR Manager', desc: 'Full HR ops: manage employees, leaves, attendance, onboarding, documents. No payroll processing.' },
                    MANAGER: { color: 'blue', label: 'Manager', desc: 'View team, approve leaves & WFH, appraise. Cannot add/edit employees or process payroll.' },
                    FINANCE: { color: 'green', label: 'Finance', desc: 'Process payroll, manage salary structures, expense policies. View-only for employees.' },
                    ADMIN: { color: 'orange', label: 'Admin', desc: 'Full access except cannot delete SUPER_ADMIN users or modify platform settings.' },
                    SUPER_ADMIN: { color: 'red', label: 'Super Admin', desc: 'Full organisation-level access. Use only for top-level administrators.' },
                  }[r] || { color: 'gray', label: r, desc: '' }
                  const selected = userForm.role === r
                  const colorMap = {
                    gray: { ring: 'ring-gray-300', bg: selected ? 'bg-gray-100' : 'bg-white', badge: 'bg-gray-100 text-gray-700' },
                    violet: { ring: 'ring-violet-400', bg: selected ? 'bg-violet-50' : 'bg-white', badge: 'bg-violet-100 text-violet-700' },
                    blue: { ring: 'ring-blue-400', bg: selected ? 'bg-blue-50' : 'bg-white', badge: 'bg-blue-100 text-blue-700' },
                    green: { ring: 'ring-green-400', bg: selected ? 'bg-green-50' : 'bg-white', badge: 'bg-green-100 text-green-700' },
                    orange: { ring: 'ring-orange-400', bg: selected ? 'bg-orange-50' : 'bg-white', badge: 'bg-orange-100 text-orange-700' },
                    red: { ring: 'ring-red-400', bg: selected ? 'bg-red-50' : 'bg-white', badge: 'bg-red-100 text-red-700' },
                  }
                  const c = colorMap[meta.color]
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setUserForm({ ...userForm, role: r })}
                      className={`text-left rounded-lg border-2 p-3 transition-all ${selected ? `${c.ring} border-opacity-100 ${c.bg} shadow-sm` : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-gray-900">{meta.label}</span>
                        {selected && <CheckCircleIcon className="h-4 w-4 text-primary-600 shrink-0" />}
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed">{meta.desc}</p>
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button type="submit" disabled={userMut.isPending} className="rounded-md bg-primary-600 px-5 py-2 text-sm font-semibold text-white hover:bg-primary-500 disabled:opacity-50">
                {userMut.isPending ? 'Creating account…' : 'Next: Employee Details →'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Step 2: Employee Details */}
      {step === 2 && (
        <div className="rounded-lg bg-white shadow p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Employee Information</h2>
          {errors.emp && <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{errors.emp}</div>}

          {/* Warning: no departments or designations yet */}
          {dropdownsReady && (departments.length === 0 || designations.length === 0) && (
            <div className="mb-4 rounded-md bg-amber-50 border border-amber-200 p-3">
              <div className="flex gap-2">
                <ExclamationTriangleIcon className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-semibold mb-1">Setup required before assigning work details</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    {departments.length === 0 && (
                      <li>No departments found. <Link to="/departments" className="underline font-medium hover:text-amber-900" target="_blank">Create departments →</Link></li>
                    )}
                    {designations.length === 0 && (
                      <li>No designations found. <Link to="/designations" className="underline font-medium hover:text-amber-900" target="_blank">Create designations →</Link></li>
                    )}
                  </ul>
                  <p className="mt-1 text-xs text-amber-600">You can skip department/designation now and update the employee profile later.</p>
                </div>
              </div>
            </div>
          )}

          {/* Loading state for dropdowns */}
          {!dropdownsReady && (
            <div className="mb-4 text-sm text-gray-500 flex items-center gap-2">
              <svg className="animate-spin h-4 w-4 text-primary-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Loading departments and designations…
            </div>
          )}
          <form onSubmit={handleEmpSubmit} className="space-y-6">
            {/* Basic */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Basic Info</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Employee Code *</label>
                  <input required value={empForm.employeeCode} onChange={ef('employeeCode')} placeholder="e.g. EMP0007" className="mt-1 block w-full rounded-md border-0 py-1.5 px-3 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Employment Status</label>
                  <select value={empForm.employmentStatus} onChange={ef('employmentStatus')} className="mt-1 block w-full rounded-md border-0 py-1.5 pl-3 pr-8 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm">
                    {['ACTIVE', 'PROBATION'].map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">First Name *</label>
                  <input required value={empForm.firstName} onChange={ef('firstName')} className="mt-1 block w-full rounded-md border-0 py-1.5 px-3 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Name</label>
                  <input value={empForm.lastName} onChange={ef('lastName')} className="mt-1 block w-full rounded-md border-0 py-1.5 px-3 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input value={empForm.phone} onChange={ef('phone')} className="mt-1 block w-full rounded-md border-0 py-1.5 px-3 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Gender</label>
                  <select value={empForm.gender} onChange={ef('gender')} className="mt-1 block w-full rounded-md border-0 py-1.5 pl-3 pr-8 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm">
                    <option value="">Select</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                  <input type="date" value={empForm.dateOfBirth} onChange={ef('dateOfBirth')} className="mt-1 block w-full rounded-md border-0 py-1.5 px-3 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date of Joining</label>
                  <input type="date" value={empForm.dateOfJoining} onChange={ef('dateOfJoining')} className="mt-1 block w-full rounded-md border-0 py-1.5 px-3 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm" />
                </div>
              </div>
            </div>

            {/* Work */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Work Assignment</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Department</label>
                  <select
                    value={empForm.departmentId}
                    onChange={ef('departmentId')}
                    disabled={deptsLoading}
                    className="mt-1 block w-full rounded-md border-0 py-1.5 pl-3 pr-8 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm disabled:bg-gray-50 disabled:text-gray-400"
                  >
                    <option value="">{deptsLoading ? 'Loading…' : departments.length === 0 ? 'No departments — create one first' : 'Select department'}</option>
                    {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Designation</label>
                  <select
                    value={empForm.designationId}
                    onChange={ef('designationId')}
                    disabled={desigsLoading}
                    className="mt-1 block w-full rounded-md border-0 py-1.5 pl-3 pr-8 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm disabled:bg-gray-50 disabled:text-gray-400"
                  >
                    <option value="">{desigsLoading ? 'Loading…' : designations.length === 0 ? 'No designations — create one first' : 'Select designation'}</option>
                    {designations.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Reporting Manager</label>
                  <select value={empForm.managerId} onChange={ef('managerId')} className="mt-1 block w-full rounded-md border-0 py-1.5 pl-3 pr-8 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm">
                    <option value="">No manager</option>
                    {managers.map((m) => <option key={m.id} value={m.id}>{m.firstName} {m.lastName} ({m.employeeCode})</option>)}
                  </select>
                </div>
              </div>

              {/* Custom Role — only show if custom roles exist for this org */}
              {customRoles.length > 0 && (
                <div className="mt-4 rounded-lg border border-teal-200 bg-teal-50 p-4">
                  <label className="block text-sm font-semibold text-teal-900 mb-0.5">Custom Role <span className="font-normal text-teal-700">(optional)</span></label>
                  <p className="text-xs text-teal-700 mb-2">
                    Assign a custom role to grant specific permissions on top of the system role selected in Step 1. Perfect for interns or specialised positions.
                  </p>
                  <select
                    value={empForm.customRoleId}
                    onChange={ef('customRoleId')}
                    className="block w-full rounded-md border-0 py-1.5 pl-3 pr-8 ring-1 ring-inset ring-teal-300 focus:ring-2 focus:ring-teal-600 sm:text-sm bg-white"
                  >
                    <option value="">None — use system role permissions only</option>
                    {customRoles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} (base: {r.baseRole}) — {Object.keys(r.permissions || {}).length} modules
                      </option>
                    ))}
                  </select>
                  {!empForm.customRoleId && (
                    <p className="mt-1.5 text-xs text-teal-600">
                      💡 Tip: Go to <strong>Roles &amp; Permissions → Custom Roles</strong> to create new custom roles.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Address */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Address</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Street Address</label>
                  <input value={empForm.address} onChange={ef('address')} className="mt-1 block w-full rounded-md border-0 py-1.5 px-3 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm" />
                </div>
                {[['city', 'City'], ['state', 'State'], ['postalCode', 'Postal Code'], ['country', 'Country']].map(([k, label]) => (
                  <div key={k}>
                    <label className="block text-sm font-medium text-gray-700">{label}</label>
                    <input value={empForm[k]} onChange={ef(k)} className="mt-1 block w-full rounded-md border-0 py-1.5 px-3 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm" />
                  </div>
                ))}
              </div>
            </div>

            {/* Emergency */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Emergency Contact</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input value={empForm.emergencyContactName} onChange={ef('emergencyContactName')} className="mt-1 block w-full rounded-md border-0 py-1.5 px-3 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input value={empForm.emergencyContactPhone} onChange={ef('emergencyContactPhone')} className="mt-1 block w-full rounded-md border-0 py-1.5 px-3 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm" />
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <button type="button" onClick={() => setStep(1)} className="rounded-md px-4 py-2 text-sm text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50">← Back</button>
              <button type="submit" disabled={empMut.isPending} className="rounded-md bg-primary-600 px-5 py-2 text-sm font-semibold text-white hover:bg-primary-500 disabled:opacity-50">
                {empMut.isPending ? 'Saving…' : 'Next: Salary & Bank →'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Step 3: Salary & Bank */}
      {step === 3 && (
        <div className="space-y-5">
          {/* Salary Structure */}
          <div className="rounded-lg bg-white shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">Salary Structure</h2>
              <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">Required for payroll generation</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs font-semibold text-green-700 uppercase mb-2">Earnings</p>
                {[['basicSalary', 'Basic Salary *'], ['hra', 'HRA'], ['conveyanceAllowance', 'Conveyance Allow.'], ['medicalAllowance', 'Medical Allow.'], ['specialAllowance', 'Special Allow.']].map(([k, label]) => (
                  <div key={k} className="mb-3">
                    <label className="block text-xs font-medium text-gray-600">{label}</label>
                    <input type="number" value={salaryForm[k]} onChange={sf(k)} className="mt-0.5 block w-full rounded-md border-0 py-1.5 px-3 ring-1 ring-gray-300 focus:ring-2 focus:ring-primary-600 text-sm" />
                  </div>
                ))}
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-600">Effective From</label>
                  <input type="date" value={salaryForm.effectiveFrom} onChange={sf('effectiveFrom')} className="mt-0.5 block w-full rounded-md border-0 py-1.5 px-3 ring-1 ring-gray-300 focus:ring-2 focus:ring-primary-600 text-sm" />
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-red-700 uppercase mb-2">Deductions</p>
                {[['pfEmployee', 'PF (Employee 12%)'], ['pfEmployer', 'PF (Employer 12%)'], ['professionalTax', 'Prof. Tax'], ['tds', 'TDS']].map(([k, label]) => (
                  <div key={k} className="mb-3">
                    <label className="block text-xs font-medium text-gray-600">{label}</label>
                    <input type="number" value={salaryForm[k]} onChange={sf(k)} className="mt-0.5 block w-full rounded-md border-0 py-1.5 px-3 ring-1 ring-gray-300 focus:ring-2 focus:ring-primary-600 text-sm" />
                  </div>
                ))}
              </div>
            </div>
            {gross > 0 && (
              <div className="grid grid-cols-3 gap-3 rounded-lg bg-gray-50 border border-gray-200 p-3 text-sm mt-2">
                <div className="text-center"><p className="text-xs text-gray-500">Gross</p><p className="font-bold text-green-600">₹{gross.toLocaleString('en-IN')}</p></div>
                <div className="text-center"><p className="text-xs text-gray-500">Deductions</p><p className="font-bold text-red-600">₹{deductions.toLocaleString('en-IN')}</p></div>
                <div className="text-center"><p className="text-xs text-gray-500">Net Pay</p><p className="font-bold text-primary-600 text-base">₹{netPay.toLocaleString('en-IN')}</p></div>
              </div>
            )}
          </div>

          {/* Bank Details */}
          <div className="rounded-lg bg-white shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">Bank Account Details</h2>
              <span className="text-xs text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">Needed for salary transfer</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                ['bankAccountHolder', 'Account Holder Name'],
                ['bankName', 'Bank Name'],
                ['bankAccountNumber', 'Account Number'],
                ['bankIFSC', 'IFSC Code'],
                ['panNumber', 'PAN Number'],
              ].map(([k, label]) => (
                <div key={k}>
                  <label className="block text-sm font-medium text-gray-700">{label}</label>
                  <input value={bankForm[k]} onChange={bf(k)}
                    placeholder={k === 'bankIFSC' ? 'e.g. SBIN0001234' : k === 'panNumber' ? 'e.g. ABCDE1234F' : ''}
                    className="mt-1 block w-full rounded-md border-0 py-1.5 px-3 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm" />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between pt-2">
            <button type="button" onClick={() => setStep(2)} className="rounded-md px-4 py-2 text-sm text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50">← Back</button>
            <div className="flex gap-3">
              <button type="button" onClick={() => handleStep3(true)}
                className="rounded-md px-4 py-2 text-sm text-gray-500 ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                Skip for now
              </button>
              <button type="button" onClick={() => handleStep3(false)} disabled={salaryMut.isPending || bankMut.isPending}
                className="rounded-md bg-primary-600 px-5 py-2 text-sm font-semibold text-white hover:bg-primary-500 disabled:opacity-50">
                {salaryMut.isPending || bankMut.isPending ? 'Saving…' : 'Save & Finish'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
