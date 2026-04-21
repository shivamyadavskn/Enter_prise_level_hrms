import clsx from 'clsx'

export default function LoadingSpinner({ className, size = 'md' }) {
  const sizes = { sm: 'h-4 w-4 border-2', md: 'h-8 w-8 border-[3px]', lg: 'h-10 w-10 border-[3px]' }
  return (
    <div className={clsx('flex items-center justify-center', className)}>
      <div className={clsx('animate-spin rounded-full border-primary-200 border-t-primary-600', sizes[size])} />
    </div>
  )
}

export function PageLoader() {
  return (
    <div className="flex h-64 flex-col items-center justify-center gap-3">
      <LoadingSpinner size="lg" />
      <p className="text-sm text-gray-400 font-medium animate-pulse">Loading...</p>
    </div>
  )
}
