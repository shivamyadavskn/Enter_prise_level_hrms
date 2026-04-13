import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { attendanceApi } from '../../api/index.js'
import { useAuth } from '../../contexts/AuthContext.jsx'
import Badge from '../../components/common/Badge.jsx'
import Modal from '../../components/common/Modal.jsx'
import Pagination from '../../components/common/Pagination.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import { PageLoader } from '../../components/common/LoadingSpinner.jsx'
import { ClockIcon, CheckIcon, XMarkIcon, ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

export default function AttendancePage() {
  const { user, isManager } = useAuth()
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())
  const [regModal, setRegModal] = useState(null)
  const [regForm, setRegForm] = useState({ requestedClockIn: '', requestedClockOut: '', reason: '' })

  const { data: todayData } = useQuery({ queryKey: ['today-att'], queryFn: attendanceApi.getToday, refetchInterval: 60_000 })
  const { data: summaryData } = useQuery({ queryKey: ['att-summary', month, year], queryFn: () => attendanceApi.getSummary({ month, year }) })
  const { data, isLoading } = useQuery({
    queryKey: ['attendance', page, month, year],
    queryFn: () => attendanceApi.getAll({ page, limit: 31, month, year }),
  })
  const { data: regData } = useQuery({ queryKey: ['regularizations'], queryFn: attendanceApi.getRegularizations })

  const clockInMut = useMutation({ mutationFn: attendanceApi.clockIn, onSuccess: () => { qc.invalidateQueries(['today-att']); toast.success('Clocked in!') } })
  const clockOutMut = useMutation({ mutationFn: attendanceApi.clockOut, onSuccess: () => { qc.invalidateQueries(['today-att']); qc.invalidateQueries(['att-summary']); toast.success('Clocked out!') } })
  const regMut = useMutation({ mutationFn: attendanceApi.applyRegularization, onSuccess: () => { qc.invalidateQueries(['regularizations']); setRegModal(null); toast.success('Regularization submitted') } })
  const approveRegMut = useMutation({ mutationFn: (id) => attendanceApi.approveRegularization(id, {}), onSuccess: () => { qc.invalidateQueries(['regularizations']); toast.success('Regularization approved') } })
  const rejectRegMut = useMutation({ mutationFn: (id) => attendanceApi.rejectRegularization(id, { rejectionReason: 'Rejected by manager' }), onSuccess: () => { qc.invalidateQueries(['regularizations']); toast.success('Regularization rejected') } })

  const today = todayData?.data?.data
  const summary = summaryData?.data?.data
  const records = data?.data?.data || []
  const pagination = data?.data?.pagination
  const regs = regData?.data?.data || []

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  const noProfile = today?.status === 'NO_PROFILE'

  return (
    <div className="space-y-6">
      {noProfile && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <ExclamationTriangleIcon className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Your employee profile is not set up yet.</p>
            <p className="text-sm text-amber-700 mt-0.5">
              Ask your HR administrator to complete your onboarding (Step 2 — Employee Details).
              Until then, attendance, leaves, and payroll features are unavailable.
            </p>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
          <p className="text-sm text-gray-500">Track your daily attendance</p>
        </div>
        <div className="flex gap-2">
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="rounded-md border-0 py-1.5 pl-3 pr-8 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm">
            {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="rounded-md border-0 py-1.5 pl-3 pr-8 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm">
            {[2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Clock In/Out Card */}
      <div className="rounded-lg bg-white shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Today — {format(new Date(), 'EEEE, dd MMM yyyy')}</p>
            <div className="mt-2 flex items-center gap-4">
              <div>
                <p className="text-xs text-gray-500">Clock In</p>
                <p className="text-lg font-semibold text-gray-900">{today?.clockIn ? format(new Date(today.clockIn), 'h:mm a') : '—'}</p>
              </div>
              <div className="h-8 w-px bg-gray-200" />
              <div>
                <p className="text-xs text-gray-500">Clock Out</p>
                <p className="text-lg font-semibold text-gray-900">{today?.clockOut ? format(new Date(today.clockOut), 'h:mm a') : '—'}</p>
              </div>
              <div className="h-8 w-px bg-gray-200" />
              <div>
                <p className="text-xs text-gray-500">Hours</p>
                <p className="text-lg font-semibold text-gray-900">{today?.totalHours ? `${Number(today.totalHours).toFixed(1)}h` : '—'}</p>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            {!today?.clockIn && (
              <button onClick={() => clockInMut.mutate({})} disabled={clockInMut.isPending} className="flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500 disabled:opacity-50">
                <ClockIcon className="h-4 w-4" /> Clock In
              </button>
            )}
            {today?.clockIn && !today?.clockOut && (
              <button onClick={() => clockOutMut.mutate({})} disabled={clockOutMut.isPending} className="flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50">
                <ClockIcon className="h-4 w-4" /> Clock Out
              </button>
            )}
            {today?.clockIn && today?.clockOut && <Badge status="PRESENT" label="Completed" />}
          </div>
        </div>
      </div>

      {/* Monthly Summary */}
      {summary && (
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
          {[
            { label: 'Present', value: summary.present, color: 'text-green-600 bg-green-50' },
            { label: 'Absent',  value: summary.absent,  color: 'text-red-600 bg-red-50' },
            { label: 'Half Day',value: summary.halfDay, color: 'text-yellow-600 bg-yellow-50' },
            { label: 'Leave',   value: summary.leave,   color: 'text-blue-600 bg-blue-50' },
            { label: 'WFH',     value: summary.wfh,     color: 'text-purple-600 bg-purple-50' },
            { label: 'Hours',   value: `${summary.totalHours}h`, color: 'text-gray-600 bg-gray-50' },
          ].map((s) => (
            <div key={s.label} className={`rounded-lg p-4 ${s.color}`}>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs font-medium mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Attendance Table */}
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Monthly Records</h2>
        </div>
        {isLoading ? <PageLoader /> : records.length === 0 ? (
          <EmptyState title="No records" description="No attendance records for selected period." />
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Date', 'Clock In', 'Clock Out', 'Hours', 'Status', 'Action'].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-sm font-medium text-gray-900">{format(new Date(r.date), 'EEE, dd MMM')}</td>
                  <td className="px-6 py-3 text-sm text-gray-500">{r.clockIn ? format(new Date(r.clockIn), 'h:mm a') : '—'}</td>
                  <td className="px-6 py-3 text-sm text-gray-500">{r.clockOut ? format(new Date(r.clockOut), 'h:mm a') : '—'}</td>
                  <td className="px-6 py-3 text-sm text-gray-500">{r.totalHours ? `${Number(r.totalHours).toFixed(1)}h` : '—'}</td>
                  <td className="px-6 py-3"><Badge status={r.status} label={r.status} /></td>
                  <td className="px-6 py-3">
                    {(r.status === 'ABSENT' || !r.clockIn || !r.clockOut) && (
                      <button onClick={() => { setRegModal(r); setRegForm({ requestedClockIn: '', requestedClockOut: '', reason: '' }) }}
                        className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-500">
                        <ArrowPathIcon className="h-3 w-3" /> Regularize
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pending Regularizations (Manager view) */}
      {isManager() && regs.filter((r) => r.status === 'PENDING').length > 0 && (
        <div className="rounded-lg bg-white shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Pending Regularizations</h2>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Employee', 'Date', 'Requested', 'Reason', 'Actions'].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {regs.filter((r) => r.status === 'PENDING').map((r) => (
                <tr key={r.id}>
                  <td className="px-6 py-3 text-sm font-medium text-gray-900">{r.employee?.firstName} {r.employee?.lastName}</td>
                  <td className="px-6 py-3 text-sm text-gray-500">{r.attendance?.date ? format(new Date(r.attendance.date), 'dd MMM') : '—'}</td>
                  <td className="px-6 py-3 text-sm text-gray-500">
                    {r.requestedClockIn ? format(new Date(r.requestedClockIn), 'h:mm a') : '—'} – {r.requestedClockOut ? format(new Date(r.requestedClockOut), 'h:mm a') : '—'}
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-500 max-w-xs truncate">{r.reason}</td>
                  <td className="px-6 py-3 flex gap-2">
                    <button onClick={() => approveRegMut.mutate(r.id)} className="rounded bg-green-50 p-1.5 text-green-600 hover:bg-green-100"><CheckIcon className="h-4 w-4" /></button>
                    <button onClick={() => rejectRegMut.mutate(r.id)} className="rounded bg-red-50 p-1.5 text-red-600 hover:bg-red-100"><XMarkIcon className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Regularization Modal */}
      <Modal open={!!regModal} onClose={() => setRegModal(null)} title="Request Regularization" size="sm">
        <form onSubmit={(e) => { e.preventDefault(); regMut.mutate({ attendanceId: regModal.id, ...regForm, requestedClockIn: regForm.requestedClockIn || undefined, requestedClockOut: regForm.requestedClockOut || undefined }) }} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Clock In</label>
              <input type="datetime-local" value={regForm.requestedClockIn} onChange={(e) => setRegForm({ ...regForm, requestedClockIn: e.target.value })} className="mt-1 block w-full rounded-md border-0 py-1.5 px-3 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Clock Out</label>
              <input type="datetime-local" value={regForm.requestedClockOut} onChange={(e) => setRegForm({ ...regForm, requestedClockOut: e.target.value })} className="mt-1 block w-full rounded-md border-0 py-1.5 px-3 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Reason *</label>
            <textarea required rows={3} value={regForm.reason} onChange={(e) => setRegForm({ ...regForm, reason: e.target.value })} className="mt-1 block w-full rounded-md border-0 py-1.5 px-3 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm" />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setRegModal(null)} className="rounded-md px-3 py-2 text-sm text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={regMut.isPending} className="rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white hover:bg-primary-500 disabled:opacity-50">Submit</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
