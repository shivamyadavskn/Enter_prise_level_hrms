import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { separationApi, employeesApi } from '../../api/index.js'
import Modal from '../../components/common/Modal.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import { PageLoader } from '../../components/common/LoadingSpinner.jsx'
import { UserMinusIcon, PlusIcon, CalculatorIcon, CheckCircleIcon, XMarkIcon, ClipboardDocumentCheckIcon, CurrencyRupeeIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

const SEP_TYPES = ['RESIGNATION', 'TERMINATION', 'RETIREMENT', 'ABSCONDING', 'CONTRACT_END', 'MUTUAL']
const STATUS_COLORS = {
  INITIATED: 'bg-blue-100 text-blue-700', IN_PROGRESS: 'bg-amber-100 text-amber-700',
  FNF_CALCULATED: 'bg-purple-100 text-purple-700', FNF_APPROVED: 'bg-cyan-100 text-cyan-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700', CANCELLED: 'bg-gray-100 text-gray-500',
}
const TYPE_COLORS = {
  RESIGNATION: 'bg-amber-100 text-amber-700', TERMINATION: 'bg-red-100 text-red-700',
  RETIREMENT: 'bg-blue-100 text-blue-700', ABSCONDING: 'bg-red-100 text-red-700',
  CONTRACT_END: 'bg-gray-100 text-gray-700', MUTUAL: 'bg-purple-100 text-purple-700',
}

export default function SeparationPage() {
  const qc = useQueryClient()
  const [initModal, setInitModal] = useState(false)
  const [fnfModal, setFnfModal] = useState(null)
  const [detailModal, setDetailModal] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [form, setForm] = useState({ employeeId: '', separationType: 'RESIGNATION', reason: '', resignationDate: '', lastWorkingDate: '', noticePeriodDays: 30 })

  const { data: empData } = useQuery({ queryKey: ['emp-list-sep'], queryFn: () => employeesApi.getAll({ limit: 500 }) })
  const { data, isLoading } = useQuery({ queryKey: ['separations', statusFilter], queryFn: () => separationApi.getAll({ status: statusFilter || undefined }) })

  const employees = empData?.data?.data?.employees || empData?.data?.data || []
  const separations = data?.data?.data || []

  const initMut = useMutation({
    mutationFn: separationApi.initiate,
    onSuccess: () => { qc.invalidateQueries(['separations']); setInitModal(false); toast.success('Separation initiated') },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  })

  const fnfMut = useMutation({
    mutationFn: (id) => separationApi.calculateFnF(id),
    onSuccess: (res) => { qc.invalidateQueries(['separations']); setFnfModal(res.data?.data); toast.success('FnF calculated') },
    onError: (err) => toast.error(err.response?.data?.message || 'FnF calculation failed'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => separationApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries(['separations']); toast.success('Updated') },
  })

  const cancelMut = useMutation({
    mutationFn: (id) => separationApi.cancel(id, { reason: 'Cancelled by admin' }),
    onSuccess: () => { qc.invalidateQueries(['separations']); toast.success('Separation cancelled') },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Separation & Offboarding</h1>
          <p className="text-sm text-gray-500">Manage employee exits, FnF settlement, and asset recovery</p>
        </div>
        <button onClick={() => { setInitModal(true); setForm({ employeeId: '', separationType: 'RESIGNATION', reason: '', resignationDate: '', lastWorkingDate: '', noticePeriodDays: 30 }) }}
          className="flex items-center gap-1.5 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-700 shadow-sm transition-all">
          <PlusIcon className="h-4 w-4" /> Initiate Separation
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {['INITIATED', 'IN_PROGRESS', 'FNF_CALCULATED', 'FNF_APPROVED', 'COMPLETED', 'CANCELLED'].map(s => {
          const count = separations.filter(sep => sep.status === s).length
          return (
            <button key={s} onClick={() => setStatusFilter(statusFilter === s ? '' : s)}
              className={`rounded-xl p-3 border text-left transition-all ${statusFilter === s ? 'ring-2 ring-primary-400 border-primary-300' : 'border-gray-200 hover:border-gray-300'}`}>
              <p className="text-xl font-black text-gray-900">{count}</p>
              <p className="text-[10px] font-bold text-gray-500 uppercase">{s.replace(/_/g, ' ')}</p>
            </button>
          )
        })}
      </div>

      {/* Table */}
      <div className="rounded-xl bg-white shadow-card border border-gray-100 overflow-hidden">
        {isLoading ? <PageLoader /> : separations.length === 0 ? (
          <EmptyState title="No separations" description="No employee separations found." />
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Employee', 'Type', 'Initiated', 'Last Working Day', 'Notice', 'FnF', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {separations.map(s => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-gray-900">{s.employee?.firstName} {s.employee?.lastName}</p>
                    <p className="text-xs text-gray-500">{s.employee?.employeeCode} · {s.employee?.department?.name}</p>
                  </td>
                  <td className="px-4 py-3"><span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${TYPE_COLORS[s.separationType] || 'bg-gray-100 text-gray-700'}`}>{s.separationType}</span></td>
                  <td className="px-4 py-3 text-sm text-gray-600">{new Date(s.initiatedDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{s.lastWorkingDate ? new Date(s.lastWorkingDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{s.noticePeriodServed}/{s.noticePeriodDays} days</td>
                  <td className="px-4 py-3 text-sm font-bold">{s.fnfAmount != null ? <span className="text-emerald-700">₹{Number(s.fnfAmount).toLocaleString('en-IN')}</span> : '—'}</td>
                  <td className="px-4 py-3"><span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${STATUS_COLORS[s.status]}`}>{s.status.replace(/_/g, ' ')}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {s.status !== 'COMPLETED' && s.status !== 'CANCELLED' && (
                        <>
                          <button onClick={() => fnfMut.mutate(s.id)} title="Calculate FnF"
                            className="rounded p-1.5 text-purple-600 hover:bg-purple-50"><CalculatorIcon className="h-4 w-4" /></button>
                          <button onClick={() => updateMut.mutate({ id: s.id, data: { status: 'COMPLETED' } })} title="Mark Complete"
                            className="rounded p-1.5 text-emerald-600 hover:bg-emerald-50"><CheckCircleIcon className="h-4 w-4" /></button>
                          <button onClick={() => { if (confirm('Cancel this separation?')) cancelMut.mutate(s.id) }} title="Cancel"
                            className="rounded p-1.5 text-red-600 hover:bg-red-50"><XMarkIcon className="h-4 w-4" /></button>
                        </>
                      )}
                      {s.fnfBreakdown && (
                        <button onClick={() => setFnfModal({ fnfBreakdown: s.fnfBreakdown, separation: s })} title="View FnF"
                          className="rounded p-1.5 text-cyan-600 hover:bg-cyan-50"><CurrencyRupeeIcon className="h-4 w-4" /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Initiate Modal */}
      <Modal open={initModal} onClose={() => setInitModal(false)} title="Initiate Employee Separation" size="md">
        <form onSubmit={e => { e.preventDefault(); initMut.mutate({ ...form, employeeId: Number(form.employeeId), noticePeriodDays: Number(form.noticePeriodDays) }) }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Employee *</label>
            <select required value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })}
              className="w-full rounded-lg border-0 py-2.5 px-3 text-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-500">
              <option value="">— Select Employee —</option>
              {employees.filter(e => e.employmentStatus === 'ACTIVE' || e.employmentStatus === 'PROBATION').map(e => (
                <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.employeeCode})</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Separation Type *</label>
              <select required value={form.separationType} onChange={e => setForm({ ...form, separationType: e.target.value })}
                className="w-full rounded-lg border-0 py-2.5 px-3 text-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-500">
                {SEP_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notice Period (days)</label>
              <input type="number" min={0} value={form.noticePeriodDays} onChange={e => setForm({ ...form, noticePeriodDays: e.target.value })}
                className="w-full rounded-lg border-0 py-2.5 px-3 text-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Resignation Date</label>
              <input type="date" value={form.resignationDate} onChange={e => setForm({ ...form, resignationDate: e.target.value })}
                className="w-full rounded-lg border-0 py-2.5 px-3 text-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Working Date</label>
              <input type="date" value={form.lastWorkingDate} onChange={e => setForm({ ...form, lastWorkingDate: e.target.value })}
                className="w-full rounded-lg border-0 py-2.5 px-3 text-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
            <textarea rows={3} value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })}
              className="w-full rounded-lg border-0 py-2 px-3 text-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-500" placeholder="Reason for separation…" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setInitModal(false)} className="rounded-lg px-4 py-2 text-sm text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={initMut.isPending} className="rounded-lg bg-red-600 px-5 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50">
              {initMut.isPending ? 'Initiating…' : 'Initiate Separation'}
            </button>
          </div>
        </form>
      </Modal>

      {/* FnF Breakdown Modal */}
      {fnfModal && (
        <Modal open={!!fnfModal} onClose={() => setFnfModal(null)} title="Full & Final Settlement" size="md">
          <div className="space-y-4">
            {(() => {
              const b = fnfModal.fnfBreakdown
              if (!b) return <p className="text-sm text-gray-500">No breakdown data</p>
              return (
                <>
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-gray-500 uppercase">Earnings</h4>
                    <div className="rounded-lg border border-gray-200 divide-y divide-gray-100">
                      {[
                        { label: 'Pending Salary', value: b.pendingSalary },
                        { label: 'Leave Encashment', value: b.leaveEncashment },
                        { label: 'Gratuity', value: b.gratuity },
                        { label: 'PF Settlement', value: b.pfSettlement },
                      ].map(r => (
                        <div key={r.label} className="flex justify-between px-4 py-2.5">
                          <span className="text-sm text-gray-600">{r.label}</span>
                          <span className="text-sm font-semibold text-emerald-700">₹{Number(r.value || 0).toLocaleString('en-IN')}</span>
                        </div>
                      ))}
                      <div className="flex justify-between px-4 py-2.5 bg-emerald-50">
                        <span className="text-sm font-bold text-gray-900">Total Earnings</span>
                        <span className="text-sm font-black text-emerald-700">₹{Number(b.totalEarnings || 0).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-gray-500 uppercase">Deductions</h4>
                    <div className="rounded-lg border border-gray-200 divide-y divide-gray-100">
                      {[
                        { label: 'Notice Period Shortfall', value: b.noticeRecovery },
                        { label: 'Monthly Deductions', value: b.totalDeductions - b.noticeRecovery },
                      ].map(r => (
                        <div key={r.label} className="flex justify-between px-4 py-2.5">
                          <span className="text-sm text-gray-600">{r.label}</span>
                          <span className="text-sm font-semibold text-red-600">₹{Number(r.value || 0).toLocaleString('en-IN')}</span>
                        </div>
                      ))}
                      <div className="flex justify-between px-4 py-2.5 bg-red-50">
                        <span className="text-sm font-bold text-gray-900">Total Deductions</span>
                        <span className="text-sm font-black text-red-600">₹{Number(b.totalDeductions || 0).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 p-5 text-white text-center">
                    <p className="text-xs font-medium opacity-80">NET PAYABLE</p>
                    <p className="text-3xl font-black mt-1">₹{Number(b.netPayable || 0).toLocaleString('en-IN')}</p>
                  </div>

                  {b.encashableLeaves?.length > 0 && (
                    <div className="text-xs text-gray-500">
                      <p className="font-semibold mb-1">Leave Encashment Breakdown:</p>
                      {b.encashableLeaves.map((l, i) => (
                        <p key={i}>{l.type}: {l.days} days = ₹{Number(l.amount).toLocaleString('en-IN')}</p>
                      ))}
                    </div>
                  )}
                </>
              )
            })()}
          </div>
        </Modal>
      )}
    </div>
  )
}
