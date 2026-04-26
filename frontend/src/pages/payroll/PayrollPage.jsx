import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { payrollApi, exportsApi, downloadBlob } from '../../api/index.js'
import ExportButton from '../../components/common/ExportButton.jsx'
import { useAuth } from '../../contexts/AuthContext.jsx'
import Badge from '../../components/common/Badge.jsx'
import Modal from '../../components/common/Modal.jsx'
import Pagination from '../../components/common/Pagination.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import { PageLoader } from '../../components/common/LoadingSpinner.jsx'
import StatCard from '../../components/common/StatCard.jsx'
import { BanknotesIcon, DocumentTextIcon, ArrowDownTrayIcon, ExclamationTriangleIcon, XMarkIcon, EyeIcon, CalendarDaysIcon, PencilSquareIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

function printPayslip(p) {
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
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
    <div class="title">SALARY PAYSLIP<br/><span style="font-weight:400;font-size:13px">${MONTHS[(p.month || 1) - 1]} ${p.year}</span></div>
  </div>
  <div class="emp-grid">
    <div><span class="label">Employee Name</span></div><div><span class="val">${p.employee?.firstName || ''} ${p.employee?.lastName || ''}</span></div>
    <div><span class="label">Employee Code</span></div><div><span class="val">${p.employee?.employeeCode || '-'}</span></div>
    <div><span class="label">Designation</span></div><div><span class="val">${p.employee?.designation?.name || '-'}</span></div>
    <div><span class="label">Department</span></div><div><span class="val">${p.employee?.department?.name || '-'}</span></div>
    <div><span class="label">Working Days</span></div><div><span class="val">${p.workingDays || 0}</span></div>
    <div><span class="label">Days Present</span></div><div><span class="val">${Number(p.presentDays || 0).toFixed(1)} (WFH: ${p.wfhDays || 0})</span></div>
    <div><span class="label">Paid Leaves</span></div><div><span class="val">${p.paidLeaves || 0}</span></div>
    <div><span class="label">LOP Days</span></div><div><span class="val">${p.unpaidLeaves || 0}</span></div>
    <div><span class="label">Payment Status</span></div><div><span class="val">${p.paymentStatus || '-'}</span></div>
    ${p.paymentDate ? `<div><span class="label">Payment Date</span></div><div><span class="val">${new Date(p.paymentDate).toLocaleDateString('en-IN')}</span></div>` : ''}
  </div>
  <table>
    <tr><th>Earnings</th><th style="text-align:right">Amount (₹)</th><th>Deductions</th><th style="text-align:right">Amount (₹)</th></tr>
    <tr><td>Basic Salary</td><td style="text-align:right">${(sal?.basicSalary || 0).toFixed(2)}</td><td>PF (Employee)</td><td style="text-align:right">${(sal?.pfEmployee || 0).toFixed(2)}</td></tr>
    <tr><td>HRA</td><td style="text-align:right">${(sal?.hra || 0).toFixed(2)}</td><td>Professional Tax</td><td style="text-align:right">${(sal?.professionalTax || 0).toFixed(2)}</td></tr>
    <tr><td>Conveyance Allow.</td><td style="text-align:right">${(sal?.conveyanceAllowance || 0).toFixed(2)}</td><td>TDS</td><td style="text-align:right">${(sal?.tds || 0).toFixed(2)}</td></tr>
    <tr><td>Medical Allow.</td><td style="text-align:right">${(sal?.medicalAllowance || 0).toFixed(2)}</td><td></td><td></td></tr>
    <tr><td>Special Allow.</td><td style="text-align:right">${(sal?.specialAllowance || 0).toFixed(2)}</td><td></td><td></td></tr>
    <tr class="total-row"><td>Gross Salary</td><td style="text-align:right">₹${(p.grossSalary || 0).toFixed(2)}</td><td>Total Deductions</td><td style="text-align:right">₹${(p.totalDeductions || 0).toFixed(2)}</td></tr>
  </table>
  <div class="net-box"><span class="label">NET PAY (Take Home)</span><span class="amount">₹${(p.netSalary || 0).toFixed(2)}</span></div>
  <div class="footer">This is a system-generated payslip and does not require a signature. · Generated on ${new Date().toLocaleDateString('en-IN')}</div>
  </body></html>`
  const win = window.open('', '_blank')
  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => { win.print() }, 500)
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function PayrollPage() {
  const { user, isFinance, isAdmin } = useAuth()
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())
  const [previewData, setPreviewData] = useState(null)
  const [workingDaysOverride, setWorkingDaysOverride] = useState({})
  const [slipModal, setSlipModal] = useState(null)
  const [salaryModal, setSalaryModal] = useState(null)
  const [historyModal, setHistoryModal] = useState(null)
  const [skippedResult, setSkippedResult] = useState([])
  const [salaryForm, setSalaryForm] = useState({ basicSalary: '', hra: '', conveyanceAllowance: 1600, medicalAllowance: 1250, specialAllowance: '', pfEmployee: '', pfEmployer: '', professionalTax: 200, tds: '', effectiveFrom: new Date().toISOString().split('T')[0], reason: '' })

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

  const previewMut = useMutation({
    mutationFn: payrollApi.preview,
    onSuccess: (res) => {
      const data = res.data?.data
      setPreviewData(data)
      setWorkingDaysOverride({})
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Preview failed'),
  })

  const processMut = useMutation({
    mutationFn: payrollApi.process,
    onSuccess: (res) => {
      qc.invalidateQueries(['payroll']); qc.invalidateQueries(['payroll-summary']); qc.invalidateQueries(['missing-salary'])
      setPreviewData(null)
      setWorkingDaysOverride({})
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

  const updateSalaryMut = useMutation({
    mutationFn: payrollApi.updateSalaryStructure,
    onSuccess: (res) => {
      qc.invalidateQueries(['missing-salary'])
      qc.invalidateQueries(['salary-history', salaryModal?.id])
      qc.invalidateQueries(['salary-revisions', salaryModal?.id])
      setSalaryModal(null)
      const diff = res.data?.data?.revision?.difference || 0
      const msg = diff >= 0
        ? `Salary updated! Net increased by ₹${diff.toLocaleString('en-IN')}`
        : `Salary updated! Net decreased by ₹${Math.abs(diff).toLocaleString('en-IN')}`
      toast.success(msg)
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update salary')
    },
  })

  const [revisionModal, setRevisionModal] = useState(null)
  const [revPage, setRevPage] = useState(1)
  const [selectedPayrolls, setSelectedPayrolls] = useState(new Set())

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

  const bulkUpdateMut = useMutation({
    mutationFn: (data) => payrollApi.bulkUpdatePaymentStatus(data),
    onSuccess: (res) => {
      qc.invalidateQueries(['payroll'])
      qc.invalidateQueries(['payroll-summary'])
      setSelectedPayrolls(new Set())
      const count = res.data?.data?.count || 0
      toast.success(`${count} payroll(s) marked as Paid successfully`)
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update payment status')
    },
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

  const { data: revisionsData } = useQuery({
    queryKey: ['salary-revisions', revisionModal?.employeeId, revPage],
    queryFn: () => payrollApi.getSalaryRevisions(revisionModal.employeeId, { page: revPage, limit: 5 }),
    enabled: !!revisionModal?.employeeId,
  })
  const revisions = revisionsData?.data?.data?.data || []
  const revPagination = revisionsData?.data?.data?.pagination

  const payrolls = data?.data?.data || []
  const pagination = data?.data?.pagination
  const summary = summaryData?.data?.data
  const sf = (k) => (e) => setSalaryForm({ ...salaryForm, [k]: e.target.value })
  const calcSalary = () => {
    const { basicSalary: b, hra: h, conveyanceAllowance: c, medicalAllowance: m, specialAllowance: s, pfEmployee: pfe, pfEmployer: pfr, professionalTax: pt, tds: t } = salaryForm
    const gross = [b, h, c, m, s].reduce((a, v) => a + Number(v || 0), 0)
    const deductions = [pfe, pt, t].reduce((a, v) => a + Number(v || 0), 0)
    return { gross, net: Math.max(0, gross - deductions), ctc: gross + Number(pfr || 0) }
  }
  const { gross, net, ctc } = calcSalary()
  const formatCurrencyShort = (amount) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(2)}K`;
    return `₹${amount}`;
  };

  const formatCurrencyFull = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Bulk selection helpers
  const togglePayrollSelection = (id) => {
    const newSelected = new Set(selectedPayrolls)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedPayrolls(newSelected)
  }

  const toggleAllSelection = () => {
    if (selectedPayrolls.size === payrolls.length) {
      setSelectedPayrolls(new Set())
    } else {
      const allIds = payrolls.filter(p => p.paymentStatus !== 'PAID').map(p => p.id)
      setSelectedPayrolls(new Set(allIds))
    }
  }

  const handleBulkMarkPaid = () => {
    if (selectedPayrolls.size === 0) {
      toast.error('Please select at least one payroll')
      return
    }
    const ids = Array.from(selectedPayrolls)
    const today = new Date().toISOString().split('T')[0]
    bulkUpdateMut.mutate({
      payrollIds: ids,
      paymentStatus: 'PAID',
      paymentDate: today
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isFinanceOrAdmin ? 'Payroll Management' : 'My Payslips'}</h1>
          <p className="text-sm text-gray-500">{isFinanceOrAdmin ? 'Process and manage organisation payroll' : 'View your salary payslips'}</p>
        </div>
        <div className="flex gap-3">
          {isFinanceOrAdmin && (
            <>
              <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="rounded-md border-0 py-1.5 pl-3 pr-8 ring-1 ring-inset ring-gray-300 sm:text-sm">
                {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
              <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="rounded-md border-0 py-1.5 pl-3 pr-8 ring-1 ring-inset ring-gray-300 sm:text-sm">
                {[2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
              <ExportButton
                label="Export Excel"
                fallbackName={`payroll_${year}_${String(month).padStart(2,'0')}.xlsx`}
                onExport={() => exportsApi.payrollXlsx({ month, year })}
              />
              <button onClick={() => previewMut.mutate({ month, year })} disabled={previewMut.isPending}
                className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 disabled:opacity-50 transition-colors">
                <EyeIcon className="h-4 w-4" />
                {previewMut.isPending ? 'Loading Preview…' : 'Process Payroll'}
              </button>
            </>
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
                  <button key={e.id} onClick={() => { setSalaryModal({ ...e, hasExisting: false }); setSalaryForm({ basicSalary: '', hra: '', conveyanceAllowance: 1600, medicalAllowance: 1250, specialAllowance: '', pfEmployee: '', pfEmployer: '', professionalTax: 200, tds: '', effectiveFrom: new Date().toISOString().split('T')[0], reason: '' }) }}
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
                    <button key={e.id} onClick={() => { setSalaryModal({ ...e, hasExisting: false }); setSalaryForm({ basicSalary: '', hra: '', conveyanceAllowance: 1600, medicalAllowance: 1250, specialAllowance: '', pfEmployee: '', pfEmployer: '', professionalTax: 200, tds: '', effectiveFrom: new Date().toISOString().split('T')[0], reason: '' }) }}
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
          <StatCard
            title="Total Employees"
            value={summary.totalEmployees}
            icon={BanknotesIcon}
            color="blue"
          />
          <StatCard
            title="Total Gross"
            value={formatCurrencyShort(summary.totalGross)}
            subtitle={formatCurrencyFull(summary.totalGross)}
            icon={BanknotesIcon}
            color="green"
          />
          <StatCard
            title="Total Deductions"
            value={formatCurrencyShort(summary.totalDeductions)}
            subtitle={formatCurrencyFull(summary.totalDeductions)}
            icon={BanknotesIcon}
            color="red"
          />
          <StatCard
            title="Net Payable"
            value={formatCurrencyShort(summary.totalNet)}
            subtitle={formatCurrencyFull(summary.totalNet)}
            icon={BanknotesIcon}
            color="indigo"
          />
        </div>
      )}

      {/* Bulk Action Toolbar */}
      {isFinanceOrAdmin && selectedPayrolls.size > 0 && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-blue-900">{selectedPayrolls.size} selected</span>
            <button
              onClick={() => setSelectedPayrolls(new Set())}
              className="text-xs text-blue-600 hover:text-blue-800 underline"
            >
              Clear selection
            </button>
          </div>
          <button
            onClick={handleBulkMarkPaid}
            disabled={bulkUpdateMut.isPending}
            className="flex items-center gap-1.5 rounded-md bg-green-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-green-500 disabled:opacity-50"
          >
            <BanknotesIcon className="h-4 w-4" />
            {bulkUpdateMut.isPending ? 'Updating…' : 'Mark as Paid'}
          </button>
        </div>
      )}

      {/* Payroll Table */}
      <div className="overflow-hidden rounded-lg bg-white shadow">
        {isLoading ? <PageLoader /> : payrolls.length === 0 ? (
          <EmptyState variant="payroll" title="No payroll records" description={isFinanceOrAdmin ? "Process payroll for the selected month." : "Your payslips will appear here once payroll is processed."} />
        ) : (
          <>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {isFinanceOrAdmin && (
                    <th className="px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={selectedPayrolls.size > 0 && selectedPayrolls.size === payrolls.filter(p => p.paymentStatus !== 'PAID').length}
                        onChange={toggleAllSelection}
                        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-600"
                      />
                    </th>
                  )}
                  {(isFinanceOrAdmin ? ['Employee', 'Month/Year', 'Days', 'Gross', 'Deductions', 'Net Pay', 'Status', 'Actions'] : ['Month/Year', 'Gross', 'Deductions', 'Net Pay', 'Status', 'Actions']).map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {payrolls.map((p) => (
                  <tr key={p.id} className={`hover:bg-gray-50 ${selectedPayrolls.has(p.id) ? 'bg-blue-50' : ''}`}>
                    {isFinanceOrAdmin && (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedPayrolls.has(p.id)}
                          onChange={() => togglePayrollSelection(p.id)}
                          disabled={p.paymentStatus === 'PAID'}
                          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-600 disabled:opacity-30"
                        />
                      </td>
                    )}
                    {isFinanceOrAdmin && (
                      <td className="px-6 py-3 text-sm font-medium text-gray-900">
                        {p.employee?.firstName} {p.employee?.lastName}
                        <p className="text-xs text-gray-500">{p.employee?.department?.name}</p>
                      </td>
                    )}
                    <td className="px-6 py-3 text-sm text-gray-500">{MONTHS[p.month - 1]} {p.year}</td>
                    <td className="px-6 py-3">
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-900">{p.presentDays?.toFixed(1)}/{p.workingDays} days</span>
                        {p.presentDays < p.workingDays && (
                          <span className="text-xs text-amber-600 font-medium" title="Prorated salary based on actual working days">Prorated</span>
                        )}
                      </div>
                    </td>
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
                          <>
                            <button onClick={() => setHistoryModal({ employeeId: p.employeeId, name: `${p.employee?.firstName} ${p.employee?.lastName}` })}
                              className="text-xs text-gray-400 hover:text-gray-600">History</button>
                            <button onClick={() => {
                              const emp = p.employee;
                              const sal = emp?.salaryStructures?.[0];
                              setSalaryModal({
                                id: p.employeeId,
                                name: `${emp?.firstName} ${emp?.lastName}`,
                                employeeCode: emp?.employeeCode,
                                department: emp?.department?.name,
                                designation: emp?.designation?.name,
                                hasExisting: true,
                                currentNet: sal?.netSalary || p.netSalary
                              });
                              setSalaryForm({
                                basicSalary: sal?.basicSalary || '',
                                hra: sal?.hra || '',
                                conveyanceAllowance: sal?.conveyanceAllowance || 1600,
                                medicalAllowance: sal?.medicalAllowance || 1250,
                                specialAllowance: sal?.specialAllowance || '',
                                pfEmployee: sal?.pfEmployee || '',
                                pfEmployer: sal?.pfEmployer || '',
                                professionalTax: sal?.professionalTax || 200,
                                tds: sal?.tds || '',
                                effectiveFrom: new Date().toISOString().split('T')[0],
                                reason: ''
                              });
                            }}
                              className="text-xs text-primary-600 hover:text-primary-500 font-medium">Update Salary</button>
                          </>
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

      {/* Payroll Preview & Confirm Modal */}
      {previewData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4" onClick={() => setPreviewData(null)}>
          <div className="w-full max-w-5xl rounded-2xl bg-white shadow-xl max-h-[92vh] flex flex-col animate-scale-in" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-gray-900 tracking-tight">Payroll Preview — {MONTHS[previewData.month - 1]} {previewData.year}</h2>
                <p className="text-sm text-gray-500 mt-0.5">Review and adjust before final processing</p>
              </div>
              <button onClick={() => setPreviewData(null)} className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Summary Cards */}
            <div className="px-6 py-4 border-b border-gray-100 shrink-0">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(() => {
                  const modified = previewData.preview.map(p => {
                    if (workingDaysOverride[p.employeeId] !== undefined) {
                      const days = Number(workingDaysOverride[p.employeeId])
                      const gross = Math.round(p.perDaySalary * days)
                      return { ...p, payableDays: days, grossSalary: gross, netSalary: Math.max(0, gross - p.totalDeductions) }
                    }
                    return p
                  })
                  const tg = modified.reduce((s, p) => s + p.grossSalary, 0)
                  const td = modified.reduce((s, p) => s + p.totalDeductions, 0)
                  const tn = modified.reduce((s, p) => s + p.netSalary, 0)
                  return [
                    { label: 'Employees', value: modified.length, bg: 'bg-blue-50 text-blue-700' },
                    { label: 'Total Gross', value: `₹${tg.toLocaleString('en-IN')}`, bg: 'bg-emerald-50 text-emerald-700' },
                    { label: 'Total Deductions', value: `₹${td.toLocaleString('en-IN')}`, bg: 'bg-red-50 text-red-700' },
                    { label: 'Net Payable', value: `₹${tn.toLocaleString('en-IN')}`, bg: 'bg-primary-50 text-primary-700' },
                  ].map(c => (
                    <div key={c.label} className={`rounded-xl p-3.5 ${c.bg}`}>
                      <p className="text-[11px] font-semibold uppercase tracking-wide opacity-70">{c.label}</p>
                      <p className="text-lg font-bold mt-0.5">{c.value}</p>
                    </div>
                  ))
                })()}
              </div>
              {previewData.skipped?.length > 0 && (
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 p-2.5 text-xs text-amber-700">
                  <ExclamationTriangleIcon className="h-4 w-4 shrink-0" />
                  <span><strong>{previewData.skipped.length}</strong> employee(s) skipped (no salary structure): {previewData.skipped.map(s => s.name).join(', ')}</span>
                </div>
              )}
              {/* Anomaly Alerts */}
              {previewData.globalAnomalies?.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  {previewData.globalAnomalies.map((a, i) => (
                    <div key={i} className={`flex items-center gap-2 rounded-lg p-2.5 text-xs ${a.severity === 'high' ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-amber-50 border border-amber-200 text-amber-700'}`}>
                      <ExclamationTriangleIcon className="h-4 w-4 shrink-0" />
                      <span>{a.message}</span>
                    </div>
                  ))}
                </div>
              )}
              {previewData.totals?.anomalyCount > 0 && (
                <div className="mt-2 flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-2.5 text-xs text-red-700">
                  <ExclamationTriangleIcon className="h-4 w-4 shrink-0" />
                  <span><strong>{previewData.totals.anomalyCount}</strong> critical anomaly(ies) detected — review flagged employees below</span>
                </div>
              )}
            </div>

            {/* Preview Table */}
            <div className="flex-1 overflow-auto px-6 py-4">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 bg-gray-50 z-10">
                  <tr>
                    {['Employee', 'Department', 'Total Days', 'Present', 'WFH', 'Leaves', 'LOP', 'Payable Days', 'Per Day', 'Gross', 'Deductions', 'Net Pay', 'Status'].map(h => (
                      <th key={h} className="px-3 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {previewData.preview.map(p => {
                    const overrideDays = workingDaysOverride[p.employeeId]
                    const effectiveDays = overrideDays !== undefined ? Number(overrideDays) : p.payableDays
                    const effectiveGross = overrideDays !== undefined ? Math.round(p.perDaySalary * effectiveDays) : p.grossSalary
                    const effectiveNet = overrideDays !== undefined ? Math.max(0, effectiveGross - p.totalDeductions) : p.netSalary
                    const isModified = overrideDays !== undefined && Number(overrideDays) !== p.payableDays
                    return (
                      <tr key={p.employeeId} className={`hover:bg-gray-50 ${isModified ? 'bg-amber-50/50' : ''} ${p.alreadyProcessed ? 'opacity-60' : ''}`}>
                        <td className="px-3 py-2.5 font-medium text-gray-900 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            {p.name}
                            {p.anomalies?.filter(a => a.severity === 'high').length > 0 && (
                              <span className="relative group">
                                <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
                                <span className="absolute bottom-full left-0 mb-1 hidden group-hover:block z-20 w-52 rounded-lg bg-gray-900 text-white text-[11px] p-2 shadow-lg">
                                  {p.anomalies.filter(a => a.severity === 'high').map(a => a.message).join(' · ')}
                                </span>
                              </span>
                            )}
                            {p.anomalies?.filter(a => a.severity === 'medium').length > 0 && !p.anomalies?.some(a => a.severity === 'high') && (
                              <span className="relative group">
                                <ExclamationTriangleIcon className="h-3.5 w-3.5 text-amber-500" />
                                <span className="absolute bottom-full left-0 mb-1 hidden group-hover:block z-20 w-52 rounded-lg bg-gray-900 text-white text-[11px] p-2 shadow-lg">
                                  {p.anomalies.filter(a => a.severity === 'medium').map(a => a.message).join(' · ')}
                                </span>
                              </span>
                            )}
                          </div>
                          <span className="block text-[11px] text-gray-400 font-normal">{p.employeeCode}</span>
                        </td>
                        <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap">{p.department || '—'}</td>
                        <td className="px-3 py-2.5 text-gray-600">{p.totalDaysInMonth}</td>
                        <td className="px-3 py-2.5 text-emerald-600 font-medium">{p.presentDays}</td>
                        <td className="px-3 py-2.5 text-purple-600">{p.wfhDays}</td>
                        <td className="px-3 py-2.5 text-blue-600">{p.paidLeaves}</td>
                        <td className="px-3 py-2.5 text-red-600">{p.unpaidLeaves}</td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min={0}
                              max={p.totalDaysInMonth}
                              step={0.5}
                              value={overrideDays !== undefined ? overrideDays : p.payableDays}
                              onChange={(e) => setWorkingDaysOverride(prev => ({ ...prev, [p.employeeId]: e.target.value }))}
                              className={`w-16 rounded-md border-0 py-1 px-2 text-center text-sm font-semibold ring-1 ring-inset focus:ring-2 focus:ring-primary-500 ${isModified ? 'ring-amber-400 bg-amber-50 text-amber-700' : 'ring-gray-300 text-gray-900'}`}
                            />
                            {isModified && (
                              <button onClick={() => setWorkingDaysOverride(prev => { const n = { ...prev }; delete n[p.employeeId]; return n })}
                                className="text-amber-500 hover:text-amber-700" title="Reset to calculated">
                                <XMarkIcon className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-gray-500">₹{p.perDaySalary?.toLocaleString('en-IN')}</td>
                        <td className="px-3 py-2.5 font-medium text-gray-900">₹{effectiveGross.toLocaleString('en-IN')}</td>
                        <td className="px-3 py-2.5 text-red-600">-₹{p.totalDeductions?.toLocaleString('en-IN')}</td>
                        <td className="px-3 py-2.5 font-bold text-emerald-700">₹{effectiveNet.toLocaleString('en-IN')}</td>
                        <td className="px-3 py-2.5">
                          {p.alreadyProcessed
                            ? <span className="inline-flex items-center rounded-md bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-600 ring-1 ring-amber-200">Re-run</span>
                            : <span className="inline-flex items-center rounded-md bg-emerald-50 px-1.5 py-0.5 text-[11px] font-medium text-emerald-600 ring-1 ring-emerald-200">New</span>
                          }
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {previewData.preview.length === 0 && (
                <p className="text-center text-gray-400 py-8">No employees with salary structure found for this period.</p>
              )}
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50 shrink-0 rounded-b-2xl">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <PencilSquareIcon className="h-4 w-4" />
                <span>Edit <strong>Payable Days</strong> column to override working days for any employee</span>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setPreviewData(null)} className="rounded-lg px-4 py-2.5 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const override = {}
                    Object.entries(workingDaysOverride).forEach(([id, val]) => {
                      const original = previewData.preview.find(p => p.employeeId === Number(id))
                      if (original && Number(val) !== original.payableDays) {
                        override[id] = Number(val)
                      }
                    })
                    processMut.mutate({ month: previewData.month, year: previewData.year, workingDaysOverride: Object.keys(override).length > 0 ? override : undefined })
                  }}
                  disabled={processMut.isPending || previewData.preview.length === 0}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                >
                  <BanknotesIcon className="h-4 w-4" />
                  {processMut.isPending ? 'Processing…' : `Confirm & Process (${previewData.preview.length} employees)`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Salary Structure Setup/Update Modal */}
      {salaryModal && (
        <Modal open={!!salaryModal} onClose={() => setSalaryModal(null)} title={`${salaryModal.hasExisting ? 'Update' : 'Set Up'} Salary — ${salaryModal.name}`} size="lg">
          <div className="space-y-4">
            {salaryModal.hasExisting ? (
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-700 flex items-start justify-between">
                <div>
                  <strong>{salaryModal.name}</strong> ({salaryModal.employeeCode}) · {salaryModal.department} — {salaryModal.designation}
                  <br />Current Net Salary: <strong>₹{Number(salaryModal.currentNet || 0).toLocaleString('en-IN')}</strong>
                </div>
                <button
                  onClick={() => { setSalaryModal(null); setRevisionModal({ employeeId: salaryModal.id, name: salaryModal.name }) }}
                  className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded font-medium"
                >
                  View Change History
                </button>
              </div>
            ) : (
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-700">
                <strong>{salaryModal.name}</strong> ({salaryModal.employeeCode}) · {salaryModal.department} — {salaryModal.designation}
                <br />Without a salary structure this employee will be skipped during payroll processing.
              </div>
            )}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs font-semibold text-green-700 uppercase mb-2">Earnings</p>
                {[['basicSalary', 'Basic Salary *'], ['hra', 'HRA'], ['conveyanceAllowance', 'Conveyance Allow.'], ['medicalAllowance', 'Medical Allow.'], ['specialAllowance', 'Special Allow.']].map(([k, label]) => (
                  <div key={k} className="mb-2">
                    <label className="block text-xs font-medium text-gray-600">{label}</label>
                    <input type="number" value={salaryForm[k]} onChange={sf(k)} required={k === 'basicSalary'} className="mt-0.5 block w-full rounded border-0 py-1.5 px-2 ring-1 ring-gray-300 focus:ring-2 focus:ring-primary-600 text-sm" />
                  </div>
                ))}
              </div>
              <div>
                <p className="text-xs font-semibold text-red-700 uppercase mb-2">Deductions</p>
                {[['pfEmployee', 'PF (Employee 12%)'], ['pfEmployer', 'PF (Employer 12%)'], ['professionalTax', 'Prof. Tax'], ['tds', 'TDS']].map(([k, label]) => (
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
            {/* Reason field for updates */}
            {salaryModal.hasExisting && (
              <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3">
                <label className="block text-xs font-semibold text-yellow-800 uppercase mb-1">Reason for Change * <span className="font-normal normal-case text-yellow-600">(required for audit trail)</span></label>
                <textarea
                  value={salaryForm.reason}
                  onChange={sf('reason')}
                  placeholder="e.g., Corrected HRA percentage, Annual increment, Promotion salary adjustment..."
                  className="block w-full rounded border-0 py-2 px-2 ring-1 ring-yellow-400 focus:ring-2 focus:ring-yellow-500 text-sm"
                  rows={2}
                />
              </div>
            )}
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
              {salaryModal.hasExisting ? (
                <button
                  disabled={!salaryForm.basicSalary || !salaryForm.reason || updateSalaryMut.isPending}
                  onClick={() => updateSalaryMut.mutate({
                    employeeId: salaryModal.id,
                    effectiveFrom: salaryForm.effectiveFrom,
                    basicSalary: Number(salaryForm.basicSalary),
                    hra: Number(salaryForm.hra || 0),
                    conveyanceAllowance: Number(salaryForm.conveyanceAllowance || 0),
                    medicalAllowance: Number(salaryForm.medicalAllowance || 0),
                    specialAllowance: Number(salaryForm.specialAllowance || 0),
                    pfEmployee: Number(salaryForm.pfEmployee || 0),
                    pfEmployer: Number(salaryForm.pfEmployer || 0),
                    professionalTax: Number(salaryForm.professionalTax || 0),
                    tds: Number(salaryForm.tds || 0),
                    reason: salaryForm.reason,
                  })}
                  className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-500 disabled:opacity-50"
                >
                  {updateSalaryMut.isPending ? 'Updating…' : 'Update Salary Structure'}
                </button>
              ) : (
                <button
                  disabled={!salaryForm.basicSalary || salaryMut.isPending}
                  onClick={() => salaryMut.mutate({
                    employeeId: salaryModal.id,
                    effectiveFrom: salaryForm.effectiveFrom,
                    basicSalary: Number(salaryForm.basicSalary),
                    hra: Number(salaryForm.hra || 0),
                    conveyanceAllowance: Number(salaryForm.conveyanceAllowance || 0),
                    medicalAllowance: Number(salaryForm.medicalAllowance || 0),
                    specialAllowance: Number(salaryForm.specialAllowance || 0),
                    pfEmployee: Number(salaryForm.pfEmployee || 0),
                    pfEmployer: Number(salaryForm.pfEmployer || 0),
                    professionalTax: Number(salaryForm.professionalTax || 0),
                    tds: Number(salaryForm.tds || 0),
                  })}
                  className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-500 disabled:opacity-50"
                >
                  {salaryMut.isPending ? 'Saving…' : 'Save Salary Structure'}
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Salary History Modal */}
      {historyModal && (
        <Modal open={!!historyModal} onClose={() => setHistoryModal(null)} title={`Salary History — ${historyModal.name}`} size="lg">
          <div className="mb-4 flex justify-end">
            <button
              onClick={() => { setHistoryModal(null); setRevisionModal({ employeeId: historyModal.employeeId, name: historyModal.name }) }}
              className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1.5 rounded font-medium"
            >
              View Change History (Audit Trail)
            </button>
          </div>
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
                      <div key={l} className={`flex justify-between border-b border-gray-100 pb-1 ${['Gross', 'Net Pay', 'CTC'].includes(l) ? 'font-semibold' : ''}`}>
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
              <button
                onClick={async () => {
                  try {
                    const res = await exportsApi.payslipPdf(fullSlip.id)
                    downloadBlob(res, `payslip_${fullSlip.employee?.employeeCode || fullSlip.id}.pdf`)
                    toast.success('Payslip downloaded')
                  } catch (err) {
                    // Fall back to client-side print if server PDF fails
                    toast.error('Server PDF unavailable, opening print view…')
                    printPayslip(fullSlip)
                  }
                }}
                className="flex items-center gap-2 rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white hover:bg-primary-500">
                <ArrowDownTrayIcon className="h-4 w-4" /> Download PDF
              </button>
            </div>

            {/* Attendance Summary */}
            <div className="grid grid-cols-4 gap-2 text-sm">
              {[['Working Days', fullSlip.workingDays], ['Present', Number(fullSlip.presentDays || 0).toFixed(1)], ['WFH', fullSlip.wfhDays || 0], ['LOP', fullSlip.unpaidLeaves || 0]].map(([l, v]) => (
                <div key={l} className="rounded-lg bg-gray-50 p-3 text-center border border-gray-100">
                  <p className="text-xs text-gray-500">{l}</p>
                  <p className="font-bold text-gray-900 text-lg">{v}</p>
                </div>
              ))}
            </div>

            {/* Prorated Notice */}
            {fullSlip.presentDays < fullSlip.workingDays && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm">
                <p className="text-amber-800 font-medium">
                  Prorated Salary: Employee worked {Number(fullSlip.presentDays).toFixed(1)} out of {fullSlip.workingDays} days.
                  Salary calculated as: ₹{fullSlip.employee?.salaryStructures?.[0]?.grossSalary?.toLocaleString('en-IN')} ÷ {fullSlip.workingDays} × {Number(fullSlip.presentDays).toFixed(1)} = ₹{(fullSlip.grossSalary || 0).toLocaleString('en-IN')}
                </p>
              </div>
            )}

            {/* Earnings & Deductions table */}
            {fullSlip.employee?.salaryStructures?.[0] && (() => {
              const sal = fullSlip.employee.salaryStructures[0]
              return (
                <div className="rounded-lg border border-gray-200 overflow-hidden text-sm">
                  <div className="grid grid-cols-2 divide-x divide-gray-200">
                    <div>
                      <div className="bg-green-50 px-4 py-2 text-xs font-semibold text-green-700 uppercase">Earnings</div>
                      {[['Basic Salary', sal.basicSalary], ['HRA', sal.hra], ['Conveyance Allow.', sal.conveyanceAllowance], ['Medical Allow.', sal.medicalAllowance], ['Special Allow.', sal.specialAllowance]].map(([l, v]) => (
                        <div key={l} className="flex justify-between px-4 py-1.5 border-t border-gray-100">
                          <span className="text-gray-600">{l}</span><span className="font-medium">₹{(v || 0).toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between px-4 py-2 bg-green-50 border-t border-green-200 font-semibold text-green-700">
                        <span>Gross</span><span>₹{(fullSlip.grossSalary || 0).toFixed(2)}</span>
                      </div>
                    </div>
                    <div>
                      <div className="bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 uppercase">Deductions</div>
                      {[['PF (Employee)', sal.pfEmployee], ['Professional Tax', sal.professionalTax], ['TDS', sal.tds]].map(([l, v]) => (
                        <div key={l} className="flex justify-between px-4 py-1.5 border-t border-gray-100">
                          <span className="text-gray-600">{l}</span><span className="font-medium text-red-600">₹{(v || 0).toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between px-4 py-2 bg-red-50 border-t border-red-200 font-semibold text-red-700 mt-auto">
                        <span>Total</span><span>₹{(fullSlip.totalDeductions || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* Net Pay */}
            <div className="flex items-center justify-between rounded-lg bg-primary-600 px-5 py-4">
              <span className="text-white font-semibold text-sm">NET PAY (Take Home)</span>
              <span className="text-white font-bold text-xl">₹{(fullSlip.netSalary || 0).toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center">
              <Badge status={fullSlip.paymentStatus} label={fullSlip.paymentStatus} />
              {fullSlip.paymentDate && <span className="text-xs text-gray-500">Paid on: {new Date(fullSlip.paymentDate).toLocaleDateString('en-IN')}</span>}
            </div>
          </div>
        </Modal>
      )}

      {/* Salary Revision History Modal */}
      {revisionModal && (
        <Modal open={!!revisionModal} onClose={() => setRevisionModal(null)} title={`Salary Change History — ${revisionModal.name}`} size="lg">
          {revisions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500 mb-2">No salary changes recorded yet.</p>
              <p className="text-xs text-gray-400">Changes will be logged here when salary is updated.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {revisions.map((rev) => (
                <div key={rev.id} className="rounded-lg border border-gray-200 bg-white p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">{rev.changeType}</span>
                      <p className="text-xs text-gray-500 mt-1">By {rev.changedBy} · {new Date(rev.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 mb-3 bg-gray-50 p-2 rounded"><strong>Reason:</strong> {rev.reason}</p>
                  {rev.changes && rev.changes.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-xs">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left font-medium text-gray-500">Component</th>
                            <th className="px-3 py-2 text-right font-medium text-gray-500">Old Value</th>
                            <th className="px-3 py-2 text-right font-medium text-gray-500">New Value</th>
                            <th className="px-3 py-2 text-right font-medium text-gray-500">Change</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {rev.changes.map((change, idx) => (
                            <tr key={idx}>
                              <td className="px-3 py-2 text-gray-700">{change.field}</td>
                              <td className="px-3 py-2 text-right text-gray-500">₹{Number(change.oldValue).toLocaleString('en-IN')}</td>
                              <td className="px-3 py-2 text-right font-medium text-gray-900">₹{Number(change.newValue).toLocaleString('en-IN')}</td>
                              <td className={`px-3 py-2 text-right font-medium ${change.difference > 0 ? 'text-green-600' : change.difference < 0 ? 'text-red-600' : 'text-gray-400'}`}>
                                {change.difference > 0 ? '+' : ''}{Number(change.difference).toLocaleString('en-IN')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
              {revPagination && revPagination.totalPages > 1 && (
                <Pagination page={revPagination.page} totalPages={revPagination.totalPages} total={revPagination.total} limit={5} onPageChange={setRevPage} />
              )}
            </div>
          )}
        </Modal>
      )}
    </div>
  )
}
