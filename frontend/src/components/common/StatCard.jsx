import clsx from 'clsx'

export default function StatCard({ title, value, icon: Icon, color = 'blue', subtitle }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
    indigo: 'bg-indigo-50 text-indigo-600',
  }

  return (
    <div className="overflow-hidden rounded-lg bg-white shadow">
      <div className="p-5">
        <div className="flex items-center">
          <div className="shrink-0">
            <div className={clsx('flex h-10 w-10 items-center justify-center rounded-lg', colors[color])}>
              {Icon && <Icon className="h-6 w-6" aria-hidden="true" />}
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="truncate text-sm font-medium text-gray-500">{title}</dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900">{value ?? '—'}</div>
                {subtitle && <div className="ml-2 text-sm text-gray-500">{subtitle}</div>}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
