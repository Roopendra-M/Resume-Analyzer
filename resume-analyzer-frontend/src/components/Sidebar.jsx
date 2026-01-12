import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  Send,
  BarChart3,
  MessageSquare,
  X,
  CreditCard,
  Video,
  User
} from 'lucide-react'
import useAuth from '../hooks/useAuth'

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation()
  const { isAdmin } = useAuth()

  const userLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/jobs', icon: Briefcase, label: 'Find Jobs' },
    { to: '/upload-resume', icon: FileText, label: 'Resume Analysis' },
    { to: '/my-applications', icon: Send, label: 'Applications' },
    { to: '/analytics', icon: BarChart3, label: 'My Growth' },
    { to: '/mock-interview', icon: Video, label: 'Mock Interview' },
    { to: '/feedback', icon: MessageSquare, label: 'Feedback' },
  ]

  const adminLinks = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Overview' },
    { to: '/admin/analytics', icon: BarChart3, label: 'Platform Stats' },
    { to: '/admin/applications', icon: Send, label: 'Manage Applications' },
    { to: '/jobs', icon: Briefcase, label: 'Job Board Manager' },
  ]

  const links = isAdmin ? adminLinks : userLinks

  const sidebarVariants = {
    open: { x: 0 },
    closed: { x: '-100%' },
  }

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-deep-navy/80 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        variants={sidebarVariants}
        initial="closed"
        animate={isOpen ? "open" : "closed"}
        // On desktop (lg), we remove the transform via CSS override or just allow it to be static
        className={`fixed lg:sticky top-0 left-0 h-screen w-72 bg-glass-black/90 backdrop-blur-xl border-r border-white/5 z-50 lg:translate-x-0 lg:!transform-none transition-transform duration-300 ease-in-out`}
      >
        <div className="flex flex-col h-full relative">
          {/* Decorative Glow */}
          <div className="absolute top-0 left-0 w-full h-32 bg-electric-violet/5 blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="flex items-center justify-between p-6 h-20">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span className="text-electric-violet">Main</span> Menu
            </h2>
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 space-y-2 overflow-y-auto py-4 custom-scrollbar">
            {links.map((link) => {
              const isActive = location.pathname === link.to
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={onClose}
                  className={`
                    relative flex items-center px-4 py-3.5 rounded-xl transition-all duration-300 group
                    ${isActive
                      ? 'bg-electric-violet/10 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }
                  `}
                >
                  {/* Active Indicator Line */}
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute left-0 w-1 h-8 bg-electric-violet rounded-r-full"
                    />
                  )}

                  <link.icon className={`h-5 w-5 mr-3 transition-colors ${isActive ? 'text-electric-violet' : 'text-slate-500 group-hover:text-white'}`} />
                  <span className="font-medium text-sm tracking-wide">{link.label}</span>

                  {/* Glowing dot for active state */}
                  {isActive && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute right-4 w-1.5 h-1.5 rounded-full bg-bright-teal shadow-[0_0_10px_#06b6d4]"
                    />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* User Profile Snippet (Mini) */}
          <div className="p-4 border-t border-white/5">
            <Link to="/profile" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-electric-violet to-bright-teal flex items-center justify-center text-white font-bold shadow-lg">
                <User className="w-5 h-5" />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-semibold text-white truncate group-hover:text-bright-teal transition-colors">My Profile</p>
                <p className="text-xs text-slate-500 truncate">Manage account</p>
              </div>
            </Link>
          </div>
        </div>
      </motion.aside>
    </>
  )
}
