import api from './api'

export const userService = {
  getProfile: (userId) => api.get(`/users/${userId}`),
  updateProfile: (userId, data) => api.patch(`/users/${userId}`, data),
  changePassword: (userId, data) => api.patch(`/users/${userId}/change-password`, data),
}
