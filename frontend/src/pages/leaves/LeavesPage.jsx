import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { leavesApi } from '../../api/index.js'
import { useAuth } from '../../contexts/AuthContext.jsx'
import Badge from '../../components/common/Badge.jsx'
import Modal from '../../components/common/Modal.jsx'
import Pagination from '../../components/common/Pagination.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import { PageLoader } from '../../components/common/LoadingSpinner.jsx'
import { PlusIcon, CheckIcon, XMarkIcon, SparklesIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

function ApplyLeaveModal({ open, onClose, leaveTypes, onSubmit, loading }) {
  const [form, setForm] = useState({ leaveTypeId: '', startDate: '', endDate: '', reason: '' })
  const f = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  return (
    <Modal open={open} onClose={onClose} title="Apply for Leave">
      <form onSubmit={(e) => { e.preventDefault(); onSubmit({ ...form, leaveTypeId: Number(form.leaveTypeId) }) }} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Leave Type *</label>
          <select required value={form.leaveTypeId} onChange={f('leaveTypeId')} className="mt-1 block w-full rounded-md border-0 py-1.5 pl-3 pr-8 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm">
            <option value="">Select type</option>
            {leaveTypes.map((lt) => <option key={lt.id} value={lt.id}>{lt.name} ({lt.code})</option>)}
          </select>
        </div>
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
          <label className="block text-sm font-medium text-gray-700">Reason *</label>
          <textarea required rows={3} value={form.reason} onChange={f('reason')} className="mt-1 block w-full rounded-md border-0 py-1.5 px-3 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm" />
        </div>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-md px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={loading} className="rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white hover:bg-primary-500 disabled:opacity-50">
            {loading ? 'Submitting…' : 'Submit'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function RejectModal({ open, onClose, onSubmit, loading }) {
  const [reason, setReason] = useState('')
  return (
    <Modal open={open} onClose={onClose} title="Reject Leave" size="sm">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Rejection Reason *</label>
          <textarea required rows={3} value={reason} onChange={(e) => setReason(e.target.value)} className="mt-1 block w-full rounded-md border-0 py-1.5 px-3 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm" />
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="rounded-md px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50">Cancel</button>
          <button onClick={() => reason && onSubmit(reason)} disabled={loading || !reason} className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50">
            {loading ? 'Rejecting…' : 'Reject'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default function LeavesPage() {
  const { user, isManager, isAdmin } = useAuth()
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [applyModal, setApplyModal] = useState(false)
  const [rejectModal, setRejectModal] = useState(null)
  const [allocateModal, setAllocateModal] = useState(false)
  const [allocateYear, setAllocateYear] = useState(new Date().getFullYear())

  const { data, isLoading } = useQuery({
    queryKey: ['leaves', page, statusFilter],
    queryFn: () => leavesApi.getAll({ page, limit: 10, status: statusFilter || undefined }),
  })

  const { data: typesData } = useQuery({ queryKey: ['leave-types'], queryFn: leavesApi.getTypes })
  const { data: balanceData } = useQuery({ queryKey: ['leave-balance'], queryFn: () => leavesApi.getBalance({ year: new Date().getFullYear() }) })

  const applyMut = useMutation({
    mutationFn: leavesApi.apply,
    onSuccess: () => { qc.invalidateQueries(['leaves']); qc.invalidateQueries(['leave-balance']); setApplyModal(false); toast.success('Leave application submitted') },
  })

  const approveMut = useMutation({
    mutationFn: (id) => leavesApi.approve(id, {}),
    onSuccess: () => { qc.invalidateQueries(['leaves']); toast.success('Leave approved') },
  })

  const rejectMut = useMutation({
    mutationFn: ({ id, reason }) => leavesApi.reject(id, { rejectionReason: reason }),
    onSuccess: () => { qc.invalidateQueries(['leaves']); setRejectModal(null); toast.success('Leave rejected') },
  })

  const cancelMut = useMutation({
    mutationFn: leavesApi.cancel,
    onSuccess: () => { qc.invalidateQueries(['leaves']); toast.success('Leave cancelled') },
  })

  const allocateMut = useMutation({
    mutationFn: leavesApi.allocateBulk,
    onSuccess: (res) => {
      qc.invalidateQueries(['leave-balance'])
      setAllocateModal(false)
      toast.success(res.data.message || 'Leave balances allocated')
    },
  })

  const leaves = data?.data?.data || []
  const pagination = data?.data?.pagination
  const leaveTypes = typesData?.data?.data || []
  const balances = balanceData?.data?.data || []

  const myEmpCode = user?.employee?.employeeCode
  const isOwnLeave = (l) => l.employee?.employeeCode === myEmpCode

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leaves</h1>
          <p className="text-sm text-gray-500">Manage leave applications</p>
        </div>
        <div className="flex gap-2">
          {isAdmin() && (
            <button onClick={() => setAllocateModal(true)} className="inline-flex items-center gap-2 rounded-md border border-primary-300 bg-primary-50 px-3 py-2 text-sm font-semibold text-primary-700 hover:bg-primary-100">
              <SparklesIcon className="h-4 w-4" /> Allocate Leaves
            </button>
          )}
          <button onClick={() => setApplyModal(true)} className="inline-flex items-center gap-2 rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white hover:bg-primary-500">
            <PlusIcon className="h-4 w-4" /> Apply Leave
          </button>
        </div>
      </div>

      {/* Balance Cards */}
      {balances.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {balances.map((b) => (
            <div key={b.id} className="rounded-lg bg-white shadow p-4">
              <p className="text-xs font-medium text-gray-500 uppercase">{b.leaveType?.code}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{b.available}</p>
              <p className="text-xs text-gray-500">of {b.accrued} available</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
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
        {isLoading ? <PageLoader /> : leaves.length === 0 ? (
          <EmptyState title="No leave applications" description="Apply for leave using the button above." />
        ) : (
          <>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Employee', 'Leave Type', 'Duration', 'Days', 'Reason', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {leaves.map((l) => (
                  <tr key={l.id} className={`hover:bg-gray-50 ${isOwnLeave(l) ? 'bg-blue-50/40' : ''}`}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {l.employee?.firstName} {l.employee?.lastName}
                      {isOwnLeave(l) && <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">My Leave</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{l.leaveType?.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {format(new Date(l.startDate), 'dd MMM')} – {format(new Date(l.endDate), 'dd MMM yyyy')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">{l.totalDays}d</td>
                    <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">{l.reason}</td>
                    <td className="px-4 py-3"><Badge status={l.status} label={l.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {isManager() && !isOwnLeave(l) && l.status === 'PENDING' && (
                          <>
                            <button onClick={() => approveMut.mutate(l.id)} className="rounded bg-green-50 p-1.5 text-green-600 hover:bg-green-100">
                              <CheckIcon className="h-4 w-4" />
                            </button>
                            <button onClick={() => setRejectModal(l.id)} className="rounded bg-red-50 p-1.5 text-red-600 hover:bg-red-100">
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        {l.status === 'PENDING' && l.employee?.employeeCode === user?.employee?.employeeCode && (
                          <button onClick={() => cancelMut.mutate(l.id)} className="text-xs text-gray-400 hover:text-red-500">Cancel</button>
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

      <ApplyLeaveModal open={applyModal} onClose={() => setApplyModal(false)} leaveTypes={leaveTypes} onSubmit={(data) => applyMut.mutate(data)} loading={applyMut.isPending} />
      <RejectModal open={!!rejectModal} onClose={() => setRejectModal(null)} onSubmit={(reason) => rejectMut.mutate({ id: rejectModal, reason })} loading={rejectMut.isPending} />

      {/* Allocate Leaves Modal */}
      <Modal open={allocateModal} onClose={() => setAllocateModal(false)} title="Bulk Allocate Leave Balances" size="sm">
        <div className="space-y-4">
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-700">
            Allocates annual leave quota (CL, SL, EL, etc.) to <strong>all active &amp; probation employees</strong> for the selected year. Existing balances are skipped.
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Year</label>
            <select value={allocateYear} onChange={(e) => setAllocateYear(Number(e.target.value))} className="mt-1 block w-full rounded-md border-0 py-1.5 pl-3 pr-8 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm">
              {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setAllocateModal(false)} className="rounded-md px-3 py-2 text-sm text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50">Cancel</button>
            <button onClick={() => allocateMut.mutate({ year: allocateYear })} disabled={allocateMut.isPending}
              className="rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white hover:bg-primary-500 disabled:opacity-50">
              {allocateMut.isPending ? 'Allocating…' : 'Allocate Now'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
