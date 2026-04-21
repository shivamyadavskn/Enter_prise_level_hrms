import api from './axios.js'

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (data) => api.post('/auth/login', data),
  logout: (refreshToken) => api.post('/auth/logout', { refreshToken }),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  me: () => api.get('/auth/me'),
  changePassword: (data) => api.put('/auth/change-password', data),
}

// ── Platform (Super-Admin god mode) ───────────────────────────────────────────
export const platformApi = {
  seed: (data) => api.post('/platform/seed', data),
  stats: () => api.get('/platform/stats'),
  listOrgs: (params) => api.get('/platform/organisations', { params }),
  getOrg: (id) => api.get(`/platform/organisations/${id}`),
  toggleOrg: (id) => api.patch(`/platform/organisations/${id}/toggle`),
}

// ── Organisation ──────────────────────────────────────────────────────────────
export const organisationApi = {
  register: (data) => api.post('/organisation/register', data),
  get: () => api.get('/organisation'),
  update: (data) => api.put('/organisation', data),
}

// ── Users ─────────────────────────────────────────────────────────────────────
export const usersApi = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  toggleActive: (id) => api.patch(`/users/${id}/toggle-active`),
}

// ── Employees ─────────────────────────────────────────────────────────────────
export const employeesApi = {
  getAll: (params) => api.get('/employees', { params }),
  getById: (id) => api.get(`/employees/${id}`),
  getMe: () => api.get('/employees/me'),
  getTeam: () => api.get('/employees/team'),
  create: (data) => api.post('/employees', data),
  update: (id, data) => api.put(`/employees/${id}`, data),
  delete: (id) => api.delete(`/employees/${id}`),
  getExperiences: (id) => api.get(`/employees/${id}/experience`),
  addExperience: (id, data) => api.post(`/employees/${id}/experience`, data),
  updateExperience: (id, expId, data) => api.put(`/employees/${id}/experience/${expId}`, data),
  deleteExperience: (id, expId) => api.delete(`/employees/${id}/experience/${expId}`),
  getEducations: (id) => api.get(`/employees/${id}/education`),
  addEducation: (id, data) => api.post(`/employees/${id}/education`, data),
  updateEducation: (id, eduId, data) => api.put(`/employees/${id}/education/${eduId}`, data),
  deleteEducation: (id, eduId) => api.delete(`/employees/${id}/education/${eduId}`),
  importPreview: (file) => { const fd = new FormData(); fd.append('file', file); return api.post('/employees/import/preview', fd) },
  importExecute: (file, columnMapping) => { const fd = new FormData(); fd.append('file', file); fd.append('columnMapping', JSON.stringify(columnMapping)); return api.post('/employees/import/execute', fd) },
}

// ── Departments ───────────────────────────────────────────────────────────────
export const departmentsApi = {
  getAll: (params) => api.get('/departments', { params }),
  getById: (id) => api.get(`/departments/${id}`),
  create: (data) => api.post('/departments', data),
  update: (id, data) => api.put(`/departments/${id}`, data),
  delete: (id) => api.delete(`/departments/${id}`),
}

// ── Designations ──────────────────────────────────────────────────────────────
export const designationsApi = {
  getAll: (params) => api.get('/designations', { params }),
  create: (data) => api.post('/designations', data),
  update: (id, data) => api.put(`/designations/${id}`, data),
  delete: (id) => api.delete(`/designations/${id}`),
}

// ── Leaves ────────────────────────────────────────────────────────────────────
export const leavesApi = {
  getAll: (params) => api.get('/leaves', { params }),
  getById: (id) => api.get(`/leaves/${id}`),
  apply: (data) => api.post('/leaves/apply', data),
  approve: (id, data) => api.patch(`/leaves/${id}/approve`, data),
  reject: (id, data) => api.patch(`/leaves/${id}/reject`, data),
  cancel: (id) => api.patch(`/leaves/${id}/cancel`),
  getBalance: (params) => api.get('/leaves/balance', { params }),
  adjustBalance: (data) => api.post('/leaves/balance/adjust', data),
  getTypes: () => api.get('/leaves/types'),
  createType: (data) => api.post('/leaves/types', data),
  updateType: (id, data) => api.put(`/leaves/types/${id}`, data),
  allocateBulk: (data) => api.post('/leaves/allocate-bulk', data),
}

// ── Attendance ────────────────────────────────────────────────────────────────
export const attendanceApi = {
  clockIn: (data) => api.post('/attendance/clock-in', data),
  clockOut: (data) => api.post('/attendance/clock-out', data),
  getToday: () => api.get('/attendance/today'),
  getAll: (params) => api.get('/attendance', { params }),
  getSummary: (params) => api.get('/attendance/summary', { params }),
  markManual: (data) => api.post('/attendance/manual', data),
  applyRegularization: (data) => api.post('/attendance/regularize', data),
  getRegularizations: () => api.get('/attendance/regularize'),
  approveRegularization: (id, data) => api.patch(`/attendance/regularize/${id}/approve`, data),
  rejectRegularization: (id, data) => api.patch(`/attendance/regularize/${id}/reject`, data),
}

// ── WFH ───────────────────────────────────────────────────────────────────────
export const wfhApi = {
  getAll: (params) => api.get('/wfh', { params }),
  getById: (id) => api.get(`/wfh/${id}`),
  apply: (data) => api.post('/wfh/apply', data),
  approve: (id) => api.patch(`/wfh/${id}/approve`),
  reject: (id, data) => api.patch(`/wfh/${id}/reject`, data),
  cancel: (id) => api.patch(`/wfh/${id}/cancel`),
}

// ── Payroll ───────────────────────────────────────────────────────────────────
export const payrollApi = {
  getAll: (params) => api.get('/payroll', { params }),
  getById: (id) => api.get(`/payroll/${id}`),
  getMyPayslips: () => api.get('/payroll/my-payslips'),
  getSummary: (params) => api.get('/payroll/summary', { params }),
  process: (data) => api.post('/payroll/process', data),
  updateStatus: (id, data) => api.patch(`/payroll/${id}/payment-status`, data),
  getSalaryStructure: (empId) => api.get(`/payroll/salary-structure/${empId}`),
  getMissingSalary: () => api.get('/payroll/salary-structure/missing'),
  upsertSalaryStructure: (data) => api.post('/payroll/salary-structure', data),
  updateSalaryStructure: (data) => api.put('/payroll/salary-structure', data),
  getSalaryRevisions: (empId, params) => api.get(`/payroll/salary-structure/${empId}/revisions`, { params }),
  bulkUpdatePaymentStatus: (data) => api.patch('/payroll/bulk-payment', data),
}

// ── Holidays ──────────────────────────────────────────────────────────────────
export const holidaysApi = {
  getAll: (params) => api.get('/holidays', { params }),
  create: (data) => api.post('/holidays', data),
  update: (id, data) => api.put(`/holidays/${id}`, data),
  delete: (id) => api.delete(`/holidays/${id}`),
}

// ── Performance ───────────────────────────────────────────────────────────────
export const performanceApi = {
  getAll: (params) => api.get('/performance', { params }),
  getById: (id) => api.get(`/performance/${id}`),
  create: (data) => api.post('/performance', data),
  selfAppraisal: (id, data) => api.patch(`/performance/${id}/self-appraisal`, data),
  managerAppraisal: (id, data) => api.patch(`/performance/${id}/manager-appraisal`, data),
  acknowledge: (id) => api.patch(`/performance/${id}/acknowledge`),
}

// ── Documents ─────────────────────────────────────────────────────────────────
export const documentsApi = {
  getAll: (params) => api.get('/documents', { params }),
  getById: (id) => api.get(`/documents/${id}`),
  upload: (formData) => api.post('/documents/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/documents/${id}`),
  downloadUrl: (id) => `/api/documents/${id}/download`,
}

// ── Notifications ─────────────────────────────────────────────────────────────
export const notificationsApi = {
  getAll: (params) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
  clearAll: () => api.delete('/notifications/clear-all'),
}

// ── Reimbursements ────────────────────────────────────────────────────────────
export const reimbursementsApi = {
  getAll: (params) => api.get('/reimbursements', { params }),
  create: (data) => api.post('/reimbursements', data),
  approve: (id) => api.patch(`/reimbursements/${id}/approve`),
  reject: (id, data) => api.patch(`/reimbursements/${id}/reject`, data),
}

// ── Onboarding ────────────────────────────────────────────────────────────────
export const onboardingApi = {
  getTasks: () => api.get('/onboarding/tasks'),
  createTask: (data) => api.post('/onboarding/tasks', data),
  updateTask: (id, data) => api.put(`/onboarding/tasks/${id}`, data),
  deleteTask: (id) => api.delete(`/onboarding/tasks/${id}`),
  getMyChecklist: () => api.get('/onboarding/my'),
  getAllChecklists: (params) => api.get('/onboarding/all', { params }),
  getEmployeeChecklist: (empId) => api.get(`/onboarding/${empId}`),
  initChecklist: (empId) => api.post(`/onboarding/${empId}/init`),
  updateItem: (id, data) => api.patch(`/onboarding/item/${id}`, data),
}

// ── Reports ───────────────────────────────────────────────────────────────────
export const reportsApi = {
  getDashboard: () => api.get('/reports/dashboard'),
  getHeadcount: (params) => api.get('/reports/headcount', { params }),
  getAttendance: (params) => api.get('/reports/attendance', { params }),
  getLeaves: (params) => api.get('/reports/leaves', { params }),
  getPayroll: (params) => api.get('/reports/payroll', { params }),
  getAttrition: (params) => api.get('/reports/attrition', { params }),
  getNewJoiners: (params) => api.get('/reports/new-joiners', { params }),
}

// ── Permissions & Roles ───────────────────────────────────────────────────────
export const permissionsApi = {
  getAll: () => api.get('/permissions'),
  getRolePermissions: (role) => api.get(`/permissions/roles/${role}`),
  updateRolePermission: (data) => api.put('/permissions/roles', data),
  bulkUpdateRolePermissions: (data) => api.put('/permissions/roles/bulk', data),
  seedDefaults: () => api.post('/permissions/seed'),
  getDefaults: () => api.get('/permissions/defaults'),
  getRoleMatrix: () => api.get('/permissions/roles/matrix'),
}

// ── Custom Roles (Dynamic, per-organisation) ──────────────────────────────────
export const customRolesApi = {
  getAll: () => api.get('/custom-roles'),
  getById: (id) => api.get(`/custom-roles/${id}`),
  create: (data) => api.post('/custom-roles', data),
  update: (id, data) => api.put(`/custom-roles/${id}`, data),
  delete: (id) => api.delete(`/custom-roles/${id}`),
  assignToEmployee: (data) => api.post('/custom-roles/assign', data),
  getAvailablePermissions: () => api.get('/custom-roles/available-permissions'),
}
