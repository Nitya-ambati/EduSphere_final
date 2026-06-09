import api from './api'

export const courseService = {
  getAll: () => api.get('/courses'),
  getDeleted: () => api.get('/courses/deleted'),
  restore: (id) => api.post(`/courses/${id}/restore`),
  getById: (id) => api.get(`/courses/${id}`),
  create: (data) => api.post('/courses', data),
  update: (id, data) => api.patch(`/courses/${id}`, data),
  delete: (id) => api.delete(`/courses/${id}`),

  // Department linking (coordinator)
  getLinkedDepartments: (courseId) => api.get(`/courses/${courseId}/departments`),
  linkDepartment: (courseId, deptId) => api.post(`/courses/${courseId}/departments/${deptId}`),
  unlinkDepartment: (courseId, deptId) => api.delete(`/courses/${courseId}/departments/${deptId}`),

  // Syllabus (coordinator upload; student/instructor view)
  uploadSyllabus: (courseId, file) => {
    const fd = new FormData()
    fd.append('file', file)
    return api.post(`/courses/${courseId}/syllabus`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  getSyllabus: (courseId) => api.get(`/courses/${courseId}/syllabus`, { silentError: true }),
  openSyllabus: async (courseId) => {
    const res = await api.get(`/courses/${courseId}/syllabus/file`, { responseType: 'blob' })
    const blobUrl = URL.createObjectURL(res.data)
    window.open(blobUrl, '_blank')
  },

  // Course content (instructor)
  getContent: (courseId) => api.get(`/courses/${courseId}/content`),
  addContent: (courseId, data) => api.post(`/courses/${courseId}/content`, data),
  uploadPdfContent: (courseId, formData) =>
    api.post(`/courses/${courseId}/content/upload-pdf`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  updateContent: (courseId, contentId, data) =>
    api.patch(`/courses/${courseId}/content/${contentId}`, data),
  deleteContent: (courseId, contentId) =>
    api.delete(`/courses/${courseId}/content/${contentId}`),

  // Serve PDF content file (fetches with auth, returns blob URL)
  openPdfContent: async (courseId, contentId) => {
    const res = await api.get(`/courses/${courseId}/content/${contentId}/file`, {
      responseType: 'blob',
    })
    const blobUrl = URL.createObjectURL(res.data)
    window.open(blobUrl, '_blank')
  },

  // Content completion (student)
  markContentComplete: (courseId, contentId) =>
    api.post(`/courses/${courseId}/content/${contentId}/complete`),
  getCourseProgress: (courseId) => api.get(`/courses/${courseId}/progress`),
}
