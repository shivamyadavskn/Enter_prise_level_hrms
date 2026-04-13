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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
          {user?.employee?.firstName || user?.email?.split('@')[0]}! 👋
        </h1>
        <p className="text-sm text-gray-500 mt-1">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
      </div>

      {/* Today's Attendance Quick Action */}
      <div className="rounded-lg bg-white shadow p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Today's Status</p>
            <div className="mt-1 flex items-center gap-3">
              <Badge status={today?.status || 'NOT_MARKED'} label={today?.status || 'Not Marked'} />
              {today?.clockIn && <span className="text-sm text-gray-500">In: {format(new Date(today.clockIn), 'h:mm a')}</span>}
              {today?.clockOut && <span className="text-sm text-gray-500">Out: {format(new Date(today.clockOut), 'h:mm a')}</span>}
            </div>
          </div>
          <Link to="/attendance" className="rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500">
            {today?.clockIn && !today?.clockOut ? 'Clock Out' : !today?.clockIn ? 'Clock In' : 'View Attendance'}
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      {isAdmin() && s && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Employees"    value={s.totalEmployees}  icon={UsersIcon}           color="blue"   />
          <StatCard title="Present Today"      value={s.presentToday}    icon={CheckCircleIcon}     color="green"  />
          <StatCard title="On Leave Today"     value={s.onLeaveToday}    icon={CalendarDaysIcon}    color="yellow" />
          <StatCard title="WFH Today"          value={s.wfhToday}        icon={ComputerDesktopIcon} color="purple" />
        </div>
      )}

      {isAdmin() && s && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <StatCard title="Pending Leave Approvals"        value={s.pendingApprovals?.leave}           icon={CalendarDaysIcon}         color="yellow" />
          <StatCard title="Pending WFH Approvals"         value={s.pendingApprovals?.wfh}             icon={ComputerDesktopIcon}      color="purple" />
          <StatCard title="Pending Regularizations"       value={s.pendingApprovals?.regularizations} icon={ExclamationCircleIcon}    color="red"    />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Leave Balance */}
        <div className="rounded-lg bg-white shadow">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-base font-semibold text-gray-900">Leave Balance ({new Date().getFullYear()})</h2>
            <Link to="/leaves" className="text-sm font-medium text-primary-600 hover:text-primary-500">View all</Link>
          </div>
          <div className="divide-y divide-gray-100">
            {balances.length === 0 && <p className="px-6 py-4 text-sm text-gray-500">No leave balance data</p>}
            {balances.map((b) => (
              <div key={b.id} className="flex items-center justify-between px-6 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{b.leaveType?.name}</p>
                  <p className="text-xs text-gray-500">{b.leaveType?.code}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{b.available} <span className="font-normal text-gray-500">days</span></p>
                  <p className="text-xs text-gray-500">Used: {b.consumed}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Approvals for Managers */}
        {isManager() && (
          <div className="rounded-lg bg-white shadow">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-base font-semibold text-gray-900">Pending Approvals</h2>
              <Link to="/leaves?status=PENDING" className="text-sm font-medium text-primary-600 hover:text-primary-500">View all</Link>
            </div>
            <div className="divide-y divide-gray-100">
              {pending.length === 0 && <p className="px-6 py-4 text-sm text-gray-500">No pending approvals</p>}
              {pending.map?.((l) => (
                <div key={l.id} className="flex items-center justify-between px-6 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {l.employee?.firstName} {l.employee?.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{l.leaveType?.name} · {l.totalDays} days</p>
                  </div>
                  <Badge status="PENDING" label="Pending" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Links */}
        {!isManager() && (
          <div className="rounded-lg bg-white shadow">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">Quick Actions</h2>
            </div>
            <div className="grid grid-cols-2 gap-4 p-6">
              {[
                { label: 'Apply Leave',    to: '/leaves',     icon: CalendarDaysIcon,    color: 'text-blue-600 bg-blue-50' },
                { label: 'Request WFH',    to: '/wfh',        icon: ComputerDesktopIcon, color: 'text-purple-600 bg-purple-50' },
                { label: 'View Payslip',   to: '/payroll',    icon: BanknotesIcon,       color: 'text-green-600 bg-green-50' },
                { label: 'My Attendance',  to: '/attendance', icon: ClockIcon,           color: 'text-yellow-600 bg-yellow-50' },
              ].map((a) => (
                <Link key={a.label} to={a.to} className="flex flex-col items-center gap-2 rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-colors">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${a.color}`}>
                    <a.icon className="h-6 w-6" />
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
