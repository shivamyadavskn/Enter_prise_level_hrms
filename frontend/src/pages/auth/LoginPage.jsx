import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.jsx'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = (email, password) => setForm({ email, password })

  return (
    <div className="flex min-h-full">
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600">
              <span className="text-lg font-bold text-white">HR</span>
            </div>
            <h2 className="mt-8 text-2xl font-bold tracking-tight text-gray-900">Sign in to HRMS</h2>
            <p className="mt-2 text-sm text-gray-500">Enterprise Human Resource Management System</p>
          </div>

          <div className="mt-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-900">Email address</label>
                <input
                  id="email" type="email" required autoComplete="email"
                  value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="mt-2 block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-900">Password</label>
                <input
                  id="password" type="password" required autoComplete="current-password"
                  value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="mt-2 block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm"
                />
              </div>

              <button
                type="submit" disabled={loading}
                className="flex w-full justify-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:opacity-50"
              >
                {loading ? 'Signing in…' : 'Sign in'}
              </button>

              <p className="mt-4 text-center text-sm text-gray-500">
                New company?{' '}
                <Link to="/register" className="font-semibold text-primary-600 hover:text-primary-500">Register for free</Link>
              </p>
            </form>

            <div className="mt-4 text-center">
              <Link to="/platform/setup" className="text-xs text-gray-400 hover:text-gray-500">
                Platform admin setup →
              </Link>
            </div>

            <div className="mt-6">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Demo Credentials</p>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { label: 'Super Admin', email: 'superadmin@hrms.com', password: 'SuperAdmin@123', color: 'red' },
                  { label: 'HR Admin',    email: 'admin@hrms.com',       password: 'Admin@123',      color: 'indigo' },
                  { label: 'Manager',     email: 'manager@hrms.com',     password: 'Manager@123',    color: 'purple' },
                  { label: 'Finance',     email: 'finance@hrms.com',     password: 'Finance@123',    color: 'blue' },
                  { label: 'Employee',    email: 'alice@hrms.com',       password: 'Employee@123',   color: 'green' },
                ].map((d) => (
                  <button
                    key={d.email}
                    type="button"
                    onClick={() => fillDemo(d.email, d.password)}
                    className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2 text-xs hover:bg-gray-50 text-left"
                  >
                    <span className="font-medium text-gray-700">{d.label}</span>
                    <span className="text-gray-400">{d.email}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative hidden w-0 flex-1 lg:block">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-primary-900 flex items-center justify-center">
          <div className="text-center text-white px-12">
            <h1 className="text-4xl font-bold mb-4">HRMS Enterprise</h1>
            <p className="text-primary-200 text-lg leading-relaxed">
              Streamline your HR operations with our comprehensive management platform.
              Manage employees, leaves, attendance, payroll and more.
            </p>
            <div className="mt-10 grid grid-cols-2 gap-6 text-left">
              {['Employee Management', 'Leave Tracking', 'Attendance System', 'Payroll Processing', 'Performance Reviews', 'Reports & Analytics'].map((f) => (
                <div key={f} className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary-300" />
                  <span className="text-sm text-primary-100">{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
