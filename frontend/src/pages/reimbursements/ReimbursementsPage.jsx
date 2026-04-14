import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { reimbursementsApi } from '../../api/index.js'
import { useAuth } from '../../contexts/AuthContext.jsx'
import Badge from '../../components/common/Badge.jsx'
import Modal from '../../components/common/Modal.jsx'
import Pagination from '../../components/common/Pagination.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import { PageLoader } from '../../components/common/LoadingSpinner.jsx'
import { PlusIcon, CheckIcon, XMarkIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const fmtDate = (d) => d ? format(new Date(d), 'dd MMM yyyy') : '—'
const fmtMoney = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`

const STATUS_COLORS = { PENDING: 'bg-amber-50 text-amber-700', APPROVED: 'bg-green-50 text-green-700', REJECTED: 'bg-red-50 text-red-700' }
const CATEGORIES = ['Travel', 'Accommodation', 'Meals', 'Communication', 'Office Supplies', 'Medical', 'Other']

export default function ReimbursementsPage() {
  const { user, isAdmin, isFinance, isManager } = useAuth()
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [createModal, setCreateModal] = useState(false)
  const [detailModal, setDetailModal] = useState(null)
  const [rejectModal, setRejectModal] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [expenses, setExpenses] = useState([{ description: '', date: '', amount: '', category: 'Travel' }])

  const { data, isLoading } = useQuery({
    queryKey: ['reimbursements', page, statusFilter],
    queryFn: () => reimbursementsApi.getAll({ page, limit: 20, status: statusFilter || undefined }),
  })
  const claims = data?.data?.data || []
  const pagination = data?.data?.pagination

  const addExp = () => setExpenses([...expenses, { description: '', date: '', amount: '', category: 'Travel' }])
  const updExp = (i, k, v) => setExpenses(expenses.map((e, idx) => idx === i ? { ...e, [k]: v } : e))
  const removeExp = (i) => setExpenses(expenses.filter((_, idx) => idx !== i))
  const totalAmount = expenses.reduce((s, e) => s + Number(e.amount || 0), 0)

  const createMut = useMutation({
    mutationFn: reimbursementsApi.create,
    onSuccess: () => { qc.invalidateQueries(['reimbursements']); setCreateModal(false); setTitle(''); setDescription(''); setExpenses([{ description: '', date: '', amount: '', category: 'Travel' }]); toast.success('Claim submitted') },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  })
  const approveMut = useMutation({
    mutationFn: reimbursementsApi.approve,
    onSuccess: () => { qc.invalidateQueries(['reimbursements']); setDetailModal(null); toast.success('Claim approved') },
  })
  const rejectMut = useMutation({
    mutationFn: ({ id, reason }) => reimbursementsApi.reject(id, { rejectionReason: reason }),
    onSuccess: () => { qc.invalidateQueries(['reimbursements']); setRejectModal(null); setDetailModal(null); toast.success('Claim rejected') },
  })

  const canApprove = isAdmin() || isFinance() || isManager?.()
  const items = detailModal?.items || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reimbursements</h1>
          <p className="text-sm text-gray-500">Submit and track expense reimbursement claims</p>
        </div>
        <div className="flex gap-2">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border-0 py-1.5 pl-3 pr-8 ring-1 ring-gray-300 text-sm focus:ring-2 focus:ring-primary-600">
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <button onClick={() => setCreateModal(true)} className="inline-flex items-center gap-2 rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white hover:bg-primary-500">
            <PlusIcon className="h-4 w-4" /> New Claim
          </button>
        </div>
      </div>

      {isLoading ? <PageLoader /> : claims.length === 0 ? (
        <EmptyState title="No claims" description="Submit your first expense reimbursement claim." icon={CurrencyDollarIcon} />
      ) : (
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>{['Employee', 'Title', 'Amount', 'Claim Date', 'Status', 'Approved By', 'Actions'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {claims.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">{c.employee?.firstName} {c.employee?.lastName}</p>
                    <p className="text-xs text-gray-400">{c.employee?.employeeCode}</p>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{c.title}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-primary-700">{fmtMoney(c.totalAmount)}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{fmtDate(c.claimDate)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs rounded-full px-2.5 py-1 font-medium ${STATUS_COLORS[c.status]}`}>{c.status}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{c.approvedBy ? `${c.approvedBy.firstName} ${c.approvedBy.lastName}` : '—'}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => setDetailModal(c)} className="text-xs text-primary-600 hover:underline">View</button>
                    {canApprove && c.status === 'PENDING' && (
                      <span className="ml-2 flex gap-1 inline-flex">
                        <button onClick={() => approveMut.mutate(c.id)} className="text-xs text-green-700 hover:underline">Approve</button>
                        <span className="text-gray-300">|</span>
                        <button onClick={() => { setRejectModal(c.id); setRejectReason('') }} className="text-xs text-red-600 hover:underline">Reject</button>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagination && <Pagination current={page} total={pagination.totalPages} onChange={setPage} />}

      {/* Create Modal */}
      <Modal open={createModal} onClose={() => setCreateModal(false)} title="New Reimbursement Claim">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Claim Title *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 block w-full rounded-md border-0 py-1.5 px-3 ring-1 ring-gray-300 text-sm" placeholder="e.g. Business trip to Mumbai" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="mt-1 block w-full rounded-md border-0 py-1.5 px-3 ring-1 ring-gray-300 text-sm" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Expense Items *</label>
              <button onClick={addExp} className="text-xs text-primary-600 hover:underline">+ Add Item</button>
            </div>
            <div className="space-y-2">
              {expenses.map((ex, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-4">
                    {i === 0 && <label className="block text-xs text-gray-500 mb-0.5">Description</label>}
                    <input value={ex.description} onChange={(e) => updExp(i, 'description', e.target.value)} placeholder="Cab, hotel…" className="block w-full rounded-md border-0 py-1.5 px-2 ring-1 ring-gray-300 text-sm" />
                  </div>
                  <div className="col-span-2">
                    {i === 0 && <label className="block text-xs text-gray-500 mb-0.5">Date</label>}
                    <input type="date" value={ex.date} onChange={(e) => updExp(i, 'date', e.target.value)} className="block w-full rounded-md border-0 py-1.5 px-2 ring-1 ring-gray-300 text-sm" />
                  </div>
                  <div className="col-span-3">
                    {i === 0 && <label className="block text-xs text-gray-500 mb-0.5">Category</label>}
                    <select value={ex.category} onChange={(e) => updExp(i, 'category', e.target.value)} className="block w-full rounded-md border-0 py-1.5 px-2 ring-1 ring-gray-300 text-sm">
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    {i === 0 && <label className="block text-xs text-gray-500 mb-0.5">Amount (₹)</label>}
                    <input type="number" value={ex.amount} onChange={(e) => updExp(i, 'amount', e.target.value)} className="block w-full rounded-md border-0 py-1.5 px-2 ring-1 ring-gray-300 text-sm" />
                  </div>
                  <div className="col-span-1 flex justify-end pt-0.5">
                    {expenses.length > 1 && <button onClick={() => removeExp(i)} className="text-red-400 hover:text-red-600 text-lg leading-none">×</button>}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-2 text-right text-sm font-semibold text-primary-700">Total: {fmtMoney(totalAmount)}</div>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button onClick={() => setCreateModal(false)} className="rounded-md px-3 py-2 text-sm ring-1 ring-gray-300 hover:bg-gray-50">Cancel</button>
            <button onClick={() => createMut.mutate({ title, description, items: expenses })} disabled={createMut.isPending || !title}
              className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-500 disabled:opacity-50">
              {createMut.isPending ? 'Submitting…' : 'Submit Claim'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal open={!!detailModal} onClose={() => setDetailModal(null)} title="Claim Details">
        {detailModal && (
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-gray-900">{detailModal.title}</h3>
                <p className="text-sm text-gray-500">{detailModal.employee?.firstName} {detailModal.employee?.lastName} · {fmtDate(detailModal.claimDate)}</p>
              </div>
              <span className={`text-xs rounded-full px-2.5 py-1 font-medium ${STATUS_COLORS[detailModal.status]}`}>{detailModal.status}</span>
            </div>
            {detailModal.description && <p className="text-sm text-gray-600">{detailModal.description}</p>}
            <table className="min-w-full text-sm border border-gray-100 rounded-lg overflow-hidden">
              <thead className="bg-gray-50"><tr>{['Description','Date','Category','Amount'].map(h => <th key={h} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item, i) => (
                  <tr key={i}><td className="px-3 py-2">{item.description}</td><td className="px-3 py-2">{fmtDate(item.date)}</td><td className="px-3 py-2">{item.category}</td><td className="px-3 py-2 font-medium">{fmtMoney(item.amount)}</td></tr>
                ))}
                <tr className="bg-primary-50"><td colSpan={3} className="px-3 py-2 font-semibold text-primary-700">Total</td><td className="px-3 py-2 font-bold text-primary-700">{fmtMoney(detailModal.totalAmount)}</td></tr>
              </tbody>
            </table>
            {detailModal.status === 'REJECTED' && detailModal.rejectionReason && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-700"><strong>Rejection Reason:</strong> {detailModal.rejectionReason}</div>
            )}
            {canApprove && detailModal.status === 'PENDING' && (
              <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                <button onClick={() => { setRejectModal(detailModal.id); setRejectReason('') }} className="flex items-center gap-1 rounded-md px-3 py-2 text-sm ring-1 ring-red-300 text-red-600 hover:bg-red-50"><XMarkIcon className="h-4 w-4" /> Reject</button>
                <button onClick={() => approveMut.mutate(detailModal.id)} disabled={approveMut.isPending} className="flex items-center gap-1 rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500 disabled:opacity-50"><CheckIcon className="h-4 w-4" /> {approveMut.isPending ? 'Approving…' : 'Approve'}</button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal open={!!rejectModal} onClose={() => setRejectModal(null)} title="Reject Claim" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Reason *</label>
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} className="mt-1 block w-full rounded-md border-0 py-1.5 px-3 ring-1 ring-gray-300 text-sm" />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setRejectModal(null)} className="rounded-md px-3 py-2 text-sm ring-1 ring-gray-300 hover:bg-gray-50">Cancel</button>
            <button onClick={() => rejectMut.mutate({ id: rejectModal, reason: rejectReason })} disabled={rejectMut.isPending}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50">
              {rejectMut.isPending ? 'Rejecting…' : 'Confirm Reject'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
