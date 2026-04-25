import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { reportsApi, attendanceApi, leavesApi } from '../../api/index.js'
import { useAuth } from '../../contexts/AuthContext.jsx'
import StatCard from '../../components/common/StatCard.jsx'
import Badge from '../../components/common/Badge.jsx'
import { PageLoader } from '../../components/common/LoadingSpinner.jsx'
import {
  UsersIcon, CalendarDaysIcon, ClockIcon, ComputerDesktopIcon,
  CheckCircleIcon, ExclamationCircleIcon, BanknotesIcon,
  ArrowRightIcon, PlayIcon, StopIcon, ChevronRightIcon,
  CurrencyDollarIcon, DocumentTextIcon, MegaphoneIcon,
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'

export default function DashboardPage() {
  const { user, isAdmin, isManager } = useAuth()

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => reportsApi.getDashboard(),
  })
  const { data: todayAtt } = useQuery({
    queryKey: ['today-attendance'],
    queryFn: () => attendanceApi.getToday(),
  })
  const { data: leaveBalance } = useQuery({
    queryKey: ['leave-balance'],
    queryFn: () => leavesApi.getBalance({ year: new Date().getFullYear() }),
  })
  const { data: pendingLeaves } = useQuery({
    queryKey: ['pending-leaves'],
    queryFn: () => leavesApi.getAll({ status: 'PENDING', limit: 5 }),
    enabled: isManager(),
  })

  const s = stats?.data?.data
  const today = todayAtt?.data?.data
  const balances = leaveBalance?.data?.data || []
  const pending = pendingLeaves?.data?.data || []

  if (statsLoading) return <PageLoader />

  const hr = new Date().getHours()
  const greeting = hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = user?.employee?.firstName || user?.email?.split('@')[0]

  // Clocked in but not out
  const isClockedIn = today?.clockIn && !today?.clockOut

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ─── Page Header ─────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <p className="text-eyebrow mb-1.5">{format(new Date(), 'EEEE · MMMM d, yyyy')}</p>
          <h1 className="page-title">{greeting}, {firstName}</h1>
          <p className="page-subtitle">Here's what's happening across your organization today.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/attendance" className="btn-secondary">
            {isClockedIn ? <><StopIcon className="h-4 w-4 text-red-500" /> Clock Out</> : !today?.clockIn ? <><PlayIcon className="h-4 w-4 text-emerald-600" /> Clock In</> : <><ClockIcon className="h-4 w-4" /> Attendance</>}
          </Link>
          {isAdmin() && (
            <Link to="/employees/new" className="btn-primary">
              <UsersIcon className="h-4 w-4" /> Add Employee
            </Link>
          )}
        </div>
      </div>

      {/* ─── Today's Status Strip ────────────────────────────────── */}
      <div className="card flex flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className={`relative flex h-2.5 w-2.5 ${isClockedIn ? '' : 'opacity-40'}`}>
            {isClockedIn && <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />}
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isClockedIn ? 'bg-emerald-500' : 'bg-ink-300'}`} />
          </div>
          <div>
            <p className="text-2xs font-semibold uppercase tracking-wider text-ink-500">Status</p>
            <p className="text-sm font-semibold text-ink-900">
              {isClockedIn ? 'On the clock' : today?.clockOut ? 'Day complete' : 'Not clocked in'}
            </p>
          </div>
        </div>
        <div className="h-8 w-px bg-ink-200" />
        <div>
          <p className="text-2xs font-semibold uppercase tracking-wider text-ink-500">Clock In</p>
          <p className="text-sm font-semibold text-ink-900 num-tabular">{today?.clockIn ? format(new Date(today.clockIn), 'h:mm a') : '—'}</p>
        </div>
        <div>
          <p className="text-2xs font-semibold uppercase tracking-wider text-ink-500">Clock Out</p>
          <p className="text-sm font-semibold text-ink-900 num-tabular">{today?.clockOut ? format(new Date(today.clockOut), 'h:mm a') : '—'}</p>
        </div>
        {today?.status && (
          <>
            <div className="h-8 w-px bg-ink-200" />
            <div>
              <p className="text-2xs font-semibold uppercase tracking-wider text-ink-500">Marked As</p>
              <Badge status={today?.status} label={today?.status} />
            </div>
          </>
        )}
      </div>

      {/* ─── KPI Cards (Admin/Manager) ───────────────────────────── */}
      {isAdmin() && s && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="page-section-title">Today at a glance</h2>
            <Link to="/reports" className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1">
              Detailed reports <ArrowRightIcon className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total Employees" value={s.totalEmployees}  icon={UsersIcon}           color="primary" />
            <StatCard title="Present Today"   value={s.presentToday}    icon={CheckCircleIcon}     color="green" subtitle={`/ ${s.totalEmployees ?? 0}`} />
            <StatCard title="On Leave"        value={s.onLeaveToday}    icon={CalendarDaysIcon}    color="yellow" />
            <StatCard title="Working from Home" value={s.wfhToday}      icon={ComputerDesktopIcon} color="purple" />
          </div>
        </div>
      )}

      {/* ─── Pending Approvals ─────────────────────────────────── */}
      {isAdmin() && s && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <PendingTile label="Leave Approvals"      count={s.pendingApprovals?.leave}            to="/approvals" icon={CalendarDaysIcon}    color="yellow" />
          <PendingTile label="WFH Requests"          count={s.pendingApprovals?.wfh}              to="/approvals" icon={ComputerDesktopIcon} color="purple" />
          <PendingTile label="Regularizations"       count={s.pendingApprovals?.regularizations}  to="/approvals" icon={ExclamationCircleIcon} color="red" />
        </div>
      )}

      {/* ─── Two-Column Layout ────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">

        {/* Leave Balance — col 1 */}
        <div className="card overflow-hidden lg:col-span-1">
          <div className="card-header">
            <div>
              <h3 className="card-header-title">Leave Balance</h3>
              <p className="text-xs text-ink-500 mt-0.5">FY {new Date().getFullYear()}</p>
            </div>
            <Link to="/leaves" className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-0.5">
              View <ChevronRightIcon className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-ink-100">
            {balances.length === 0 && (
              <div className="px-5 py-12 text-center">
                <CalendarDaysIcon className="h-8 w-8 text-ink-200 mx-auto mb-2" />
                <p className="text-sm text-ink-400">No leave balance yet</p>
              </div>
            )}
            {balances.map((b) => {
              const total = (b.openingBalance || 0) + (b.accrued || 0)
              const pct = total > 0 ? Math.min(100, ((b.consumed || 0) / total) * 100) : 0
              return (
                <div key={b.id} className="px-5 py-3.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink-900 truncate">{b.leaveType?.name}</p>
                      <p className="text-2xs uppercase tracking-wider text-ink-400">{b.leaveType?.code}</p>
                    </div>
                    <p className="text-sm font-semibold text-ink-900 num-tabular shrink-0">
                      {b.available} <span className="text-xs font-normal text-ink-400">/ {total}</span>
                    </p>
                  </div>
                  <div className="h-1 w-full bg-ink-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Pending Approvals — col 2 (managers) */}
        {isManager() ? (
          <div className="card overflow-hidden lg:col-span-2">
            <div className="card-header">
              <div>
                <h3 className="card-header-title">Pending Approvals</h3>
                <p className="text-xs text-ink-500 mt-0.5">Items waiting for your action</p>
              </div>
              <Link to="/approvals" className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-0.5">
                Review all <ChevronRightIcon className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="divide-y divide-ink-100">
              {pending.length === 0 && (
                <div className="px-5 py-12 text-center">
                  <CheckCircleIcon className="h-8 w-8 text-emerald-200 mx-auto mb-2" />
                  <p className="text-sm font-medium text-ink-700">All caught up</p>
                  <p className="text-xs text-ink-400 mt-0.5">No pending approvals.</p>
                </div>
              )}
              {pending.map((l) => (
                <div key={l.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-ink-50/60">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold shrink-0">
                      {(l.employee?.firstName?.[0] || '?').toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink-900 truncate">
                        {l.employee?.firstName} {l.employee?.lastName}
                      </p>
                      <p className="text-xs text-ink-500 mt-0.5">
                        {l.leaveType?.name} · <span className="num-tabular">{l.totalDays}</span> days
                      </p>
                    </div>
                  </div>
                  <span className="badge-warning">Pending</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Quick Actions — col 2 (employees) */
          <div className="card overflow-hidden lg:col-span-2">
            <div className="card-header">
              <h3 className="card-header-title">Quick Actions</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-4">
              {[
                { label: 'Apply Leave',     to: '/leaves',         icon: CalendarDaysIcon,    color: 'primary' },
                { label: 'Request WFH',     to: '/wfh',            icon: ComputerDesktopIcon, color: 'purple' },
                { label: 'View Payslip',    to: '/payroll',        icon: BanknotesIcon,       color: 'green' },
                { label: 'Reimbursement',   to: '/reimbursements', icon: CurrencyDollarIcon,  color: 'yellow' },
                { label: 'My Documents',    to: '/documents',      icon: DocumentTextIcon,    color: 'indigo' },
                { label: 'Attendance',      to: '/attendance',     icon: ClockIcon,           color: 'red' },
                { label: 'Announcements',   to: '/announcements',  icon: MegaphoneIcon,       color: 'slate' },
                { label: 'Profile',         to: '/profile',        icon: UsersIcon,           color: 'blue' },
              ].map((a) => {
                const tints = {
                  primary: 'bg-primary-50 text-primary-600',
                  purple:  'bg-purple-50 text-purple-600',
                  green:   'bg-emerald-50 text-emerald-600',
                  yellow:  'bg-amber-50 text-amber-600',
                  indigo:  'bg-indigo-50 text-indigo-600',
                  red:     'bg-red-50 text-red-600',
                  slate:   'bg-ink-100 text-ink-600',
                  blue:    'bg-sky-50 text-sky-600',
                }
                return (
                  <Link
                    key={a.label}
                    to={a.to}
                    className="group flex flex-col items-center justify-center gap-2 rounded-lg border border-ink-200/70 bg-white p-3 hover:border-primary-200 hover:bg-primary-50/30 transition-all"
                  >
                    <div className={`flex h-9 w-9 items-center justify-center rounded-md ${tints[a.color]}`}>
                      <a.icon className="h-4.5 w-4.5" />
                    </div>
                    <span className="text-xs font-semibold text-ink-700 text-center group-hover:text-primary-700">{a.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Sub-component ─────────────────────────────────────────── */
function PendingTile({ label, count, to, icon: Icon, color }) {
  const tints = {
    yellow: 'bg-amber-50 text-amber-700 ring-amber-200',
    purple: 'bg-purple-50 text-purple-700 ring-purple-200',
    red:    'bg-red-50 text-red-700 ring-red-200',
  }
  return (
    <Link to={to} className="group card-hover p-4 flex items-center gap-3">
      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ring-1 ring-inset ${tints[color] || tints.yellow}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-2xs uppercase tracking-wider font-semibold text-ink-500">{label}</p>
        <p className="font-display text-2xl font-semibold tracking-tight text-ink-900 num-tabular leading-none mt-1">
          {count ?? 0}
        </p>
      </div>
      <ChevronRightIcon className="h-4 w-4 text-ink-300 group-hover:text-ink-500 group-hover:translate-x-0.5 transition-all" />
    </Link>
  )
}
