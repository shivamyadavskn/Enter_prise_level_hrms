import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import Modal from './Modal.jsx'

export default function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', danger = false, loading = false }) {
  return (
    <Modal open={open} onClose={onClose} title="" size="sm">
      <div className="sm:flex sm:items-start">
        <div className={`mx-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-xl sm:mx-0 sm:h-11 sm:w-11 ${danger ? 'bg-red-50 ring-1 ring-red-100' : 'bg-amber-50 ring-1 ring-amber-100'}`}>
          <ExclamationTriangleIcon className={`h-6 w-6 ${danger ? 'text-red-500' : 'text-amber-500'}`} />
        </div>
        <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
          <h3 className="text-base font-semibold text-gray-900 tracking-tight">{title}</h3>
          <p className="mt-2 text-sm text-gray-500 leading-relaxed">{message}</p>
        </div>
      </div>
      <div className="mt-6 sm:flex sm:flex-row-reverse gap-3">
        <button
          onClick={onConfirm}
          disabled={loading}
          className={`inline-flex w-full justify-center rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm disabled:opacity-50 transition-colors sm:w-auto ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-primary-600 hover:bg-primary-700'}`}
        >
          {loading ? 'Processing…' : confirmLabel}
        </button>
        <button onClick={onClose} className="mt-3 inline-flex w-full justify-center rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto transition-colors">Cancel</button>
      </div>
    </Modal>
  )
}
