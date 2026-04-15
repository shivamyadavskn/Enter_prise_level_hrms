import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx'
import AppLayout from './layouts/AppLayout.jsx'
import PlatformLayout from './layouts/PlatformLayout.jsx'
import PlatformDashboardPage from './pages/platform/PlatformDashboardPage.jsx'
import PlatformSetupPage from './pages/platform/PlatformSetupPage.jsx'
import LoginPage from './pages/auth/LoginPage.jsx'
import DashboardPage from './pages/dashboard/DashboardPage.jsx'
import EmployeesPage from './pages/employees/EmployeesPage.jsx'
import EmployeeDetailPage from './pages/employees/EmployeeDetailPage.jsx'
import EmployeeFormPage from './pages/employees/EmployeeFormPage.jsx'
import LeavesPage from './pages/leaves/LeavesPage.jsx'
import AttendancePage from './pages/attendance/AttendancePage.jsx'
import WfhPage from './pages/wfh/WfhPage.jsx'
import PayrollPage from './pages/payroll/PayrollPage.jsx'
import PerformancePage from './pages/performance/PerformancePage.jsx'
import DocumentsPage from './pages/documents/DocumentsPage.jsx'
import NotificationsPage from './pages/notifications/NotificationsPage.jsx'
import DepartmentsPage from './pages/departments/DepartmentsPage.jsx'
import ReportsPage from './pages/reports/ReportsPage.jsx'
import HolidaysPage from './pages/holidays/HolidaysPage.jsx'
import DocumentGeneratorPage from './pages/documents/DocumentGeneratorPage.jsx'
import DesignationsPage from './pages/designations/DesignationsPage.jsx'
import MyProfilePage from './pages/profile/MyProfilePage.jsx'
import ApprovalsPage from './pages/approvals/ApprovalsPage.jsx'
import ReimbursementsPage from './pages/reimbursements/ReimbursementsPage.jsx'
import OnboardingPage from './pages/onboarding/OnboardingPage.jsx'
import RegisterPage from './pages/auth/RegisterPage.jsx'
import OrganisationSettingsPage from './pages/organisation/OrganisationSettingsPage.jsx'

function ProtectedRoute({ children }) {
  const { user, loading, activeOrg } = useAuth()
  if (loading) return <div className="flex h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" /></div>
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'PLATFORM_ADMIN' && !activeOrg) return <Navigate to="/platform" replace />
  return children
}

function PlatformRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" /></div>
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'PLATFORM_ADMIN') return <Navigate to="/" replace />
  return children
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (!['SUPER_ADMIN', 'ADMIN'].includes(user.role)) return <Navigate to="/" replace />
  return children
}

function ManagerRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (!['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(user.role)) return <Navigate to="/" replace />
  return children
}

function FinanceRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (!['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'FINANCE'].includes(user.role)) return <Navigate to="/" replace />
  return children
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) return <Navigate to={user.role === 'PLATFORM_ADMIN' ? '/platform' : '/'} replace />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/platform/setup" element={<PublicRoute><PlatformSetupPage /></PublicRoute>} />
      <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="employees" element={<ManagerRoute><EmployeesPage /></ManagerRoute>} />
        <Route path="employees/new" element={<AdminRoute><EmployeeFormPage /></AdminRoute>} />
        <Route path="employees/:id" element={<ManagerRoute><EmployeeDetailPage /></ManagerRoute>} />
        <Route path="departments" element={<AdminRoute><DepartmentsPage /></AdminRoute>} />
        <Route path="leaves" element={<LeavesPage />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="wfh" element={<WfhPage />} />
        <Route path="payroll" element={<PayrollPage />} />
        <Route path="performance" element={<PerformancePage />} />
        <Route path="documents" element={<DocumentsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="reports" element={<FinanceRoute><ReportsPage /></FinanceRoute>} />
        <Route path="holidays" element={<HolidaysPage />} />
        <Route path="documents/generate" element={<AdminRoute><DocumentGeneratorPage /></AdminRoute>} />
        <Route path="designations" element={<AdminRoute><DesignationsPage /></AdminRoute>} />
        <Route path="profile" element={<MyProfilePage />} />
        <Route path="approvals" element={<ManagerRoute><ApprovalsPage /></ManagerRoute>} />
        <Route path="reimbursements" element={<ReimbursementsPage />} />
        <Route path="onboarding" element={<OnboardingPage />} />
        <Route path="organisation" element={<AdminRoute><OrganisationSettingsPage /></AdminRoute>} />
      </Route>
      <Route path="/platform" element={<PlatformRoute><PlatformLayout /></PlatformRoute>}>
        <Route index element={<PlatformDashboardPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
