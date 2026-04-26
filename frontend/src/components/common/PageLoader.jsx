/**
 * Skeleton/spinner shown while a lazy-loaded route chunk is being fetched.
 * Uses a centred spinner — pages can render their own skeleton on top.
 */
export default function PageLoader({ label = "Loading…" }) {
  return (
    <div className="flex h-[60vh] flex-col items-center justify-center gap-3" role="status" aria-live="polite">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      <p className="text-xs font-medium uppercase tracking-widest text-gray-400">{label}</p>
    </div>
  )
}
