import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../lib/api'
import { Mail, Lock, Zap, ArrowRight, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Card from '../components/ui/Card'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data } = await api.post('/auth/login', { email, password })
      localStorage.setItem('token', data.access_token)
      localStorage.setItem('role', data.role)
      localStorage.setItem('user', JSON.stringify(data.user || { email }))

      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true')
      }

      toast.success('Welcome back! 🎉')
      navigate(data.role === 'admin' ? '/admin/dashboard' : '/dashboard')
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-deep-navy relative overflow-hidden py-12 px-4">
      {/* Animated Background Elements */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.3, 0.2]
        }}
        transition={{ duration: 8, repeat: Infinity }}
        className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-electric-violet/20 rounded-full blur-[100px]"
      />
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.1, 0.2, 0.1]
        }}
        transition={{ duration: 10, repeat: Infinity, delay: 1 }}
        className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-bright-teal/10 rounded-full blur-[100px]"
      />

      <div className="w-full max-w-md relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-6 group">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
                className="bg-gradient-to-br from-bright-teal to-electric-violet p-2.5 rounded-xl shadow-lg"
              >
                <Zap className="h-6 w-6 text-white" />
              </motion.div>
              <span className="text-3xl font-bold text-white tracking-tight">
                JobCopilot
              </span>
            </Link>
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-2xl font-bold text-white mb-2"
            >
              Welcome Back
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-gray-400"
            >
              Sign in to continue to your dashboard
            </motion.p>
          </div>

          <Card className="shadow-2xl" hoverEffect>
            <form onSubmit={handleLogin} className="space-y-6">
              <Input
                label="Email Address"
                type="email"
                icon={<Mail className="w-5 h-5" />}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  icon={<Lock className="w-5 h-5" />}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-[42px] text-slate-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 bg-deep-navy/50 text-electric-violet focus:ring-electric-violet focus:ring-offset-0"
                  />
                  <span className="text-sm text-gray-400 group-hover:text-white transition-colors">
                    Remember me
                  </span>
                </label>
                <Link to="#" className="text-sm text-bright-teal hover:text-white transition-colors">
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                isLoading={loading}
                className="w-full"
                variant="glow"
                size="lg"
                iconPosition="right"
                icon={<ArrowRight className="w-5 h-5" />}
              >
                Sign In
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-glass-black text-gray-400">Or continue with</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button type="button" variant="secondary" className="w-full">
                  Google
                </Button>
                <Button type="button" variant="secondary" className="w-full">
                  Github
                </Button>
              </div>
            </form>
          </Card>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center mt-6 text-gray-400"
          >
            Don't have an account?{' '}
            <Link to="/signup" className="text-bright-teal hover:text-white font-semibold transition-colors">
              Sign up free
            </Link>
          </motion.p>
        </motion.div>
      </div>
    </div>
  )
}

