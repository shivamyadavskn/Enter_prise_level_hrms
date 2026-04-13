import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { performanceApi, employeesApi } from '../../api/index.js'
import { useAuth } from '../../contexts/AuthContext.jsx'
import Badge from '../../components/common/Badge.jsx'
import Modal from '../../components/common/Modal.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import { PageLoader } from '../../components/common/LoadingSpinner.jsx'
import { PlusIcon, StarIcon } from '@heroicons/react/24/outline'
import { StarIcon as StarSolid } from '@heroicons/react/24/solid'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

function StarRating({ value, onChange, readonly }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button key={s} type="button" onClick={() => !readonly && onChange?.(s)} className={readonly ? 'cursor-default' : 'hover:scale-110 transition-transform'}>
          {s <= value
            ? <StarSolid className="h-5 w-5 text-yellow-400" />
            : <StarIcon className="h-5 w-5 text-gray-300" />}
        </button>
      ))}
    </div>
  )
}

export default function PerformancePage() {
  const { user, isManager, isAdmin } = useAuth()
  const qc = useQueryClient()
  const [createModal, setCreateModal] = useState(false)
  const [detailModal, setDetailModal] = useState(null)
  const [appraisalForm, setAppraisalForm] = useState({ selfRating: 0, strengths: '', areasOfImprovement: '', goalsAchieved: '', comments: '' })
  const [managerForm, setManagerForm] = useState({ managerRating: 0, finalRating: 0, strengths: '', areasOfImprovement: '', comments: '', goalsAchieved: '' })
  const [createForm, setCreateForm] = useState({ employeeId: '', reviewType: 'QUARTERLY', reviewPeriodStart: '', reviewPeriodEnd: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['performance'],
    queryFn: () => performanceApi.getAll({}),
  })

  const { data: empData } = useQuery({
    queryKey: ['employees-list'],
    queryFn: () => employeesApi.getAll({ limit: 200 }),
    enabled: isManager() || isAdmin(),
  })

  const createMut = useMutation({ mutationFn: performanceApi.create, onSuccess: () => { qc.invalidateQueries(['performance']); setCreateModal(false); toast.success('Review created') } })
  const selfMut = useMutation({
    mutationFn: ({ id, data }) => performanceApi.selfAppraisal(id, data),
    onSuccess: () => { qc.invalidateQueries(['performance']); setDetailModal(null); toast.success('Self appraisal submitted') },
  })
  const managerMut = useMutation({
    mutationFn: ({ id, data }) => performanceApi.managerAppraisal(id, data),
    onSuccess: () => { qc.invalidateQueries(['performance']); setDetailModal(null); toast.success('Manager appraisal submitted') },
  })
  const ackMut = useMutation({
    mutationFn: performanceApi.acknowledge,
    onSuccess: () => { qc.invalidateQueries(['performance']); setDetailModal(null); toast.success('Review acknowledged') },
  })

  const reviews = data?.data?.data || []
  const employees = empData?.data?.data || []

  const myEmpId = user?.employee?.id

  if (isLoading) return <PageLoader />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance Reviews</h1>
          <p className="text-sm text-gray-500">Manage appraisals and reviews</p>
        </div>
        {(isManager() || isAdmin()) && (
          <button onClick={() => setCreateModal(true)} className="inline-flex items-center gap-2 rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white hover:bg-primary-500">
            <PlusIcon className="h-4 w-4" /> Create Review
          </button>
        )}
      </div>

      {reviews.length === 0 ? (
        <EmptyState title="No reviews" description="No performance reviews found." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map((r) => {
            const isSelf = r.employeeId === myEmpId
            const isReviewer = r.reviewerId === myEmpId
            return (
              <div key={r.id} className="rounded-lg bg-white shadow p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{r.employee?.firstName} {r.employee?.lastName}</p>
                    <p className="text-xs text-gray-500">{r.employee?.department?.name}</p>
                  </div>
                  <Badge status={r.status} label={r.status} />
                </div>
                <div className="text-xs text-gray-500">
                  <p>{r.reviewType?.replace('_', ' ')} Review</p>
                  <p>{format(new Date(r.reviewPeriodStart), 'dd MMM')} – {format(new Date(r.reviewPeriodEnd), 'dd MMM yyyy')}</p>
                </div>
                {r.selfRating && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Self:</span>
                    <StarRating value={r.selfRating} readonly />
                  </div>
                )}
                {r.managerRating && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Manager:</span>
                    <StarRating value={r.managerRating} readonly />
                  </div>
                )}
                <button onClick={() => {
                  setDetailModal(r)
                  setAppraisalForm({ selfRating: r.selfRating || 0, strengths: r.strengths || '', areasOfImprovement: r.areasOfImprovement || '', goalsAchieved: r.goalsAchieved || '', comments: r.comments || '' })
                  setManagerForm({ managerRating: r.managerRating || 0, finalRating: r.finalRating || 0, strengths: r.strengths || '', areasOfImprovement: r.areasOfImprovement || '', comments: r.comments || '' })
                }}
                  className="text-sm font-medium text-primary-600 hover:text-primary-500 text-left">
                  View / Submit →
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Create Modal */}
      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Create Performance Review">
        <form onSubmit={(e) => { e.preventDefault(); createMut.mutate({ ...createForm, employeeId: Number(createForm.employeeId) }) }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Employee *</label>
            <select required value={createForm.employeeId} onChange={(e) => setCreateForm({ ...createForm, employeeId: e.target.value })} className="mt-1 block w-full rounded-md border-0 py-1.5 pl-3 pr-8 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm">
              <option value="">Select employee</option>
              {employees.map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.employeeCode})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Review Type</label>
            <select value={createForm.reviewType} onChange={(e) => setCreateForm({ ...createForm, reviewType: e.target.value })} className="mt-1 block w-full rounded-md border-0 py-1.5 pl-3 pr-8 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm">
              {['PROBATION','QUARTERLY','ANNUAL','MID_YEAR'].map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Period Start *</label>
              <input type="date" required value={createForm.reviewPeriodStart} onChange={(e) => setCreateForm({ ...createForm, reviewPeriodStart: e.target.value })} className="mt-1 block w-full rounded-md border-0 py-1.5 px-3 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Period End *</label>
              <input type="date" required value={createForm.reviewPeriodEnd} onChange={(e) => setCreateForm({ ...createForm, reviewPeriodEnd: e.target.value })} className="mt-1 block w-full rounded-md border-0 py-1.5 px-3 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm" />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setCreateModal(false)} className="rounded-md px-3 py-2 text-sm text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={createMut.isPending} className="rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white hover:bg-primary-500 disabled:opacity-50">Create</button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      {detailModal && (
        <Modal open={!!detailModal} onClose={() => setDetailModal(null)} title={`${detailModal.reviewType?.replace('_', ' ')} Review`} size="lg">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">{detailModal.employee?.firstName} {detailModal.employee?.lastName}</p>
                <p className="text-sm text-gray-500">{format(new Date(detailModal.reviewPeriodStart), 'dd MMM')} – {format(new Date(detailModal.reviewPeriodEnd), 'dd MMM yyyy')}</p>
              </div>
              <Badge status={detailModal.status} label={detailModal.status} />
            </div>

            {/* Self Appraisal */}
            {detailModal.employeeId === myEmpId && detailModal.status === 'PENDING' && !detailModal.selfRating && (
              <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                <h3 className="font-medium text-blue-900 mb-3">Self Appraisal</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Self Rating *</label>
                    <StarRating value={appraisalForm.selfRating} onChange={(v) => setAppraisalForm({ ...appraisalForm, selfRating: v })} />
                  </div>
                  {['strengths', 'areasOfImprovement', 'goalsAchieved', 'comments'].map((field) => (
                    <div key={field}>
                      <label className="block text-sm font-medium text-gray-700 capitalize">{field.replace(/([A-Z])/g, ' $1')}</label>
                      <textarea rows={2} value={appraisalForm[field]} onChange={(e) => setAppraisalForm({ ...appraisalForm, [field]: e.target.value })} className="mt-1 block w-full rounded-md border-0 py-1.5 px-3 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm" />
                    </div>
                  ))}
                  <button onClick={() => selfMut.mutate({ id: detailModal.id, data: appraisalForm })} disabled={!appraisalForm.selfRating || selfMut.isPending}
                    className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50">
                    Submit Self Appraisal
                  </button>
                </div>
              </div>
            )}

            {/* Manager Appraisal */}
            {detailModal.reviewerId === myEmpId && detailModal.status !== 'ACKNOWLEDGED' && (
              <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
                <h3 className="font-medium text-purple-900 mb-3">Manager Appraisal</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Manager Rating *</label>
                    <StarRating value={managerForm.managerRating} onChange={(v) => setManagerForm({ ...managerForm, managerRating: v })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Final Rating <span className="text-gray-400 font-normal">(optional)</span></label>
                    <StarRating value={managerForm.finalRating} onChange={(v) => setManagerForm({ ...managerForm, finalRating: v })} />
                  </div>
                  {['goalsAchieved', 'strengths', 'areasOfImprovement', 'comments'].map((field) => (
                    <div key={field}>
                      <label className="block text-sm font-medium text-gray-700 capitalize">{field.replace(/([A-Z])/g, ' $1')}</label>
                      <textarea rows={2} value={managerForm[field]} onChange={(e) => setManagerForm({ ...managerForm, [field]: e.target.value })} className="mt-1 block w-full rounded-md border-0 py-1.5 px-3 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm" />
                    </div>
                  ))}
                  <button onClick={() => {
                    const payload = { ...managerForm }
                    if (!payload.finalRating) delete payload.finalRating
                    managerMut.mutate({ id: detailModal.id, data: payload })
                  }} disabled={!managerForm.managerRating || managerMut.isPending}
                    className="rounded-md bg-purple-600 px-3 py-2 text-sm font-semibold text-white hover:bg-purple-500 disabled:opacity-50">
                    Submit Manager Appraisal
                  </button>
                </div>
              </div>
            )}

            {/* Acknowledge */}
            {detailModal.employeeId === myEmpId && detailModal.status === 'COMPLETED' && (
              <button onClick={() => ackMut.mutate(detailModal.id)} disabled={ackMut.isPending}
                className="w-full rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-500 disabled:opacity-50">
                Acknowledge Review
              </button>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}
