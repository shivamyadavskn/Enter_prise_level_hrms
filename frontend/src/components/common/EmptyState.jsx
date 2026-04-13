import { InboxIcon } from '@heroicons/react/24/outline'

export default function EmptyState({ title = 'No results', description = 'Nothing to display yet.', action }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <InboxIcon className="mx-auto h-12 w-12 text-gray-300" />
      <h3 className="mt-2 text-sm font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
