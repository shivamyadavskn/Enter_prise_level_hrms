import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { departmentsApi } from '../../api/index.js'
import { useAuth } from '../../contexts/AuthContext.jsx'
import Modal from '../../components/common/Modal.jsx'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import { PageLoader } from '../../components/common/LoadingSpinner.jsx'
import { PlusIcon, PencilIcon, TrashIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

function DeptForm({ initial, onSubmit, loading }) {
  const [form, setForm] = useState(initial || { name: '', code: '', description: '' })
  const f = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form) }} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name *</label>
          <input required value={form.name} onChange={f('name')} className="mt-1 block w-full rounded-md border-0 py-1.5 px-3 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Code *</label>
          <input required value={form.code} onChange={f('code')} className="mt-1 block w-full rounded-md border-0 py-1.5 px-3 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea value={form.description} onChange={f('description')} rows={3} className="mt-1 block w-full rounded-md border-0 py-1.5 px-3 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm" />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="submit" disabled={loading} className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-500 disabled:opacity-50">
          {loading ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  )
}

export default function DepartmentsPage() {
  const { isAdmin } = useAuth()
  const qc = useQueryClient()
  const [modal, setModal] = useState(null)
  const [confirm, setConfirm] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentsApi.getAll({ limit: 100 }),
  })

  const departments = data?.data?.data || []

  const createMut = useMutation({
    mutationFn: departmentsApi.create,
    onSuccess: () => { qc.invalidateQueries(['departments']); setModal(null); toast.success('Department created') },
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => departmentsApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries(['departments']); setModal(null); toast.success('Department updated') },
  })

  const deleteMut = useMutation({
    mutationFn: departmentsApi.delete,
    onSuccess: () => { qc.invalidateQueries(['departments']); setConfirm(null); toast.success('Department deactivated') },
  })

  if (isLoading) return <PageLoader />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Departments</h1>
          <p className="text-sm text-gray-500">{departments.length} departments</p>
        </div>
        {isAdmin() && (
          <button onClick={() => setModal({ type: 'create' })} className="inline-flex items-center gap-2 rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white hover:bg-primary-500">
            <PlusIcon className="h-4 w-4" /> Add Department
          </button>
        )}
      </div>

      {departments.length === 0 ? (
        <EmptyState title="No departments" description="Create your first department to get started." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {departments.map((dept) => (
            <div key={dept.id} className="rounded-lg bg-white shadow p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                    <BuildingOfficeIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{dept.name}</p>
                    <p className="text-xs text-gray-500">Code: {dept.code}</p>
                  </div>
                </div>
                {isAdmin() && (
                  <div className="flex gap-1">
                    <button onClick={() => setModal({ type: 'edit', dept })} className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-primary-600">
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button onClick={() => setConfirm(dept)} className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-600">
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
              {dept.description && <p className="text-sm text-gray-500 line-clamp-2">{dept.description}</p>}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{dept._count?.employees || 0} employees</span>
                {dept.head && <span>Head: {dept.head.firstName} {dept.head.lastName}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.type === 'edit' ? 'Edit Department' : 'Add Department'}>
        <DeptForm
          initial={modal?.dept}
          loading={createMut.isPending || updateMut.isPending}
          onSubmit={(form) => modal?.type === 'edit' ? updateMut.mutate({ id: modal.dept.id, data: form }) : createMut.mutate(form)}
        />
      </Modal>

      <ConfirmDialog
        open={!!confirm} onClose={() => setConfirm(null)}
        onConfirm={() => deleteMut.mutate(confirm?.id)}
        loading={deleteMut.isPending} danger
        title="Deactivate Department"
        message={`Are you sure you want to deactivate "${confirm?.name}"?`}
        confirmLabel="Deactivate"
      />
    </div>
  )
}
