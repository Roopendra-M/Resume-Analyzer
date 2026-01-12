import { Link, useNavigate } from "react-router-dom"
import useAuth from "../hooks/useAuth"
import { Menu, ChevronDown, User as UserIcon, LogOut, Settings, BarChart3, Zap } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import toast from "react-hot-toast"
import { motion, AnimatePresence } from "framer-motion"
import NotificationBell from "./NotificationBell"

export default function Navbar({ onMenuToggle }) {
  const { isAuthenticated, isAdmin, user } = useAuth()
  const navigate = useNavigate()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const menuRef = useRef(null)

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("role")
    localStorage.removeItem("user")
    toast.success("Logged out successfully")
    navigate("/")
    setShowUserMenu(false)
  }

  // Public Navbar
  if (!isAuthenticated) {
    return (
      <nav className="fixed top-0 w-full z-50 bg-deep-navy/80 backdrop-blur-md border-b border-white/5 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-electric-violet blur-lg opacity-40 group-hover:opacity-60 transition-opacity" />
                <div className="relative bg-gradient-to-br from-bright-teal to-electric-violet p-2.5 rounded-xl">
                  <Zap className="h-6 w-6 text-white" />
                </div>
              </div>
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 font-heading tracking-tight">
                JobCopilot
              </span>
            </Link>

            <div className="flex items-center space-x-6">
              <Link
                to="/login"
                className="text-gray-300 hover:text-white font-medium transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="btn-primary shadow-neon hover:shadow-neon-teal"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>
    )
  }

  // Authenticated Navbar
  return (
    <nav className="sticky top-0 z-40 w-full bg-glass-black/80 backdrop-blur-xl border-b border-white/5 shadow-glass">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Left: Menu + Logo */}
          <div className="flex items-center gap-4">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onMenuToggle}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 transition-colors lg:hidden"
            >
              <Menu className="h-6 w-6" />
            </motion.button>

            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-electric-violet blur-lg opacity-40 group-hover:opacity-60 transition-opacity" />
                <div className="relative bg-gradient-to-br from-bright-teal to-electric-violet p-2 rounded-xl">
                  <Zap className="h-5 w-5 text-white" />
                </div>
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 font-heading hidden sm:block">
                JobCopilot
              </span>
            </Link>
          </div>

          {/* Right: Notifications + User Menu */}
          <div className="flex items-center gap-4">
            {/* Notifications - Now using NotificationBell component */}
            <NotificationBell />

            {/* User Menu Dropdown */}
            <div className="relative" ref={menuRef}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 pl-2 pr-4 py-1.5 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-electric-violet to-bright-teal p-[2px] shadow-lg">
                  <div className="w-full h-full rounded-full bg-deep-navy flex items-center justify-center">
                    <span className="text-transparent bg-clip-text bg-gradient-to-br from-electric-violet to-bright-teal font-bold">
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                </div>

                <div className="hidden md:block text-left">
                  <p className="text-sm font-semibold text-white group-hover:text-bright-teal transition-colors">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {isAdmin ? 'Administrator' : 'Job Seeker'}
                  </p>
                </div>
                <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform duration-300 ${showUserMenu ? 'rotate-180' : ''}`} />
              </motion.button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-3 w-64 bg-deep-navy/95 backdrop-blur-xl rounded-2xl shadow-glass-hover border border-white/10 py-2 origin-top-right overflow-hidden"
                  >
                    {/* User Info Header */}
                    <div className="px-5 py-4 border-b border-white/5 bg-white/5">
                      <p className="text-sm font-semibold text-white">
                        {user?.name || 'User'}
                      </p>
                      <p className="text-xs text-gray-400 truncate mt-1">
                        {user?.email}
                      </p>
                    </div>

                    {/* Menu Items */}
                    <div className="p-2 space-y-1">
                      <Link
                        to="/profile"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-gray-300 hover:text-white transition-all group"
                      >
                        <UserIcon className="h-4 w-4 group-hover:text-bright-teal transition-colors" />
                        <span className="text-sm font-medium">My Profile</span>
                      </Link>

                      <Link
                        to="/analytics"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-gray-300 hover:text-white transition-all group"
                      >
                        <BarChart3 className="h-4 w-4 group-hover:text-electric-violet transition-colors" />
                        <span className="text-sm font-medium">Analytics</span>
                      </Link>

                      {isAdmin && (
                        <Link
                          to="/admin/dashboard"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-gray-300 hover:text-white transition-all group"
                        >
                          <Settings className="h-4 w-4 group-hover:text-amber-400 transition-colors" />
                          <span className="text-sm font-medium">Admin Panel</span>
                        </Link>
                      )}
                    </div>

                    {/* Logout */}
                    <div className="p-2 border-t border-white/5">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 w-full rounded-xl hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-all group"
                      >
                        <LogOut className="h-4 w-4 group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-medium">Sign Out</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
