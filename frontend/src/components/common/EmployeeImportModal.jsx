import { useState, useRef } from 'react'
import { employeesApi } from '../../api/index.js'
import Modal from './Modal.jsx'
import { ArrowUpTrayIcon, TableCellsIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

const FIELD_OPTIONS = ['firstName', 'lastName', 'email', 'phone', 'department', 'designation', 'dateOfJoining', 'gender', 'employeeCode', 'basicSalary', '(ignore)']

const STEP_LABELS = ['Upload File', 'Map Columns', 'Import']

export default function EmployeeImportModal({ open, onClose, onSuccess }) {
  const [step, setStep] = useState(0)
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [mapping, setMapping] = useState({})
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef()

  const reset = () => { setStep(0); setFile(null); setPreview(null); setMapping({}); setResult(null) }

  const handleClose = () => { reset(); onClose() }

  const handleFile = async (f) => {
    if (!f) return
    const ext = f.name.split('.').pop().toLowerCase()
    if (!['xlsx', 'xls', 'csv'].includes(ext)) return toast.error('Only Excel (.xlsx, .xls) or CSV files accepted')
    setFile(f)
    setLoading(true)
    try {
      const res = await employeesApi.importPreview(f)
      const data = res.data.data
      setPreview(data)
      const autoMap = {}
      for (const [orig, field] of Object.entries(data.mapped)) {
        autoMap[orig] = field
      }
      for (const col of data.unmapped) autoMap[col] = '(ignore)'
      setMapping(autoMap)
      setStep(1)
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to parse file')
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async () => {
    const finalMapping = {}
    for (const [col, field] of Object.entries(mapping)) {
      if (field !== '(ignore)') finalMapping[col] = field
    }
    if (!Object.keys(finalMapping).length) return toast.error('Map at least one column')
    if (!finalMapping.firstName && !Object.values(finalMapping).includes('firstName')) {
      return toast.error('First Name column must be mapped')
    }

    setLoading(true)
    try {
      const res = await employeesApi.importExecute(file, finalMapping)
      setResult(res.data.data)
      setStep(2)
      if (res.data.data.created > 0) onSuccess?.()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Import failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Import Employees from Excel" size="lg">
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {STEP_LABELS.map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${i <= step ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-400'}`}>{i + 1}</div>
            <span className={`text-sm ${i === step ? 'font-semibold text-gray-900' : 'text-gray-400'}`}>{label}</span>
            {i < STEP_LABELS.length - 1 && <div className="h-px w-8 bg-gray-200" />}
          </div>
        ))}
      </div>

      {/* Step 0 — Upload */}
      {step === 0 && (
        <div className="space-y-4">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
            onClick={() => fileRef.current?.click()}
            className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-12 cursor-pointer transition-colors ${dragOver ? 'border-primary-400 bg-primary-50' : 'border-gray-300 hover:border-primary-300 hover:bg-gray-50'}`}>
            <ArrowUpTrayIcon className="h-10 w-10 text-gray-300" />
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700">Drop your Excel file here or <span className="text-primary-600">browse</span></p>
              <p className="text-xs text-gray-400 mt-1">Supports .xlsx, .xls, .csv · Max 5 MB</p>
            </div>
            <input ref={fileRef} type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={(e) => handleFile(e.target.files[0])} />
          </div>

          <div className="rounded-lg bg-gray-50 border border-gray-200 p-4">
            <p className="text-xs font-semibold text-gray-500 mb-2">Supported column names (auto-detected):</p>
            <div className="flex flex-wrap gap-1.5">
              {['First Name', 'Last Name', 'Email', 'Phone', 'Department', 'Designation', 'Date of Joining', 'Gender', 'Employee Code', 'Basic Salary'].map(c => (
                <span key={c} className="inline-flex items-center rounded-full bg-white border border-gray-200 px-2.5 py-0.5 text-xs text-gray-600">{c}</span>
              ))}
            </div>
          </div>

          {loading && <p className="text-center text-sm text-primary-600 animate-pulse">Parsing file…</p>}
        </div>
      )}

      {/* Step 1 — Map columns */}
      {step === 1 && preview && (
        <div className="space-y-4">
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-700">
            Found <strong>{preview.totalRows}</strong> rows. We auto-mapped your columns below — adjust as needed.
          </div>
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Your Column</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Map to Field</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Sample Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {preview.headers.map(col => (
                  <tr key={col} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 text-sm font-medium text-gray-900">{col}</td>
                    <td className="px-4 py-2.5">
                      <select value={mapping[col] || '(ignore)'}
                        onChange={(e) => setMapping({ ...mapping, [col]: e.target.value })}
                        className={`rounded-md border-0 py-1 pl-2 pr-6 text-sm ring-1 ring-inset focus:ring-2 focus:ring-primary-500 ${mapping[col] && mapping[col] !== '(ignore)' ? 'ring-green-300 bg-green-50' : 'ring-gray-300'}`}>
                        {FIELD_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-400">{preview.preview[0]?.[mapping[col]] || preview.preview[0]?.[col] || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between">
            <button onClick={() => { setStep(0); setFile(null); setPreview(null) }} className="rounded-md px-3 py-2 text-sm ring-1 ring-gray-300 hover:bg-gray-50">Back</button>
            <button onClick={handleImport} disabled={loading}
              className="rounded-md bg-primary-600 px-5 py-2 text-sm font-semibold text-white hover:bg-primary-500 disabled:opacity-50">
              {loading ? 'Importing…' : `Import ${preview.totalRows} Employees`}
            </button>
          </div>
        </div>
      )}

      {/* Step 2 — Result */}
      {step === 2 && result && (
        <div className="space-y-4">
          <div className={`rounded-xl p-5 flex items-start gap-4 ${result.created > 0 ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
            {result.created > 0
              ? <CheckCircleIcon className="h-8 w-8 text-green-500 shrink-0" />
              : <ExclamationTriangleIcon className="h-8 w-8 text-amber-500 shrink-0" />}
            <div>
              <p className="font-semibold text-gray-900">Import Complete</p>
              <p className="text-sm text-gray-600 mt-1">
                <span className="text-green-600 font-semibold">{result.created} employees created</span>
                {result.skipped > 0 && <span className="text-amber-600 font-semibold ml-2">{result.skipped} skipped</span>}
              </p>
            </div>
          </div>

          {result.errors?.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Issues ({result.errors.length})</p>
              <div className="max-h-40 overflow-y-auto rounded-lg border border-red-100 bg-red-50 p-3 space-y-1">
                {result.errors.map((e, i) => (
                  <p key={i} className="text-xs text-red-600">{e}</p>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button onClick={() => { reset() }} className="rounded-md px-3 py-2 text-sm ring-1 ring-gray-300 hover:bg-gray-50">Import Another</button>
            <button onClick={handleClose} className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-500">Done</button>
          </div>
        </div>
      )}
    </Modal>
  )
}
