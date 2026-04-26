import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx'
import AppLayout from './layouts/AppLayout.jsx'
import PlatformLayout from './layouts/PlatformLayout.jsx'
import PageLoader from './components/common/PageLoader.jsx'

// Eagerly load auth + landing (critical path; small + always needed)
import LoginPage from './pages/auth/LoginPage.jsx'
import RegisterPage from './pages/auth/RegisterPage.jsx'
import LandingPage from './pages/landing/LandingPage.jsx'

// Lazy-load every other page so initial bundle stays small.
// Each becomes its own JS chunk fetched on first navigation to that route.
const PlatformDashboardPage      = lazy(() => import('./pages/platform/PlatformDashboardPage.jsx'))
const PlatformSetupPage          = lazy(() => import('./pages/platform/PlatformSetupPage.jsx'))
const DashboardPage              = lazy(() => import('./pages/dashboard/DashboardPage.jsx'))
const EmployeesPage              = lazy(() => import('./pages/employees/EmployeesPage.jsx'))
const EmployeeDetailPage         = lazy(() => import('./pages/employees/EmployeeDetailPage.jsx'))
const EmployeeFormPage           = lazy(() => import('./pages/employees/EmployeeFormPage.jsx'))
const LeavesPage                 = lazy(() => import('./pages/leaves/LeavesPage.jsx'))
const AttendancePage             = lazy(() => import('./pages/attendance/AttendancePage.jsx'))
const WfhPage                    = lazy(() => import('./pages/wfh/WfhPage.jsx'))
const PayrollPage                = lazy(() => import('./pages/payroll/PayrollPage.jsx'))
const PerformancePage            = lazy(() => import('./pages/performance/PerformancePage.jsx'))
const DocumentsPage              = lazy(() => import('./pages/documents/DocumentsPage.jsx'))
const NotificationsPage          = lazy(() => import('./pages/notifications/NotificationsPage.jsx'))
const DepartmentsPage            = lazy(() => import('./pages/departments/DepartmentsPage.jsx'))
const ReportsPage                = lazy(() => import('./pages/reports/ReportsPage.jsx'))
const HolidaysPage               = lazy(() => import('./pages/holidays/HolidaysPage.jsx'))
const DocumentGeneratorPage      = lazy(() => import('./pages/documents/DocumentGeneratorPage.jsx'))
const DesignationsPage           = lazy(() => import('./pages/designations/DesignationsPage.jsx'))
const MyProfilePage              = lazy(() => import('./pages/profile/MyProfilePage.jsx'))
const ApprovalsPage              = lazy(() => import('./pages/approvals/ApprovalsPage.jsx'))
const ReimbursementsPage         = lazy(() => import('./pages/reimbursements/ReimbursementsPage.jsx'))
const OnboardingPage             = lazy(() => import('./pages/onboarding/OnboardingPage.jsx'))
const OrganisationSettingsPage   = lazy(() => import('./pages/organisation/OrganisationSettingsPage.jsx'))
const RolesPermissionsPage       = lazy(() => import('./pages/permissions/RolesPermissionsPage.jsx'))
const AnnouncementsPage          = lazy(() => import('./pages/announcements/AnnouncementsPage.jsx'))
const AssetsPage                 = lazy(() => import('./pages/assets/AssetsPage.jsx'))
const PulseSurveyPage            = lazy(() => import('./pages/pulse/PulseSurveyPage.jsx'))
const AuditLogsPage              = lazy(() => import('./pages/audit/AuditLogsPage.jsx'))
const LettersPage                = lazy(() => import('./pages/letters/LettersPage.jsx'))
const CompliancePage             = lazy(() => import('./pages/compliance/CompliancePage.jsx'))
const SeparationPage             = lazy(() => import('./pages/separation/SeparationPage.jsx'))

function ProtectedRoute({ children }) {
  const { user, loading, activeOrg } = useAuth()
  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/welcome" replace />
  if (user.role === 'PLATFORM_ADMIN' && !activeOrg) return <Navigate to="/platform" replace />
  return children
}

function PlatformRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'PLATFORM_ADMIN') return <Navigate to="/" replace />
  return children
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (!['SUPER_ADMIN', 'ADMIN', 'HR'].includes(user.role)) return <Navigate to="/" replace />
  return children
}

function ManagerRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (!['SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER'].includes(user.role)) return <Navigate to="/" replace />
  return children
}

function FinanceRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (!['SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER', 'FINANCE'].includes(user.role)) return <Navigate to="/" replace />
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
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/welcome" element={<LandingPage />} />
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
          <Route path="announcements" element={<AnnouncementsPage />} />
          <Route path="assets" element={<AdminRoute><AssetsPage /></AdminRoute>} />
          <Route path="pulse" element={<PulseSurveyPage />} />
          <Route path="audit-logs" element={<AdminRoute><AuditLogsPage /></AdminRoute>} />
          <Route path="organisation" element={<AdminRoute><OrganisationSettingsPage /></AdminRoute>} />
          <Route path="roles" element={<AdminRoute><RolesPermissionsPage /></AdminRoute>} />
          <Route path="letters" element={<AdminRoute><LettersPage /></AdminRoute>} />
          <Route path="compliance" element={<FinanceRoute><CompliancePage /></FinanceRoute>} />
          <Route path="separation" element={<AdminRoute><SeparationPage /></AdminRoute>} />
        </Route>
        <Route path="/platform" element={<PlatformRoute><PlatformLayout /></PlatformRoute>}>
          <Route index element={<PlatformDashboardPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
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
