import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { lettersApi, employeesApi } from '../../api/index.js'
import { useAuth } from '../../contexts/AuthContext.jsx'
import Modal from '../../components/common/Modal.jsx'
import Pagination from '../../components/common/Pagination.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import { PageLoader } from '../../components/common/LoadingSpinner.jsx'
import { DocumentTextIcon, PlusIcon, EyeIcon, TrashIcon, ArrowDownTrayIcon, SparklesIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

const CATEGORIES = ['OFFER', 'APPOINTMENT', 'CONFIRMATION', 'SALARY_REVISION', 'EXPERIENCE', 'RELIEVING', 'WARNING', 'TERMINATION', 'INTERNSHIP', 'CUSTOM']
const CAT_COLORS = { OFFER: 'bg-blue-100 text-blue-700', APPOINTMENT: 'bg-emerald-100 text-emerald-700', EXPERIENCE: 'bg-purple-100 text-purple-700', RELIEVING: 'bg-amber-100 text-amber-700', SALARY_REVISION: 'bg-cyan-100 text-cyan-700', WARNING: 'bg-red-100 text-red-700', TERMINATION: 'bg-red-100 text-red-700', CONFIRMATION: 'bg-green-100 text-green-700', INTERNSHIP: 'bg-indigo-100 text-indigo-700', CUSTOM: 'bg-gray-100 text-gray-700' }

export default function LettersPage() {
  const { isAdmin } = useAuth()
  const qc = useQueryClient()
  const [tab, setTab] = useState('generate')
  const [page, setPage] = useState(1)
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [previewHtml, setPreviewHtml] = useState(null)
  const [viewLetter, setViewLetter] = useState(null)
  const [templateModal, setTemplateModal] = useState(null)
  const [templateForm, setTemplateForm] = useState({ name: '', category: 'CUSTOM', subject: '', body: '' })

  const { data: tplData, isLoading: tplLoading } = useQuery({ queryKey: ['letter-templates'], queryFn: lettersApi.getTemplates })
  const { data: lettersData, isLoading } = useQuery({ queryKey: ['generated-letters', page], queryFn: () => lettersApi.getAll({ page, limit: 15 }) })
  const { data: empData } = useQuery({ queryKey: ['employees-list'], queryFn: () => employeesApi.getAll({ limit: 500 }) })
  const { data: varsData } = useQuery({ queryKey: ['letter-variables'], queryFn: lettersApi.getVariables })

  const templates = tplData?.data?.data || []
  const letters = lettersData?.data?.data || []
  const pagination = lettersData?.data?.pagination
  const employees = empData?.data?.data?.employees || empData?.data?.data || []
  const variables = varsData?.data?.data || {}

  const seedMut = useMutation({ mutationFn: lettersApi.seedDefaults, onSuccess: () => { qc.invalidateQueries(['letter-templates']); toast.success('Default templates created!') } })
  const previewMut = useMutation({
    mutationFn: lettersApi.preview,
    onSuccess: (res) => setPreviewHtml(res.data?.data),
    onError: (err) => toast.error(err.response?.data?.message || 'Preview failed'),
  })
  const generateMut = useMutation({
    mutationFn: lettersApi.generate,
    onSuccess: () => { qc.invalidateQueries(['generated-letters']); toast.success('Letter generated!'); setPreviewHtml(null) },
  })
  const createTplMut = useMutation({
    mutationFn: (data) => templateModal?.id ? lettersApi.updateTemplate(templateModal.id, data) : lettersApi.createTemplate(data),
    onSuccess: () => { qc.invalidateQueries(['letter-templates']); setTemplateModal(null); toast.success('Template saved!') },
  })
  const deleteMut = useMutation({ mutationFn: lettersApi.delete, onSuccess: () => { qc.invalidateQueries(['generated-letters']); toast.success('Letter deleted') } })

  function printLetter(html, subject) {
    const w = window.open('', '_blank')
    w.document.write(`<!DOCTYPE html><html><head><title>${subject || 'Letter'}</title><style>@media print{body{margin:0}}</style></head><body>${html}</body></html>`)
    w.document.close()
    w.print()
  }

  const tabs = [
    { id: 'generate', label: 'Generate Letters', icon: SparklesIcon },
    { id: 'history', label: 'Generated Letters', icon: DocumentTextIcon },
    ...(isAdmin() ? [{ id: 'templates', label: 'Manage Templates', icon: DocumentDuplicateIcon }] : []),
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Letter Generation</h1>
          <p className="text-sm text-gray-500">Generate offer letters, appointment letters, experience certificates and more</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.id ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* Generate Tab */}
      {tab === 'generate' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Template + Employee Selection */}
          <div className="lg:col-span-1 space-y-4">
            <div className="rounded-xl bg-white shadow-card border border-gray-100 p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-3">1. Choose Template</h3>
              {templates.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-gray-500 mb-3">No templates found</p>
                  <button onClick={() => seedMut.mutate()} disabled={seedMut.isPending}
                    className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50">
                    {seedMut.isPending ? 'Creating…' : 'Create Default Templates'}
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {templates.map(t => (
                    <button key={t.id} onClick={() => setSelectedTemplate(t)}
                      className={`w-full text-left rounded-lg p-3 border transition-all ${selectedTemplate?.id === t.id ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-200' : 'border-gray-200 hover:border-gray-300'}`}>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${CAT_COLORS[t.category] || CAT_COLORS.CUSTOM}`}>{t.category}</span>
                        <span className="text-sm font-medium text-gray-900">{t.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <h3 className="text-sm font-bold text-gray-900 mt-5 mb-3">2. Select Employee</h3>
              <select value={selectedEmployee} onChange={e => setSelectedEmployee(e.target.value)}
                className="w-full rounded-lg border-0 py-2.5 px-3 text-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-500">
                <option value="">— Select Employee —</option>
                {employees.map(e => (
                  <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.employeeCode})</option>
                ))}
              </select>

              <div className="flex gap-2 mt-4">
                <button onClick={() => { if (!selectedTemplate || !selectedEmployee) return toast.error('Select template and employee'); previewMut.mutate({ templateId: selectedTemplate.id, employeeId: Number(selectedEmployee) }) }}
                  disabled={previewMut.isPending || !selectedTemplate || !selectedEmployee}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-200 disabled:opacity-50 transition-colors">
                  <EyeIcon className="h-4 w-4" /> {previewMut.isPending ? 'Loading…' : 'Preview'}
                </button>
                <button onClick={() => { if (!selectedTemplate || !selectedEmployee) return toast.error('Select template and employee'); generateMut.mutate({ templateId: selectedTemplate.id, employeeId: Number(selectedEmployee) }) }}
                  disabled={generateMut.isPending || !selectedTemplate || !selectedEmployee}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-700 disabled:opacity-50 transition-colors">
                  <SparklesIcon className="h-4 w-4" /> {generateMut.isPending ? 'Generating…' : 'Generate'}
                </button>
              </div>
            </div>
          </div>

          {/* Right: Preview */}
          <div className="lg:col-span-2">
            <div className="rounded-xl bg-white shadow-card border border-gray-100 overflow-hidden">
              {previewHtml ? (
                <>
                  <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
                    <p className="text-sm font-semibold text-gray-700">Preview: {previewHtml.subject}</p>
                    <button onClick={() => printLetter(previewHtml.body, previewHtml.subject)}
                      className="flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-700">
                      <ArrowDownTrayIcon className="h-3.5 w-3.5" /> Print / Download PDF
                    </button>
                  </div>
                  <div className="p-6 bg-white min-h-[500px]" dangerouslySetInnerHTML={{ __html: previewHtml.body }} />
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <DocumentTextIcon className="h-16 w-16 mb-3 opacity-30" />
                  <p className="text-sm font-medium">Select a template and employee, then click Preview</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* History Tab */}
      {tab === 'history' && (
        <div className="rounded-xl bg-white shadow-card border border-gray-100 overflow-hidden">
          {isLoading ? <PageLoader /> : letters.length === 0 ? (
            <EmptyState title="No letters generated yet" description="Generate your first letter from the Generate tab." />
          ) : (
            <>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {['Letter #', 'Employee', 'Category', 'Subject', 'Generated', 'Actions'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {letters.map(l => (
                    <tr key={l.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 text-sm font-mono text-primary-600">{l.letterNumber}</td>
                      <td className="px-5 py-3 text-sm font-medium text-gray-900">{l.employee?.firstName} {l.employee?.lastName}</td>
                      <td className="px-5 py-3"><span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${CAT_COLORS[l.category] || CAT_COLORS.CUSTOM}`}>{l.category}</span></td>
                      <td className="px-5 py-3 text-sm text-gray-600 max-w-xs truncate">{l.subject}</td>
                      <td className="px-5 py-3 text-sm text-gray-500">{new Date(l.generatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                      <td className="px-5 py-3 flex gap-2">
                        <button onClick={() => setViewLetter(l)} className="text-primary-600 hover:text-primary-700"><EyeIcon className="h-4 w-4" /></button>
                        <button onClick={() => printLetter(l.body, l.subject)} className="text-gray-500 hover:text-gray-700"><ArrowDownTrayIcon className="h-4 w-4" /></button>
                        <button onClick={() => { if (confirm('Delete this letter?')) deleteMut.mutate(l.id) }} className="text-red-500 hover:text-red-700"><TrashIcon className="h-4 w-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {pagination && pagination.totalPages > 1 && <div className="p-4"><Pagination page={pagination.page} totalPages={pagination.totalPages} total={pagination.total} limit={15} onPageChange={setPage} /></div>}
            </>
          )}
        </div>
      )}

      {/* Templates Tab */}
      {tab === 'templates' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">{templates.length} template(s)</p>
            <div className="flex gap-2">
              {templates.length === 0 && (
                <button onClick={() => seedMut.mutate()} disabled={seedMut.isPending}
                  className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200 disabled:opacity-50">
                  {seedMut.isPending ? 'Creating…' : 'Seed Defaults'}
                </button>
              )}
              <button onClick={() => { setTemplateModal({}); setTemplateForm({ name: '', category: 'CUSTOM', subject: '', body: '' }) }}
                className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white hover:bg-primary-700">
                <PlusIcon className="h-4 w-4" /> New Template
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map(t => (
              <div key={t.id} className="rounded-xl bg-white shadow-card border border-gray-100 p-5 hover:shadow-card-hover transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${CAT_COLORS[t.category] || CAT_COLORS.CUSTOM}`}>{t.category}</span>
                    <h3 className="text-sm font-bold text-gray-900 mt-1.5">{t.name}</h3>
                  </div>
                  {t.isDefault && <span className="text-[10px] text-gray-400 font-medium">Default</span>}
                </div>
                <p className="text-xs text-gray-500 mb-3 line-clamp-2">{t.subject || 'No subject'}</p>
                <div className="flex gap-2">
                  <button onClick={() => { setTemplateModal(t); setTemplateForm({ name: t.name, category: t.category, subject: t.subject || '', body: t.body }) }}
                    className="text-xs text-primary-600 hover:text-primary-700 font-medium">Edit</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* View Letter Modal */}
      {viewLetter && (
        <Modal open={!!viewLetter} onClose={() => setViewLetter(null)} title={viewLetter.subject || 'Letter'} size="lg">
          <div className="flex justify-end mb-3">
            <button onClick={() => printLetter(viewLetter.body, viewLetter.subject)}
              className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-primary-700">
              <ArrowDownTrayIcon className="h-4 w-4" /> Print / PDF
            </button>
          </div>
          <div className="border rounded-lg p-4" dangerouslySetInnerHTML={{ __html: viewLetter.body }} />
        </Modal>
      )}

      {/* Template Edit Modal */}
      {templateModal && (
        <Modal open={!!templateModal} onClose={() => setTemplateModal(null)} title={templateModal.id ? 'Edit Template' : 'New Template'} size="lg">
          <form onSubmit={e => { e.preventDefault(); createTplMut.mutate(templateForm) }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Template Name *</label>
                <input required value={templateForm.name} onChange={e => setTemplateForm({ ...templateForm, name: e.target.value })}
                  className="w-full rounded-lg border-0 py-2 px-3 text-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select value={templateForm.category} onChange={e => setTemplateForm({ ...templateForm, category: e.target.value })}
                  className="w-full rounded-lg border-0 py-2 px-3 text-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-500">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <input value={templateForm.subject} onChange={e => setTemplateForm({ ...templateForm, subject: e.target.value })}
                className="w-full rounded-lg border-0 py-2 px-3 text-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-500" placeholder="Use {{variable}} placeholders" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700">Body (HTML) *</label>
                <span className="text-[10px] text-gray-400">Variables: {Object.keys(variables).map(v => `{{${v}}}`).join(', ')}</span>
              </div>
              <textarea required rows={12} value={templateForm.body} onChange={e => setTemplateForm({ ...templateForm, body: e.target.value })}
                className="w-full rounded-lg border-0 py-2 px-3 text-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-500 font-mono text-xs" />
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setTemplateModal(null)} className="rounded-lg px-4 py-2 text-sm text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={createTplMut.isPending} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white hover:bg-primary-700 disabled:opacity-50">
                {createTplMut.isPending ? 'Saving…' : 'Save Template'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
