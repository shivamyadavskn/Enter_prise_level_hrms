import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { payrollApi } from '../../api/index.js'
import { useAuth } from '../../contexts/AuthContext.jsx'
import Badge from '../../components/common/Badge.jsx'
import Modal from '../../components/common/Modal.jsx'
import Pagination from '../../components/common/Pagination.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import { PageLoader } from '../../components/common/LoadingSpinner.jsx'
import StatCard from '../../components/common/StatCard.jsx'
import { BanknotesIcon, DocumentTextIcon, ArrowDownTrayIcon, ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

function printPayslip(p) {
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const sal = p.employee?.salaryStructures?.[0]
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Payslip</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0;font-family:Arial,sans-serif}
    body{padding:32px;color:#111}
    .header{display:flex;justify-content:space-between;border-bottom:2px solid #2563eb;padding-bottom:16px;margin-bottom:20px}
    .company{font-size:22px;font-weight:700;color:#2563eb}
    .title{font-size:16px;font-weight:600;text-align:right}
    .emp-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:20px;font-size:13px}
    .emp-grid .label{color:#555}
    .emp-grid .val{font-weight:600}
    table{width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px}
    th{background:#f1f5f9;text-align:left;padding:8px 12px;font-size:11px;text-transform:uppercase;color:#555}
    td{padding:8px 12px;border-bottom:1px solid #f1f5f9}
    .total-row td{font-weight:700;background:#eff6ff;color:#2563eb}
    .net-box{background:#2563eb;color:white;padding:16px;border-radius:8px;display:flex;justify-content:space-between;align-items:center;margin-top:8px}
    .net-box .label{font-size:14px}
    .net-box .amount{font-size:22px;font-weight:700}
    .footer{margin-top:24px;text-align:center;font-size:11px;color:#888;border-top:1px solid #e5e7eb;padding-top:12px}
    @media print{body{padding:16px}}
  </style></head><body>
  <div class="header">
    <div><div class="company">HRMS Enterprise</div><div style="font-size:12px;color:#666;margin-top:4px">Human Resource Management System</div></div>
    <div class="title">SALARY PAYSLIP<br/><span style="font-weight:400;font-size:13px">${MONTHS[(p.month||1)-1]} ${p.year}</span></div>
  </div>
  <div class="emp-grid">
    <div><span class="label">Employee Name</span></div><div><span class="val">${p.employee?.firstName||''} ${p.employee?.lastName||''}</span></div>
    <div><span class="label">Employee Code</span></div><div><span class="val">${p.employee?.employeeCode||'-'}</span></div>
    <div><span class="label">Designation</span></div><div><span class="val">${p.employee?.designation?.name||'-'}</span></div>
    <div><span class="label">Department</span></div><div><span class="val">${p.employee?.department?.name||'-'}</span></div>
    <div><span class="label">Working Days</span></div><div><span class="val">${p.workingDays||0}</span></div>
    <div><span class="label">Days Present</span></div><div><span class="val">${Number(p.presentDays||0).toFixed(1)} (WFH: ${p.wfhDays||0})</span></div>
    <div><span class="label">Paid Leaves</span></div><div><span class="val">${p.paidLeaves||0}</span></div>
    <div><span class="label">LOP Days</span></div><div><span class="val">${p.unpaidLeaves||0}</span></div>
    <div><span class="label">Payment Status</span></div><div><span class="val">${p.paymentStatus||'-'}</span></div>
    ${p.paymentDate?`<div><span class="label">Payment Date</span></div><div><span class="val">${new Date(p.paymentDate).toLocaleDateString('en-IN')}</span></div>`:''}
  </div>
  <table>
    <tr><th>Earnings</th><th style="text-align:right">Amount (₹)</th><th>Deductions</th><th style="text-align:right">Amount (₹)</th></tr>
    <tr><td>Basic Salary</td><td style="text-align:right">${(sal?.basicSalary||0).toFixed(2)}</td><td>PF (Employee)</td><td style="text-align:right">${(sal?.pfEmployee||0).toFixed(2)}</td></tr>
    <tr><td>HRA</td><td style="text-align:right">${(sal?.hra||0).toFixed(2)}</td><td>Professional Tax</td><td style="text-align:right">${(sal?.professionalTax||0).toFixed(2)}</td></tr>
    <tr><td>Conveyance Allow.</td><td style="text-align:right">${(sal?.conveyanceAllowance||0).toFixed(2)}</td><td>TDS</td><td style="text-align:right">${(sal?.tds||0).toFixed(2)}</td></tr>
    <tr><td>Medical Allow.</td><td style="text-align:right">${(sal?.medicalAllowance||0).toFixed(2)}</td><td></td><td></td></tr>
    <tr><td>Special Allow.</td><td style="text-align:right">${(sal?.specialAllowance||0).toFixed(2)}</td><td></td><td></td></tr>
    <tr class="total-row"><td>Gross Salary</td><td style="text-align:right">₹${(p.grossSalary||0).toFixed(2)}</td><td>Total Deductions</td><td style="text-align:right">₹${(p.totalDeductions||0).toFixed(2)}</td></tr>
  </table>
  <div class="net-box"><span class="label">NET PAY (Take Home)</span><span class="amount">₹${(p.netSalary||0).toFixed(2)}</span></div>
  <div class="footer">This is a system-generated payslip and does not require a signature. · Generated on ${new Date().toLocaleDateString('en-IN')}</div>
  </body></html>`
  const win = window.open('', '_blank')
  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => { win.print() }, 500)
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function PayrollPage() {
  const { user, isFinance, isAdmin } = useAuth()
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())
  const [processModal, setProcessModal] = useState(false)
  const [slipModal, setSlipModal] = useState(null)
  const [salaryModal, setSalaryModal] = useState(null)
  const [historyModal, setHistoryModal] = useState(null)
  const [skippedResult, setSkippedResult] = useState([])
  const [salaryForm, setSalaryForm] = useState({ basicSalary: '', hra: '', conveyanceAllowance: 1600, medicalAllowance: 1250, specialAllowance: '', pfEmployee: '', pfEmployer: '', professionalTax: 200, tds: '', effectiveFrom: new Date().toISOString().split('T')[0] })

  const isFinanceOrAdmin = isFinance() || isAdmin()

  const { data, isLoading } = useQuery({
    queryKey: ['payroll', page, month, year],
    queryFn: () => isFinanceOrAdmin
      ? payrollApi.getAll({ page, limit: 10, month, year })
      : payrollApi.getMyPayslips(),
  })

  const { data: summaryData } = useQuery({
    queryKey: ['payroll-summary', month, year],
    queryFn: () => payrollApi.getSummary({ month, year }),
    enabled: isFinanceOrAdmin,
  })

  const processMut = useMutation({
    mutationFn: payrollApi.process,
    onSuccess: (res) => {
      qc.invalidateQueries(['payroll']); qc.invalidateQueries(['payroll-summary']); qc.invalidateQueries(['missing-salary'])
      setProcessModal(false)
      const skipped = res.data?.data?.skipped || []
      if (skipped.length) {
        setSkippedResult(skipped)
        toast.error(`${skipped.length} employee(s) skipped — salary structure missing!`, { duration: 6000 })
      } else {
        toast.success(res.data?.message || 'Payroll processed successfully')
      }
    },
  })

  const salaryMut = useMutation({
    mutationFn: payrollApi.upsertSalaryStructure,
    onSuccess: () => { qc.invalidateQueries(['missing-salary']); setSalaryModal(null); toast.success('Salary structure saved!') },
  })

  const { data: missingData } = useQuery({
    queryKey: ['missing-salary'],
    queryFn: payrollApi.getMissingSalary,
    enabled: isFinanceOrAdmin,
  })
  const missingSalary = missingData?.data?.data || []

  const updateStatusMut = useMutation({
    mutationFn: ({ id, data }) => payrollApi.updateStatus(id, data),
    onSuccess: () => { qc.invalidateQueries(['payroll']); toast.success('Payment status updated') },
  })

  const { data: slipDetail } = useQuery({
    queryKey: ['payroll-detail', slipModal?.id],
    queryFn: () => payrollApi.getById(slipModal.id),
    enabled: !!slipModal?.id,
  })
  const fullSlip = slipDetail?.data?.data || slipModal

  const { data: salHistoryData } = useQuery({
    queryKey: ['salary-history', historyModal?.employeeId],
    queryFn: () => payrollApi.getSalaryStructure(historyModal.employeeId),
    enabled: !!historyModal?.employeeId,
  })
  const salHistory = salHistoryData?.data?.data || []

  const payrolls = data?.data?.data || []
  const pagination = data?.data?.pagination
  const summary = summaryData?.data?.data

  const sf = (k) => (e) => setSalaryForm({ ...salaryForm, [k]: e.target.value })
  const calcSalary = () => {
    const { basicSalary: b, hra: h, conveyanceAllowance: c, medicalAllowance: m, specialAllowance: s, pfEmployee: pfe, pfEmployer: pfr, professionalTax: pt, tds: t } = salaryForm
    const gross = [b,h,c,m,s].reduce((a,v)=>a+Number(v||0),0)
    const deductions = [pfe,pt,t].reduce((a,v)=>a+Number(v||0),0)
    return { gross, net: Math.max(0, gross - deductions), ctc: gross + Number(pfr||0) }
  }
  const { gross, net, ctc } = calcSalary()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payroll</h1>
          <p className="text-sm text-gray-500">Manage salary and payslips</p>
        </div>
        <div className="flex gap-3">
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="rounded-md border-0 py-1.5 pl-3 pr-8 ring-1 ring-inset ring-gray-300 sm:text-sm">
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="rounded-md border-0 py-1.5 pl-3 pr-8 ring-1 ring-inset ring-gray-300 sm:text-sm">
            {[2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          {isFinanceOrAdmin && (
            <button onClick={() => setProcessModal(true)} className="rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white hover:bg-primary-500">
              Process Payroll
            </button>
          )}
        </div>
      </div>

      {/* Missing Salary Structure Alert */}
      {isFinanceOrAdmin && missingSalary.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-800">{missingSalary.length} employee(s) have no salary structure — payroll will be skipped for them</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {missingSalary.map((e) => (
                  <button key={e.id} onClick={() => { setSalaryModal(e); setSalaryForm({ basicSalary: '', hra: '', conveyanceAllowance: 1600, medicalAllowance: 1250, specialAllowance: '', pfEmployee: '', pfEmployer: '', professionalTax: 200, tds: '', effectiveFrom: new Date().toISOString().split('T')[0] }) }}
                    className="inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-300 px-3 py-1 text-xs font-medium text-amber-800 hover:bg-amber-200">
                    {e.name} <span className="text-amber-500">({e.employeeCode})</span> — Set up salary →
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Skipped Employees After Processing */}
      {skippedResult.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-800">These employees were skipped (no salary structure):</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {skippedResult.map((e) => (
                    <button key={e.id} onClick={() => { setSalaryModal(e); setSalaryForm({ basicSalary: '', hra: '', conveyanceAllowance: 1600, medicalAllowance: 1250, specialAllowance: '', pfEmployee: '', pfEmployer: '', professionalTax: 200, tds: '', effectiveFrom: new Date().toISOString().split('T')[0] }) }}
                      className="inline-flex items-center gap-1 rounded-full bg-red-100 border border-red-300 px-3 py-1 text-xs font-medium text-red-800 hover:bg-red-200">
                      {e.name} ({e.employeeCode}) — Set up salary →
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={() => setSkippedResult([])} className="text-red-400 hover:text-red-600"><XMarkIcon className="h-4 w-4" /></button>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      {summary && isFinanceOrAdmin && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard title="Total Employees" value={summary.totalEmployees} icon={BanknotesIcon} color="blue" />
          <StatCard title="Total Gross" value={`₹${(summary.totalGross / 1000).toFixed(0)}K`} icon={BanknotesIcon} color="green" />
          <StatCard title="Total Deductions" value={`₹${(summary.totalDeductions / 1000).toFixed(0)}K`} icon={BanknotesIcon} color="red" />
          <StatCard title="Net Payable" value={`₹${(summary.totalNet / 1000).toFixed(0)}K`} icon={BanknotesIcon} color="indigo" />
        </div>
      )}

      {/* Payroll Table */}
      <div className="overflow-hidden rounded-lg bg-white shadow">
        {isLoading ? <PageLoader /> : payrolls.length === 0 ? (
          <EmptyState variant="payroll" title="No payroll records" description="Process payroll for the selected month." />
        ) : (
          <>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Employee', 'Month/Year', 'Gross', 'Deductions', 'Net Pay', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {payrolls.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm font-medium text-gray-900">
                      {p.employee?.firstName} {p.employee?.lastName}
                      <p className="text-xs text-gray-500">{p.employee?.department?.name}</p>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-500">{MONTHS[p.month - 1]} {p.year}</td>
                    <td className="px-6 py-3 text-sm text-gray-900">₹{p.grossSalary?.toFixed(2)}</td>
                    <td className="px-6 py-3 text-sm text-red-600">-₹{p.totalDeductions?.toFixed(2)}</td>
                    <td className="px-6 py-3 text-sm font-semibold text-green-600">₹{p.netSalary?.toFixed(2)}</td>
                    <td className="px-6 py-3"><Badge status={p.paymentStatus} label={p.paymentStatus} /></td>
                    <td className="px-6 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => setSlipModal(p)} className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-500">
                          <DocumentTextIcon className="h-3.5 w-3.5" /> Payslip
                        </button>
                        {isFinanceOrAdmin && p.paymentStatus !== 'PAID' && (
                          <button onClick={() => updateStatusMut.mutate({ id: p.id, data: { paymentStatus: 'PAID', paymentDate: new Date().toISOString().split('T')[0] } })}
                            className="text-xs text-green-600 hover:text-green-500 font-medium">Mark Paid</button>
                        )}
                        {isFinanceOrAdmin && (
                          <button onClick={() => setHistoryModal({ employeeId: p.employeeId, name: `${p.employee?.firstName} ${p.employee?.lastName}` })}
                            className="text-xs text-gray-400 hover:text-gray-600">History</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pagination && <Pagination page={pagination.page} totalPages={pagination.totalPages} total={pagination.total} limit={10} onPageChange={setPage} />}
          </>
        )}
      </div>

      {/* Process Modal */}
      <Modal open={processModal} onClose={() => setProcessModal(false)} title="Process Payroll" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">This will calculate payroll for all active employees for <strong>{MONTHS[month - 1]} {year}</strong>.</p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setProcessModal(false)} className="rounded-md px-3 py-2 text-sm text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50">Cancel</button>
            <button onClick={() => processMut.mutate({ month, year })} disabled={processMut.isPending}
              className="rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white hover:bg-primary-500 disabled:opacity-50">
              {processMut.isPending ? 'Processing…' : 'Process'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Salary Structure Setup Modal */}
      {salaryModal && (
        <Modal open={!!salaryModal} onClose={() => setSalaryModal(null)} title={`Set Up Salary — ${salaryModal.name}`} size="lg">
          <div className="space-y-4">
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-700">
              <strong>{salaryModal.name}</strong> ({salaryModal.employeeCode}) · {salaryModal.department} — {salaryModal.designation}
              <br />Without a salary structure this employee will be skipped during payroll processing.
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs font-semibold text-green-700 uppercase mb-2">Earnings</p>
                {[['basicSalary','Basic Salary *'],['hra','HRA'],['conveyanceAllowance','Conveyance Allow.'],['medicalAllowance','Medical Allow.'],['specialAllowance','Special Allow.']].map(([k,label]) => (
                  <div key={k} className="mb-2">
                    <label className="block text-xs font-medium text-gray-600">{label}</label>
                    <input type="number" value={salaryForm[k]} onChange={sf(k)} required={k==='basicSalary'} className="mt-0.5 block w-full rounded border-0 py-1.5 px-2 ring-1 ring-gray-300 focus:ring-2 focus:ring-primary-600 text-sm" />
                  </div>
                ))}
              </div>
              <div>
                <p className="text-xs font-semibold text-red-700 uppercase mb-2">Deductions</p>
                {[['pfEmployee','PF (Employee 12%)'],['pfEmployer','PF (Employer 12%)'],['professionalTax','Prof. Tax'],['tds','TDS']].map(([k,label]) => (
                  <div key={k} className="mb-2">
                    <label className="block text-xs font-medium text-gray-600">{label}</label>
                    <input type="number" value={salaryForm[k]} onChange={sf(k)} className="mt-0.5 block w-full rounded border-0 py-1.5 px-2 ring-1 ring-gray-300 focus:ring-2 focus:ring-primary-600 text-sm" />
                  </div>
                ))}
                <div className="mb-2">
                  <label className="block text-xs font-medium text-gray-600">Effective From</label>
                  <input type="date" value={salaryForm.effectiveFrom} onChange={sf('effectiveFrom')} className="mt-0.5 block w-full rounded border-0 py-1.5 px-2 ring-1 ring-gray-300 focus:ring-2 focus:ring-primary-600 text-sm" />
                </div>
              </div>
            </div>
            {/* Calculated Preview */}
            {gross > 0 && (
              <div className="grid grid-cols-3 gap-3 rounded-lg bg-gray-50 border border-gray-200 p-3 text-sm">
                <div className="text-center"><p className="text-xs text-gray-500">Gross</p><p className="font-bold text-green-600">₹{gross.toFixed(0)}</p></div>
                <div className="text-center"><p className="text-xs text-gray-500">Deductions</p><p className="font-bold text-red-600">₹{(gross - net).toFixed(0)}</p></div>
                <div className="text-center"><p className="text-xs text-gray-500">Net Pay</p><p className="font-bold text-primary-600 text-base">₹{net.toFixed(0)}</p></div>
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button onClick={() => setSalaryModal(null)} className="rounded-md px-3 py-2 text-sm ring-1 ring-gray-300 hover:bg-gray-50">Cancel</button>
              <button disabled={!salaryForm.basicSalary || salaryMut.isPending}
                onClick={() => salaryMut.mutate({
                  employeeId: salaryModal.id,
                  effectiveFrom: salaryForm.effectiveFrom,
                  basicSalary: Number(salaryForm.basicSalary),
                  hra: Number(salaryForm.hra||0),
                  conveyanceAllowance: Number(salaryForm.conveyanceAllowance||0),
                  medicalAllowance: Number(salaryForm.medicalAllowance||0),
                  specialAllowance: Number(salaryForm.specialAllowance||0),
                  pfEmployee: Number(salaryForm.pfEmployee||0),
                  pfEmployer: Number(salaryForm.pfEmployer||0),
                  professionalTax: Number(salaryForm.professionalTax||0),
                  tds: Number(salaryForm.tds||0),
                })}
                className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-500 disabled:opacity-50">
                {salaryMut.isPending ? 'Saving…' : 'Save Salary Structure'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Salary History Modal */}
      {historyModal && (
        <Modal open={!!historyModal} onClose={() => setHistoryModal(null)} title={`Salary History — ${historyModal.name}`} size="lg">
          {salHistory.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No salary structures on record.</p>
          ) : (
            <div className="space-y-3">
              {salHistory.map((s, i) => (
                <div key={s.id} className={`rounded-lg border p-4 ${s.isActive ? 'border-primary-200 bg-primary-50' : 'border-gray-200 bg-white'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">Effective from {new Date(s.effectiveFrom).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      {s.isActive && <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Current</span>}
                    </div>
                    <span className="text-sm font-bold text-primary-600">₹{Number(s.netSalary).toLocaleString('en-IN')}/mo</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    {[['Basic', s.basicSalary], ['HRA', s.hra], ['Conveyance', s.conveyanceAllowance], ['Medical', s.medicalAllowance], ['Special Allow.', s.specialAllowance], ['Gross', s.grossSalary], ['PF (Emp)', s.pfEmployee], ['Prof. Tax', s.professionalTax], ['TDS', s.tds], ['Total Deduct.', s.totalDeductions], ['Net Pay', s.netSalary], ['CTC', s.ctc]].map(([l, v]) => (
                      <div key={l} className={`flex justify-between border-b border-gray-100 pb-1 ${['Gross','Net Pay','CTC'].includes(l) ? 'font-semibold' : ''}`}>
                        <span className="text-gray-500">{l}</span>
                        <span className={l === 'Net Pay' ? 'text-primary-600' : l === 'Total Deduct.' ? 'text-red-600' : 'text-gray-800'}>₹{Number(v || 0).toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}

      {/* Payslip Modal */}
      {slipModal && (
        <Modal open={!!slipModal} onClose={() => setSlipModal(null)} title={`Payslip — ${MONTHS[slipModal.month - 1]} ${slipModal.year}`} size="lg">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between bg-primary-50 rounded-lg p-4 border border-primary-100">
              <div>
                <p className="font-bold text-gray-900 text-base">{fullSlip.employee?.firstName} {fullSlip.employee?.lastName}</p>
                <p className="text-sm text-gray-500">{fullSlip.employee?.employeeCode} · {fullSlip.employee?.designation?.name || fullSlip.employee?.department?.name}</p>
              </div>
              <button onClick={() => printPayslip(fullSlip)}
                className="flex items-center gap-2 rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white hover:bg-primary-500">
                <ArrowDownTrayIcon className="h-4 w-4" /> Download PDF
              </button>
            </div>

            {/* Attendance Summary */}
            <div className="grid grid-cols-4 gap-2 text-sm">
              {[['Working Days', fullSlip.workingDays], ['Present', Number(fullSlip.presentDays||0).toFixed(1)], ['WFH', fullSlip.wfhDays||0], ['LOP', fullSlip.unpaidLeaves||0]].map(([l,v]) => (
                <div key={l} className="rounded-lg bg-gray-50 p-3 text-center border border-gray-100">
                  <p className="text-xs text-gray-500">{l}</p>
                  <p className="font-bold text-gray-900 text-lg">{v}</p>
                </div>
              ))}
            </div>

            {/* Earnings & Deductions table */}
            {fullSlip.employee?.salaryStructures?.[0] && (() => {
              const sal = fullSlip.employee.salaryStructures[0]
              return (
                <div className="rounded-lg border border-gray-200 overflow-hidden text-sm">
                  <div className="grid grid-cols-2 divide-x divide-gray-200">
                    <div>
                      <div className="bg-green-50 px-4 py-2 text-xs font-semibold text-green-700 uppercase">Earnings</div>
                      {[['Basic Salary', sal.basicSalary], ['HRA', sal.hra], ['Conveyance Allow.', sal.conveyanceAllowance], ['Medical Allow.', sal.medicalAllowance], ['Special Allow.', sal.specialAllowance]].map(([l,v]) => (
                        <div key={l} className="flex justify-between px-4 py-1.5 border-t border-gray-100">
                          <span className="text-gray-600">{l}</span><span className="font-medium">₹{(v||0).toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between px-4 py-2 bg-green-50 border-t border-green-200 font-semibold text-green-700">
                        <span>Gross</span><span>₹{(fullSlip.grossSalary||0).toFixed(2)}</span>
                      </div>
                    </div>
                    <div>
                      <div className="bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 uppercase">Deductions</div>
                      {[['PF (Employee)', sal.pfEmployee], ['Professional Tax', sal.professionalTax], ['TDS', sal.tds]].map(([l,v]) => (
                        <div key={l} className="flex justify-between px-4 py-1.5 border-t border-gray-100">
                          <span className="text-gray-600">{l}</span><span className="font-medium text-red-600">₹{(v||0).toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between px-4 py-2 bg-red-50 border-t border-red-200 font-semibold text-red-700 mt-auto">
                        <span>Total</span><span>₹{(fullSlip.totalDeductions||0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* Net Pay */}
            <div className="flex items-center justify-between rounded-lg bg-primary-600 px-5 py-4">
              <span className="text-white font-semibold text-sm">NET PAY (Take Home)</span>
              <span className="text-white font-bold text-xl">₹{(fullSlip.netSalary||0).toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center">
              <Badge status={fullSlip.paymentStatus} label={fullSlip.paymentStatus} />
              {fullSlip.paymentDate && <span className="text-xs text-gray-500">Paid on: {new Date(fullSlip.paymentDate).toLocaleDateString('en-IN')}</span>}
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
