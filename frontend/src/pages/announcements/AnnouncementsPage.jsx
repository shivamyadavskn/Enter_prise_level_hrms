import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { announcementsApi } from '../../api/index.js'
import { useAuth } from '../../contexts/AuthContext.jsx'
import Badge from '../../components/common/Badge.jsx'
import Modal from '../../components/common/Modal.jsx'
import Pagination from '../../components/common/Pagination.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import { PageLoader } from '../../components/common/LoadingSpinner.jsx'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'
import { 
  PlusIcon, MegaphoneIcon, PencilIcon, TrashIcon, 
  CalendarIcon, UserIcon, FlagIcon 
} from '@heroicons/react/24/outline'
import { MegaphoneIcon as MegaphoneSolidIcon } from '@heroicons/react/24/solid'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const inputCls = 'mt-1 block w-full rounded-md border-0 py-1.5 px-3 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm'
const labelCls = 'block text-sm font-medium text-gray-700'

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Low', color: 'gray' },
  { value: 'NORMAL', label: 'Normal', color: 'blue' },
  { value: 'HIGH', label: 'High', color: 'orange' },
  { value: 'URGENT', label: 'Urgent', color: 'red' },
]

function AnnouncementFormModal({ open, onClose, announcement, onSubmit, loading }) {
  const [form, setForm] = useState(announcement || {
    title: '',
    content: '',
    priority: 'NORMAL',
    isPinned: false,
    expiresAt: '',
  })

  const handleChange = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm({ ...form, [field]: value })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = { ...form }
    if (!payload.expiresAt) delete payload.expiresAt
    onSubmit(payload)
  }

  return (
    <Modal open={open} onClose={onClose} title={announcement ? 'Edit Announcement' : 'Create Announcement'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelCls}>Title *</label>
          <input
            type="text"
            required
            value={form.title}
            onChange={handleChange('title')}
            placeholder="e.g., Company Holiday - Diwali"
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls}>Content *</label>
          <textarea
            required
            rows={5}
            value={form.content}
            onChange={handleChange('content')}
            placeholder="Write your announcement here..."
            className={inputCls}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Priority *</label>
            <select
              value={form.priority}
              onChange={handleChange('priority')}
              className="mt-1 block w-full rounded-md border-0 py-1.5 pl-3 pr-8 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm"
            >
              {PRIORITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>Expires On (Optional)</label>
            <input
              type="date"
              value={form.expiresAt ? form.expiresAt.split('T')[0] : ''}
              onChange={handleChange('expiresAt')}
              className={inputCls}
            />
          </div>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="isPinned"
            checked={form.isPinned}
            onChange={handleChange('isPinned')}
            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-600"
          />
          <label htmlFor="isPinned" className="ml-2 text-sm text-gray-700">
            Pin this announcement to the top
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white hover:bg-primary-500 disabled:opacity-50"
          >
            {loading ? 'Saving...' : announcement ? 'Update' : 'Create'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function AnnouncementCard({ announcement, onEdit, onDelete, canManage }) {
  const priorityConfig = PRIORITY_OPTIONS.find(p => p.value === announcement.priority)
  const isExpired = announcement.expiresAt && new Date(announcement.expiresAt) < new Date()

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${announcement.isPinned ? 'border-primary-300 ring-2 ring-primary-100' : 'border-gray-200'} p-6 hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {announcement.isPinned && (
              <MegaphoneSolidIcon className="h-5 w-5 text-primary-600" />
            )}
            <h3 className="text-lg font-semibold text-gray-900">{announcement.title}</h3>
            <Badge color={priorityConfig?.color || 'gray'}>{priorityConfig?.label || announcement.priority}</Badge>
            {isExpired && <Badge color="gray">Expired</Badge>}
          </div>

          <p className="text-gray-700 whitespace-pre-wrap mb-4">{announcement.content}</p>

          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <CalendarIcon className="h-4 w-4" />
              <span>{format(new Date(announcement.publishedAt), 'MMM dd, yyyy')}</span>
            </div>
            {announcement.expiresAt && (
              <div className="flex items-center gap-1">
                <FlagIcon className="h-4 w-4" />
                <span>Expires: {format(new Date(announcement.expiresAt), 'MMM dd, yyyy')}</span>
              </div>
            )}
          </div>
        </div>

        {canManage && (
          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={() => onEdit(announcement)}
              className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-md"
              title="Edit"
            >
              <PencilIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => onDelete(announcement)}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md"
              title="Delete"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AnnouncementsPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const limit = 10

  const canManage = user && ['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(user.role)

  const { data, isLoading } = useQuery({
    queryKey: ['announcements', page],
    queryFn: () => announcementsApi.getAll({ page, limit }),
  })

  const createMutation = useMutation({
    mutationFn: announcementsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['announcements'])
      toast.success('Announcement created successfully')
      setShowForm(false)
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create announcement')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => announcementsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['announcements'])
      toast.success('Announcement updated successfully')
      setShowForm(false)
      setEditingAnnouncement(null)
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update announcement')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: announcementsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['announcements'])
      toast.success('Announcement deleted successfully')
      setDeleteConfirm(null)
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete announcement')
    },
  })

  const handleSubmit = (formData) => {
    if (editingAnnouncement) {
      updateMutation.mutate({ id: editingAnnouncement.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleEdit = (announcement) => {
    setEditingAnnouncement(announcement)
    setShowForm(true)
  }

  const handleDelete = (announcement) => {
    setDeleteConfirm(announcement)
  }

  const confirmDelete = () => {
    if (deleteConfirm) {
      deleteMutation.mutate(deleteConfirm.id)
    }
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingAnnouncement(null)
  }

  if (isLoading) return <PageLoader />

  const announcements = data?.data?.data || []
  const pagination = data?.data?.pagination || {}
  const pinnedAnnouncements = announcements.filter(a => a.isPinned)
  const regularAnnouncements = announcements.filter(a => !a.isPinned)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
          <p className="mt-1 text-sm text-gray-500">
            Company-wide announcements and important updates
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white hover:bg-primary-500"
          >
            <PlusIcon className="h-5 w-5" />
            New Announcement
          </button>
        )}
      </div>

      {announcements.length === 0 ? (
        <EmptyState
          icon={MegaphoneIcon}
          title="No announcements yet"
          description={canManage ? "Create your first announcement to keep everyone informed" : "No announcements have been posted yet"}
          action={canManage ? {
            label: 'Create Announcement',
            onClick: () => setShowForm(true)
          } : undefined}
        />
      ) : (
        <div className="space-y-6">
          {pinnedAnnouncements.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <MegaphoneSolidIcon className="h-4 w-4" />
                Pinned Announcements
              </h2>
              {pinnedAnnouncements.map((announcement) => (
                <AnnouncementCard
                  key={announcement.id}
                  announcement={announcement}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  canManage={canManage}
                />
              ))}
            </div>
          )}

          {regularAnnouncements.length > 0 && (
            <div className="space-y-4">
              {pinnedAnnouncements.length > 0 && (
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                  Recent Announcements
                </h2>
              )}
              {regularAnnouncements.map((announcement) => (
                <AnnouncementCard
                  key={announcement.id}
                  announcement={announcement}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  canManage={canManage}
                />
              ))}
            </div>
          )}

          {pagination.totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={pagination.totalPages}
              onPageChange={setPage}
            />
          )}
        </div>
      )}

      <AnnouncementFormModal
        open={showForm}
        onClose={handleCloseForm}
        announcement={editingAnnouncement}
        onSubmit={handleSubmit}
        loading={createMutation.isPending || updateMutation.isPending}
      />

      <ConfirmDialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={confirmDelete}
        title="Delete Announcement"
        message={`Are you sure you want to delete "${deleteConfirm?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        confirmColor="red"
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
