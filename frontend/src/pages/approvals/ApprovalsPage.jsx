import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { leavesApi, wfhApi, attendanceApi } from '../../api/index.js'
import { useAuth } from '../../contexts/AuthContext.jsx'
import Badge from '../../components/common/Badge.jsx'
import Modal from '../../components/common/Modal.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import { PageLoader } from '../../components/common/LoadingSpinner.jsx'
import { CheckIcon, XMarkIcon, CalendarDaysIcon, ComputerDesktopIcon, ClockIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const fmtDate = (d) => d ? format(new Date(d), 'dd MMM yyyy') : '—'
const fmtTime = (d) => d ? format(new Date(d), 'h:mm a') : '—'

const TABS = [
  { id: 'leaves',   label: 'Leave Requests',    icon: CalendarDaysIcon },
  { id: 'wfh',      label: 'WFH Requests',       icon: ComputerDesktopIcon },
  { id: 'regul',    label: 'Regularizations',    icon: ClockIcon },
]

export default function ApprovalsPage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [tab, setTab] = useState('leaves')
  const [rejectModal, setRejectModal] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  const { data: leavesData, isLoading: lLoading } = useQuery({
    queryKey: ['approval-leaves'],
    queryFn: () => leavesApi.getAll({ status: 'PENDING', limit: 50 }),
  })
  const { data: wfhData, isLoading: wLoading } = useQuery({
    queryKey: ['approval-wfh'],
    queryFn: () => wfhApi.getAll({ status: 'PENDING', limit: 50 }),
  })
  const { data: regulData, isLoading: rLoading } = useQuery({
    queryKey: ['approval-regul'],
    queryFn: attendanceApi.getRegularizations,
  })

  const leaves = (leavesData?.data?.data || []).filter(l => l.employee?.userId !== user?.id)
  const wfhs   = (wfhData?.data?.data || []).filter(w => w.employee?.userId !== user?.id)
  const reguls = (regulData?.data?.data || []).filter(r => r.status === 'PENDING')

  const approveLeaveMut = useMutation({ mutationFn: (id) => leavesApi.approve(id, {}), onSuccess: () => { qc.invalidateQueries(['approval-leaves']); toast.success('Leave approved') } })
  const rejectLeaveMut  = useMutation({ mutationFn: ({ id, reason }) => leavesApi.reject(id, { reason }), onSuccess: () => { qc.invalidateQueries(['approval-leaves']); setRejectModal(null); toast.success('Leave rejected') } })
  const approveWfhMut   = useMutation({ mutationFn: wfhApi.approve, onSuccess: () => { qc.invalidateQueries(['approval-wfh']); toast.success('WFH approved') } })
  const rejectWfhMut    = useMutation({ mutationFn: ({ id, reason }) => wfhApi.reject(id, { rejectionReason: reason }), onSuccess: () => { qc.invalidateQueries(['approval-wfh']); setRejectModal(null); toast.success('WFH rejected') } })
  const approveRegMut   = useMutation({ mutationFn: (id) => attendanceApi.approveRegularization(id, {}), onSuccess: () => { qc.invalidateQueries(['approval-regul']); toast.success('Regularization approved') } })
  const rejectRegMut    = useMutation({ mutationFn: ({ id, reason }) => attendanceApi.rejectRegularization(id, { rejectionReason: reason }), onSuccess: () => { qc.invalidateQueries(['approval-regul']); setRejectModal(null); toast.success('Regularization rejected') } })

  const handleReject = () => {
    if (!rejectReason.trim()) return toast.error('Reason required')
    const { type, id } = rejectModal
    if (type === 'leave') rejectLeaveMut.mutate({ id, reason: rejectReason })
    else if (type === 'wfh') rejectWfhMut.mutate({ id, reason: rejectReason })
    else rejectRegMut.mutate({ id, reason: rejectReason })
  }

  const pendingCount = (t) => t === 'leaves' ? leaves.length : t === 'wfh' ? wfhs.length : reguls.length

  const actionBtns = (onApprove, onReject, loading) => (
    <div className="flex gap-1 shrink-0">
      <button onClick={onApprove} disabled={loading} className="flex items-center gap-1 rounded bg-green-50 px-2.5 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 disabled:opacity-50">
        <CheckIcon className="h-3.5 w-3.5" /> Approve
      </button>
      <button onClick={onReject} className="flex items-center gap-1 rounded bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100">
        <XMarkIcon className="h-3.5 w-3.5" /> Reject
      </button>
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Approvals Inbox</h1>
        <p className="text-sm text-gray-500">Pending requests from your team</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all ${tab === t.id ? 'bg-white shadow text-primary-600' : 'text-gray-600 hover:text-gray-900'}`}>
            <t.icon className="h-4 w-4" />
            {t.label}
            {pendingCount(t.id) > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white px-1">{pendingCount(t.id)}</span>
            )}
          </button>
        ))}
      </div>

      {/* Leave Requests */}
      {tab === 'leaves' && (
        lLoading ? <PageLoader /> : leaves.length === 0 ? <EmptyState title="No pending leave requests" description="Your team has no pending leaves." /> : (
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>{['Employee', 'Leave Type', 'Duration', 'Days', 'Reason', 'Applied', 'Actions'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {leaves.map(l => (
                  <tr key={l.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-bold">
                          {l.employee?.firstName?.[0]}{l.employee?.lastName?.[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{l.employee?.firstName} {l.employee?.lastName}</p>
                          <p className="text-xs text-gray-400">{l.employee?.employeeCode}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{l.leaveType?.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{fmtDate(l.startDate)} – {fmtDate(l.endDate)}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">{l.totalDays}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">{l.reason}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">{fmtDate(l.appliedOn)}</td>
                    <td className="px-4 py-3">{actionBtns(() => approveLeaveMut.mutate(l.id), () => { setRejectModal({ type: 'leave', id: l.id }); setRejectReason('') }, approveLeaveMut.isPending)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* WFH Requests */}
      {tab === 'wfh' && (
        wLoading ? <PageLoader /> : wfhs.length === 0 ? <EmptyState title="No pending WFH requests" description="Your team has no pending WFH requests." /> : (
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>{['Employee', 'Dates', 'Type', 'Reason', 'Applied', 'Actions'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {wfhs.map(w => (
                  <tr key={w.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 text-xs font-bold">
                          {w.employee?.firstName?.[0]}{w.employee?.lastName?.[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{w.employee?.firstName} {w.employee?.lastName}</p>
                          <p className="text-xs text-gray-400">{w.employee?.employeeCode}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{fmtDate(w.startDate)} – {fmtDate(w.endDate)}</td>
                    <td className="px-4 py-3"><Badge status={w.wfhType} label={w.wfhType} /></td>
                    <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">{w.reason}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">{fmtDate(w.createdAt)}</td>
                    <td className="px-4 py-3">{actionBtns(() => approveWfhMut.mutate(w.id), () => { setRejectModal({ type: 'wfh', id: w.id }); setRejectReason('') }, approveWfhMut.isPending)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Regularizations */}
      {tab === 'regul' && (
        rLoading ? <PageLoader /> : reguls.length === 0 ? <EmptyState title="No pending regularizations" description="No attendance regularization requests." /> : (
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>{['Employee', 'Date', 'Requested In', 'Requested Out', 'Reason', 'Actions'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reguls.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{r.employee?.firstName} {r.employee?.lastName}</p>
                      <p className="text-xs text-gray-400">{r.employee?.employeeCode}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{r.attendance?.date ? fmtDate(r.attendance.date) : '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{fmtTime(r.requestedClockIn)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{fmtTime(r.requestedClockOut)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">{r.reason}</td>
                    <td className="px-4 py-3">{actionBtns(() => approveRegMut.mutate(r.id), () => { setRejectModal({ type: 'regul', id: r.id }); setRejectReason('') }, approveRegMut.isPending)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Reject Modal */}
      <Modal open={!!rejectModal} onClose={() => setRejectModal(null)} title="Reject Request" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Reason for Rejection *</label>
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} className="mt-1 block w-full rounded-md border-0 py-1.5 px-3 ring-1 ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm" placeholder="Provide a reason…" />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setRejectModal(null)} className="rounded-md px-3 py-2 text-sm ring-1 ring-gray-300 hover:bg-gray-50">Cancel</button>
            <button onClick={handleReject} disabled={rejectLeaveMut.isPending || rejectWfhMut.isPending || rejectRegMut.isPending}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50">
              Confirm Reject
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
