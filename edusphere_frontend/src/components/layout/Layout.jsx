import { useState, useCallback } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

const TITLES = {
  '/student/dashboard':       'Dashboard',
  '/student/courses':         'My Courses',
  '/student/enrollments':     'My Enrollments',
  '/student/progress':        'My Progress',
  '/student/certifications':  'My Certifications',
  '/instructor/dashboard':    'Dashboard',
  '/instructor/courses':      'Courses',
  '/coordinator/dashboard':   'Dashboard',
  '/coordinator/courses':     'Course Management',
  '/coordinator/enrollments': 'Enrollment Management',
  '/admin/dashboard':         'Dashboard',
  '/admin/users':             'User Management',
  '/admin/courses':           'Course Management',
  '/admin/audit':             'Audit Logs',
  '/admin/departments':       'Departments',
  '/notifications':           'Notifications',
  '/profile':                 'My Profile',
}

export default function Layout() {
  const { pathname } = useLocation()
  const title = TITLES[pathname] ?? 'EduSphere'
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const closeSidebar = useCallback(() => setSidebarOpen(false), [])
  const toggleSidebar = useCallback(() => setSidebarOpen((o) => !o), [])

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: 'var(--bg-base)' }}>
      {/* Mobile backdrop overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header title={title} onMenuToggle={toggleSidebar} />
        <main className="flex-1 p-4 sm:p-6 animate-fade-in overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
