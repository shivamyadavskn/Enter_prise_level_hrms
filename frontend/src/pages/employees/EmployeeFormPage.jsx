import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { usersApi, employeesApi, departmentsApi, designationsApi, payrollApi } from '../../api/index.js'
import { PageLoader } from '../../components/common/LoadingSpinner.jsx'
import { ArrowLeftIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

const STEPS = [
  { n: 1, label: 'User Account' },
  { n: 2, label: 'Employee Details' },
  { n: 3, label: 'Salary & Bank' },
]

export default function EmployeeFormPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [step, setStep] = useState(1)
  const [createdUserId, setCreatedUserId] = useState(null)
  const [createdEmpId, setCreatedEmpId] = useState(null)
  const [userForm, setUserForm] = useState({ email: '', password: '', role: 'EMPLOYEE' })
  const [empForm, setEmpForm] = useState({
    employeeCode: '', firstName: '', lastName: '', phone: '',
    gender: '', dateOfBirth: '', dateOfJoining: '',
    employmentStatus: 'PROBATION',
    departmentId: '', designationId: '', managerId: '',
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

  const { data: depts } = useQuery({ queryKey: ['departments-list'], queryFn: () => departmentsApi.getAll({ limit: 100 }) })
  const { data: desigs } = useQuery({ queryKey: ['designations-list'], queryFn: () => designationsApi.getAll({ limit: 100 }) })
  const { data: empList } = useQuery({ queryKey: ['employees-list'], queryFn: () => employeesApi.getAll({ limit: 200, employmentStatus: 'ACTIVE' }) })

  const departments = depts?.data?.data || []
  const designations = desigs?.data?.data || []
  const managers = empList?.data?.data || []

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
      dateOfBirth: empForm.dateOfBirth ? new Date(empForm.dateOfBirth).toISOString() : undefined,
      dateOfJoining: empForm.dateOfJoining ? new Date(empForm.dateOfJoining).toISOString() : undefined,
      gender: empForm.gender || undefined,
    })
  }

  const calcGross = () => {
    const { basicSalary: b, hra: h, conveyanceAllowance: c, medicalAllowance: m, specialAllowance: s } = salaryForm
    return [b,h,c,m,s].reduce((a,v) => a + Number(v||0), 0)
  }
  const gross = calcGross()
  const deductions = [salaryForm.pfEmployee, salaryForm.professionalTax, salaryForm.tds].reduce((a,v) => a + Number(v||0), 0)
  const netPay = Math.max(0, gross - deductions)

  const handleStep3 = async (skip = false) => {
    if (!skip && salaryForm.basicSalary) {
      try {
        await salaryMut.mutateAsync({
          employeeId: createdEmpId,
          effectiveFrom: salaryForm.effectiveFrom,
          basicSalary: Number(salaryForm.basicSalary),
          hra: Number(salaryForm.hra||0),
          conveyanceAllowance: Number(salaryForm.conveyanceAllowance||0),
          medicalAllowance: Number(salaryForm.medicalAllowance||0),
          specialAllowance: Number(salaryForm.specialAllowance||0),
          pfEmployee: Number(salaryForm.pfEmployee||0),
          pfEmployer: Number(salaryForm.pfEmployer||0),
          professionalTax: Number(salaryForm.professionalTax||0),
          tds: Number(salaryForm.tds||0),
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
              <label className="block text-sm font-medium text-gray-700">System Role *</label>
              <select required value={userForm.role} onChange={uf('role')} className="mt-1 block w-full rounded-md border-0 py-1.5 pl-3 pr-8 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm">
                {['EMPLOYEE', 'HR', 'MANAGER', 'ADMIN', 'FINANCE', 'SUPER_ADMIN'].map((r) => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
              </select>
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
                  <select value={empForm.departmentId} onChange={ef('departmentId')} className="mt-1 block w-full rounded-md border-0 py-1.5 pl-3 pr-8 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm">
                    <option value="">Select department</option>
                    {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Designation</label>
                  <select value={empForm.designationId} onChange={ef('designationId')} className="mt-1 block w-full rounded-md border-0 py-1.5 pl-3 pr-8 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm">
                    <option value="">Select designation</option>
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
                {[['basicSalary','Basic Salary *'],['hra','HRA'],['conveyanceAllowance','Conveyance Allow.'],['medicalAllowance','Medical Allow.'],['specialAllowance','Special Allow.']].map(([k,label]) => (
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
                {[['pfEmployee','PF (Employee 12%)'],['pfEmployer','PF (Employer 12%)'],['professionalTax','Prof. Tax'],['tds','TDS']].map(([k,label]) => (
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
