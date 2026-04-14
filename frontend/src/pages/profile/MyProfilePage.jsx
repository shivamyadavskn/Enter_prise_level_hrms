import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { employeesApi, authApi } from '../../api/index.js'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { PageLoader } from '../../components/common/LoadingSpinner.jsx'
import { UserCircleIcon, KeyIcon, BanknotesIcon, PhoneIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

const inputCls = 'mt-1 block w-full rounded-md border-0 py-1.5 px-3 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm'
const labelCls = 'block text-sm font-medium text-gray-700'

const TABS = [
  { id: 'personal', label: 'Personal Info', icon: UserCircleIcon },
  { id: 'bank', label: 'Bank & PAN', icon: BanknotesIcon },
  { id: 'contact', label: 'Contact & Emergency', icon: PhoneIcon },
  { id: 'password', label: 'Change Password', icon: KeyIcon },
]

export default function MyProfilePage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [tab, setTab] = useState('personal')

  const { data, isLoading } = useQuery({
    queryKey: ['my-profile'],
    queryFn: employeesApi.getMe,
  })
  const emp = data?.data?.data

  const [form, setForm] = useState({})
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })

  useEffect(() => {
    if (emp) setForm({
      phone: emp.phone || '',
      address: emp.address || '',
      city: emp.city || '',
      state: emp.state || '',
      country: emp.country || '',
      postalCode: emp.postalCode || '',
      emergencyContactName: emp.emergencyContactName || '',
      emergencyContactPhone: emp.emergencyContactPhone || '',
      bankName: emp.bankName || '',
      bankAccountNumber: emp.bankAccountNumber || '',
      bankIFSC: emp.bankIFSC || '',
      bankAccountHolder: emp.bankAccountHolder || '',
      panNumber: emp.panNumber || '',
    })
  }, [emp])

  const f = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const pw = (k) => (e) => setPwForm({ ...pwForm, [k]: e.target.value })

  const updateMut = useMutation({
    mutationFn: (data) => employeesApi.update(emp.id, data),
    onSuccess: () => { qc.invalidateQueries(['my-profile']); toast.success('Profile updated') },
    onError: (e) => toast.error(e.response?.data?.message || 'Update failed'),
  })

  const pwMut = useMutation({
    mutationFn: authApi.changePassword,
    onSuccess: () => { setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); toast.success('Password changed') },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  })

  const handleSave = (fields) => updateMut.mutate(Object.fromEntries(fields.map(k => [k, form[k]])))

  const handlePw = (e) => {
    e.preventDefault()
    if (pwForm.newPassword !== pwForm.confirmPassword) return toast.error('Passwords do not match')
    if (pwForm.newPassword.length < 8) return toast.error('Password must be at least 8 characters')
    pwMut.mutate({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword })
  }

  if (isLoading) return <PageLoader />
  if (!emp) return (
    <div className="rounded-lg bg-amber-50 border border-amber-200 p-6 text-amber-700">
      Your employee profile is not set up yet. Contact HR to complete your onboarding.
    </div>
  )

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-sm text-gray-500">Manage your personal details and settings</p>
      </div>

      {/* Profile header card */}
      <div className="rounded-lg bg-white shadow p-6 flex items-center gap-5">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-600 text-white text-2xl font-bold">
          {emp.firstName?.[0]}{emp.lastName?.[0] || ''}
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">{emp.firstName} {emp.lastName}</h2>
          <p className="text-sm text-gray-500">{emp.designation?.name} · {emp.department?.name}</p>
          <p className="text-xs text-gray-400 mt-1">{emp.employeeCode} · {user?.email}</p>
        </div>
        <div className="ml-auto flex flex-col items-end gap-1">
          {emp.bankAccountNumber && <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircleIcon className="h-4 w-4" /> Bank verified</span>}
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${emp.employmentStatus === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{emp.employmentStatus}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-all ${tab === t.id ? 'bg-white shadow text-primary-600' : 'text-gray-600 hover:text-gray-900'}`}>
            <t.icon className="h-4 w-4" /><span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      <div className="rounded-lg bg-white shadow p-6">
        {tab === 'personal' && (
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Personal Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={labelCls}>First Name</label><input value={emp.firstName} disabled className={inputCls + ' bg-gray-50'} /></div>
              <div><label className={labelCls}>Last Name</label><input value={emp.lastName || ''} disabled className={inputCls + ' bg-gray-50'} /></div>
              <div><label className={labelCls}>Email</label><input value={emp.email || user?.email} disabled className={inputCls + ' bg-gray-50'} /></div>
              <div><label className={labelCls}>Phone *</label><input value={form.phone} onChange={f('phone')} className={inputCls} placeholder="+91 9000000000" /></div>
              <div><label className={labelCls}>Date of Birth</label><input value={emp.dateOfBirth ? emp.dateOfBirth.split('T')[0] : ''} disabled className={inputCls + ' bg-gray-50'} /></div>
              <div><label className={labelCls}>Date of Joining</label><input value={emp.dateOfJoining ? emp.dateOfJoining.split('T')[0] : ''} disabled className={inputCls + ' bg-gray-50'} /></div>
            </div>
            <div className="flex justify-end pt-2 border-t border-gray-100">
              <button onClick={() => handleSave(['phone'])} disabled={updateMut.isPending}
                className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-500 disabled:opacity-50">
                {updateMut.isPending ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}

        {tab === 'bank' && (
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-gray-900 mb-1">Bank Account & PAN Details</h3>
            <p className="text-sm text-gray-500 mb-4">This information is used for payroll credit and reimbursements.</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><label className={labelCls}>Account Holder Name</label><input value={form.bankAccountHolder} onChange={f('bankAccountHolder')} className={inputCls} placeholder="As per bank records" /></div>
              <div><label className={labelCls}>Bank Name</label><input value={form.bankName} onChange={f('bankName')} className={inputCls} placeholder="HDFC Bank" /></div>
              <div><label className={labelCls}>Account Number</label><input value={form.bankAccountNumber} onChange={f('bankAccountNumber')} className={inputCls} placeholder="000123456789" /></div>
              <div><label className={labelCls}>IFSC Code</label><input value={form.bankIFSC} onChange={f('bankIFSC')} className={inputCls} placeholder="HDFC0001234" /></div>
              <div><label className={labelCls}>PAN Number</label><input value={form.panNumber} onChange={f('panNumber')} className={inputCls + ' uppercase'} placeholder="ABCDE1234F" maxLength={10} /></div>
            </div>
            <div className="flex justify-end pt-2 border-t border-gray-100">
              <button onClick={() => handleSave(['bankName', 'bankAccountNumber', 'bankIFSC', 'bankAccountHolder', 'panNumber'])} disabled={updateMut.isPending}
                className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-500 disabled:opacity-50">
                {updateMut.isPending ? 'Saving…' : 'Save Bank Details'}
              </button>
            </div>
          </div>
        )}

        {tab === 'contact' && (
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Address & Emergency Contact</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><label className={labelCls}>Address</label><input value={form.address} onChange={f('address')} className={inputCls} placeholder="Street address" /></div>
              <div><label className={labelCls}>City</label><input value={form.city} onChange={f('city')} className={inputCls} /></div>
              <div><label className={labelCls}>State</label><input value={form.state} onChange={f('state')} className={inputCls} /></div>
              <div><label className={labelCls}>Postal Code</label><input value={form.postalCode} onChange={f('postalCode')} className={inputCls} /></div>
              <div><label className={labelCls}>Country</label><input value={form.country} onChange={f('country')} className={inputCls} /></div>
            </div>
            <div className="border-t border-gray-100 pt-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Emergency Contact</h4>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>Contact Name</label><input value={form.emergencyContactName} onChange={f('emergencyContactName')} className={inputCls} placeholder="Name" /></div>
                <div><label className={labelCls}>Contact Phone</label><input value={form.emergencyContactPhone} onChange={f('emergencyContactPhone')} className={inputCls} placeholder="+91 9000000000" /></div>
              </div>
            </div>
            <div className="flex justify-end pt-2 border-t border-gray-100">
              <button onClick={() => handleSave(['address','city','state','country','postalCode','emergencyContactName','emergencyContactPhone'])} disabled={updateMut.isPending}
                className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-500 disabled:opacity-50">
                {updateMut.isPending ? 'Saving…' : 'Save Contact Info'}
              </button>
            </div>
          </div>
        )}

        {tab === 'password' && (
          <form onSubmit={handlePw} className="space-y-4 max-w-md">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Change Password</h3>
            <div><label className={labelCls}>Current Password</label><input type="password" required value={pwForm.currentPassword} onChange={pw('currentPassword')} className={inputCls} /></div>
            <div><label className={labelCls}>New Password</label><input type="password" required value={pwForm.newPassword} onChange={pw('newPassword')} className={inputCls} /></div>
            <div><label className={labelCls}>Confirm New Password</label><input type="password" required value={pwForm.confirmPassword} onChange={pw('confirmPassword')} className={inputCls} /></div>
            <div className="flex justify-end pt-2 border-t border-gray-100">
              <button type="submit" disabled={pwMut.isPending}
                className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-500 disabled:opacity-50">
                {pwMut.isPending ? 'Changing…' : 'Change Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
