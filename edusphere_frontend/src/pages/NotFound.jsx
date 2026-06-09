import { useNavigate } from 'react-router-dom'
import { GraduationCap, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-5 animate-fade-in">
      <div className="w-24 h-24 bg-primary-100 rounded-3xl flex items-center justify-center">
        <GraduationCap size={44} className="text-primary-400" />
      </div>
      <div>
        <h1 className="text-6xl font-black text-primary-200">404</h1>
        <p className="text-xl font-bold text-slate-800 mt-2">Page Not Found</p>
        <p className="text-slate-500 text-sm mt-1">The page you're looking for doesn't exist.</p>
      </div>
      <button onClick={() => navigate(-1)} className="btn-primary">
        <ArrowLeft size={16} /> Go Back
      </button>
    </div>
  )
}
