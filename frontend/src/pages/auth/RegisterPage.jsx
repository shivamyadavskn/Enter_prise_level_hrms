import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { organisationApi } from '../../api/index.js'
import toast from 'react-hot-toast'
import { BuildingOfficeIcon } from '@heroicons/react/24/outline'

const INDUSTRIES = ['Technology', 'Healthcare', 'Manufacturing', 'Retail', 'Education', 'Finance', 'Construction', 'Hospitality', 'Other']

const inputCls = 'mt-1 block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm'
const labelCls = 'block text-sm font-medium text-gray-700'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    orgName: '', industry: '', adminFirstName: '', adminLastName: '', adminEmail: '', password: '', confirmPassword: '',
  })

  const f = (k) => (e) => setForm({ ...form, [k]: e.target.value })

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
      toast.success('Company registered! Please login.')
      navigate('/login')
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
