import clsx from 'clsx'

export default function StatCard({ title, value, icon: Icon, color = 'blue', subtitle }) {
  const iconColors = {
    blue:   'bg-blue-500/10 text-blue-600 ring-blue-500/20',
    green:  'bg-emerald-500/10 text-emerald-600 ring-emerald-500/20',
    yellow: 'bg-amber-500/10 text-amber-600 ring-amber-500/20',
    red:    'bg-red-500/10 text-red-600 ring-red-500/20',
    purple: 'bg-purple-500/10 text-purple-600 ring-purple-500/20',
    indigo: 'bg-indigo-500/10 text-indigo-600 ring-indigo-500/20',
  }

  const accentColors = {
    blue:   'from-blue-500',
    green:  'from-emerald-500',
    yellow: 'from-amber-500',
    red:    'from-red-500',
    purple: 'from-purple-500',
    indigo: 'from-indigo-500',
  }

  return (
    <div className="group relative overflow-hidden rounded-xl bg-white border border-gray-100 shadow-card hover:shadow-card-hover transition-all duration-200">
      <div className={clsx('absolute top-0 left-0 h-1 w-full bg-gradient-to-r to-transparent', accentColors[color])} />
      <div className="p-5">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-500">{title}</p>
            <div className="mt-1.5 flex items-baseline gap-2">
              <p className="text-2xl font-bold tracking-tight text-gray-900">{value ?? '—'}</p>
              {subtitle && <span className="text-sm font-medium text-gray-400">{subtitle}</span>}
            </div>
          </div>
          <div className={clsx('flex h-11 w-11 items-center justify-center rounded-xl ring-1 shrink-0 ml-4', iconColors[color])}>
            {Icon && <Icon className="h-5 w-5" aria-hidden="true" />}
          </div>
        </div>
      </div>
    </div>
  )
}
