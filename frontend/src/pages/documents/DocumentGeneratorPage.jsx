import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { employeesApi } from '../../api/index.js'
import { useAuth } from '../../contexts/AuthContext.jsx'
import {
  generateOfferLetter, generateProbationLetter, generateExitLetter,
  generateFullFinal, generateReimbursement,
} from '../../utils/docTemplates.js'
import { DocumentTextIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'

const DOC_TYPES = [
  { id: 'offer',        label: 'Offer Letter',              icon: '📄', color: 'bg-blue-50 border-blue-200 text-blue-700' },
  { id: 'probation',    label: 'Probation Letter',          icon: '📋', color: 'bg-amber-50 border-amber-200 text-amber-700' },
  { id: 'exit',         label: 'Exit / Resignation Letter', icon: '🚪', color: 'bg-red-50 border-red-200 text-red-700' },
  { id: 'fnf',          label: 'Full & Final Settlement',   icon: '💰', color: 'bg-green-50 border-green-200 text-green-700' },
  { id: 'reimbursement',label: 'Reimbursement Claim',       icon: '🧾', color: 'bg-purple-50 border-purple-200 text-purple-700' },
]

export default function DocumentGeneratorPage() {
  const { isAdmin, isFinance } = useAuth()
  const [empId, setEmpId] = useState('')
  const [docType, setDocType] = useState(null)
  const [params, setParams] = useState({})
  const [expenses, setExpenses] = useState([{ description: '', date: '', amount: '', category: 'Travel' }])

  const { data: empListData } = useQuery({
    queryKey: ['employees-doc-list'],
    queryFn: () => employeesApi.getAll({ limit: 200 }),
  })
  const employees = empListData?.data?.data || []

  const { data: empData } = useQuery({
    queryKey: ['employee-doc', empId],
    queryFn: () => employeesApi.getById(empId),
    enabled: !!empId,
  })
  const emp = empData?.data?.data

  const p = (k) => (e) => setParams({ ...params, [k]: e.target.value })

  const addExpense = () => setExpenses([...expenses, { description: '', date: '', amount: '', category: 'Travel' }])
  const updExp = (i, k, v) => setExpenses(expenses.map((ex, idx) => idx === i ? { ...ex, [k]: v } : ex))
  const removeExp = (i) => setExpenses(expenses.filter((_, idx) => idx !== i))

  const handleGenerate = () => {
    if (!emp) return
    switch (docType) {
      case 'offer':        return generateOfferLetter(emp, params)
      case 'probation':    return generateProbationLetter(emp, params)
      case 'exit':         return generateExitLetter(emp, params)
      case 'fnf':          return generateFullFinal(emp, params)
      case 'reimbursement':return generateReimbursement(emp, { ...params, expenses })
    }
  }

  const inputCls = 'mt-1 block w-full rounded-md border-0 py-1.5 px-3 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm'
  const labelCls = 'block text-sm font-medium text-gray-700'

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">HR Document Generator</h1>
        <p className="text-sm text-gray-500">Generate professional HR documents ready for print / PDF download</p>
      </div>

      {/* Step 1: Select Employee */}
      <div className="rounded-lg bg-white shadow p-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Step 1 — Select Employee</h2>
        <select value={empId} onChange={(e) => setEmpId(e.target.value)}
          className="block w-full rounded-md border-0 py-2 pl-3 pr-8 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm">
          <option value="">Choose an employee…</option>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>{e.firstName} {e.lastName} — {e.employeeCode} ({e.designation?.name || e.department?.name || 'N/A'})</option>
          ))}
        </select>
        {emp && (
          <div className="mt-3 flex items-center gap-3 rounded-lg bg-primary-50 border border-primary-100 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-600 text-white font-bold text-sm">
              {emp.firstName[0]}{emp.lastName?.[0] || ''}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{emp.firstName} {emp.lastName}</p>
              <p className="text-xs text-gray-500">{emp.designation?.name} · {emp.department?.name} · {emp.employeeCode}</p>
            </div>
          </div>
        )}
      </div>

      {/* Step 2: Select Document Type */}
      {empId && (
        <div className="rounded-lg bg-white shadow p-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Step 2 — Document Type</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {DOC_TYPES.map((dt) => (
              <button key={dt.id} onClick={() => { setDocType(dt.id); setParams({}) }}
                className={`flex items-start gap-3 rounded-lg border-2 p-3 text-left transition-all ${docType === dt.id ? dt.color + ' border-current' : 'border-gray-200 hover:border-gray-300'}`}>
                <span className="text-2xl leading-none">{dt.icon}</span>
                <span className="text-sm font-medium leading-snug">{dt.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Document Parameters */}
      {docType && emp && (
        <div className="rounded-lg bg-white shadow p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Step 3 — Document Details</h2>

          {docType === 'offer' && (
            <div className="grid grid-cols-2 gap-4">
              <div><label className={labelCls}>Date of Joining</label><input type="date" defaultValue={emp.dateOfJoining?.split('T')[0]} onChange={p('joiningDate')} className={inputCls} /></div>
              <div><label className={labelCls}>Probation Period (months)</label><input type="number" defaultValue={6} onChange={p('probationMonths')} className={inputCls} /></div>
              <div><label className={labelCls}>Reference Number</label><input placeholder={`OL/${emp.employeeCode}`} onChange={p('refNo')} className={inputCls} /></div>
            </div>
          )}

          {docType === 'probation' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Letter Type</label>
                <select onChange={p('type')} className={inputCls}>
                  <option value="CONFIRM">Confirmation Letter</option>
                  <option value="EXTEND">Extension Letter</option>
                </select>
              </div>
              <div><label className={labelCls}>Effective Date</label><input type="date" onChange={p('effectiveDate')} className={inputCls} /></div>
              {params.type === 'EXTEND' && (
                <div><label className={labelCls}>Extension Period (months)</label><input type="number" defaultValue={3} onChange={p('extensionMonths')} className={inputCls} /></div>
              )}
              <div><label className={labelCls}>Reference Number</label><input placeholder={`PL/${emp.employeeCode}`} onChange={p('refNo')} className={inputCls} /></div>
            </div>
          )}

          {docType === 'exit' && (
            <div className="grid grid-cols-2 gap-4">
              <div><label className={labelCls}>Resignation Date</label><input type="date" onChange={p('resignationDate')} className={inputCls} /></div>
              <div><label className={labelCls}>Last Working Date</label><input type="date" onChange={p('lastWorkingDate')} className={inputCls} /></div>
              <div><label className={labelCls}>Notice Period (days)</label><input type="number" defaultValue={30} onChange={p('noticePeriodDays')} className={inputCls} /></div>
              <div><label className={labelCls}>Reason for Leaving</label><input placeholder="personal reasons" onChange={p('reason')} className={inputCls} /></div>
              <div><label className={labelCls}>Reference Number</label><input placeholder={`EL/${emp.employeeCode}`} onChange={p('refNo')} className={inputCls} /></div>
            </div>
          )}

          {docType === 'fnf' && (
            <div className="grid grid-cols-2 gap-4">
              <div><label className={labelCls}>Last Working Date</label><input type="date" onChange={p('lastWorkingDate')} className={inputCls} /></div>
              <div><label className={labelCls}>Last Month Salary (₹)</label><input type="number" placeholder="0" onChange={p('lastMonthSalary')} className={inputCls} /></div>
              <div><label className={labelCls}>Leave Encashment Days</label><input type="number" defaultValue={0} onChange={p('leaveEncashmentDays')} className={inputCls} /></div>
              <div><label className={labelCls}>Gratuity (₹)</label><input type="number" defaultValue={0} onChange={p('gratuity')} className={inputCls} /></div>
              <div><label className={labelCls}>Bonus / Incentive (₹)</label><input type="number" defaultValue={0} onChange={p('bonus')} className={inputCls} /></div>
              <div><label className={labelCls}>Notice Period Recovery (₹)</label><input type="number" defaultValue={0} onChange={p('noticePeriodRecovery')} className={inputCls} /></div>
              <div><label className={labelCls}>Advance Recovery (₹)</label><input type="number" defaultValue={0} onChange={p('advanceRecovery')} className={inputCls} /></div>
              <div><label className={labelCls}>Other Deductions (₹)</label><input type="number" defaultValue={0} onChange={p('otherDeductions')} className={inputCls} /></div>
              <div><label className={labelCls}>Reference Number</label><input placeholder={`FNF/${emp.employeeCode}`} onChange={p('refNo')} className={inputCls} /></div>
            </div>
          )}

          {docType === 'reimbursement' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>Claim Date</label><input type="date" onChange={p('claimDate')} className={inputCls} /></div>
                <div><label className={labelCls}>Reference Number</label><input placeholder={`RMB/${emp.employeeCode}`} onChange={p('refNo')} className={inputCls} /></div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Expense Items</label>
                  <button onClick={addExpense} className="text-xs text-primary-600 hover:underline">+ Add Row</button>
                </div>
                <div className="space-y-2">
                  {expenses.map((ex, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-4">
                        {i === 0 && <label className="block text-xs text-gray-500 mb-0.5">Description</label>}
                        <input value={ex.description} onChange={(e) => updExp(i, 'description', e.target.value)} placeholder="Cab fare, hotel…" className="block w-full rounded-md border-0 py-1.5 px-2 ring-1 ring-gray-300 text-sm" />
                      </div>
                      <div className="col-span-2">
                        {i === 0 && <label className="block text-xs text-gray-500 mb-0.5">Date</label>}
                        <input type="date" value={ex.date} onChange={(e) => updExp(i, 'date', e.target.value)} className="block w-full rounded-md border-0 py-1.5 px-2 ring-1 ring-gray-300 text-sm" />
                      </div>
                      <div className="col-span-3">
                        {i === 0 && <label className="block text-xs text-gray-500 mb-0.5">Category</label>}
                        <select value={ex.category} onChange={(e) => updExp(i, 'category', e.target.value)} className="block w-full rounded-md border-0 py-1.5 px-2 ring-1 ring-gray-300 text-sm">
                          {['Travel','Accommodation','Meals','Communication','Office Supplies','Other'].map((c) => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                      <div className="col-span-2">
                        {i === 0 && <label className="block text-xs text-gray-500 mb-0.5">Amount (₹)</label>}
                        <input type="number" value={ex.amount} onChange={(e) => updExp(i, 'amount', e.target.value)} placeholder="0" className="block w-full rounded-md border-0 py-1.5 px-2 ring-1 ring-gray-300 text-sm" />
                      </div>
                      <div className="col-span-1 flex justify-end">
                        {expenses.length > 1 && <button onClick={() => removeExp(i)} className="text-red-400 hover:text-red-600 text-lg leading-none">×</button>}
                      </div>
                    </div>
                  ))}
                </div>
                {expenses.length > 0 && (
                  <div className="mt-2 text-right text-sm font-semibold text-primary-700">
                    Total: ₹{expenses.reduce((s, e) => s + Number(e.amount || 0), 0).toLocaleString('en-IN')}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2 border-t border-gray-100 mt-4">
            <button onClick={handleGenerate}
              className="flex items-center gap-2 rounded-md bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-500">
              <ArrowDownTrayIcon className="h-4 w-4" />
              Generate & Download PDF
            </button>
          </div>
        </div>
      )}

      {/* Placeholder when nothing selected */}
      {!empId && (
        <div className="rounded-lg border-2 border-dashed border-gray-200 p-12 text-center">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-2 text-sm text-gray-500">Select an employee above to get started</p>
        </div>
      )}
    </div>
  )
}
