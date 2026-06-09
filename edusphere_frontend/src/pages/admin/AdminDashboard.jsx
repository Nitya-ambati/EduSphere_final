import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { courseService } from '../../services/courseService'
import { adminService } from '../../services/adminService'
import { enrollmentService } from '../../services/enrollmentService'
import StatCard from '../../components/dashboard/StatCard'
import { PageLoader } from '../../components/common/LoadingSpinner'
import Badge from '../../components/common/Badge'
import { Users, BookOpen, ClipboardList, GraduationCap, UserCheck, Shield, ListChecks, Sun, Moon, Cloud } from 'lucide-react'
import { getGreeting } from '../../utils/helpers'

const ROLE_BADGE = { STUDENT: 'blue', INSTRUCTOR: 'green', COORDINATOR: 'amber', ADMIN: 'rose' }

export default function AdminDashboard() {
  const { user } = useAuth()

  const { data: coursesData, isLoading: loadingCourses } = useQuery({
    queryKey: ['courses'],
    queryFn: () => courseService.getAll(),
  })

  const { data: usersData, isLoading: loadingUsers } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminService.getUsers(),
  })

  const { data: enrollCountData } = useQuery({
    queryKey: ['admin-enrollment-count'],
    queryFn: () => adminService.getTotalEnrollmentCount(),
    retry: false,
  })

  if (loadingCourses || loadingUsers) return <PageLoader />

  const courses = coursesData?.data?.data || []
  const users   = usersData?.data?.data   || []

  const totalUsers        = users.length
  const totalCourses      = courses.length
  const totalStudents     = users.filter(u => u.role === 'STUDENT').length
  const totalInstructors  = users.filter(u => u.role === 'INSTRUCTOR').length
  const totalCoordinators = users.filter(u => u.role === 'COORDINATOR').length
  const totalEnrollments  = enrollCountData?.data?.data ?? '—'

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Personalized welcome banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 p-6 text-white shadow-glow">
        <div className="absolute right-0 top-0 w-64 h-full opacity-10">
          <div className="absolute right-[-30px] top-[-30px] w-48 h-48 rounded-full bg-white" />
          <div className="absolute right-24 bottom-[-20px] w-32 h-32 rounded-full bg-white" />
        </div>
        <div className="relative z-10 flex items-start justify-between gap-4">
          <div>
            <p className="text-white/70 text-sm font-medium flex items-center gap-1.5">
              {(() => { const h = new Date().getHours(); return h < 12 ? <Sun size={14}/> : h < 17 ? <Cloud size={14}/> : <Moon size={14}/> })()} {getGreeting()}
            </p>
            <h2 className="text-3xl font-bold mt-0.5">
              {user?.firstName} {user?.lastName}
            </h2>
            <p className="text-white/70 text-sm mt-2">Full platform control at your fingertips.</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0">
            <Shield size={26} className="text-white" />
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <StatCard label="Total Users"        value={totalUsers}          icon={Users}         colorIndex={0} />
        <StatCard label="Total Courses"      value={totalCourses}        icon={BookOpen}      colorIndex={1} />
        <StatCard label="Coordinators"       value={totalCoordinators}   icon={UserCheck}     colorIndex={2} />
        <StatCard label="Total Students"     value={totalStudents}       icon={GraduationCap} colorIndex={3} />
        <StatCard label="Instructors"        value={totalInstructors}    icon={ClipboardList} colorIndex={4} />
        <StatCard label="Total Enrollments"  value={totalEnrollments}    icon={ListChecks}    colorIndex={5} />
      </div>

      {/* Recent users */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <h3 className="section-title">Recent Users</h3>
          <a href="/admin/users" className="text-sm text-primary-600 dark:text-primary-400 font-medium hover:underline">View all →</a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[440px]">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-base)' }}>
                <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--text-muted)' }}>Name</th>
                <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--text-muted)' }}>Email</th>
                <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--text-muted)' }}>Role</th>
              </tr>
            </thead>
            <tbody>
              {users.slice(0, 5).map((u) => (
                <tr key={u.userId} className="border-b transition-colors hover:bg-primary-50/50 dark:hover:bg-primary-900/10" style={{ borderColor: 'var(--border)' }}>
                  <td className="py-3 px-4 font-medium" style={{ color: 'var(--text-primary)' }}>{u.firstName} {u.lastName}</td>
                  <td className="py-3 px-4" style={{ color: 'var(--text-muted)' }}>{u.email}</td>
                  <td className="py-3 px-4">
                    <Badge variant={ROLE_BADGE[u.role] || 'slate'}>{u.role}</Badge>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={4} className="py-8 text-center" style={{ color: 'var(--text-muted)' }}>No users found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
