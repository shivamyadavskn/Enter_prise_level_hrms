import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx'
import AppLayout from './layouts/AppLayout.jsx'
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

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" /></div>
  if (!user) return <Navigate to="/login" replace />
  return children
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) return <Navigate to="/" replace />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="employees" element={<EmployeesPage />} />
        <Route path="employees/new" element={<EmployeeFormPage />} />
        <Route path="employees/:id" element={<EmployeeDetailPage />} />
        <Route path="departments" element={<DepartmentsPage />} />
        <Route path="leaves" element={<LeavesPage />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="wfh" element={<WfhPage />} />
        <Route path="payroll" element={<PayrollPage />} />
        <Route path="performance" element={<PerformancePage />} />
        <Route path="documents" element={<DocumentsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="holidays" element={<HolidaysPage />} />
        <Route path="documents/generate" element={<DocumentGeneratorPage />} />
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
