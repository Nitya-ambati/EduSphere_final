import api from './api'

export const departmentService = {
  getAll: () => api.get('/departments'),
  getById: (deptId) => api.get(`/departments/${deptId}`),
  create: (data) => api.post('/departments', data),
  deleteDepartment: (deptId) => api.delete(`/departments/${deptId}`),
  getCoursesByDepartment: (deptId) => api.get(`/departments/${deptId}/courses`),
}
