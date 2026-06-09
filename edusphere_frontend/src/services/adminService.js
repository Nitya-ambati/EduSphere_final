import api from './api'

export const adminService = {
  // User management
  getUsers: (params) => api.get('/admin/users', { params }),
  getUsersSilent: () => api.get('/admin/users', { silentError: true }),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  reactivateUser: (id) => api.patch(`/admin/users/${id}/reactivate`),
  uploadUsers: (file) => {
    const fd = new FormData()
    fd.append('file', file)
    return api.post('/admin/users/upload', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  // User lookup by student/employee ID (accessible to coordinators via users endpoint)
  getUserByEmpId: (studentOrEmployeeId) =>
    api.get('/users/lookup', { params: { studentOrEmployeeId }, silentError: true }),

  // Enrollment count for admin dashboard
  getTotalEnrollmentCount: () => api.get('/enrollments/count', { silentError: true }),

  // Student count from IAM — accessible to COORDINATOR and INSTRUCTOR too
  getStudentCount: () => api.get('/users/students/count', { silentError: true }),

  // Audit logs
  getAuditLogs: (params) => api.get('/audit/logs/all', { params }),
  exportAuditLogs: (params) => api.post('/audit/logs/export', params),
}
