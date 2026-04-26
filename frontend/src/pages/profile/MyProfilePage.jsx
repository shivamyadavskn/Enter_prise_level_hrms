import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { employeesApi, authApi } from '../../api/index.js'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { PageLoader } from '../../components/common/LoadingSpinner.jsx'
import { UserCircleIcon, KeyIcon, BanknotesIcon, PhoneIcon, CheckCircleIcon, BriefcaseIcon, AcademicCapIcon, DocumentTextIcon, PlusIcon, PencilIcon, TrashIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'
import TwoFactorSettings from '../../components/auth/TwoFactorSettings.jsx'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const inputCls = 'mt-1.5 block w-full rounded-lg border-0 py-2.5 px-3.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-500 sm:text-sm transition-shadow'
const labelCls = 'block text-sm font-medium text-gray-600'
const fmtDate = (d) => d ? format(new Date(d), 'MMM yyyy') : 'Present'

const TABS = [
  { id: 'personal',   label: 'Personal Info',        icon: UserCircleIcon },
  { id: 'bank',       label: 'Bank & PAN',            icon: BanknotesIcon },
  { id: 'contact',    label: 'Contact & Emergency',   icon: PhoneIcon },
  { id: 'experience', label: 'Experience',            icon: BriefcaseIcon },
  { id: 'education',  label: 'Education',             icon: AcademicCapIcon },
  { id: 'documents',  label: 'Documents',             icon: DocumentTextIcon },
  { id: 'security',   label: 'Security',              icon: ShieldCheckIcon },
]

const EMP_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance']
const DOC_TYPES = ['ID_PROOF','ADDRESS_PROOF','EDUCATION','EXPERIENCE','OFFER_LETTER','APPOINTMENT_LETTER','CONFIRMATION_LETTER','RELIEVING_LETTER','RESIGNATION_LETTER','CONTRACT','PAYSLIP','OTHER']
const emptyExp = { companyName:'', jobTitle:'', department:'', location:'', employmentType:'Full-time', startDate:'', endDate:'', isCurrent:false, ctc:'', responsibilities:'', reasonForLeaving:'' }
const emptyEdu = { degree:'', fieldOfStudy:'', institution:'', board:'', startYear:'', endYear:'', grade:'' }

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
  const [expModal, setExpModal] = useState(null)
  const [expForm, setExpForm] = useState(emptyExp)
  const [eduModal, setEduModal] = useState(null)
  const [eduForm, setEduForm] = useState(emptyEdu)

  useEffect(() => {
    if (emp) setForm({
      phone: emp.phone || '', address: emp.address || '', city: emp.city || '',
      state: emp.state || '', country: emp.country || '', postalCode: emp.postalCode || '',
      emergencyContactName: emp.emergencyContactName || '', emergencyContactPhone: emp.emergencyContactPhone || '',
      bankName: emp.bankName || '', bankAccountNumber: emp.bankAccountNumber || '',
      bankIFSC: emp.bankIFSC || '', bankAccountHolder: emp.bankAccountHolder || '', panNumber: emp.panNumber || '',
    })
  }, [emp])

  const f = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const pw = (k) => (e) => setPwForm({ ...pwForm, [k]: e.target.value })
  const ef = (k) => (e) => setExpForm(p => ({ ...p, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))
  const edf = (k) => (e) => setEduForm(p => ({ ...p, [k]: e.target.value }))

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
  const addExpMut = useMutation({
    mutationFn: (d) => expForm.id ? employeesApi.updateExperience(emp.id, expForm.id, d) : employeesApi.addExperience(emp.id, d),
    onSuccess: () => { qc.invalidateQueries(['my-profile']); setExpModal(null); toast.success(expForm.id ? 'Experience updated' : 'Experience added') },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  })
  const delExpMut = useMutation({
    mutationFn: (id) => employeesApi.deleteExperience(emp.id, id),
    onSuccess: () => { qc.invalidateQueries(['my-profile']); toast.success('Experience removed') },
  })
  const addEduMut = useMutation({
    mutationFn: (d) => eduForm.id ? employeesApi.updateEducation(emp.id, eduForm.id, d) : employeesApi.addEducation(emp.id, d),
    onSuccess: () => { qc.invalidateQueries(['my-profile']); setEduModal(null); toast.success(eduForm.id ? 'Education updated' : 'Education added') },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  })
  const delEduMut = useMutation({
    mutationFn: (id) => employeesApi.deleteEducation(emp.id, id),
    onSuccess: () => { qc.invalidateQueries(['my-profile']); toast.success('Education removed') },
  })

  const handleSave = (fields) => updateMut.mutate(Object.fromEntries(fields.map(k => [k, form[k]])))
  const handlePw = (e) => {
    e.preventDefault()
    if (pwForm.newPassword !== pwForm.confirmPassword) return toast.error('Passwords do not match')
    if (pwForm.newPassword.length < 8) return toast.error('Password must be at least 8 characters')
    pwMut.mutate({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword })
  }
  const openExp = (exp = null) => { setExpForm(exp ? { ...exp, startDate: exp.startDate?.split('T')[0] || '', endDate: exp.endDate?.split('T')[0] || '' } : emptyExp); setExpModal(true) }
  const openEdu = (edu = null) => { setEduForm(edu ? { ...edu } : emptyEdu); setEduModal(true) }
  const submitExp = (e) => { e.preventDefault(); const d = { ...expForm, ctc: expForm.ctc ? Number(expForm.ctc) : null, endDate: expForm.isCurrent ? null : expForm.endDate || null }; addExpMut.mutate(d) }
  const submitEdu = (e) => { e.preventDefault(); const d = { ...eduForm, startYear: eduForm.startYear ? Number(eduForm.startYear) : null, endYear: eduForm.endYear ? Number(eduForm.endYear) : null }; addEduMut.mutate(d) }

  if (isLoading) return <PageLoader />
  if (!emp) return (
    <div className="flex items-center gap-3 rounded-xl bg-amber-50 border border-amber-200 p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
        <UserCircleIcon className="h-5 w-5 text-amber-600" />
      </div>
      <div>
        <p className="text-sm font-semibold text-amber-800">Profile Not Set Up</p>
        <p className="text-sm text-amber-600 mt-0.5">Your employee profile is not set up yet. Contact HR to complete your onboarding.</p>
      </div>
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">My Profile</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your personal details and settings</p>
      </div>

      {/* Profile Header Card */}
      <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-card">
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-r from-primary-600 via-primary-700 to-indigo-700" />
        <div className="relative px-6 pb-6 pt-14">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-white text-2xl font-bold ring-4 ring-white shadow-lg">
              {emp.firstName?.[0]}{emp.lastName?.[0] || ''}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">{emp.firstName} {emp.lastName}</h2>
              <p className="text-sm text-gray-500 mt-0.5">{emp.designation?.name} · {emp.department?.name}</p>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="text-xs text-gray-400 font-medium">{emp.employeeCode}</span>
                <span className="h-1 w-1 rounded-full bg-gray-300" />
                <span className="text-xs text-gray-400">{user?.email}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:flex-col sm:items-end">
              <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg font-semibold ${emp.employmentStatus === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/10' : 'bg-gray-100 text-gray-600 ring-1 ring-gray-200'}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${emp.employmentStatus === 'ACTIVE' ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                {emp.employmentStatus}
              </span>
              {emp.bankAccountNumber && (
                <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                  <CheckCircleIcon className="h-3.5 w-3.5" /> Bank verified
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-gray-100/80 p-1 overflow-x-auto scrollbar-hide">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-shrink-0 flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-150 ${tab === t.id ? 'bg-white shadow-sm text-primary-700 ring-1 ring-gray-200/50' : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'}`}>
            <t.icon className={`h-4 w-4 ${tab === t.id ? 'text-primary-600' : ''}`} /><span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="rounded-2xl bg-white border border-gray-100 shadow-card p-6 animate-fade-in">
        {tab === 'personal' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Personal Information</h3>
              <p className="text-sm text-gray-400 mt-0.5">Your basic details managed by HR</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className={labelCls}>First Name</label><input value={emp.firstName} disabled className={inputCls + ' bg-gray-50 text-gray-500 cursor-not-allowed'} /></div>
              <div><label className={labelCls}>Last Name</label><input value={emp.lastName || ''} disabled className={inputCls + ' bg-gray-50 text-gray-500 cursor-not-allowed'} /></div>
              <div><label className={labelCls}>Email</label><input value={emp.email || user?.email} disabled className={inputCls + ' bg-gray-50 text-gray-500 cursor-not-allowed'} /></div>
              <div><label className={labelCls}>Phone <span className="text-red-400">*</span></label><input value={form.phone} onChange={f('phone')} className={inputCls} placeholder="+91 9000000000" /></div>
              <div><label className={labelCls}>Date of Birth</label><input value={emp.dateOfBirth ? emp.dateOfBirth.split('T')[0] : ''} disabled className={inputCls + ' bg-gray-50 text-gray-500 cursor-not-allowed'} /></div>
              <div><label className={labelCls}>Date of Joining</label><input value={emp.dateOfJoining ? emp.dateOfJoining.split('T')[0] : ''} disabled className={inputCls + ' bg-gray-50 text-gray-500 cursor-not-allowed'} /></div>
            </div>
            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button onClick={() => handleSave(['phone'])} disabled={updateMut.isPending}
                className="rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 disabled:opacity-50 transition-colors">
                {updateMut.isPending ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}

        {tab === 'bank' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Bank Account & PAN Details</h3>
              <p className="text-sm text-gray-400 mt-0.5">Used for payroll credit and reimbursements</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2"><label className={labelCls}>Account Holder Name</label><input value={form.bankAccountHolder} onChange={f('bankAccountHolder')} className={inputCls} placeholder="As per bank records" /></div>
              <div><label className={labelCls}>Bank Name</label><input value={form.bankName} onChange={f('bankName')} className={inputCls} placeholder="HDFC Bank" /></div>
              <div><label className={labelCls}>Account Number</label><input value={form.bankAccountNumber} onChange={f('bankAccountNumber')} className={inputCls} placeholder="000123456789" /></div>
              <div><label className={labelCls}>IFSC Code</label><input value={form.bankIFSC} onChange={f('bankIFSC')} className={inputCls} placeholder="HDFC0001234" /></div>
              <div><label className={labelCls}>PAN Number</label><input value={form.panNumber} onChange={f('panNumber')} className={inputCls + ' uppercase'} placeholder="ABCDE1234F" maxLength={10} /></div>
            </div>
            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button onClick={() => handleSave(['bankName', 'bankAccountNumber', 'bankIFSC', 'bankAccountHolder', 'panNumber'])} disabled={updateMut.isPending}
                className="rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 disabled:opacity-50 transition-colors">
                {updateMut.isPending ? 'Saving…' : 'Save Bank Details'}
              </button>
            </div>
          </div>
        )}

        {tab === 'contact' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Address & Emergency Contact</h3>
              <p className="text-sm text-gray-400 mt-0.5">Keep your contact information up to date</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2"><label className={labelCls}>Address</label><input value={form.address} onChange={f('address')} className={inputCls} placeholder="Street address" /></div>
              <div><label className={labelCls}>City</label><input value={form.city} onChange={f('city')} className={inputCls} /></div>
              <div><label className={labelCls}>State</label><input value={form.state} onChange={f('state')} className={inputCls} /></div>
              <div><label className={labelCls}>Postal Code</label><input value={form.postalCode} onChange={f('postalCode')} className={inputCls} /></div>
              <div><label className={labelCls}>Country</label><input value={form.country} onChange={f('country')} className={inputCls} /></div>
            </div>
            <div className="border-t border-gray-100 pt-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50">
                  <PhoneIcon className="h-4 w-4 text-red-500" />
                </div>
                <h4 className="text-sm font-semibold text-gray-900">Emergency Contact</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className={labelCls}>Contact Name</label><input value={form.emergencyContactName} onChange={f('emergencyContactName')} className={inputCls} placeholder="Full name" /></div>
                <div><label className={labelCls}>Contact Phone</label><input value={form.emergencyContactPhone} onChange={f('emergencyContactPhone')} className={inputCls} placeholder="+91 9000000000" /></div>
              </div>
            </div>
            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button onClick={() => handleSave(['address','city','state','country','postalCode','emergencyContactName','emergencyContactPhone'])} disabled={updateMut.isPending}
                className="rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 disabled:opacity-50 transition-colors">
                {updateMut.isPending ? 'Saving…' : 'Save Contact Info'}
              </button>
            </div>
          </div>
        )}

        {tab === 'security' && (
          <div className="space-y-6 max-w-2xl">
            <TwoFactorSettings />

          <form onSubmit={handlePw} className="space-y-5 max-w-md">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Change Password</h3>
              <p className="text-sm text-gray-400 mt-0.5">Must be at least 8 characters long</p>
            </div>
            <div><label className={labelCls}>Current Password</label><input type="password" required value={pwForm.currentPassword} onChange={pw('currentPassword')} className={inputCls} placeholder="Enter current password" /></div>
            <div><label className={labelCls}>New Password</label><input type="password" required value={pwForm.newPassword} onChange={pw('newPassword')} className={inputCls} placeholder="Enter new password" /></div>
            <div><label className={labelCls}>Confirm New Password</label><input type="password" required value={pwForm.confirmPassword} onChange={pw('confirmPassword')} className={inputCls} placeholder="Confirm new password" /></div>
            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button type="submit" disabled={pwMut.isPending}
                className="rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 disabled:opacity-50 transition-colors">
                {pwMut.isPending ? 'Changing…' : 'Change Password'}
              </button>
            </div>
          </form>
          </div>
        )}

        {/* ── Experience ── */}
        {tab === 'experience' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Work Experience</h3>
                <p className="text-sm text-gray-400 mt-0.5">Add your previous and current work history</p>
              </div>
              <button onClick={() => openExp()} className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 transition-colors">
                <PlusIcon className="h-4 w-4" /> Add Experience
              </button>
            </div>
            {(!emp.experiences || emp.experiences.length === 0) ? (
              <div className="text-center py-12">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 mx-auto mb-3">
                  <BriefcaseIcon className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-500">No work experience added yet</p>
                <p className="text-xs text-gray-400 mt-1">Click "Add Experience" to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {emp.experiences.map(ex => (
                  <div key={ex.id} className="group rounded-xl border border-gray-200 p-4 hover:border-gray-300 hover:shadow-sm transition-all">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-3.5">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600 shrink-0 mt-0.5">
                          <BriefcaseIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{ex.jobTitle}</p>
                          <p className="text-sm text-gray-600">{ex.companyName} {ex.location ? `· ${ex.location}` : ''}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-xs text-gray-400">{fmtDate(ex.startDate)} — {ex.isCurrent ? 'Present' : fmtDate(ex.endDate)}</span>
                            <span className="inline-flex items-center rounded-md bg-gray-100 px-1.5 py-0.5 text-[11px] font-medium text-gray-500">{ex.employmentType}</span>
                          </div>
                          {ex.ctc && <p className="text-xs text-gray-500 mt-1">CTC: ₹{Number(ex.ctc).toLocaleString('en-IN')}</p>}
                          {ex.responsibilities && <p className="text-xs text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">{ex.responsibilities}</p>}
                        </div>
                      </div>
                      <div className="flex gap-1 ml-3 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openExp(ex)} className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"><PencilIcon className="h-4 w-4" /></button>
                        <button onClick={() => { if (window.confirm('Remove this experience?')) delExpMut.mutate(ex.id) }} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"><TrashIcon className="h-4 w-4" /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Education ── */}
        {tab === 'education' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Education</h3>
                <p className="text-sm text-gray-400 mt-0.5">Your academic qualifications</p>
              </div>
              <button onClick={() => openEdu()} className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 transition-colors">
                <PlusIcon className="h-4 w-4" /> Add Education
              </button>
            </div>
            {(!emp.educations || emp.educations.length === 0) ? (
              <div className="text-center py-12">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 mx-auto mb-3">
                  <AcademicCapIcon className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-500">No education records added yet</p>
                <p className="text-xs text-gray-400 mt-1">Click "Add Education" to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {emp.educations.map(ed => (
                  <div key={ed.id} className="group rounded-xl border border-gray-200 p-4 hover:border-gray-300 hover:shadow-sm transition-all">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-3.5">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 shrink-0 mt-0.5">
                          <AcademicCapIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{ed.degree}{ed.fieldOfStudy ? ` in ${ed.fieldOfStudy}` : ''}</p>
                          <p className="text-sm text-gray-600">{ed.institution}{ed.board ? ` · ${ed.board}` : ''}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-xs text-gray-400">{ed.startYear || '—'} — {ed.endYear || 'Present'}</span>
                            {ed.grade && <span className="inline-flex items-center rounded-md bg-emerald-50 px-1.5 py-0.5 text-[11px] font-medium text-emerald-600">{ed.grade}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1 ml-3 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdu(ed)} className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"><PencilIcon className="h-4 w-4" /></button>
                        <button onClick={() => { if (window.confirm('Remove this record?')) delEduMut.mutate(ed.id) }} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"><TrashIcon className="h-4 w-4" /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Documents ── */}
        {tab === 'documents' && (
          <div>
            <div className="mb-5">
              <h3 className="text-base font-semibold text-gray-900">My Documents</h3>
              <p className="text-sm text-gray-400 mt-0.5">Documents uploaded by your HR team</p>
            </div>
            {(!emp.documents || emp.documents.length === 0) ? (
              <div className="text-center py-12">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 mx-auto mb-3">
                  <DocumentTextIcon className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-500">No documents found</p>
                <p className="text-xs text-gray-400 mt-1">Ask HR to upload your documents</p>
              </div>
            ) : (
              <div className="space-y-2">
                {emp.documents.map(doc => (
                  <div key={doc.id} className="group flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3.5 hover:border-gray-300 hover:shadow-sm transition-all">
                    <div className="flex items-center gap-3.5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 shrink-0">
                        <DocumentTextIcon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{doc.documentName}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{doc.documentType?.replace(/_/g, ' ')} · {doc.uploadedOn ? format(new Date(doc.uploadedOn), 'dd MMM yyyy') : ''}</p>
                      </div>
                    </div>
                    <a href={`/api/documents/${doc.id}/download`} target="_blank" rel="noopener noreferrer"
                      className="text-sm text-primary-600 hover:text-primary-700 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">Download</a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Experience Modal */}
      {expModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4" onClick={() => setExpModal(null)}>
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto scrollbar-thin animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 tracking-tight">{expForm.id ? 'Edit Experience' : 'Add Experience'}</h2>
              <button onClick={() => setExpModal(null)} className="rounded-lg p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" /></svg>
              </button>
            </div>
            <form onSubmit={submitExp} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2"><label className={labelCls}>Company Name <span className="text-red-400">*</span></label><input required value={expForm.companyName} onChange={ef('companyName')} className={inputCls} placeholder="Company name" /></div>
                <div><label className={labelCls}>Job Title <span className="text-red-400">*</span></label><input required value={expForm.jobTitle} onChange={ef('jobTitle')} className={inputCls} placeholder="Your role" /></div>
                <div><label className={labelCls}>Employment Type</label>
                  <select value={expForm.employmentType} onChange={ef('employmentType')} className={inputCls}>
                    {EMP_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div><label className={labelCls}>Department</label><input value={expForm.department} onChange={ef('department')} className={inputCls} placeholder="e.g. Engineering" /></div>
                <div><label className={labelCls}>Location</label><input value={expForm.location} onChange={ef('location')} className={inputCls} placeholder="City, Country" /></div>
                <div><label className={labelCls}>Start Date <span className="text-red-400">*</span></label><input required type="date" value={expForm.startDate} onChange={ef('startDate')} className={inputCls} /></div>
                <div><label className={labelCls}>End Date</label><input type="date" value={expForm.endDate} onChange={ef('endDate')} disabled={expForm.isCurrent} className={inputCls + (expForm.isCurrent ? ' opacity-40 cursor-not-allowed' : '')} /></div>
                <div className="sm:col-span-2 flex items-center gap-2.5">
                  <input type="checkbox" id="isCurrent" checked={expForm.isCurrent} onChange={ef('isCurrent')} className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                  <label htmlFor="isCurrent" className="text-sm text-gray-700 font-medium">Currently working here</label>
                </div>
                <div><label className={labelCls}>CTC (₹/year)</label><input type="number" value={expForm.ctc} onChange={ef('ctc')} className={inputCls} placeholder="500000" /></div>
                <div><label className={labelCls}>Reason for Leaving</label><input value={expForm.reasonForLeaving} onChange={ef('reasonForLeaving')} className={inputCls} placeholder="Optional" /></div>
                <div className="sm:col-span-2"><label className={labelCls}>Key Responsibilities</label><textarea rows={3} value={expForm.responsibilities} onChange={ef('responsibilities')} className={inputCls} placeholder="Describe your key responsibilities..." /></div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setExpModal(null)} className="rounded-lg px-4 py-2.5 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" disabled={addExpMut.isPending} className="rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 disabled:opacity-50 transition-colors">
                  {addExpMut.isPending ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Education Modal */}
      {eduModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4" onClick={() => setEduModal(null)}>
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 tracking-tight">{eduForm.id ? 'Edit Education' : 'Add Education'}</h2>
              <button onClick={() => setEduModal(null)} className="rounded-lg p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" /></svg>
              </button>
            </div>
            <form onSubmit={submitEdu} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className={labelCls}>Degree / Level <span className="text-red-400">*</span></label><input required value={eduForm.degree} onChange={edf('degree')} className={inputCls} placeholder="B.Tech, MBA, 12th…" /></div>
                <div><label className={labelCls}>Field of Study</label><input value={eduForm.fieldOfStudy} onChange={edf('fieldOfStudy')} className={inputCls} placeholder="Computer Science" /></div>
                <div className="sm:col-span-2"><label className={labelCls}>Institution <span className="text-red-400">*</span></label><input required value={eduForm.institution} onChange={edf('institution')} className={inputCls} placeholder="University or school name" /></div>
                <div className="sm:col-span-2"><label className={labelCls}>University / Board</label><input value={eduForm.board} onChange={edf('board')} className={inputCls} placeholder="e.g. CBSE, VTU" /></div>
                <div><label className={labelCls}>Start Year</label><input type="number" value={eduForm.startYear} onChange={edf('startYear')} className={inputCls} placeholder="2018" min="1960" max="2030" /></div>
                <div><label className={labelCls}>End Year</label><input type="number" value={eduForm.endYear} onChange={edf('endYear')} className={inputCls} placeholder="2022" min="1960" max="2030" /></div>
                <div className="sm:col-span-2"><label className={labelCls}>Grade / Percentage / CGPA</label><input value={eduForm.grade} onChange={edf('grade')} className={inputCls} placeholder="8.5 CGPA / 85%" /></div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setEduModal(null)} className="rounded-lg px-4 py-2.5 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" disabled={addEduMut.isPending} className="rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 disabled:opacity-50 transition-colors">
                  {addEduMut.isPending ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
