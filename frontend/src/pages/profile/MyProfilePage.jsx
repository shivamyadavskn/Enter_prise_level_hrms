import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { employeesApi, authApi } from '../../api/index.js'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { PageLoader } from '../../components/common/LoadingSpinner.jsx'
import { UserCircleIcon, KeyIcon, BanknotesIcon, PhoneIcon, CheckCircleIcon, BriefcaseIcon, AcademicCapIcon, DocumentTextIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const inputCls = 'mt-1 block w-full rounded-md border-0 py-1.5 px-3 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm'
const labelCls = 'block text-sm font-medium text-gray-700'
const fmtDate = (d) => d ? format(new Date(d), 'MMM yyyy') : 'Present'

const TABS = [
  { id: 'personal',   label: 'Personal Info',        icon: UserCircleIcon },
  { id: 'bank',       label: 'Bank & PAN',            icon: BanknotesIcon },
  { id: 'contact',    label: 'Contact & Emergency',   icon: PhoneIcon },
  { id: 'experience', label: 'Experience',            icon: BriefcaseIcon },
  { id: 'education',  label: 'Education',             icon: AcademicCapIcon },
  { id: 'documents',  label: 'Documents',             icon: DocumentTextIcon },
  { id: 'password',   label: 'Change Password',       icon: KeyIcon },
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
      <div className="flex gap-1 rounded-lg bg-gray-100 p-1 overflow-x-auto">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-shrink-0 flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-all ${tab === t.id ? 'bg-white shadow text-primary-600' : 'text-gray-600 hover:text-gray-900'}`}>
            <t.icon className="h-4 w-4" /><span>{t.label}</span>
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

        {/* ── Experience ── */}
        {tab === 'experience' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900">Work Experience</h3>
              <button onClick={() => openExp()} className="inline-flex items-center gap-1 rounded-md bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-500">
                <PlusIcon className="h-4 w-4" /> Add
              </button>
            </div>
            {(!emp.experiences || emp.experiences.length === 0) ? (
              <p className="text-sm text-gray-400 text-center py-8">No work experience added yet.</p>
            ) : (
              <div className="space-y-4">
                {emp.experiences.map(ex => (
                  <div key={ex.id} className="rounded-lg border border-gray-200 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{ex.jobTitle}</p>
                        <p className="text-sm text-gray-600">{ex.companyName} {ex.location ? `· ${ex.location}` : ''}</p>
                        <p className="text-xs text-gray-400 mt-1">{fmtDate(ex.startDate)} — {ex.isCurrent ? 'Present' : fmtDate(ex.endDate)} · {ex.employmentType}</p>
                        {ex.ctc && <p className="text-xs text-gray-500 mt-0.5">CTC: ₹{Number(ex.ctc).toLocaleString('en-IN')}</p>}
                        {ex.responsibilities && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{ex.responsibilities}</p>}
                      </div>
                      <div className="flex gap-2 ml-3 flex-shrink-0">
                        <button onClick={() => openExp(ex)} className="text-gray-400 hover:text-primary-600"><PencilIcon className="h-4 w-4" /></button>
                        <button onClick={() => { if (window.confirm('Remove this experience?')) delExpMut.mutate(ex.id) }} className="text-gray-400 hover:text-red-600"><TrashIcon className="h-4 w-4" /></button>
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
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900">Education</h3>
              <button onClick={() => openEdu()} className="inline-flex items-center gap-1 rounded-md bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-500">
                <PlusIcon className="h-4 w-4" /> Add
              </button>
            </div>
            {(!emp.educations || emp.educations.length === 0) ? (
              <p className="text-sm text-gray-400 text-center py-8">No education records added yet.</p>
            ) : (
              <div className="space-y-4">
                {emp.educations.map(ed => (
                  <div key={ed.id} className="rounded-lg border border-gray-200 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{ed.degree}{ed.fieldOfStudy ? ` in ${ed.fieldOfStudy}` : ''}</p>
                        <p className="text-sm text-gray-600">{ed.institution}{ed.board ? ` · ${ed.board}` : ''}</p>
                        <p className="text-xs text-gray-400 mt-1">{ed.startYear || '—'} — {ed.endYear || 'Present'}{ed.grade ? ` · ${ed.grade}` : ''}</p>
                      </div>
                      <div className="flex gap-2 ml-3 flex-shrink-0">
                        <button onClick={() => openEdu(ed)} className="text-gray-400 hover:text-primary-600"><PencilIcon className="h-4 w-4" /></button>
                        <button onClick={() => { if (window.confirm('Remove this record?')) delEduMut.mutate(ed.id) }} className="text-gray-400 hover:text-red-600"><TrashIcon className="h-4 w-4" /></button>
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
            <h3 className="text-base font-semibold text-gray-900 mb-4">My Documents</h3>
            {(!emp.documents || emp.documents.length === 0) ? (
              <p className="text-sm text-gray-400 text-center py-8">No documents found. Ask HR to upload your documents.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {emp.documents.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <DocumentTextIcon className="h-8 w-8 text-primary-500 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{doc.documentName}</p>
                        <p className="text-xs text-gray-400">{doc.documentType?.replace(/_/g, ' ')} · {doc.uploadedOn ? format(new Date(doc.uploadedOn), 'dd MMM yyyy') : ''}</p>
                      </div>
                    </div>
                    <a href={`/api/documents/${doc.id}/download`} target="_blank" rel="noopener noreferrer"
                      className="text-sm text-primary-600 hover:underline font-medium">Download</a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Experience Modal */}
      {expModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">{expForm.id ? 'Edit Experience' : 'Add Experience'}</h2>
              <button onClick={() => setExpModal(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <form onSubmit={submitExp} className="p-6 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><label className={labelCls}>Company Name *</label><input required value={expForm.companyName} onChange={ef('companyName')} className={inputCls} /></div>
                <div><label className={labelCls}>Job Title *</label><input required value={expForm.jobTitle} onChange={ef('jobTitle')} className={inputCls} /></div>
                <div><label className={labelCls}>Employment Type</label>
                  <select value={expForm.employmentType} onChange={ef('employmentType')} className={inputCls}>
                    {EMP_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div><label className={labelCls}>Department</label><input value={expForm.department} onChange={ef('department')} className={inputCls} /></div>
                <div><label className={labelCls}>Location</label><input value={expForm.location} onChange={ef('location')} className={inputCls} /></div>
                <div><label className={labelCls}>Start Date *</label><input required type="date" value={expForm.startDate} onChange={ef('startDate')} className={inputCls} /></div>
                <div><label className={labelCls}>End Date</label><input type="date" value={expForm.endDate} onChange={ef('endDate')} disabled={expForm.isCurrent} className={inputCls + (expForm.isCurrent ? ' opacity-40' : '')} /></div>
                <div className="col-span-2 flex items-center gap-2">
                  <input type="checkbox" id="isCurrent" checked={expForm.isCurrent} onChange={ef('isCurrent')} className="h-4 w-4 rounded border-gray-300 text-primary-600" />
                  <label htmlFor="isCurrent" className="text-sm text-gray-700">Currently working here</label>
                </div>
                <div><label className={labelCls}>CTC (₹/year)</label><input type="number" value={expForm.ctc} onChange={ef('ctc')} className={inputCls} placeholder="500000" /></div>
                <div><label className={labelCls}>Reason for Leaving</label><input value={expForm.reasonForLeaving} onChange={ef('reasonForLeaving')} className={inputCls} /></div>
                <div className="col-span-2"><label className={labelCls}>Key Responsibilities</label><textarea rows={3} value={expForm.responsibilities} onChange={ef('responsibilities')} className={inputCls} /></div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setExpModal(null)} className="rounded-md px-4 py-2 text-sm border border-gray-300 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={addExpMut.isPending} className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-500 disabled:opacity-50">
                  {addExpMut.isPending ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Education Modal */}
      {eduModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">{eduForm.id ? 'Edit Education' : 'Add Education'}</h2>
              <button onClick={() => setEduModal(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <form onSubmit={submitEdu} className="p-6 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>Degree / Level *</label><input required value={eduForm.degree} onChange={edf('degree')} className={inputCls} placeholder="B.Tech, MBA, 12th…" /></div>
                <div><label className={labelCls}>Field of Study</label><input value={eduForm.fieldOfStudy} onChange={edf('fieldOfStudy')} className={inputCls} placeholder="Computer Science" /></div>
                <div className="col-span-2"><label className={labelCls}>Institution *</label><input required value={eduForm.institution} onChange={edf('institution')} className={inputCls} /></div>
                <div className="col-span-2"><label className={labelCls}>University / Board</label><input value={eduForm.board} onChange={edf('board')} className={inputCls} /></div>
                <div><label className={labelCls}>Start Year</label><input type="number" value={eduForm.startYear} onChange={edf('startYear')} className={inputCls} placeholder="2018" min="1960" max="2030" /></div>
                <div><label className={labelCls}>End Year</label><input type="number" value={eduForm.endYear} onChange={edf('endYear')} className={inputCls} placeholder="2022" min="1960" max="2030" /></div>
                <div className="col-span-2"><label className={labelCls}>Grade / Percentage / CGPA</label><input value={eduForm.grade} onChange={edf('grade')} className={inputCls} placeholder="8.5 CGPA / 85%" /></div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setEduModal(null)} className="rounded-md px-4 py-2 text-sm border border-gray-300 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={addEduMut.isPending} className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-500 disabled:opacity-50">
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
