import api from './api'

export const assignmentService = {
  // List assignments for a course (student/instructor — requires enrollment)
  getForCourse: (courseId) => api.get(`/courses/${courseId}/assignments`),

  // List assignments for coordinator/admin supervision — dedicated endpoint, no enrollment required
  getForCourseCoordinator: (courseId) =>
    api.get(`/coordinator/courses/${courseId}/assignments`, { silentError: true }),

  // Same as getForCourse but silent — used as fallback from coordinator view
  getForCourseSilent: (courseId) =>
    api.get(`/courses/${courseId}/assignments`, { silentError: true }),

  // Get assignment details (includes questions)
  getById: (id) => api.get(`/assignments/${id}`),

  // Create assignment with JSON questions
  create: (courseId, data) => api.post(`/courses/${courseId}/assignments`, data),

  // Create assignment via Excel upload
  uploadBulk: (courseId, formData) =>
    api.post(`/courses/${courseId}/assignments/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // Update assignment
  update: (id, data) => api.patch(`/assignments/${id}`, data),

  // Delete assignment
  delete: (id) => api.delete(`/assignments/${id}`),

  // Submit assignment (student) — payload = { answers: [{questionId, selectedOption}], timeTakenSeconds }
  submit: (assignmentId, payload) =>
    api.post(`/assignments/${assignmentId}/submit`, payload),

  // View all submissions for an assignment (instructor)
  getSubmissions: (assignmentId) => api.get(`/assignments/${assignmentId}/submissions`),

  // Get a specific submission
  getSubmission: (submissionId) => api.get(`/submissions/${submissionId}`),

  // Attempt status — who submitted and who didn't (instructor)
  getAttemptStatus: (assignmentId) => api.get(`/assignments/${assignmentId}/attempt-status`),

  // Student overall progress across assignments (assignment-service)
  getStudentProgress: (studentId) => api.get(`/students/${studentId}/progress`),

  // All submissions by a student
  getStudentSubmissions: (studentId) => api.get(`/students/${studentId}/submissions`),
}
