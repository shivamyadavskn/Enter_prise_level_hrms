/**
 * Composable skeleton primitives. Use these inside data pages while
 * react-query is fetching, instead of a blank screen.
 */

export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-md bg-gray-200/70 ${className}`} />
}

export function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={`h-3 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`} />
      ))}
    </div>
  )
}

export function SkeletonCard({ rows = 3 }) {
  return (
    <div className="card p-5 space-y-4">
      <Skeleton className="h-5 w-1/3" />
      <SkeletonText lines={rows} />
    </div>
  )
}

export function SkeletonTable({ rows = 6, cols = 5 }) {
  return (
    <div className="card overflow-hidden">
      <div className="grid border-b border-gray-100 px-5 py-3" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {Array.from({ length: cols }).map((_, c) => <Skeleton key={c} className="mr-4 h-3 w-2/3" />)}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="grid border-b border-gray-50 px-5 py-4" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className={`mr-4 h-3 ${c === 0 ? 'w-3/4' : 'w-1/2'}`} />
          ))}
        </div>
      ))}
    </div>
  )
}

export function SkeletonStatGrid({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card p-5 space-y-3">
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-7 w-2/3" />
          <Skeleton className="h-2 w-1/3" />
        </div>
      ))}
    </div>
  )
}
