import { useState } from 'react'
import toast from 'react-hot-toast'
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import { downloadBlob } from '../../api/index.js'

/**
 * Generic Excel/PDF download button.
 *
 * Usage:
 *   <ExportButton onExport={() => exportsApi.employeesXlsx()} fallbackName="employees.xlsx" />
 *   <ExportButton label="Download Payslip" onExport={() => exportsApi.payslipPdf(id)} fallbackName="payslip.pdf" />
 */
export default function ExportButton({
  onExport,
  label = 'Export Excel',
  fallbackName = 'export.xlsx',
  variant = 'secondary',
  className = '',
  icon: Icon = ArrowDownTrayIcon,
}) {
  const [loading, setLoading] = useState(false)

  const handle = async () => {
    try {
      setLoading(true)
      const res = await onExport()
      downloadBlob(res, fallbackName)
      toast.success('Download started')
    } catch (err) {
      // Blob errors come back as a Blob, not JSON — try to read the message
      let msg = 'Export failed'
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text()
          const json = JSON.parse(text)
          msg = json.message || msg
        } catch { /* keep default */ }
      } else {
        msg = err.response?.data?.message || err.message || msg
      }
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const base = variant === 'primary'
    ? 'bg-primary-600 text-white hover:bg-primary-700'
    : 'bg-white text-gray-700 ring-1 ring-gray-300 hover:bg-gray-50'

  return (
    <button
      type="button"
      onClick={handle}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium shadow-sm transition-colors disabled:opacity-50 ${base} ${className}`}
    >
      {loading ? (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (
        <Icon className="h-4 w-4" />
      )}
      {loading ? 'Downloading…' : label}
    </button>
  )
}
