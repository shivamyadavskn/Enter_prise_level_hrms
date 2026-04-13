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
import { BanknotesIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function PayrollPage() {
  const { user, isFinance, isAdmin } = useAuth()
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())
  const [processModal, setProcessModal] = useState(false)
  const [slipModal, setSlipModal] = useState(null)

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
    onSuccess: () => { qc.invalidateQueries(['payroll']); qc.invalidateQueries(['payroll-summary']); setProcessModal(false); toast.success('Payroll processed successfully') },
  })

  const updateStatusMut = useMutation({
    mutationFn: ({ id, data }) => payrollApi.updateStatus(id, data),
    onSuccess: () => { qc.invalidateQueries(['payroll']); toast.success('Payment status updated') },
  })

  const payrolls = data?.data?.data || []
  const pagination = data?.data?.pagination
  const summary = summaryData?.data?.data

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
          <EmptyState title="No payroll records" description="Process payroll for the selected month." />
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

      {/* Payslip Modal */}
      {slipModal && (
        <Modal open={!!slipModal} onClose={() => setSlipModal(null)} title={`Payslip — ${MONTHS[slipModal.month - 1]} ${slipModal.year}`} size="md">
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="font-semibold text-gray-900">{slipModal.employee?.firstName} {slipModal.employee?.lastName}</p>
              <p className="text-sm text-gray-500">{slipModal.employee?.employeeCode} · {slipModal.employee?.department?.name}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {[
                ['Working Days', slipModal.workingDays],
                ['Present Days', Number(slipModal.presentDays).toFixed(1)],
                ['Paid Leaves', slipModal.paidLeaves],
                ['LOP Days', slipModal.unpaidLeaves],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between border-b border-gray-100 py-1">
                  <span className="text-gray-500">{l}</span>
                  <span className="font-medium text-gray-900">{v}</span>
                </div>
              ))}
            </div>
            <div className="rounded-lg border border-gray-200 divide-y divide-gray-100 text-sm">
              <div className="flex justify-between px-4 py-2 bg-green-50">
                <span className="font-medium text-green-700">Gross Salary</span>
                <span className="font-semibold text-green-700">₹{slipModal.grossSalary?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between px-4 py-2 bg-red-50">
                <span className="font-medium text-red-700">Total Deductions</span>
                <span className="font-semibold text-red-700">-₹{slipModal.totalDeductions?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between px-4 py-3 bg-primary-50">
                <span className="font-bold text-primary-700">Net Pay</span>
                <span className="font-bold text-primary-700 text-base">₹{slipModal.netSalary?.toFixed(2)}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <Badge status={slipModal.paymentStatus} label={slipModal.paymentStatus} />
              {slipModal.paymentDate && <span className="text-xs text-gray-500">Paid on: {new Date(slipModal.paymentDate).toLocaleDateString('en-IN')}</span>}
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
