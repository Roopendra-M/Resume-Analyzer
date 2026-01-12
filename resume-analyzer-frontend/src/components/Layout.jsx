import { useState } from 'react'
import { Outlet, useLocation } from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"
import Navbar from "./Navbar"
import Sidebar from "./Sidebar"
import Footer from "./Footer"
import ChatbotWidget from "./ChatbotWidget"
import useAuth from "../hooks/useAuth"

export default function Layout() {
  const { isAuthenticated } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  // Hide Navbar/Sidebar for auth pages
  const isAuthPage = ['/login', '/signup', '/admin/login', '/'].includes(location.pathname)

  return (
    <div className="flex flex-col min-h-screen bg-deep-navy text-lavender-gray overflow-hidden relative">
      {/* Global Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-electric-violet/10 rounded-full blur-[100px] opacity-30 animate-pulse-slow" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-bright-teal/10 rounded-full blur-[100px] opacity-30 animate-pulse-slow" style={{ animationDelay: '1s' }} />
      </div>

      {isAuthenticated && !isAuthPage ? (
        <div className="flex flex-col h-screen relative z-10">
          <Navbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
          <div className="flex flex-1 overflow-hidden">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <main className="flex-1 overflow-y-auto overflow-x-hidden relative scroll-smooth bg-glass-black/30 backdrop-blur-sm">
              <AnimatePresence mode="wait">
                <motion.div
                  key={location.pathname}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="min-h-full"
                >
                  <Outlet />
                </motion.div>
              </AnimatePresence>
            </main>
          </div>
        </div>
      ) : (
        <div className="flex flex-col min-h-screen relative z-10">
          {/* Public Page Layout */}
          <main className="flex-grow">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
          {!isAuthenticated && !isAuthPage && <Footer />}
        </div>
      )}

      {isAuthenticated && !isAuthPage && <ChatbotWidget />}
    </div>
  )
}
