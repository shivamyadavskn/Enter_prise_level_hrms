import clsx from 'clsx'

const variants = {
  green:  'bg-green-50 text-green-700 ring-green-600/20',
  red:    'bg-red-50 text-red-700 ring-red-600/20',
  yellow: 'bg-yellow-50 text-yellow-800 ring-yellow-600/20',
  blue:   'bg-blue-50 text-blue-700 ring-blue-700/10',
  gray:   'bg-gray-50 text-gray-600 ring-gray-500/10',
  purple: 'bg-purple-50 text-purple-700 ring-purple-700/10',
  indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-700/10',
}

const statusMap = {
  ACTIVE: 'green', PROBATION: 'yellow', RESIGNED: 'gray', TERMINATED: 'red',
  APPROVED: 'green', PENDING: 'yellow', REJECTED: 'red', CANCELLED: 'gray',
  PRESENT: 'green', ABSENT: 'red', HALF_DAY: 'yellow', LEAVE: 'blue',
  WFH: 'purple', HOLIDAY: 'indigo',
  PAID: 'green', PROCESSED: 'blue',
  COMPLETED: 'green', ACKNOWLEDGED: 'blue',
  SUPER_ADMIN: 'red', ADMIN: 'indigo', MANAGER: 'purple', FINANCE: 'blue', EMPLOYEE: 'gray',
}

export default function Badge({ label, status, variant }) {
  const color = variant || statusMap[status] || statusMap[label?.toUpperCase()] || 'gray'
  return (
    <span className={clsx('inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset', variants[color])}>
      {label || status}
    </span>
  )
}
