import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import Modal from './Modal.jsx'

export default function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', danger = false, loading = false }) {
  return (
    <Modal open={open} onClose={onClose} title="" size="sm">
      <div className="sm:flex sm:items-start">
        <div className={`mx-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-full sm:mx-0 sm:h-10 sm:w-10 ${danger ? 'bg-red-100' : 'bg-yellow-100'}`}>
          <ExclamationTriangleIcon className={`h-6 w-6 ${danger ? 'text-red-600' : 'text-yellow-600'}`} />
        </div>
        <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <p className="mt-2 text-sm text-gray-500">{message}</p>
        </div>
      </div>
      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
        <button
          onClick={onConfirm}
          disabled={loading}
          className={`inline-flex justify-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-50 ${danger ? 'bg-red-600 hover:bg-red-500' : 'bg-primary-600 hover:bg-primary-500'}`}
        >
          {loading ? 'Processing…' : confirmLabel}
        </button>
        <button onClick={onClose} className="mt-3 inline-flex justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0">Cancel</button>
      </div>
    </Modal>
  )
}
