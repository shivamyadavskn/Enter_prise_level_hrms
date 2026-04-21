import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid'

export default function Pagination({ page, totalPages, total, limit, onPageChange }) {
  const from = (page - 1) * limit + 1
  const to = Math.min(page * limit, total)

  return (
    <div className="flex items-center justify-between border-t border-gray-100 bg-white px-4 py-3 sm:px-6">
      <div className="flex flex-1 justify-between sm:hidden">
        <button onClick={() => onPageChange(page - 1)} disabled={page <= 1} className="relative inline-flex items-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors">Previous</button>
        <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} className="relative ml-3 inline-flex items-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors">Next</button>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <p className="text-sm text-gray-500">
          Showing <span className="font-semibold text-gray-700">{from}</span> to <span className="font-semibold text-gray-700">{to}</span> of <span className="font-semibold text-gray-700">{total}</span> results
        </p>
        <nav className="isolate inline-flex gap-1">
          <button onClick={() => onPageChange(page - 1)} disabled={page <= 1} className="inline-flex items-center rounded-lg px-2 py-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-40 disabled:hover:bg-transparent transition-colors">
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            const p = i + 1
            return (
              <button key={p} onClick={() => onPageChange(p)} className={`inline-flex items-center justify-center rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors ${p === page ? 'bg-primary-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}>{p}</button>
            )
          })}
          <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} className="inline-flex items-center rounded-lg px-2 py-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-40 disabled:hover:bg-transparent transition-colors">
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </nav>
      </div>
    </div>
  )
}
