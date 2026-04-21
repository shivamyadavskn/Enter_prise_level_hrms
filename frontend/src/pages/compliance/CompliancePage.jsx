import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { complianceApi } from '../../api/index.js'
import { PageLoader } from '../../components/common/LoadingSpinner.jsx'
import { ShieldCheckIcon, ExclamationTriangleIcon, ExclamationCircleIcon, InformationCircleIcon, CheckCircleIcon, ArrowDownTrayIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

const SEV_STYLES = {
  critical: { bg: 'bg-red-50 border-red-200', icon: ExclamationCircleIcon, iconColor: 'text-red-600', badge: 'bg-red-100 text-red-700' },
  warning: { bg: 'bg-amber-50 border-amber-200', icon: ExclamationTriangleIcon, iconColor: 'text-amber-600', badge: 'bg-amber-100 text-amber-700' },
  info: { bg: 'bg-blue-50 border-blue-200', icon: InformationCircleIcon, iconColor: 'text-blue-600', badge: 'bg-blue-100 text-blue-700' },
  ok: { bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircleIcon, iconColor: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700' },
}

function ScoreRing({ score }) {
  const r = 54, c = 2 * Math.PI * r
  const offset = c - (score / 100) * c
  const color = score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444'
  return (
    <div className="relative inline-flex">
      <svg width={128} height={128} className="transform -rotate-90">
        <circle cx={64} cy={64} r={r} fill="none" stroke="#f3f4f6" strokeWidth={10} />
        <circle cx={64} cy={64} r={r} fill="none" stroke={color} strokeWidth={10}
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-1000" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black" style={{ color }}>{score}</span>
        <span className="text-xs text-gray-500 font-medium">/ 100</span>
      </div>
    </div>
  )
}

export default function CompliancePage() {
  const [expandedCheck, setExpandedCheck] = useState(null)
  const [tab, setTab] = useState('health')
  const [fileMonth, setFileMonth] = useState(new Date().getMonth() + 1)
  const [fileYear, setFileYear] = useState(new Date().getFullYear())

  const { data, isLoading } = useQuery({ queryKey: ['compliance-health'], queryFn: complianceApi.getHealth })
  const health = data?.data?.data

  const { data: ecrData, isLoading: ecrLoading, refetch: refetchEcr } = useQuery({
    queryKey: ['pf-ecr', fileMonth, fileYear],
    queryFn: () => complianceApi.getPfEcr({ month: fileMonth, year: fileYear }),
    enabled: tab === 'files',
  })
  const { data: ptData, refetch: refetchPt } = useQuery({
    queryKey: ['pt-challan', fileMonth, fileYear],
    queryFn: () => complianceApi.getPtChallan({ month: fileMonth, year: fileYear }),
    enabled: tab === 'files',
  })
  const { data: bankData, refetch: refetchBank } = useQuery({
    queryKey: ['bank-file', fileMonth, fileYear],
    queryFn: () => complianceApi.getBankFile({ month: fileMonth, year: fileYear }),
    enabled: tab === 'files',
  })

  const ecr = ecrData?.data?.data
  const pt = ptData?.data?.data
  const bank = bankData?.data?.data

  function downloadText(content, fileName) {
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = fileName; a.click()
    URL.revokeObjectURL(url)
    toast.success(`Downloaded ${fileName}`)
  }

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  if (isLoading) return <PageLoader />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compliance Dashboard</h1>
          <p className="text-sm text-gray-500">Monitor statutory compliance and generate filing documents</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {[{ id: 'health', label: 'Health Score', icon: ShieldCheckIcon }, { id: 'files', label: 'Compliance Files', icon: DocumentTextIcon }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.id ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'health' && health && (
        <>
          {/* Score Card */}
          <div className="rounded-2xl bg-white shadow-card border border-gray-100 p-8">
            <div className="flex items-center gap-10">
              <ScoreRing score={health.score} />
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 mb-1">Compliance Health Score</h2>
                <p className="text-sm text-gray-500 mb-4">{health.employeeCount} active employees &middot; {health.summary.total} checks performed</p>
                <div className="flex gap-4">
                  {[
                    { label: 'Passed', value: health.summary.passed, color: 'text-emerald-700 bg-emerald-50' },
                    { label: 'Critical', value: health.summary.critical, color: 'text-red-700 bg-red-50' },
                    { label: 'Warnings', value: health.summary.warnings, color: 'text-amber-700 bg-amber-50' },
                    { label: 'Info', value: health.summary.info, color: 'text-blue-700 bg-blue-50' },
                  ].map(s => (
                    <div key={s.label} className={`rounded-lg px-4 py-2 ${s.color}`}>
                      <p className="text-2xl font-black">{s.value}</p>
                      <p className="text-[11px] font-semibold">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Checks List */}
          <div className="space-y-3">
            {health.checks.map(check => {
              const sev = SEV_STYLES[check.severity] || SEV_STYLES.ok
              const Icon = sev.icon
              const isExpanded = expandedCheck === check.id
              return (
                <div key={check.id} className={`rounded-xl border ${sev.bg} overflow-hidden transition-all`}>
                  <button onClick={() => setExpandedCheck(isExpanded ? null : check.id)}
                    className="w-full flex items-center gap-3 px-5 py-4 text-left">
                    <Icon className={`h-5 w-5 flex-shrink-0 ${sev.iconColor}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${sev.badge}`}>{check.category}</span>
                        <h3 className="text-sm font-bold text-gray-900">{check.title}</h3>
                      </div>
                      <p className="text-sm text-gray-600 mt-0.5">{check.message}</p>
                    </div>
                    {check.status === 'pass' ? (
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-lg">PASS</span>
                    ) : (
                      <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded-lg">FAIL</span>
                    )}
                  </button>
                  {isExpanded && check.employees && (
                    <div className="px-5 pb-4 border-t border-gray-200/50">
                      <p className="text-xs font-semibold text-gray-500 mt-3 mb-2">Affected Employees ({check.employees.length})</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {check.employees.slice(0, 20).map(e => (
                          <div key={e.id} className="flex items-center gap-2 rounded-lg bg-white/70 px-3 py-2 text-sm">
                            <span className="font-mono text-[10px] text-gray-400">{e.code}</span>
                            <span className="text-gray-900 font-medium truncate">{e.name}</span>
                          </div>
                        ))}
                        {check.employees.length > 20 && <p className="text-xs text-gray-500 col-span-full">+{check.employees.length - 20} more</p>}
                      </div>
                      {check.action && (
                        <div className="mt-3 flex items-center gap-2 text-xs text-gray-700 bg-white/60 rounded-lg px-3 py-2">
                          <span className="font-bold">Recommended:</span> {check.action}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}

      {tab === 'files' && (
        <div className="space-y-6">
          <div className="flex gap-3 items-center">
            <select value={fileMonth} onChange={e => setFileMonth(Number(e.target.value))}
              className="rounded-lg border-0 py-2 pl-3 pr-8 text-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-500">
              {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <select value={fileYear} onChange={e => setFileYear(Number(e.target.value))}
              className="rounded-lg border-0 py-2 pl-3 pr-8 text-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-500">
              {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* PF ECR */}
            <div className="rounded-xl bg-white shadow-card border border-gray-100 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center"><DocumentTextIcon className="h-5 w-5 text-blue-600" /></div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">PF ECR File</h3>
                  <p className="text-xs text-gray-500">EPFO Electronic Challan</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-3">{ecr ? `${ecr.employeeCount} employees` : 'Loading…'}</p>
              <button onClick={() => { if (ecr?.ecrContent) downloadText(ecr.ecrContent, ecr.fileName) }}
                disabled={!ecr?.ecrContent}
                className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50">
                <ArrowDownTrayIcon className="h-4 w-4" /> Download ECR
              </button>
            </div>

            {/* PT Challan */}
            <div className="rounded-xl bg-white shadow-card border border-gray-100 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center"><DocumentTextIcon className="h-5 w-5 text-amber-600" /></div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">PT Challan</h3>
                  <p className="text-xs text-gray-500">Professional Tax Return</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1">{pt ? `${pt.employeeCount} employees` : 'Loading…'}</p>
              {pt && <p className="text-lg font-bold text-amber-700 mb-3">₹{pt.totalPt?.toLocaleString('en-IN')}</p>}
              <button onClick={() => {
                if (!pt?.entries?.length) return
                const csv = ['Name,Employee Code,Gross Salary,PT Amount', ...pt.entries.map(e => `${e.name},${e.code},${e.grossSalary},${e.ptAmount}`)].join('\n')
                downloadText(csv, `PT_Challan_${fileYear}_${String(fileMonth).padStart(2, '0')}.csv`)
              }} disabled={!pt?.entries?.length}
                className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-amber-700 disabled:opacity-50">
                <ArrowDownTrayIcon className="h-4 w-4" /> Download PT Data
              </button>
            </div>

            {/* Bank File */}
            <div className="rounded-xl bg-white shadow-card border border-gray-100 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center"><DocumentTextIcon className="h-5 w-5 text-emerald-600" /></div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Salary Bank File</h3>
                  <p className="text-xs text-gray-500">NEFT / RTGS Payment File</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1">{bank ? `${bank.employeeCount} employees` : 'Loading…'}</p>
              {bank && <p className="text-lg font-bold text-emerald-700 mb-1">₹{bank.totalAmount?.toLocaleString('en-IN')}</p>}
              {bank?.missingBankDetails > 0 && <p className="text-xs text-red-600 mb-2">⚠ {bank.missingBankDetails} missing bank details</p>}
              <button onClick={() => {
                if (!bank?.entries?.length) return
                const csv = ['Name,Account No,IFSC,Bank,Amount,Employee Code', ...bank.entries.map(e => `${e.name},${e.accountNumber},${e.ifsc},${e.bankName},${e.amount},${e.employeeCode}`)].join('\n')
                downloadText(csv, `Bank_Payment_${fileYear}_${String(fileMonth).padStart(2, '0')}.csv`)
              }} disabled={!bank?.entries?.length}
                className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50">
                <ArrowDownTrayIcon className="h-4 w-4" /> Download Bank File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
