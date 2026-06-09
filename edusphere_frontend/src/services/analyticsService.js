import api from './api'

export const analyticsService = {
  // KPIs — ADMIN/INSTRUCTOR/COORDINATOR only
  getKpis: (params) => api.get('/analytics/kpis', { params }),

  // Student progress analytics
  getStudentProgress: (studentId) => api.get(`/analytics/progress/student/${studentId}`),

  // Course progress analytics
  getCourseProgress: (courseId) => api.get(`/analytics/progress/course/${courseId}`),

  // Student progress within a specific course
  getStudentCourseProgress: (studentId, courseId) =>
    api.get(`/analytics/progress/student/${studentId}/course/${courseId}`),
}
