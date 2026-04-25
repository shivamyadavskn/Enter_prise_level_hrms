import clsx from 'clsx'
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline'

/**
 * Enterprise KPI / Stat Card.
 * Props: title, value, icon, color, subtitle, delta (number, % change), deltaLabel
 */
export default function StatCard({ title, value, icon: Icon, color = 'primary', subtitle, delta, deltaLabel }) {
  const tints = {
    primary: 'bg-primary-50 text-primary-600 ring-primary-100',
    blue:    'bg-sky-50 text-sky-600 ring-sky-100',
    green:   'bg-emerald-50 text-emerald-600 ring-emerald-100',
    yellow:  'bg-amber-50 text-amber-600 ring-amber-100',
    red:     'bg-red-50 text-red-600 ring-red-100',
    purple:  'bg-purple-50 text-purple-600 ring-purple-100',
    indigo:  'bg-indigo-50 text-indigo-600 ring-indigo-100',
    slate:   'bg-ink-100 text-ink-600 ring-ink-200',
  }

  const isUp = typeof delta === 'number' && delta >= 0

  return (
    <div className="kpi-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="kpi-label truncate">{title}</p>
          <div className="mt-2 flex items-baseline gap-1.5">
            <p className="kpi-value num-tabular truncate">{value ?? '—'}</p>
            {subtitle && <span className="text-xs font-medium text-ink-400 num-tabular">{subtitle}</span>}
          </div>
          {typeof delta === 'number' && (
            <div className="mt-2 flex items-center gap-1.5">
              <span className={isUp ? 'kpi-delta-up' : 'kpi-delta-down'}>
                {isUp ? <ArrowTrendingUpIcon className="h-3 w-3" /> : <ArrowTrendingDownIcon className="h-3 w-3" />}
                {Math.abs(delta).toFixed(1)}%
              </span>
              {deltaLabel && <span className="text-2xs text-ink-500">{deltaLabel}</span>}
            </div>
          )}
        </div>
        {Icon && (
          <div className={clsx('shrink-0 flex h-10 w-10 items-center justify-center rounded-lg ring-1 ring-inset', tints[color] || tints.primary)}>
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
        )}
      </div>
    </div>
  )
}
