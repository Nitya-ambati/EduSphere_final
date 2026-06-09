import api from './api'
import axios from 'axios'

export const authService = {
  login: (email, password) =>
    api.post('/auth/login', { email, password }),

  logout: () =>
    api.post('/auth/logout'),

  refresh: () =>
    axios.post('/api/v1/auth/refresh', {}, { withCredentials: true }),

  forgotPassword: (email) =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (email, otp, newPassword) =>
    api.post('/auth/reset-password', { email, otp, newPassword }),

  validate: () =>
    api.get('/auth/validate'),
}
