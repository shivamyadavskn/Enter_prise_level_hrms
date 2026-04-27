import { useQuery } from '@tanstack/react-query'
import { celebrationsApi } from '../../api/index.js'
import { CakeIcon, SparklesIcon } from '@heroicons/react/24/outline'

const fmt = (iso) => {
  if (!iso) return ''
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
}

function Row({ icon: Icon, accent, name, code, dept, on, badge }) {
  return (
    <li className="flex items-center gap-3 py-2.5">
      <div className={`flex h-9 w-9 flex-none items-center justify-center rounded-full ${accent}`}>
        <Icon className="h-4 w-4 text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-gray-900">{name}</p>
        <p className="truncate text-xs text-gray-500">{code}{dept ? ` · ${dept}` : ''}</p>
      </div>
      <div className="text-right">
        <p className="text-xs font-semibold text-gray-700 tabular-nums">{fmt(on)}</p>
        {badge ? <p className="text-[10px] text-gray-400">{badge}</p> : null}
      </div>
    </li>
  )
}

export default function CelebrationsWidget({ days = 14 }) {
  const { data, isLoading } = useQuery({
    queryKey: ['celebrations', days],
    queryFn: () => celebrationsApi.getUpcoming(days),
    staleTime: 5 * 60_000,
  })

  const birthdays = data?.data?.data?.birthdays || []
  const anniversaries = data?.data?.data?.anniversaries || []
  const total = birthdays.length + anniversaries.length

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Upcoming Celebrations</h3>
          <p className="text-xs text-gray-500">Next {days} days</p>
        </div>
        <span className="rounded-full bg-pink-50 px-2 py-0.5 text-xs font-semibold text-pink-700">{total}</span>
      </div>

      <div className="max-h-80 overflow-y-auto px-5 py-2">
        {isLoading ? (
          <div className="space-y-2 py-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 animate-pulse rounded-md bg-gray-100" />
            ))}
          </div>
        ) : total === 0 ? (
          <p className="py-6 text-center text-sm text-gray-500">No celebrations coming up</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {birthdays.map((e) => (
              <Row
                key={`b-${e.id}-${e.on}`}
                icon={CakeIcon}
                accent="bg-pink-500"
                name={`${e.firstName} ${e.lastName || ''}`.trim()}
                code={e.employeeCode}
                dept={e.department?.name}
                on={e.on}
                badge="Birthday"
              />
            ))}
            {anniversaries.map((e) => (
              <Row
                key={`a-${e.id}-${e.on}`}
                icon={SparklesIcon}
                accent="bg-amber-500"
                name={`${e.firstName} ${e.lastName || ''}`.trim()}
                code={e.employeeCode}
                dept={e.department?.name}
                on={e.on}
                badge={`${e.years} yr anniversary`}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
