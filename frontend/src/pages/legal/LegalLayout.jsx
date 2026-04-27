import { Link } from 'react-router-dom'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

/**
 * Shared shell for legal pages so Terms and Privacy share the same chrome.
 * Keep these pages plain and readable — clients (and their lawyers) skim them.
 */
export default function LegalLayout({ title, lastUpdated, children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link to="/welcome" className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-primary-600">
            <ArrowLeftIcon className="h-4 w-4" /> Back
          </Link>
          <div className="flex gap-4 text-sm">
            <Link to="/legal/terms"   className="font-medium text-gray-700 hover:text-primary-600">Terms</Link>
            <Link to="/legal/privacy" className="font-medium text-gray-700 hover:text-primary-600">Privacy</Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        {lastUpdated && (
          <p className="mt-1 text-sm text-gray-500">Last updated: {lastUpdated}</p>
        )}
        <article className="prose prose-sm sm:prose mt-8 max-w-none text-gray-700">
          {children}
        </article>
        <footer className="mt-12 border-t border-gray-200 pt-6 text-xs text-gray-400">
          © {new Date().getFullYear()} PeopleOS. All rights reserved.
        </footer>
      </main>
    </div>
  )
}
