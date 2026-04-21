import clsx from 'clsx'

const variants = {
  green:  'bg-emerald-50 text-emerald-700 ring-emerald-600/10',
  red:    'bg-red-50 text-red-700 ring-red-600/10',
  yellow: 'bg-amber-50 text-amber-700 ring-amber-600/10',
  blue:   'bg-blue-50 text-blue-700 ring-blue-600/10',
  gray:   'bg-gray-50 text-gray-600 ring-gray-500/10',
  purple: 'bg-purple-50 text-purple-700 ring-purple-600/10',
  indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-600/10',
}

const dotColors = {
  green:  'bg-emerald-500',
  red:    'bg-red-500',
  yellow: 'bg-amber-500',
  blue:   'bg-blue-500',
  gray:   'bg-gray-400',
  purple: 'bg-purple-500',
  indigo: 'bg-indigo-500',
}

const statusMap = {
  ACTIVE: 'green', PROBATION: 'yellow', RESIGNED: 'gray', TERMINATED: 'red',
  APPROVED: 'green', PENDING: 'yellow', REJECTED: 'red', CANCELLED: 'gray',
  PRESENT: 'green', ABSENT: 'red', HALF_DAY: 'yellow', LEAVE: 'blue',
  WFH: 'purple', HOLIDAY: 'indigo',
  PAID: 'green', PROCESSED: 'blue',
  COMPLETED: 'green', ACKNOWLEDGED: 'blue',
  SUPER_ADMIN: 'red', ADMIN: 'indigo', MANAGER: 'purple', FINANCE: 'blue', EMPLOYEE: 'gray',
  NOT_MARKED: 'gray',
}

export default function Badge({ label, status, variant, dot = false }) {
  const color = variant || statusMap[status] || statusMap[label?.toUpperCase()] || 'gray'
  return (
    <span className={clsx('inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset', variants[color])}>
      {dot && <span className={clsx('h-1.5 w-1.5 rounded-full', dotColors[color])} />}
      {label || status}
    </span>
  )
}
