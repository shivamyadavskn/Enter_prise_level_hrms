import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { organisationApi } from '../../api/index.js'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { PageLoader } from '../../components/common/LoadingSpinner.jsx'
import { BuildingOfficeIcon, ShieldCheckIcon, CurrencyRupeeIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

const inputCls = 'mt-1 block w-full rounded-md border-0 py-1.5 px-3 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm'
const labelCls = 'block text-sm font-medium text-gray-700'

const INDUSTRIES = ['Technology', 'Healthcare', 'Manufacturing', 'Retail', 'Education', 'Finance', 'Construction', 'Hospitality', 'Other']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export default function OrganisationSettingsPage() {
  const { isAdmin } = useAuth()
  const qc = useQueryClient()
  const [form, setForm] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['organisation'],
    queryFn: organisationApi.get,
  })

  useEffect(() => {
    if (data?.data?.data) setForm({ ...data.data.data })
  }, [data])

  const updateMut = useMutation({
    mutationFn: organisationApi.update,
    onSuccess: () => { qc.invalidateQueries(['organisation']); toast.success('Organisation settings saved') },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to save'),
  })

  const f = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })

  if (isLoading || !form) return <PageLoader />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Organisation Settings</h1>
        <p className="text-sm text-gray-500">Manage your company profile and compliance settings</p>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); updateMut.mutate(form) }} className="space-y-6">

        {/* Company Info */}
        <div className="rounded-lg bg-white shadow p-6">
          <div className="flex items-center gap-2 mb-5">
            <BuildingOfficeIcon className="h-5 w-5 text-primary-600" />
            <h2 className="text-base font-semibold text-gray-900">Company Profile</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelCls}>Company Name *</label>
              <input required value={form.name || ''} onChange={f('name')} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Industry</label>
              <select value={form.industry || ''} onChange={f('industry')} className={inputCls}>
                <option value="">Select</option>
                {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Company Size</label>
              <select value={form.size || ''} onChange={f('size')} className={inputCls}>
                <option value="">Select</option>
                {['1-10', '11-20', '21-50', '51-100', '101-250', '250+'].map(s => <option key={s} value={s}>{s} employees</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Phone</label>
              <input value={form.phone || ''} onChange={f('phone')} className={inputCls} placeholder="+91 98765 43210" />
            </div>
            <div>
              <label className={labelCls}>Email</label>
              <input type="email" value={form.email || ''} onChange={f('email')} className={inputCls} placeholder="hr@company.com" />
            </div>
            <div>
              <label className={labelCls}>Website</label>
              <input value={form.website || ''} onChange={f('website')} className={inputCls} placeholder="https://company.com" />
            </div>
            <div>
              <label className={labelCls}>City</label>
              <input value={form.city || ''} onChange={f('city')} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>State</label>
              <input value={form.state || ''} onChange={f('state')} className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Address</label>
              <textarea rows={2} value={form.address || ''} onChange={f('address')} className={inputCls} />
            </div>
          </div>
        </div>

        {/* Payroll & Compliance */}
        <div className="rounded-lg bg-white shadow p-6">
          <div className="flex items-center gap-2 mb-5">
            <CurrencyRupeeIcon className="h-5 w-5 text-primary-600" />
            <h2 className="text-base font-semibold text-gray-900">Payroll & Compliance</h2>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Financial Year Start Month</label>
              <select value={form.financialYearStart || 4} onChange={f('financialYearStart')} className={inputCls}>
                {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
              </select>
              <p className="mt-1 text-xs text-gray-400">Most Indian companies use April (month 4)</p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <div className="rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">PF (Provident Fund)</p>
                  <p className="text-xs text-gray-500 mt-0.5">Mandatory when you have 20+ employees. 12% employer + 12% employee contribution.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={!!form.pfEnabled} onChange={f('pfEnabled')} className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-primary-600 after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                </label>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">ESIC (Employee State Insurance)</p>
                  <p className="text-xs text-gray-500 mt-0.5">Mandatory when you have 10+ employees earning ≤ ₹21,000/month.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={!!form.esicEnabled} onChange={f('esicEnabled')} className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-primary-600 after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Compliance Info Card */}
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 flex gap-3">
          <ShieldCheckIcon className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700">
            <p className="font-medium">Compliance Status</p>
            <ul className="mt-1 space-y-1 text-xs">
              <li>✅ PF: {form.pfEnabled ? 'Enabled — 12% employer + 12% employee deducted automatically' : 'Disabled'}</li>
              <li>✅ ESIC: {form.esicEnabled ? 'Enabled — 3.25% employer + 0.75% employee for eligible staff' : 'Disabled'}</li>
              <li>✅ Professional Tax: Configured per-state in salary structures</li>
              <li>✅ TDS: Set individually per employee salary structure</li>
            </ul>
          </div>
        </div>

        {isAdmin() && (
          <div className="flex justify-end">
            <button type="submit" disabled={updateMut.isPending}
              className="rounded-md bg-primary-600 px-5 py-2 text-sm font-semibold text-white hover:bg-primary-500 disabled:opacity-50">
              {updateMut.isPending ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        )}
      </form>
    </div>
  )
}
