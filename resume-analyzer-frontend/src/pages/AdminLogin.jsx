import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../lib/api'
import { Mail, Lock, Loader, Shield, Eye, EyeOff, Key } from 'lucide-react'
import toast from 'react-hot-toast'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleAdminLogin = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data } = await api.post('/auth/admin/login', {
        email,
        password
      })

      localStorage.setItem('token', data.access_token)
      localStorage.setItem('role', data.role)
      localStorage.setItem('user', JSON.stringify({
        email: email,
        role: 'admin'
      }))

      toast.success('Welcome back, Admin!')
      navigate('/admin/dashboard')
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Admin access only')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-deep-navy flex items-center justify-center p-6 relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-bright-teal/20 rounded-full blur-[128px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-electric-violet/20 rounded-full blur-[128px] animate-pulse delay-1000" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-glass-black/50 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          {/* Top Border Gradient */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-bright-teal via-electric-violet to-accent-yellow" />

          <div className="text-center mb-8">
            <motion.div
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              className="w-16 h-16 bg-gradient-to-br from-bright-teal to-electric-violet rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-bright-teal/20"
            >
              <Shield className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold text-white mb-2">Admin Portal</h1>
            <p className="text-gray-400">Secure access for administrators</p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-6">
            <div>
              <Input
                label="Admin Email"
                type="email"
                placeholder="admin@jobcopilot.ai"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail />}
                required
                className="bg-deep-navy/50"
              />
            </div>

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock />}
                required
                className="bg-deep-navy/50 pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-[38px] text-gray-500 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full py-4 text-lg"
              icon={loading ? <Loader className="animate-spin" /> : <Key />}
            >
              {loading ? 'Authenticating...' : 'Access Dashboard'}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-gray-500 text-sm">
              Not an admin?{' '}
              <Link to="/login" className="text-bright-teal hover:text-white transition-colors font-semibold">
                Return to User Login
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
