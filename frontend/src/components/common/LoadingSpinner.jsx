import clsx from 'clsx'

export default function LoadingSpinner({ className, size = 'md' }) {
  const sizes = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' }
  return (
    <div className={clsx('flex items-center justify-center', className)}>
      <div className={clsx('animate-spin rounded-full border-4 border-primary-200 border-t-primary-600', sizes[size])} />
    </div>
  )
}

export function PageLoader() {
  return <div className="flex h-64 items-center justify-center"><LoadingSpinner size="lg" /></div>
}
