import { createBrowserRouter, createRoutesFromElements, RouterProvider, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { NotificationProvider } from './context/NotificationContext'
import Layout from './components/layout/Layout'
import ProtectedRoute from './components/layout/ProtectedRoute'

import Login from './pages/auth/Login'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'

import StudentDashboard from './pages/student/StudentDashboard'
import MyCourses from './pages/student/MyCourses'
import CourseDetail from './pages/student/CourseDetail'
import AssignmentAttempt from './pages/student/AssignmentAttempt'
import MyProgress from './pages/student/MyProgress'
import MyEnrollments from './pages/student/MyEnrollments'
import MyCertifications from './pages/student/MyCertifications'

import InstructorDashboard from './pages/instructor/InstructorDashboard'
import InstructorCourses from './pages/instructor/InstructorCourses'
import ManageCourse from './pages/instructor/ManageCourse'
import CreateAssignment from './pages/instructor/CreateAssignment'
import Submissions from './pages/instructor/Submissions'

import CoordinatorDashboard from './pages/coordinator/CoordinatorDashboard'
import CoordCourseManagement from './pages/coordinator/CourseManagement'
import CoordinatorCourseView from './pages/coordinator/CoordinatorCourseView'
import EnrollmentManagement from './pages/coordinator/EnrollmentManagement'

import AdminDashboard from './pages/admin/AdminDashboard'
import UserManagement from './pages/admin/UserManagement'
import AdminCourseManagement from './pages/admin/CourseManagement'
import AuditLogs from './pages/admin/AuditLogs'
import DepartmentManagement from './pages/admin/DepartmentManagement'

import Notifications from './pages/shared/Notifications'
import Profile from './pages/shared/Profile'
import NotFound from './pages/NotFound'

const ROLE_HOME = {
  STUDENT:     '/student/dashboard',
  INSTRUCTOR:  '/instructor/dashboard',
  COORDINATOR: '/coordinator/dashboard',
  ADMIN:       '/admin/dashboard',
}

function RoleRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={ROLE_HOME[user.role] || '/login'} replace />
}

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      {/* Public routes */}
      <Route path="/login"           element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password"  element={<ResetPassword />} />

      {/* Authenticated routes (all roles) */}
      <Route element={<ProtectedRoute />}>
        <Route element={
          <NotificationProvider>
            <Layout />
          </NotificationProvider>
        }>
          <Route path="/" element={<RoleRedirect />} />

          {/* Shared */}
          <Route path="/profile"       element={<Profile />} />
          <Route path="/notifications" element={<Notifications />} />

          {/* Student */}
          <Route path="/student/dashboard"                element={<ProtectedRoute role="STUDENT"><StudentDashboard /></ProtectedRoute>} />
          <Route path="/student/courses"                  element={<ProtectedRoute role="STUDENT"><MyCourses /></ProtectedRoute>} />
          <Route path="/student/courses/:courseId"        element={<ProtectedRoute role="STUDENT"><CourseDetail /></ProtectedRoute>} />
          <Route path="/student/assignments/:assignmentId" element={<ProtectedRoute role="STUDENT"><AssignmentAttempt /></ProtectedRoute>} />
          <Route path="/student/progress"                 element={<ProtectedRoute role="STUDENT"><MyProgress /></ProtectedRoute>} />
          <Route path="/student/enrollments"              element={<ProtectedRoute role="STUDENT"><MyEnrollments /></ProtectedRoute>} />
          <Route path="/student/certifications"           element={<ProtectedRoute role="STUDENT"><MyCertifications /></ProtectedRoute>} />

          {/* Instructor */}
          <Route path="/instructor/dashboard"                          element={<ProtectedRoute role="INSTRUCTOR"><InstructorDashboard /></ProtectedRoute>} />
          <Route path="/instructor/courses"                            element={<ProtectedRoute role="INSTRUCTOR"><InstructorCourses /></ProtectedRoute>} />
          <Route path="/instructor/courses/:courseId"                  element={<ProtectedRoute role="INSTRUCTOR"><ManageCourse /></ProtectedRoute>} />
          <Route path="/instructor/courses/:courseId/assignments/new"  element={<ProtectedRoute role="INSTRUCTOR"><CreateAssignment /></ProtectedRoute>} />
          <Route path="/instructor/assignments/:assignmentId/submissions" element={<ProtectedRoute role="INSTRUCTOR"><Submissions /></ProtectedRoute>} />

          {/* Coordinator */}
          <Route path="/coordinator/dashboard"          element={<ProtectedRoute role="COORDINATOR"><CoordinatorDashboard /></ProtectedRoute>} />
          <Route path="/coordinator/courses"            element={<ProtectedRoute role="COORDINATOR"><CoordCourseManagement /></ProtectedRoute>} />
          <Route path="/coordinator/courses/:courseId"  element={<ProtectedRoute role="COORDINATOR"><CoordinatorCourseView /></ProtectedRoute>} />
          <Route path="/coordinator/enrollments"        element={<ProtectedRoute role="COORDINATOR"><EnrollmentManagement /></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin/dashboard"     element={<ProtectedRoute role="ADMIN"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/users"         element={<ProtectedRoute role="ADMIN"><UserManagement /></ProtectedRoute>} />
          <Route path="/admin/courses"       element={<ProtectedRoute role="ADMIN"><AdminCourseManagement /></ProtectedRoute>} />
          <Route path="/admin/audit"         element={<ProtectedRoute role="ADMIN"><AuditLogs /></ProtectedRoute>} />
          <Route path="/admin/departments"   element={<ProtectedRoute role="ADMIN"><DepartmentManagement /></ProtectedRoute>} />

          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
    </>
  )
)

export default function App() {
  return <RouterProvider router={router} />
}
