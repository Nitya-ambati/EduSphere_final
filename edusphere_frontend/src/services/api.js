import axios from 'axios'
import toast from 'react-hot-toast'

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let refreshing = false
let refreshSubscribers = []

const onRefreshed = (token) => {
  refreshSubscribers.forEach((cb) => cb(token))
  refreshSubscribers = []
}
const addRefreshSubscriber = (cb) => refreshSubscribers.push(cb)

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      if (refreshing) {
        return new Promise((resolve, reject) => {
          addRefreshSubscriber((token) => {
            if (token) {
              original.headers.Authorization = `Bearer ${token}`
              resolve(api(original))
            } else {
              reject(error)
            }
          })
        })
      }
      original._retry = true
      refreshing = true
      try {
        const { data } = await axios.post('/api/v1/auth/refresh', {}, { withCredentials: true })
        const token = data.data?.accessToken
        if (token) {
          localStorage.setItem('accessToken', token)
          onRefreshed(token)
          original.headers.Authorization = `Bearer ${token}`
          return api(original)
        } else {
          throw new Error('No token in refresh response')
        }
      } catch {
        onRefreshed(null)
        localStorage.removeItem('accessToken')
        localStorage.removeItem('user')
        window.location.href = '/login'
        return Promise.reject(error)
      } finally {
        refreshing = false
      }
    }
    const msg = error.response?.data?.message || 'Something went wrong'
    if (error.response?.status !== 401 && !original?.silentError) {
      toast.error(msg)
    }
    return Promise.reject(error)
  }
)

export default api
