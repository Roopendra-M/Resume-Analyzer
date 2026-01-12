import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../lib/api'
import { User, Mail, Lock, ArrowRight, Zap, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Card from '../components/ui/Card'

const PasswordStrengthMeter = ({ password }) => {
  const getStrength = () => {
    let strength = 0
    if (password.length >= 6) strength++
    if (password.length >= 10) strength++
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++
    if (/\d/.test(password)) strength++
    if (/[^a-zA-Z\d]/.test(password)) strength++
    return strength
  }

  const strength = getStrength()
  const getColor = () => {
    if (strength <= 1) return 'bg-red-500'
    if (strength <= 3) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getLabel = () => {
    if (strength <= 1) return 'Weak'
    if (strength <= 3) return 'Medium'
    return 'Strong'
  }

  if (!password) return null

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all ${i < strength ? getColor() : 'bg-slate-700'
              }`}
          />
        ))}
      </div>
      <p className={`text-xs ${strength <= 1 ? 'text-red-400' : strength <= 3 ? 'text-yellow-400' : 'text-green-400'}`}>
        Password strength: {getLabel()}
      </p>
    </div>
  )
}

export default function Signup() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSignup = async (e) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    if (!agreedToTerms) {
      toast.error('Please agree to the Terms of Service')
      return
    }

    setLoading(true)

    try {
      await api.post('/auth/signup', { name, email, password })
      toast.success('Account created! Please sign in 🎉')
      navigate('/login')
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Signup failed')
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
        className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-electric-violet/20 rounded-full blur-[100px]"
      />
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.1, 0.2, 0.1]
        }}
        transition={{ duration: 10, repeat: Infinity, delay: 1 }}
        className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-bright-teal/10 rounded-full blur-[100px]"
      />

      <div className="w-full max-w-md relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
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
              Create Account
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-gray-400"
            >
              Join thousands of job seekers today
            </motion.p>
          </div>

          <Card className="shadow-2xl" hoverEffect>
            <form onSubmit={handleSignup} className="space-y-5">
              <Input
                label="Full Name"
                type="text"
                icon={<User className="w-5 h-5" />}
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

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
                <PasswordStrengthMeter password={password} />
              </div>

              <Input
                label="Confirm Password"
                type={showPassword ? "text" : "password"}
                icon={<Lock className="w-5 h-5" />}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                success={confirmPassword && password === confirmPassword ? "Passwords match" : undefined}
                error={confirmPassword && password !== confirmPassword ? "Passwords don't match" : undefined}
                required
              />

              <motion.label
                whileHover={{ scale: 1.02 }}
                className="flex items-start gap-3 cursor-pointer group"
              >
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-slate-700 bg-deep-navy/50 text-electric-violet focus:ring-electric-violet focus:ring-offset-0"
                  required
                />
                <span className="text-sm text-gray-400 group-hover:text-white transition-colors">
                  I agree to the{' '}
                  <a href="#" className="text-bright-teal hover:underline">Terms of Service</a>
                  {' '}and{' '}
                  <a href="#" className="text-bright-teal hover:underline">Privacy Policy</a>
                </span>
              </motion.label>

              <Button
                type="submit"
                isLoading={loading}
                className="w-full"
                variant="glow"
                size="lg"
                iconPosition="right"
                icon={<ArrowRight className="w-5 h-5" />}
              >
                Create Account
              </Button>
            </form>
          </Card>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center mt-6 text-gray-400"
          >
            Already have an account?{' '}
            <Link to="/login" className="text-bright-teal hover:text-white font-semibold transition-colors">
              Sign in
            </Link>
          </motion.p>
        </motion.div>
      </div>
    </div>
  )
}
