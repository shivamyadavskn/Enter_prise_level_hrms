import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { designationsApi } from '../../api/index.js'
import { useAuth } from '../../contexts/AuthContext.jsx'
import Modal from '../../components/common/Modal.jsx'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import { PageLoader } from '../../components/common/LoadingSpinner.jsx'
import { PlusIcon, PencilIcon, TrashIcon, BriefcaseIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

const LEVEL_COLORS = [
  'bg-red-50 text-red-700','bg-orange-50 text-orange-700','bg-amber-50 text-amber-700',
  'bg-yellow-50 text-yellow-700','bg-green-50 text-green-700','bg-teal-50 text-teal-700',
  'bg-blue-50 text-blue-700','bg-indigo-50 text-indigo-700','bg-purple-50 text-purple-700',
]

function DesigForm({ initial, onSubmit, loading }) {
  const [form, setForm] = useState(initial || { name: '', level: 1, description: '' })
  const f = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ ...form, level: Number(form.level) }) }} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name *</label>
          <input required value={form.name} onChange={f('name')} className="mt-1 block w-full rounded-md border-0 py-1.5 px-3 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Level (1=Senior)</label>
          <input type="number" min={1} max={20} value={form.level} onChange={f('level')} className="mt-1 block w-full rounded-md border-0 py-1.5 px-3 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea value={form.description || ''} onChange={f('description')} rows={2} className="mt-1 block w-full rounded-md border-0 py-1.5 px-3 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm" />
      </div>
      <div className="flex justify-end pt-2">
        <button type="submit" disabled={loading} className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-500 disabled:opacity-50">
          {loading ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  )
}

export default function DesignationsPage() {
  const { isAdmin } = useAuth()
  const qc = useQueryClient()
  const [modal, setModal] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['designations', search],
    queryFn: () => designationsApi.getAll({ limit: 200, search: search || undefined }),
  })
  const designations = data?.data?.data || []

  const createMut = useMutation({
    mutationFn: designationsApi.create,
    onSuccess: () => { qc.invalidateQueries(['designations']); setModal(null); toast.success('Designation created') },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  })
  const updateMut = useMutation({
    mutationFn: ({ id, data }) => designationsApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries(['designations']); setModal(null); toast.success('Designation updated') },
  })
  const deleteMut = useMutation({
    mutationFn: designationsApi.delete,
    onSuccess: () => { qc.invalidateQueries(['designations']); setConfirm(null); toast.success('Designation deactivated') },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  })

  if (isLoading) return <PageLoader />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Designations</h1>
          <p className="text-sm text-gray-500">{designations.length} designations</p>
        </div>
        <div className="flex gap-2">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…"
            className="rounded-md border-0 py-1.5 px-3 ring-1 ring-gray-300 text-sm focus:ring-2 focus:ring-primary-600 w-48" />
          {isAdmin() && (
            <button onClick={() => setModal({ type: 'create' })} className="inline-flex items-center gap-2 rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white hover:bg-primary-500">
              <PlusIcon className="h-4 w-4" /> Add Designation
            </button>
          )}
        </div>
      </div>

      {designations.length === 0 ? (
        <EmptyState title="No designations" description="Create your first designation to get started." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {designations.map((d) => (
            <div key={d.id} className="rounded-lg bg-white shadow p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                    <BriefcaseIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{d.name}</p>
                    <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${LEVEL_COLORS[(d.level - 1) % LEVEL_COLORS.length]}`}>
                      Level {d.level}
                    </span>
                  </div>
                </div>
                {isAdmin() && (
                  <div className="flex gap-1">
                    <button onClick={() => setModal({ type: 'edit', desig: d })} className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-primary-600">
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button onClick={() => setConfirm(d)} className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-600">
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
              {d.description && <p className="text-sm text-gray-500 line-clamp-2">{d.description}</p>}
              <p className="text-xs text-gray-400">{d._count?.employees || 0} employees</p>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.type === 'edit' ? 'Edit Designation' : 'Add Designation'}>
        <DesigForm
          initial={modal?.desig}
          loading={createMut.isPending || updateMut.isPending}
          onSubmit={(form) => modal?.type === 'edit' ? updateMut.mutate({ id: modal.desig.id, data: form }) : createMut.mutate(form)}
        />
      </Modal>

      <ConfirmDialog
        open={!!confirm} onClose={() => setConfirm(null)}
        onConfirm={() => deleteMut.mutate(confirm?.id)}
        loading={deleteMut.isPending} danger
        title="Deactivate Designation"
        message={`Deactivate "${confirm?.name}"? This cannot be assigned to new employees.`}
        confirmLabel="Deactivate"
      />
    </div>
  )
}
