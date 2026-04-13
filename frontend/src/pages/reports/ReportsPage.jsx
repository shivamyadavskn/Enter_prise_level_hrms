import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { reportsApi, departmentsApi } from '../../api/index.js'
import StatCard from '../../components/common/StatCard.jsx'
import Badge from '../../components/common/Badge.jsx'
import { PageLoader } from '../../components/common/LoadingSpinner.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import {
  UsersIcon, ChartBarIcon, CalendarDaysIcon,
  BanknotesIcon, ArrowTrendingDownIcon, UserPlusIcon,
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const TABS = [
  { id: 'headcount',   label: 'Headcount',   icon: UsersIcon },
  { id: 'attendance',  label: 'Attendance',  icon: ChartBarIcon },
  { id: 'leaves',      label: 'Leaves',      icon: CalendarDaysIcon },
  { id: 'payroll',     label: 'Payroll',     icon: BanknotesIcon },
  { id: 'attrition',  label: 'Attrition',   icon: ArrowTrendingDownIcon },
  { id: 'newjoiners', label: 'New Joiners',  icon: UserPlusIcon },
]

function HeadcountReport() {
  const { data, isLoading } = useQuery({ queryKey: ['report-headcount'], queryFn: () => reportsApi.getHeadcount() })
  const rows = data?.data?.data || []
  if (isLoading) return <PageLoader />
  return (
    <div className="overflow-hidden rounded-lg bg-white shadow">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {['Department', 'Status', 'Count'].map((h) => <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {rows.map((r, i) => (
            <tr key={i} className="hover:bg-gray-50">
              <td className="px-6 py-3 text-sm font-medium text-gray-900">{r.department}</td>
              <td className="px-6 py-3"><Badge status={r.status} label={r.status} /></td>
              <td className="px-6 py-3 text-sm text-gray-900 font-semibold">{r.count}</td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={3}><EmptyState title="No data" /></td></tr>}
        </tbody>
      </table>
    </div>
  )
}

function AttendanceReport() {
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())
  const { data, isLoading } = useQuery({ queryKey: ['report-attendance', month, year], queryFn: () => reportsApi.getAttendance({ month, year }) })
  const rows = data?.data?.data?.data || []
  if (isLoading) return <PageLoader />
  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="rounded-md border-0 py-1.5 pl-3 pr-8 ring-1 ring-inset ring-gray-300 sm:text-sm">
          {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="rounded-md border-0 py-1.5 pl-3 pr-8 ring-1 ring-inset ring-gray-300 sm:text-sm">
          {[2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['Employee', 'Dept', 'Present', 'Absent', 'Half Day', 'Leave', 'WFH', 'Hours'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {rows.map((r, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{r.employee?.firstName} {r.employee?.lastName}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{r.employee?.department?.name}</td>
                <td className="px-4 py-3 text-sm text-green-600 font-medium">{r.present}</td>
                <td className="px-4 py-3 text-sm text-red-500">{r.absent}</td>
                <td className="px-4 py-3 text-sm text-yellow-600">{r.halfDay}</td>
                <td className="px-4 py-3 text-sm text-blue-600">{r.leave}</td>
                <td className="px-4 py-3 text-sm text-purple-600">{r.wfh}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{r.totalHours}h</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={8}><EmptyState title="No attendance data" /></td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function PayrollReport() {
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())
  const { data, isLoading } = useQuery({ queryKey: ['report-payroll', month, year], queryFn: () => reportsApi.getPayroll({ month, year }) })
  const report = data?.data?.data
  const payrolls = report?.payrolls || []
  if (isLoading) return <PageLoader />
  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="rounded-md border-0 py-1.5 pl-3 pr-8 ring-1 ring-inset ring-gray-300 sm:text-sm">
          {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="rounded-md border-0 py-1.5 pl-3 pr-8 ring-1 ring-inset ring-gray-300 sm:text-sm">
          {[2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      {report?.totals && (
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg bg-green-50 p-4"><p className="text-xs text-green-600 font-medium">Total Gross</p><p className="text-xl font-bold text-green-700 mt-1">₹{report.totals.grossSalary?.toFixed(0)}</p></div>
          <div className="rounded-lg bg-red-50 p-4"><p className="text-xs text-red-600 font-medium">Total Deductions</p><p className="text-xl font-bold text-red-700 mt-1">₹{report.totals.totalDeductions?.toFixed(0)}</p></div>
          <div className="rounded-lg bg-primary-50 p-4"><p className="text-xs text-primary-600 font-medium">Net Payable</p><p className="text-xl font-bold text-primary-700 mt-1">₹{report.totals.netSalary?.toFixed(0)}</p></div>
        </div>
      )}
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['Employee', 'Department', 'Designation', 'Gross', 'Deductions', 'Net', 'Status'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {payrolls.map((p, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{p.employee?.firstName} {p.employee?.lastName}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{p.employee?.department?.name}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{p.employee?.designation?.name}</td>
                <td className="px-4 py-3 text-sm text-gray-900">₹{p.grossSalary?.toFixed(0)}</td>
                <td className="px-4 py-3 text-sm text-red-500">-₹{p.totalDeductions?.toFixed(0)}</td>
                <td className="px-4 py-3 text-sm font-semibold text-green-600">₹{p.netSalary?.toFixed(0)}</td>
                <td className="px-4 py-3"><Badge status={p.paymentStatus} label={p.paymentStatus} /></td>
              </tr>
            ))}
            {payrolls.length === 0 && <tr><td colSpan={7}><EmptyState title="No payroll data" /></td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function AttritionReport() {
  const [year, setYear] = useState(new Date().getFullYear())
  const { data, isLoading } = useQuery({ queryKey: ['report-attrition', year], queryFn: () => reportsApi.getAttrition({ year }) })
  const report = data?.data?.data
  if (isLoading) return <PageLoader />
  return (
    <div className="space-y-4">
      <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="rounded-md border-0 py-1.5 pl-3 pr-8 ring-1 ring-inset ring-gray-300 sm:text-sm">
        {[2023, 2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}</option>)}
      </select>
      {report && (
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg bg-white shadow p-4"><p className="text-xs text-gray-500">Resigned/Terminated</p><p className="text-3xl font-bold text-gray-900 mt-1">{report.resigned}</p></div>
          <div className="rounded-lg bg-white shadow p-4"><p className="text-xs text-gray-500">Total Employees</p><p className="text-3xl font-bold text-gray-900 mt-1">{report.totalEmployees}</p></div>
          <div className="rounded-lg bg-red-50 p-4"><p className="text-xs text-red-500">Attrition Rate</p><p className="text-3xl font-bold text-red-600 mt-1">{report.attritionRate}</p></div>
        </div>
      )}
      {report?.employees?.length > 0 && (
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Employee', 'Department', 'Designation', 'Leaving Date', 'Status'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {report.employees.map((e) => (
                <tr key={e.id}>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{e.firstName} {e.lastName}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{e.department?.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{e.designation?.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{e.dateOfLeaving ? format(new Date(e.dateOfLeaving), 'dd MMM yyyy') : '—'}</td>
                  <td className="px-4 py-3"><Badge status={e.employmentStatus} label={e.employmentStatus} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function NewJoinersReport() {
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())
  const { data, isLoading } = useQuery({ queryKey: ['report-joiners', month, year], queryFn: () => reportsApi.getNewJoiners({ month, year }) })
  const report = data?.data?.data
  if (isLoading) return <PageLoader />
  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="rounded-md border-0 py-1.5 pl-3 pr-8 ring-1 ring-inset ring-gray-300 sm:text-sm">
          {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="rounded-md border-0 py-1.5 pl-3 pr-8 ring-1 ring-inset ring-gray-300 sm:text-sm">
          {[2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      <div className="rounded-lg bg-primary-50 p-4 inline-flex items-center gap-3">
        <UserPlusIcon className="h-8 w-8 text-primary-600" />
        <div><p className="text-2xl font-bold text-primary-700">{report?.count || 0}</p><p className="text-xs text-primary-600">New joiners in {MONTHS[month - 1]} {year}</p></div>
      </div>
      {report?.employees?.length > 0 && (
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Employee', 'Department', 'Designation', 'Manager', 'Joining Date'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {report.employees.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{e.firstName} {e.lastName}<p className="text-xs text-gray-400">{e.employeeCode}</p></td>
                  <td className="px-4 py-3 text-sm text-gray-500">{e.department?.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{e.designation?.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{e.manager ? `${e.manager.firstName} ${e.manager.lastName}` : '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{e.dateOfJoining ? format(new Date(e.dateOfJoining), 'dd MMM yyyy') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('headcount')

  const reportComponents = {
    headcount:  <HeadcountReport />,
    attendance: <AttendanceReport />,
    payroll:    <PayrollReport />,
    attrition:  <AttritionReport />,
    newjoiners: <NewJoinersReport />,
    leaves:     <div className="text-sm text-gray-500 py-4">Leave report — see Leaves module for balance data.</div>,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-sm text-gray-500">Organisation-wide insights</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-x-6 overflow-x-auto" aria-label="Tabs">
          {TABS.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}>
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div>{reportComponents[activeTab]}</div>
    </div>
  )
}
