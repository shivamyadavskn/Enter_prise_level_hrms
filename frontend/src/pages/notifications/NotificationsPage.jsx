import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationsApi } from '../../api/index.js'
import { PageLoader } from '../../components/common/LoadingSpinner.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import { BellIcon, CheckIcon, TrashIcon } from '@heroicons/react/24/outline'
import { BellAlertIcon } from '@heroicons/react/24/solid'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'
import clsx from 'clsx'

export default function NotificationsPage() {
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getAll({ limit: 50 }),
  })

  const markReadMut = useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: () => { qc.invalidateQueries(['notifications']); qc.invalidateQueries(['notif-count']) },
  })

  const markAllMut = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => { qc.invalidateQueries(['notifications']); qc.invalidateQueries(['notif-count']); toast.success('All marked as read') },
  })

  const deleteMut = useMutation({
    mutationFn: notificationsApi.delete,
    onSuccess: () => { qc.invalidateQueries(['notifications']); qc.invalidateQueries(['notif-count']) },
  })

  const clearAllMut = useMutation({
    mutationFn: notificationsApi.clearAll,
    onSuccess: () => { qc.invalidateQueries(['notifications']); qc.invalidateQueries(['notif-count']); toast.success('All notifications cleared') },
  })

  const notifications = data?.data?.data || []
  const unread = notifications.filter((n) => !n.isRead).length

  const typeColors = {
    LEAVE_REQUEST: 'bg-blue-100 text-blue-600',
    LEAVE_APPROVED: 'bg-green-100 text-green-600',
    LEAVE_REJECTED: 'bg-red-100 text-red-600',
    WFH_REQUEST: 'bg-purple-100 text-purple-600',
    WFH_APPROVED: 'bg-green-100 text-green-600',
    WFH_REJECTED: 'bg-red-100 text-red-600',
    PAYSLIP: 'bg-yellow-100 text-yellow-600',
    PERFORMANCE_REVIEW: 'bg-indigo-100 text-indigo-600',
    REGULARIZATION: 'bg-orange-100 text-orange-600',
    DEFAULT: 'bg-gray-100 text-gray-600',
  }

  if (isLoading) return <PageLoader />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500">{unread} unread</p>
        </div>
        <div className="flex gap-3">
          {unread > 0 && (
            <button onClick={() => markAllMut.mutate()} disabled={markAllMut.isPending}
              className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
              <CheckIcon className="h-4 w-4" /> Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button onClick={() => clearAllMut.mutate()} disabled={clearAllMut.isPending}
              className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
              <TrashIcon className="h-4 w-4" /> Clear all
            </button>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <EmptyState title="No notifications" description="You're all caught up!" action={<BellIcon className="mx-auto h-12 w-12 text-gray-300" />} />
      ) : (
        <div className="overflow-hidden rounded-lg bg-white shadow divide-y divide-gray-100">
          {notifications.map((n) => (
            <div key={n.id} className={clsx('flex items-start gap-4 px-6 py-4 transition-colors', !n.isRead ? 'bg-primary-50/50' : 'hover:bg-gray-50')}>
              <div className={clsx('mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full', typeColors[n.notificationType] || typeColors.DEFAULT)}>
                {n.isRead ? <BellIcon className="h-5 w-5" /> : <BellAlertIcon className="h-5 w-5" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={clsx('text-sm', !n.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700')}>{n.title}</p>
                  <span className="shrink-0 text-xs text-gray-400">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-gray-500">{n.message}</p>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                {!n.isRead && (
                  <button onClick={() => markReadMut.mutate(n.id)} className="rounded p-1.5 text-gray-400 hover:bg-primary-100 hover:text-primary-600" title="Mark as read">
                    <CheckIcon className="h-4 w-4" />
                  </button>
                )}
                <button onClick={() => deleteMut.mutate(n.id)} className="rounded p-1.5 text-gray-400 hover:bg-red-100 hover:text-red-500" title="Delete">
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
