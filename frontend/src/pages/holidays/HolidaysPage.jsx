import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { holidaysApi, leavesApi } from '../../api/index.js'
import { useAuth } from '../../contexts/AuthContext.jsx'
import Modal from '../../components/common/Modal.jsx'
import { PlusIcon, TrashIcon, DocumentArrowDownIcon, PencilIcon } from '@heroicons/react/24/outline'
import { generateHolidayPolicy, generateLeavePolicy } from '../../utils/docTemplates.js'
import toast from 'react-hot-toast'

const TYPE_COLORS = {
  PUBLIC: 'bg-green-100 text-green-700',
  OPTIONAL: 'bg-amber-100 text-amber-700',
  RESTRICTED: 'bg-blue-100 text-blue-700',
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function HolidaysPage() {
  const { isAdmin } = useAuth()
  const qc = useQueryClient()
  const [year, setYear] = useState(new Date().getFullYear())
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ name: '', date: '', type: 'PUBLIC' })
  const f = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const { data, isLoading } = useQuery({
    queryKey: ['holidays', year],
    queryFn: () => holidaysApi.getAll({ year }),
  })

  const { data: leaveTypesData } = useQuery({
    queryKey: ['leave-types'],
    queryFn: () => leavesApi.getTypes(),
  })

  const holidays = data?.data?.data || []
  const leaveTypes = leaveTypesData?.data?.data || []

  const createMut = useMutation({
    mutationFn: holidaysApi.create,
    onSuccess: () => { qc.invalidateQueries(['holidays']); setModal(null); toast.success('Holiday added') },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => holidaysApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries(['holidays']); setModal(null); toast.success('Holiday updated') },
  })

  const deleteMut = useMutation({
    mutationFn: holidaysApi.delete,
    onSuccess: () => { qc.invalidateQueries(['holidays']); toast.success('Holiday removed') },
  })

  const openAdd = () => { setForm({ name: '', date: `${year}-01-01`, type: 'PUBLIC' }); setModal({ mode: 'add' }) }
  const openEdit = (h) => { setForm({ name: h.name, date: h.date.split('T')[0], type: h.type }); setModal({ mode: 'edit', id: h.id }) }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (modal.mode === 'add') createMut.mutate(form)
    else updateMut.mutate({ id: modal.id, data: form })
  }

  const grouped = {}
  holidays.forEach((h) => {
    const m = new Date(h.date).getMonth()
    if (!grouped[m]) grouped[m] = []
    grouped[m].push(h)
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Holiday Calendar</h1>
          <p className="text-sm text-gray-500">{holidays.length} holidays for {year}</p>
        </div>
        <div className="flex gap-2">
          <select value={year} onChange={(e) => setYear(Number(e.target.value))}
            className="rounded-md border-0 py-1.5 pl-3 pr-8 ring-1 ring-inset ring-gray-300 sm:text-sm">
            {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={() => generateLeavePolicy(leaveTypes)}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium ring-1 ring-gray-300 hover:bg-gray-50">
            <DocumentArrowDownIcon className="h-4 w-4" /> Leave Policy PDF
          </button>
          <button onClick={() => generateHolidayPolicy(holidays, year)} disabled={!holidays.length}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium ring-1 ring-gray-300 hover:bg-gray-50 disabled:opacity-50">
            <DocumentArrowDownIcon className="h-4 w-4" /> Holiday Policy PDF
          </button>
          {isAdmin() && (
            <button onClick={openAdd}
              className="flex items-center gap-1.5 rounded-md bg-primary-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-primary-500">
              <PlusIcon className="h-4 w-4" /> Add Holiday
            </button>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs">
        {Object.entries(TYPE_COLORS).map(([t, cls]) => (
          <span key={t} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-medium ${cls}`}>{t}</span>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" /></div>
      ) : holidays.length === 0 ? (
        <div className="rounded-lg bg-white shadow p-12 text-center text-gray-500">
          No holidays added for {year}. {isAdmin() && <button onClick={openAdd} className="text-primary-600 underline ml-1">Add first holiday →</button>}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(grouped).sort(([a], [b]) => a - b).map(([m, items]) => (
            <div key={m} className="rounded-lg bg-white shadow overflow-hidden">
              <div className="bg-primary-600 px-4 py-2">
                <h3 className="text-sm font-semibold text-white">{MONTHS[m]}</h3>
              </div>
              <ul className="divide-y divide-gray-100">
                {items.map((h) => (
                  <li key={h.id} className="flex items-center justify-between px-4 py-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="text-center min-w-[36px]">
                        <p className="text-lg font-bold text-gray-900 leading-none">{new Date(h.date).getDate()}</p>
                        <p className="text-xs text-gray-400">{new Date(h.date).toLocaleDateString('en-IN', { weekday: 'short' })}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{h.name}</p>
                        <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${TYPE_COLORS[h.type]}`}>{h.type}</span>
                      </div>
                    </div>
                    {isAdmin() && (
                      <div className="flex gap-1 shrink-0 ml-2">
                        <button onClick={() => openEdit(h)} className="p-1 text-gray-400 hover:text-primary-600"><PencilIcon className="h-3.5 w-3.5" /></button>
                        <button onClick={() => deleteMut.mutate(h.id)} className="p-1 text-gray-400 hover:text-red-500"><TrashIcon className="h-3.5 w-3.5" /></button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {modal && (
        <Modal open={!!modal} onClose={() => setModal(null)} title={modal.mode === 'add' ? 'Add Holiday' : 'Edit Holiday'} size="sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Holiday Name *</label>
              <input required value={form.name} onChange={f('name')} className="mt-1 block w-full rounded-md border-0 py-1.5 px-3 ring-1 ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Date *</label>
              <input type="date" required value={form.date} onChange={f('date')} className="mt-1 block w-full rounded-md border-0 py-1.5 px-3 ring-1 ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Type</label>
              <select value={form.type} onChange={f('type')} className="mt-1 block w-full rounded-md border-0 py-1.5 pl-3 pr-8 ring-1 ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm">
                <option value="PUBLIC">Public Holiday</option>
                <option value="OPTIONAL">Optional Holiday</option>
                <option value="RESTRICTED">Restricted Holiday</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setModal(null)} className="rounded-md px-3 py-2 text-sm ring-1 ring-gray-300 hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={createMut.isPending || updateMut.isPending}
                className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-500 disabled:opacity-50">
                {createMut.isPending || updateMut.isPending ? 'Saving…' : modal.mode === 'add' ? 'Add' : 'Update'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
