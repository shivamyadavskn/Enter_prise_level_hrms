import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { onboardingApi, employeesApi } from '../../api/index.js'
import { useAuth } from '../../contexts/AuthContext.jsx'
import Modal from '../../components/common/Modal.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import { PageLoader } from '../../components/common/LoadingSpinner.jsx'
import { PlusIcon, CheckCircleIcon, ClockIcon, PencilIcon, TrashIcon, ClipboardDocumentListIcon, Cog6ToothIcon } from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckSolid } from '@heroicons/react/24/solid'
import toast from 'react-hot-toast'

const STATUS_COLOR = { PENDING: 'text-amber-600 bg-amber-50', COMPLETED: 'text-green-600 bg-green-50', SKIPPED: 'text-gray-400 bg-gray-50' }
const CATEGORIES = ['General', 'HR', 'IT', 'Finance', 'Admin', 'Compliance', 'Other']

function ProgressBar({ completed, total }) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-2 rounded-full bg-primary-500 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-500 shrink-0">{completed}/{total}</span>
    </div>
  )
}

export default function OnboardingPage() {
  const { user, isAdmin, isManager } = useAuth()
  const qc = useQueryClient()
  const isAdminOrManager = isAdmin() || isManager()

  const [tab, setTab] = useState(isAdminOrManager ? 'overview' : 'my')
  const [taskModal, setTaskModal] = useState(null)
  const [taskForm, setTaskForm] = useState({ title: '', description: '', category: 'General', isRequired: true, order: 0 })
  const [selectedEmp, setSelectedEmp] = useState(null)
  const [remarkModal, setRemarkModal] = useState(null)
  const [remark, setRemark] = useState('')

  const { data: myData, isLoading: myLoading } = useQuery({
    queryKey: ['my-onboarding'],
    queryFn: onboardingApi.getMyChecklist,
  })

  const { data: allData, isLoading: allLoading } = useQuery({
    queryKey: ['all-onboarding'],
    queryFn: () => onboardingApi.getAllChecklists(),
    enabled: isAdminOrManager,
  })

  const { data: tasksData } = useQuery({
    queryKey: ['onboarding-tasks'],
    queryFn: onboardingApi.getTasks,
    enabled: isAdmin(),
  })

  const { data: empListData } = useQuery({
    queryKey: ['emp-list-onboarding'],
    queryFn: () => employeesApi.getAll({ limit: 200 }),
    enabled: isAdmin(),
  })

  const { data: empChecklistData } = useQuery({
    queryKey: ['emp-onboarding', selectedEmp],
    queryFn: () => onboardingApi.getEmployeeChecklist(selectedEmp),
    enabled: !!selectedEmp,
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => onboardingApi.updateItem(id, data),
    onSuccess: () => {
      qc.invalidateQueries(['my-onboarding'])
      qc.invalidateQueries(['emp-onboarding'])
      qc.invalidateQueries(['all-onboarding'])
      setRemarkModal(null)
      toast.success('Updated')
    },
  })

  const taskMut = useMutation({
    mutationFn: (d) => taskForm.id ? onboardingApi.updateTask(taskForm.id, d) : onboardingApi.createTask(d),
    onSuccess: () => { qc.invalidateQueries(['onboarding-tasks']); setTaskModal(null); toast.success(taskForm.id ? 'Task updated' : 'Task created') },
  })

  const deleteMut = useMutation({
    mutationFn: onboardingApi.deleteTask,
    onSuccess: () => { qc.invalidateQueries(['onboarding-tasks']); toast.success('Task deactivated') },
  })

  const initMut = useMutation({
    mutationFn: onboardingApi.initChecklist,
    onSuccess: (res) => {
      qc.invalidateQueries(['all-onboarding'])
      qc.invalidateQueries(['emp-onboarding'])
      toast.success(res.data?.message || 'Checklist initialized')
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  })

  const myItems = myData?.data?.data || []
  const allChecklists = allData?.data?.data || []
  const tasks = tasksData?.data?.data || []
  const employees = empListData?.data?.data || []
  const empChecklist = empChecklistData?.data?.data || []

  const grouped = myItems.reduce((acc, item) => {
    const cat = item.task?.category || 'General'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(item)
    return acc
  }, {})

  const openTask = (t = null) => { setTaskForm(t ? { ...t } : { title: '', description: '', category: 'General', isRequired: true, order: 0 }); setTaskModal(true) }
  const submitTask = (e) => { e.preventDefault(); const d = { ...taskForm, order: Number(taskForm.order) }; delete d.id; taskMut.mutate(d) }

  const markComplete = (item) => {
    if (item.status === 'COMPLETED') {
      updateMut.mutate({ id: item.id, data: { status: 'PENDING', remarks: '' } })
    } else {
      setRemarkModal(item)
      setRemark('')
    }
  }

  const confirmComplete = () => {
    updateMut.mutate({ id: remarkModal.id, data: { status: 'COMPLETED', remarks: remark } })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Onboarding</h1>
          <p className="text-sm text-gray-500">Track onboarding progress for new employees</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {[
          ...(!isAdminOrManager ? [] : [{ id: 'overview', label: 'All Employees', icon: ClipboardDocumentListIcon }]),
          { id: 'my', label: 'My Checklist', icon: CheckCircleIcon },
          ...(isAdmin() ? [{ id: 'tasks', label: 'Manage Tasks', icon: Cog6ToothIcon }] : []),
        ].map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === id ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {/* ── My Checklist ── */}
      {tab === 'my' && (
        <>
          {myLoading ? <PageLoader /> : myItems.length === 0 ? (
            <EmptyState title="No checklist assigned" description="Your HR will assign your onboarding checklist soon." />
          ) : (
            <div className="space-y-6">
              <div className="rounded-lg bg-white shadow p-4 flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700 mb-1">Overall Progress</p>
                  <ProgressBar completed={myItems.filter(i => i.status === 'COMPLETED').length} total={myItems.length} />
                </div>
                <div className="text-2xl font-bold text-primary-600">{Math.round((myItems.filter(i => i.status === 'COMPLETED').length / myItems.length) * 100)}%</div>
              </div>
              {Object.entries(grouped).map(([cat, items]) => (
                <div key={cat} className="rounded-lg bg-white shadow overflow-hidden">
                  <div className="bg-gray-50 px-5 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-700">{cat}</p>
                  </div>
                  <ul className="divide-y divide-gray-100">
                    {items.map(item => (
                      <li key={item.id} className="flex items-start gap-4 px-5 py-4 hover:bg-gray-50">
                        <button onClick={() => markComplete(item)} disabled={updateMut.isPending}
                          className="mt-0.5 shrink-0">
                          {item.status === 'COMPLETED'
                            ? <CheckSolid className="h-6 w-6 text-green-500" />
                            : <div className="h-6 w-6 rounded-full border-2 border-gray-300 hover:border-primary-400 transition-colors" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`text-sm font-medium ${item.status === 'COMPLETED' ? 'line-through text-gray-400' : 'text-gray-900'}`}>{item.task?.title}</p>
                            {item.task?.isRequired && <span className="text-xs text-red-500">Required</span>}
                          </div>
                          {item.task?.description && <p className="text-xs text-gray-500 mt-0.5">{item.task.description}</p>}
                          {item.remarks && <p className="text-xs text-gray-400 mt-1 italic">"{item.remarks}"</p>}
                          {item.completedAt && <p className="text-xs text-green-500 mt-0.5">Completed {new Date(item.completedAt).toLocaleDateString('en-IN')}</p>}
                        </div>
                        <span className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[item.status]}`}>
                          {item.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── All Employees Overview ── */}
      {tab === 'overview' && isAdminOrManager && (
        <>
          {/* Employee Selector */}
          <div className="flex items-center gap-3">
            <select value={selectedEmp || ''} onChange={e => setSelectedEmp(e.target.value || null)}
              className="rounded-md border-0 py-1.5 pl-3 pr-8 ring-1 ring-inset ring-gray-300 text-sm focus:ring-2 focus:ring-primary-600">
              <option value="">View all summaries</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.employeeCode})</option>)}
            </select>
            {selectedEmp && isAdmin() && (
              <button onClick={() => initMut.mutate(selectedEmp)} disabled={initMut.isPending}
                className="rounded-md bg-primary-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-primary-500 disabled:opacity-50">
                {initMut.isPending ? 'Assigning…' : 'Assign Checklist'}
              </button>
            )}
          </div>

          {/* Detail view for selected employee */}
          {selectedEmp && (
            empChecklist.length === 0 ? (
              <EmptyState title="No checklist" description="Click 'Assign Checklist' to initialize onboarding tasks for this employee." />
            ) : (
              <div className="rounded-lg bg-white shadow overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-700">Checklist</p>
                  <ProgressBar completed={empChecklist.filter(i => i.status === 'COMPLETED').length} total={empChecklist.length} />
                </div>
                <ul className="divide-y divide-gray-100">
                  {empChecklist.map(item => (
                    <li key={item.id} className="flex items-center gap-4 px-5 py-3">
                      <button onClick={() => { setRemarkModal(item); setRemark('') }} disabled={updateMut.isPending}>
                        {item.status === 'COMPLETED'
                          ? <CheckSolid className="h-5 w-5 text-green-500" />
                          : <div className="h-5 w-5 rounded-full border-2 border-gray-300 hover:border-primary-400" />}
                      </button>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${item.status === 'COMPLETED' ? 'line-through text-gray-400' : 'text-gray-900'}`}>{item.task?.title}</p>
                        <p className="text-xs text-gray-500">{item.task?.category}</p>
                      </div>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[item.status]}`}>{item.status}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          )}

          {/* Summary table when no employee selected */}
          {!selectedEmp && (
            allLoading ? <PageLoader /> : allChecklists.length === 0 ? (
              <EmptyState title="No checklists" description="Assign onboarding checklists to employees." />
            ) : (
              <div className="overflow-hidden rounded-lg bg-white shadow">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Employee', 'Joined', 'Progress', 'Pending', 'Status'].map(h => (
                        <th key={h} className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {allChecklists.map(c => (
                      <tr key={c.employeeId} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedEmp(String(c.employeeId))}>
                        <td className="px-5 py-3 text-sm font-medium text-gray-900">{c.name} <span className="text-gray-400 font-normal">({c.employeeCode})</span></td>
                        <td className="px-5 py-3 text-sm text-gray-500">{c.dateOfJoining ? new Date(c.dateOfJoining).toLocaleDateString('en-IN') : '—'}</td>
                        <td className="px-5 py-3 w-48"><ProgressBar completed={c.completed} total={c.total} /></td>
                        <td className="px-5 py-3 text-sm text-amber-600 font-medium">{c.pending} tasks</td>
                        <td className="px-5 py-3">
                          {c.completed === c.total
                            ? <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">Complete</span>
                            : <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">In Progress</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </>
      )}

      {/* ── Task Management (Admin) ── */}
      {tab === 'tasks' && isAdmin() && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => openTask()} className="inline-flex items-center gap-2 rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white hover:bg-primary-500">
              <PlusIcon className="h-4 w-4" /> New Task
            </button>
          </div>
          {tasks.length === 0 ? (
            <EmptyState title="No tasks defined" description="Create onboarding tasks that will be assigned to new employees." />
          ) : (
            <div className="overflow-hidden rounded-lg bg-white shadow">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {['#', 'Task', 'Category', 'Required', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {tasks.map(t => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-400">{t.order}</td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">{t.title}</p>
                        {t.description && <p className="text-xs text-gray-500">{t.description}</p>}
                      </td>
                      <td className="px-4 py-3"><span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">{t.category}</span></td>
                      <td className="px-4 py-3 text-sm text-gray-500">{t.isRequired ? 'Yes' : 'No'}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-3">
                          <button onClick={() => openTask(t)} className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-500">
                            <PencilIcon className="h-3.5 w-3.5" /> Edit
                          </button>
                          <button onClick={() => deleteMut.mutate(t.id)} disabled={deleteMut.isPending} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600">
                            <TrashIcon className="h-3.5 w-3.5" /> Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Task Modal */}
      <Modal open={!!taskModal} onClose={() => setTaskModal(null)} title={taskForm.id ? 'Edit Task' : 'New Onboarding Task'} size="sm">
        <form onSubmit={submitTask} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Title *</label>
            <input required value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
              className="mt-1 block w-full rounded-md border-0 py-1.5 px-3 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm" placeholder="e.g. Submit ID proof" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea rows={2} value={taskForm.description || ''} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
              className="mt-1 block w-full rounded-md border-0 py-1.5 px-3 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <select value={taskForm.category} onChange={e => setTaskForm({ ...taskForm, category: e.target.value })}
                className="mt-1 block w-full rounded-md border-0 py-1.5 pl-3 pr-8 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Order</label>
              <input type="number" min={0} value={taskForm.order} onChange={e => setTaskForm({ ...taskForm, order: e.target.value })}
                className="mt-1 block w-full rounded-md border-0 py-1.5 px-3 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm" />
            </div>
          </div>
          <label className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={!!taskForm.isRequired} onChange={e => setTaskForm({ ...taskForm, isRequired: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
            Required task
          </label>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setTaskModal(null)} className="rounded-md px-3 py-2 text-sm ring-1 ring-gray-300 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={taskMut.isPending} className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-500 disabled:opacity-50">
              {taskMut.isPending ? 'Saving…' : (taskForm.id ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Complete Item Modal */}
      <Modal open={!!remarkModal} onClose={() => setRemarkModal(null)} title="Complete Task" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600"><strong>{remarkModal?.task?.title}</strong></p>
          <div>
            <label className="block text-sm font-medium text-gray-700">Remarks <span className="text-gray-400">(optional)</span></label>
            <textarea rows={3} value={remark} onChange={e => setRemark(e.target.value)}
              className="mt-1 block w-full rounded-md border-0 py-1.5 px-3 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm"
              placeholder="e.g. Submitted to HR desk, tracking #123" />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setRemarkModal(null)} className="rounded-md px-3 py-2 text-sm ring-1 ring-gray-300 hover:bg-gray-50">Cancel</button>
            <button onClick={confirmComplete} disabled={updateMut.isPending}
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500 disabled:opacity-50">
              {updateMut.isPending ? 'Saving…' : 'Mark Complete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
