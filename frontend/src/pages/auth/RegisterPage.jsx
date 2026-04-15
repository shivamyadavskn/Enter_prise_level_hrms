import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { organisationApi } from '../../api/index.js'
import toast from 'react-hot-toast'
import { BuildingOfficeIcon, CheckCircleIcon, EnvelopeIcon } from '@heroicons/react/24/outline'

const INDUSTRIES = ['Technology', 'Healthcare', 'Manufacturing', 'Retail', 'Education', 'Finance', 'Construction', 'Hospitality', 'Other']

const inputCls = 'mt-1 block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm'
const labelCls = 'block text-sm font-medium text-gray-700'

const NEXT_STEPS = [
  { num: '1', title: 'Configure company settings', desc: 'Add address, PF/ESIC and financial year under Organisation settings.' },
  { num: '2', title: 'Add your employees', desc: 'Import via Excel or add employees one by one.' },
  { num: '3', title: 'Set up departments & designations', desc: 'Organise your workforce structure.' },
  { num: '4', title: 'Configure leave policies', desc: 'Define leave types, quotas and allocate balances.' },
]

function SuccessScreen({ orgName, email }) {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="flex justify-center mb-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircleIcon className="h-10 w-10 text-green-600" />
          </div>
        </div>
        <h2 className="text-center text-2xl font-bold text-gray-900">You're all set! 🎉</h2>
        <p className="mt-1 text-center text-sm text-gray-500">
          <span className="font-semibold text-gray-700">{orgName}</span> has been registered successfully.
        </p>

        <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
          <EnvelopeIcon className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-blue-800">Check your email</p>
            <p className="text-sm text-blue-600 mt-0.5">A welcome email with login details and getting-started guide has been sent to <strong>{email}</strong></p>
          </div>
        </div>

        <div className="mt-6 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm font-semibold text-gray-700 mb-4">🚀 What to do after you login</p>
          <div className="space-y-3">
            {NEXT_STEPS.map(s => (
              <div key={s.num} className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">{s.num}</span>
                <div>
                  <p className="text-sm font-medium text-gray-800">{s.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => navigate('/login')}
          className="mt-6 w-full flex justify-center rounded-md bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-500 transition-colors"
        >
          Login to your account →
        </button>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(null)
  const [form, setForm] = useState({
    orgName: '', industry: '', adminFirstName: '', adminLastName: '', adminEmail: '', password: '', confirmPassword: '',
  })

  const f = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  if (success) return <SuccessScreen orgName={success.orgName} email={success.email} />

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match')
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters')

    setLoading(true)
    try {
      await organisationApi.register({
        orgName: form.orgName, industry: form.industry,
        adminFirstName: form.adminFirstName, adminLastName: form.adminLastName,
        adminEmail: form.adminEmail, password: form.password,
      })
      setSuccess({ orgName: form.orgName, email: form.adminEmail })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600">
            <BuildingOfficeIcon className="h-7 w-7 text-white" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold text-gray-900">Set up your company</h2>
        <p className="mt-1 text-center text-sm text-gray-500">Free for up to 20 employees · No credit card required</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm rounded-xl border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="border-b border-gray-100 pb-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Company Info</p>
              <div className="space-y-4">
                <div>
                  <label className={labelCls}>Company Name *</label>
                  <input required value={form.orgName} onChange={f('orgName')} className={inputCls} placeholder="Acme Technologies Pvt Ltd" />
                </div>
                <div>
                  <label className={labelCls}>Industry</label>
                  <select value={form.industry} onChange={f('industry')} className={inputCls}>
                    <option value="">Select industry</option>
                    {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Admin Account</p>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>First Name *</label>
                    <input required value={form.adminFirstName} onChange={f('adminFirstName')} className={inputCls} placeholder="Rajan" />
                  </div>
                  <div>
                    <label className={labelCls}>Last Name</label>
                    <input value={form.adminLastName} onChange={f('adminLastName')} className={inputCls} placeholder="Sharma" />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Work Email *</label>
                  <input type="email" required value={form.adminEmail} onChange={f('adminEmail')} className={inputCls} placeholder="rajan@acme.com" />
                </div>
                <div>
                  <label className={labelCls}>Password *</label>
                  <input type="password" required value={form.password} onChange={f('password')} className={inputCls} placeholder="Min. 8 characters" />
                </div>
                <div>
                  <label className={labelCls}>Confirm Password *</label>
                  <input type="password" required value={form.confirmPassword} onChange={f('confirmPassword')} className={inputCls} />
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full flex justify-center rounded-md bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-500 disabled:opacity-50 transition-colors">
              {loading ? 'Setting up your account…' : 'Create Company & Account'}
            </button>

            <p className="text-center text-sm text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-500">Sign in</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
