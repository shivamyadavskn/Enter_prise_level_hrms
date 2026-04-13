import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { wfhApi } from '../../api/index.js'
import { useAuth } from '../../contexts/AuthContext.jsx'
import Badge from '../../components/common/Badge.jsx'
import Modal from '../../components/common/Modal.jsx'
import Pagination from '../../components/common/Pagination.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import { PageLoader } from '../../components/common/LoadingSpinner.jsx'
import { PlusIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

export default function WfhPage() {
  const { isManager, user } = useAuth()
  const myEmpCode = user?.employee?.employeeCode
  const isOwnWfh = (r) => r.employee?.employeeCode === myEmpCode
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [applyModal, setApplyModal] = useState(false)
  const [rejectModal, setRejectModal] = useState(null)
  const [form, setForm] = useState({ startDate: '', endDate: '', wfhType: 'FULL_DAY', reason: '' })
  const f = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const { data, isLoading } = useQuery({
    queryKey: ['wfh', page, statusFilter],
    queryFn: () => wfhApi.getAll({ page, limit: 10, status: statusFilter || undefined }),
  })

  const applyMut = useMutation({ mutationFn: wfhApi.apply, onSuccess: () => { qc.invalidateQueries(['wfh']); setApplyModal(false); toast.success('WFH request submitted') } })
  const approveMut = useMutation({ mutationFn: wfhApi.approve, onSuccess: () => { qc.invalidateQueries(['wfh']); toast.success('WFH approved') } })
  const rejectMut = useMutation({
    mutationFn: ({ id, reason }) => wfhApi.reject(id, { rejectionReason: reason }),
    onSuccess: () => { qc.invalidateQueries(['wfh']); setRejectModal(null); toast.success('WFH rejected') },
  })
  const cancelMut = useMutation({ mutationFn: wfhApi.cancel, onSuccess: () => { qc.invalidateQueries(['wfh']); toast.success('WFH cancelled') } })

  const requests = data?.data?.data || []
  const pagination = data?.data?.pagination

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Work From Home</h1>
          <p className="text-sm text-gray-500">Manage WFH requests</p>
        </div>
        <button onClick={() => setApplyModal(true)} className="inline-flex items-center gap-2 rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white hover:bg-primary-500">
          <PlusIcon className="h-4 w-4" /> Request WFH
        </button>
      </div>

      {/* Filter Pills */}
      <div className="flex gap-3">
        {['', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].map((s) => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(1) }}
            className={`rounded-full px-3 py-1 text-sm font-medium ${statusFilter === s ? 'bg-primary-100 text-primary-700' : 'text-gray-500 hover:bg-gray-100'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg bg-white shadow">
        {isLoading ? <PageLoader /> : requests.length === 0 ? (
          <EmptyState title="No WFH requests" description="Submit a WFH request using the button above." />
        ) : (
          <>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Employee', 'Duration', 'Type', 'Reason', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm font-medium text-gray-900">
                      {r.employee?.firstName} {r.employee?.lastName}
                      {isOwnWfh(r) && <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">Mine</span>}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-500">{format(new Date(r.startDate), 'dd MMM')} – {format(new Date(r.endDate), 'dd MMM yyyy')}</td>
                    <td className="px-6 py-3 text-sm text-gray-500">{r.wfhType?.replace('_', ' ')}</td>
                    <td className="px-6 py-3 text-sm text-gray-500 max-w-xs truncate">{r.reason}</td>
                    <td className="px-6 py-3"><Badge status={r.status} label={r.status} /></td>
                    <td className="px-6 py-3">
                      <div className="flex gap-2">
                        {isManager() && !isOwnWfh(r) && r.status === 'PENDING' && (
                          <>
                            <button onClick={() => approveMut.mutate(r.id)} className="rounded bg-green-50 p-1.5 text-green-600 hover:bg-green-100"><CheckIcon className="h-4 w-4" /></button>
                            <button onClick={() => setRejectModal(r.id)} className="rounded bg-red-50 p-1.5 text-red-600 hover:bg-red-100"><XMarkIcon className="h-4 w-4" /></button>
                          </>
                        )}
                        {r.status === 'PENDING' && (
                          <button onClick={() => cancelMut.mutate(r.id)} className="text-xs text-gray-400 hover:text-red-500">Cancel</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pagination && <Pagination page={pagination.page} totalPages={pagination.totalPages} total={pagination.total} limit={10} onPageChange={setPage} />}
          </>
        )}
      </div>

      {/* Apply Modal */}
      <Modal open={applyModal} onClose={() => setApplyModal(false)} title="Request Work From Home">
        <form onSubmit={(e) => { e.preventDefault(); applyMut.mutate(form) }} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Date *</label>
              <input type="date" required value={form.startDate} onChange={f('startDate')} className="mt-1 block w-full rounded-md border-0 py-1.5 px-3 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">End Date *</label>
              <input type="date" required value={form.endDate} min={form.startDate} onChange={f('endDate')} className="mt-1 block w-full rounded-md border-0 py-1.5 px-3 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">WFH Type</label>
            <select value={form.wfhType} onChange={f('wfhType')} className="mt-1 block w-full rounded-md border-0 py-1.5 pl-3 pr-8 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm">
              <option value="FULL_DAY">Full Day</option>
              <option value="HALF_DAY">Half Day</option>
              <option value="RECURRING">Recurring</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Reason *</label>
            <textarea required rows={3} value={form.reason} onChange={f('reason')} className="mt-1 block w-full rounded-md border-0 py-1.5 px-3 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm" />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setApplyModal(false)} className="rounded-md px-3 py-2 text-sm text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={applyMut.isPending} className="rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white hover:bg-primary-500 disabled:opacity-50">
              {applyMut.isPending ? 'Submitting…' : 'Submit'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Reject Modal */}
      <Modal open={!!rejectModal} onClose={() => setRejectModal(null)} title="Reject WFH Request" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Rejection Reason *</label>
            <textarea rows={3} id="rej-reason" className="mt-1 block w-full rounded-md border-0 py-1.5 px-3 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm" />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setRejectModal(null)} className="rounded-md px-3 py-2 text-sm text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50">Cancel</button>
            <button onClick={() => rejectMut.mutate({ id: rejectModal, reason: document.getElementById('rej-reason').value || 'Rejected' })}
              disabled={rejectMut.isPending} className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50">
              {rejectMut.isPending ? 'Rejecting…' : 'Reject'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
