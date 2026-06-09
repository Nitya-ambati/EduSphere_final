import api from './api'

export const enrollmentService = {
  // ADMIN/COORDINATOR: manual enroll
  enroll: (data) => api.post('/enrollments', data),

  // STUDENT/INSTRUCTOR: self-enroll — courseId is a query param not body
  selfEnroll: (courseId) => api.post('/enrollments/self', null, { params: { courseId } }),

  // STUDENT: request enrollment (requires coordinator approval)
  requestEnrollment: (courseId) => api.post('/enrollments/request', null, { params: { courseId } }),

  // COORDINATOR/ADMIN: get pending enrollment requests
  getPendingRequests: () => api.get('/enrollments/pending'),

  // COORDINATOR/ADMIN: approve enrollment request
  approveEnrollment: (enrollmentId) => api.post(`/enrollments/${enrollmentId}/approve`),

  // COORDINATOR/ADMIN: reject enrollment request
  rejectEnrollment: (enrollmentId) => api.post(`/enrollments/${enrollmentId}/reject`),

  // ADMIN/COORDINATOR/INSTRUCTOR: get enrollments for a course
  getEnrollmentsByCourse: (courseId) => api.get('/enrollments', { params: { courseId } }),

  // Get enrollments for a specific student
  getStudentEnrollments: (studentId) => api.get(`/students/${studentId}/enrollments`),

  // Get pending enrollment requests for a student
  getStudentPendingRequests: (studentId) => api.get(`/students/${studentId}/enrollments/pending`),

  // Get enrollments for a specific instructor
  getInstructorEnrollments: (instructorId) => api.get(`/instructors/${instructorId}/enrollments`),

  // Check enrollment status (internal use)
  checkEnrollment: (userId, courseId) =>
    api.get('/enrollments/check', { params: { userId, courseId }, silentError: true }),

  // ADMIN: unenroll
  unenroll: (enrollmentId) => api.delete(`/enrollments/${enrollmentId}`),

  // ADMIN: get past (soft-deleted) enrollments
  getPastEnrollments: () => api.get('/enrollments/past'),
}
