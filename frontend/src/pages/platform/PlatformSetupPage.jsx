import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { platformApi } from '../../api/index.js'
import { ShieldCheckIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

const inputCls = 'mt-1 block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm'

export default function PlatformSetupPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '', confirm: '' })
  const [loading, setLoading] = useState(false)

  const f = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirm) return toast.error('Passwords do not match')
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters')
    setLoading(true)
    try {
      await platformApi.seed({ email: form.email, password: form.password })
      toast.success('Platform admin created! Please login.')
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Setup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-600">
            <ShieldCheckIcon className="h-8 w-8 text-white" />
          </div>
        </div>
        <h1 className="text-center text-2xl font-bold text-white mb-1">Platform Admin Setup</h1>
        <p className="text-center text-sm text-gray-400 mb-8">One-time setup. Can only be done once.</p>

        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300">Email</label>
              <input type="email" required value={form.email} onChange={f('email')} className={inputCls} placeholder="admin@yourplatform.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300">Password</label>
              <input type="password" required value={form.password} onChange={f('password')} className={inputCls} placeholder="Min. 8 characters" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300">Confirm Password</label>
              <input type="password" required value={form.confirm} onChange={f('confirm')} className={inputCls} />
            </div>
            <button type="submit" disabled={loading}
              className="w-full rounded-lg bg-primary-600 py-2.5 text-sm font-semibold text-white hover:bg-primary-500 disabled:opacity-50 transition-colors">
              {loading ? 'Creating…' : 'Create Platform Admin'}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-sm text-gray-500">
          <Link to="/login" className="text-gray-400 hover:text-white">← Back to login</Link>
        </p>
      </div>
    </div>
  )
}
