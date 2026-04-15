import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { documentsApi, employeesApi } from '../../api/index.js'
import { useAuth } from '../../contexts/AuthContext.jsx'
import Badge from '../../components/common/Badge.jsx'
import Modal from '../../components/common/Modal.jsx'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import { PageLoader } from '../../components/common/LoadingSpinner.jsx'
import { ArrowUpTrayIcon, ArrowDownTrayIcon, TrashIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const DOC_TYPES = ['ID_PROOF','ADDRESS_PROOF','EDUCATION','EXPERIENCE','OFFER_LETTER','APPOINTMENT_LETTER','CONFIRMATION_LETTER','RELIEVING_LETTER','RESIGNATION_LETTER','CONTRACT','PAYSLIP','OTHER']

export default function DocumentsPage() {
  const { user, isAdmin } = useAuth()
  const qc = useQueryClient()
  const fileRef = useRef(null)
  const [uploadModal, setUploadModal] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [form, setForm] = useState({ documentType: 'OTHER', documentName: '' })
  const [file, setFile] = useState(null)
  const [typeFilter, setTypeFilter] = useState('')
  const [selectedEmpId, setSelectedEmpId] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['documents', typeFilter],
    queryFn: () => documentsApi.getAll({ documentType: typeFilter || undefined }),
  })

  const { data: empListData } = useQuery({
    queryKey: ['emp-list-docs'],
    queryFn: () => employeesApi.getAll({ limit: 200 }),
    enabled: isAdmin(),
  })
  const allEmployees = empListData?.data?.data || []

  const empId = user?.employee?.id

  const uploadMut = useMutation({
    mutationFn: (fd) => documentsApi.upload(fd),
    onSuccess: () => { qc.invalidateQueries(['documents']); setUploadModal(false); setFile(null); toast.success('Document uploaded') },
  })

  const deleteMut = useMutation({
    mutationFn: documentsApi.delete,
    onSuccess: () => { qc.invalidateQueries(['documents']); setConfirmDelete(null); toast.success('Document deleted') },
  })

  const handleUpload = (e) => {
    e.preventDefault()
    if (!file) return toast.error('Please select a file')
    const targetEmpId = isAdmin() && selectedEmpId ? selectedEmpId : empId
    if (!targetEmpId) return toast.error('No employee selected')
    const fd = new FormData()
    fd.append('file', file)
    fd.append('employeeId', targetEmpId)
    fd.append('documentType', form.documentType)
    fd.append('documentName', form.documentName || file.name)
    uploadMut.mutate(fd)
  }

  const docs = data?.data?.data || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-sm text-gray-500">Manage your documents</p>
        </div>
        <button onClick={() => setUploadModal(true)} className="inline-flex items-center gap-2 rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white hover:bg-primary-500">
          <ArrowUpTrayIcon className="h-4 w-4" /> Upload Document
        </button>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {['', ...DOC_TYPES].map((t) => (
          <button key={t} onClick={() => setTypeFilter(t)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${typeFilter === t ? 'bg-primary-100 text-primary-700' : 'text-gray-500 hover:bg-gray-100'}`}>
            {t || 'All Types'}
          </button>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? <PageLoader /> : docs.length === 0 ? (
        <EmptyState title="No documents" description="Upload your first document." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {docs.map((doc) => (
            <div key={doc.id} className="rounded-lg bg-white shadow p-5 flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <DocumentTextIcon className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 truncate">{doc.documentName}</p>
                  <p className="text-xs text-gray-500">{doc.employee?.firstName} {doc.employee?.lastName}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Badge label={doc.documentType?.replace(/_/g, ' ')} variant="blue" />
                <span className="text-xs text-gray-400">{doc.uploadedOn ? format(new Date(doc.uploadedOn), 'dd MMM yyyy') : ''}</span>
              </div>
              <div className="flex gap-2">
                <a href={documentsApi.downloadUrl(doc.id)} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1 rounded px-2 py-1.5 text-xs font-medium text-primary-600 hover:bg-primary-50">
                  <ArrowDownTrayIcon className="h-3.5 w-3.5" /> Download
                </a>
                {isAdmin() && (
                  <button onClick={() => setConfirmDelete(doc)} className="flex items-center gap-1 rounded px-2 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50">
                    <TrashIcon className="h-3.5 w-3.5" /> Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <Modal open={uploadModal} onClose={() => { setUploadModal(false); setSelectedEmpId('') }} title="Upload Document" size="sm">
        <form onSubmit={handleUpload} className="space-y-4">
          {isAdmin() && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Upload For Employee *</label>
              <select required value={selectedEmpId} onChange={(e) => setSelectedEmpId(e.target.value)} className="mt-1 block w-full rounded-md border-0 py-1.5 pl-3 pr-8 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm">
                <option value="">Select employee</option>
                {allEmployees.map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.employeeCode})</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700">Document Name</label>
            <input value={form.documentName} onChange={(e) => setForm({ ...form, documentName: e.target.value })} placeholder="Leave blank to use filename" className="mt-1 block w-full rounded-md border-0 py-1.5 px-3 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Document Type</label>
            <select value={form.documentType} onChange={(e) => setForm({ ...form, documentType: e.target.value })} className="mt-1 block w-full rounded-md border-0 py-1.5 pl-3 pr-8 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm">
              {DOC_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">File * <span className="text-gray-400">(PDF, JPG, PNG, DOC — max 10MB)</span></label>
            <div onClick={() => fileRef.current?.click()} className="mt-1 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-6 hover:border-primary-400">
              {file ? (
                <p className="text-sm font-medium text-primary-600">{file.name}</p>
              ) : (
                <>
                  <ArrowUpTrayIcon className="h-8 w-8 text-gray-300" />
                  <p className="mt-2 text-sm text-gray-500">Click to select file</p>
                </>
              )}
            </div>
            <input ref={fileRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={(e) => setFile(e.target.files?.[0])} />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setUploadModal(false)} className="rounded-md px-3 py-2 text-sm text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={uploadMut.isPending || !file} className="rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white hover:bg-primary-500 disabled:opacity-50">
              {uploadMut.isPending ? 'Uploading…' : 'Upload'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={() => deleteMut.mutate(confirmDelete?.id)}
        loading={deleteMut.isPending} danger title="Delete Document" message={`Delete "${confirmDelete?.documentName}"? This cannot be undone.`} confirmLabel="Delete" />
    </div>
  )
}
