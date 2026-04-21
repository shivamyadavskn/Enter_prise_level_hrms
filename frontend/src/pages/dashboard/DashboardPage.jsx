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

  const greeting = new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'
  const firstName = user?.employee?.firstName || user?.email?.split('@')[0]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 via-primary-700 to-indigo-800 p-6 lg:p-8 text-white">
        <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-white/5" />
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/5" />
        <div className="relative z-10">
          <p className="text-primary-200 text-sm font-medium">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
          <h1 className="mt-1 text-2xl lg:text-3xl font-bold tracking-tight">
            Good {greeting}, {firstName}!
          </h1>
          <p className="mt-2 text-primary-200 text-sm max-w-lg">
            Here's your daily overview. Stay on top of your tasks and team activities.
          </p>
        </div>

        {/* Attendance Quick Action */}
        <div className="relative z-10 mt-5 flex items-center gap-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 p-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-white/70">Today's Status</p>
            <div className="mt-1 flex items-center gap-3">
              <Badge status={today?.status || 'NOT_MARKED'} label={today?.status || 'Not Marked'} />
              {today?.clockIn && <span className="text-sm text-white/70">In: {format(new Date(today.clockIn), 'h:mm a')}</span>}
              {today?.clockOut && <span className="text-sm text-white/70">Out: {format(new Date(today.clockOut), 'h:mm a')}</span>}
            </div>
          </div>
          <Link to="/attendance" className="rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-primary-700 shadow-sm hover:bg-primary-50 transition-colors whitespace-nowrap">
            {today?.clockIn && !today?.clockOut ? 'Clock Out' : !today?.clockIn ? 'Clock In' : 'View Attendance'}
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      {isAdmin() && s && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Employees"    value={s.totalEmployees}  icon={UsersIcon}           color="blue"   />
          <StatCard title="Present Today"      value={s.presentToday}    icon={CheckCircleIcon}     color="green"  />
          <StatCard title="On Leave Today"     value={s.onLeaveToday}    icon={CalendarDaysIcon}    color="yellow" />
          <StatCard title="WFH Today"          value={s.wfhToday}        icon={ComputerDesktopIcon} color="purple" />
        </div>
      )}

      {isAdmin() && s && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard title="Pending Leave Approvals"        value={s.pendingApprovals?.leave}           icon={CalendarDaysIcon}         color="yellow" />
          <StatCard title="Pending WFH Approvals"         value={s.pendingApprovals?.wfh}             icon={ComputerDesktopIcon}      color="purple" />
          <StatCard title="Pending Regularizations"       value={s.pendingApprovals?.regularizations} icon={ExclamationCircleIcon}    color="red"    />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Leave Balance */}
        <div className="rounded-xl bg-white border border-gray-100 shadow-card overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-base font-semibold text-gray-900">Leave Balance <span className="text-gray-400 font-normal">({new Date().getFullYear()})</span></h2>
            <Link to="/leaves" className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors">View all</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {balances.length === 0 && (
              <div className="px-6 py-8 text-center">
                <CalendarDaysIcon className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No leave balance data</p>
              </div>
            )}
            {balances.map((b) => (
              <div key={b.id} className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50/50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-gray-900">{b.leaveType?.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{b.leaveType?.code}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{b.available} <span className="font-normal text-gray-400 text-xs">days</span></p>
                  <p className="text-xs text-gray-400">Used: {b.consumed}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Approvals for Managers */}
        {isManager() && (
          <div className="rounded-xl bg-white border border-gray-100 shadow-card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-base font-semibold text-gray-900">Pending Approvals</h2>
              <Link to="/leaves?status=PENDING" className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors">View all</Link>
            </div>
            <div className="divide-y divide-gray-50">
              {pending.length === 0 && (
                <div className="px-6 py-8 text-center">
                  <CheckCircleIcon className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">All caught up!</p>
                </div>
              )}
              {pending.map?.((l) => (
                <div key={l.id} className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50/50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {l.employee?.firstName} {l.employee?.lastName}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{l.leaveType?.name} · {l.totalDays} days</p>
                  </div>
                  <Badge status="PENDING" label="Pending" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Links */}
        {!isManager() && (
          <div className="rounded-xl bg-white border border-gray-100 shadow-card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">Quick Actions</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 p-5">
              {[
                { label: 'Apply Leave',    to: '/leaves',     icon: CalendarDaysIcon,    bg: 'bg-blue-50 hover:bg-blue-100', iconColor: 'text-blue-600' },
                { label: 'Request WFH',    to: '/wfh',        icon: ComputerDesktopIcon, bg: 'bg-purple-50 hover:bg-purple-100', iconColor: 'text-purple-600' },
                { label: 'View Payslip',   to: '/payroll',    icon: BanknotesIcon,       bg: 'bg-emerald-50 hover:bg-emerald-100', iconColor: 'text-emerald-600' },
                { label: 'My Attendance',  to: '/attendance', icon: ClockIcon,           bg: 'bg-amber-50 hover:bg-amber-100', iconColor: 'text-amber-600' },
              ].map((a) => (
                <Link key={a.label} to={a.to} className={`flex flex-col items-center gap-2.5 rounded-xl p-4 transition-all duration-150 ${a.bg}`}>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm ${a.iconColor}`}>
                    <a.icon className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{a.label}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
