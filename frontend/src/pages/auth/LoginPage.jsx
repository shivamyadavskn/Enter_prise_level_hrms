import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.jsx'
import toast from 'react-hot-toast'
import HrDashboardIllustration from '../../assets/illustrations/HrDashboardIllustration.jsx'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '', totp: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [twoFactorStep, setTwoFactorStep] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      // First call: email + password. If 2FA enabled, server replies with twoFactorRequired flag.
      // Second call: include `totp` from authenticator app (or a backup code).
      await login(twoFactorStep ? form : { email: form.email, password: form.password })
      navigate('/')
    } catch (err) {
      if (err.twoFactorRequired) {
        setTwoFactorStep(true)
        setError('')
        setLoading(false)
        return
      }
      setError(err.response?.data?.message || err.message || 'Login failed. Please try again.')
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
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-primary-700 shadow-lg shadow-primary-500/20">
              <span className="text-lg font-extrabold text-white tracking-tight">HR</span>
            </div>
            <h2 className="mt-8 text-2xl font-bold tracking-tight text-gray-900">Welcome back</h2>
            <p className="mt-2 text-sm text-gray-500">Sign in to your HRMS Enterprise account</p>
          </div>

          <div className="mt-10">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-100 p-3.5 text-sm text-red-700">
                  <svg className="h-4 w-4 shrink-0 text-red-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" /></svg>
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
                <input
                  id="email" type="email" required autoComplete="email"
                  placeholder="you@company.com"
                  value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="block w-full rounded-lg border-0 py-2.5 px-3.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-500 sm:text-sm transition-shadow"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <input
                  id="password" type="password" required autoComplete="current-password"
                  placeholder="Enter your password"
                  disabled={twoFactorStep}
                  value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="block w-full rounded-lg border-0 py-2.5 px-3.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-500 sm:text-sm transition-shadow disabled:bg-gray-50"
                />
              </div>

              {twoFactorStep && (
                <div>
                  <label htmlFor="totp" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Authenticator code
                  </label>
                  <input
                    id="totp" type="text" inputMode="numeric" autoFocus required
                    autoComplete="one-time-code"
                    placeholder="123456"
                    pattern="[0-9A-Za-z]{6,12}"
                    value={form.totp}
                    onChange={(e) => setForm({ ...form, totp: e.target.value.replace(/\s/g, '') })}
                    className="block w-full rounded-lg border-0 py-2.5 px-3.5 text-center text-lg font-mono tracking-[0.4em] text-gray-900 shadow-sm ring-1 ring-inset ring-primary-300 placeholder:text-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-500 sm:text-base transition-shadow"
                  />
                  <p className="mt-1.5 text-xs text-gray-500">
                    Enter the 6-digit code from your authenticator app, or one of your backup codes.
                  </p>
                  <button
                    type="button"
                    onClick={() => { setTwoFactorStep(false); setForm({ ...form, totp: '' }); setError('') }}
                    className="mt-2 text-xs text-gray-400 hover:text-gray-600"
                  >
                    ← Use a different account
                  </button>
                </div>
              )}

              <button
                type="submit" disabled={loading}
                className="flex w-full justify-center rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:opacity-50 transition-colors"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    {twoFactorStep ? 'Verifying…' : 'Signing in…'}
                  </span>
                ) : (twoFactorStep ? 'Verify & sign in' : 'Sign in')}
              </button>

              <p className="text-center text-sm text-gray-500">
                New company?{' '}
                <Link to="/register" className="font-semibold text-primary-600 hover:text-primary-500">Register for free</Link>
              </p>
            </form>

            <div className="mt-3 text-center">
              <Link to="/platform/setup" className="text-xs text-gray-400 hover:text-gray-500 transition-colors">
                Platform admin setup →
              </Link>
            </div>

            {import.meta.env.DEV && (
            <div className="mt-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-px flex-1 bg-gray-200" />
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Demo Accounts <span className="text-amber-500">(dev only)</span></p>
                <div className="h-px flex-1 bg-gray-200" />
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {[
                  { label: 'Super Admin', email: 'superadmin@hrms.com', password: 'SuperAdmin@123', dot: 'bg-red-500' },
                  { label: 'HR Admin',    email: 'admin@hrms.com',       password: 'Admin@123',      dot: 'bg-indigo-500' },
                  { label: 'Manager',     email: 'manager@hrms.com',     password: 'Manager@123',    dot: 'bg-purple-500' },
                  { label: 'Finance',     email: 'finance@hrms.com',     password: 'Finance@123',    dot: 'bg-blue-500' },
                  { label: 'Employee',    email: 'alice@hrms.com',       password: 'Employee@123',   dot: 'bg-emerald-500' },
                ].map((d) => (
                  <button
                    key={d.email}
                    type="button"
                    onClick={() => fillDemo(d.email, d.password)}
                    className="flex items-center gap-2.5 rounded-lg border border-gray-200 px-3 py-2 text-xs hover:bg-gray-50 hover:border-gray-300 text-left transition-colors group"
                  >
                    <span className={`h-2 w-2 rounded-full ${d.dot} shrink-0`} />
                    <span className="font-semibold text-gray-700 group-hover:text-gray-900">{d.label}</span>
                    <span className="text-gray-400 ml-auto text-[11px]">{d.email}</span>
                  </button>
                ))}
              </div>
            </div>
            )}
          </div>
        </div>
      </div>

      <div className="relative hidden w-0 flex-1 lg:block">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-700 via-primary-800 to-violet-900 flex flex-col items-center justify-center overflow-hidden px-12">
          {/* Decorative background circles */}
          <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white opacity-5" />
          <div className="absolute -bottom-32 -left-16 h-72 w-72 rounded-full bg-white opacity-5" />

          {/* Headline */}
          <div className="relative z-10 w-full max-w-lg text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-1.5 mb-6">
              <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-medium text-white/80 uppercase tracking-widest">Enterprise HRMS</span>
            </div>
            <h1 className="text-4xl font-bold text-white leading-tight mb-3">
              Your entire HR<br />in one place
            </h1>
            <p className="text-primary-200 text-base leading-relaxed mb-8">
              Manage employees, track leaves, process payroll, and get real-time insights — all from a single dashboard.
            </p>

            {/* Illustration */}
            <HrDashboardIllustration className="w-full max-w-md mx-auto drop-shadow-2xl" />

            {/* Feature pills */}
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {['👥 Employees', '📅 Leaves', '🕐 Attendance', '💰 Payroll', '📊 Reports', '🎯 Performance'].map((f) => (
                <span key={f} className="rounded-full bg-white/10 border border-white/15 px-3 py-1 text-xs text-white/80 font-medium backdrop-blur-sm">
                  {f}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
