import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { Toaster } from "react-hot-toast"
import Layout from "./components/Layout"
import Home from "./pages/Home"
import Login from "./pages/Login"
import Signup from "./pages/Signup"
import AdminLogin from "./pages/AdminLogin"
import Dashboard from "./pages/Dashboard"
import Jobs from "./pages/Jobs"
import UploadResume from "./pages/UploadResume"
import MyApplications from "./pages/MyApplications"
import Analytics from "./pages/Analytics"
import Feedback from "./pages/Feedback"
import Profile from "./pages/Profile"
import MockInterview from "./pages/MockInterview"
import VideoInterview from "./pages/VideoInterview"
import AdminDashboard from "./pages/AdminDashboard"
import AdminAnalytics from "./pages/AdminAnalytics"
import ManageApplications from "./pages/ManageApplications"
import useAuth from "./hooks/useAuth"
import { Loader } from "lucide-react"

function App() {
  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1a1d29',
            color: '#fff',
            borderRadius: '12px',
          },
          success: {
            iconTheme: {
              primary: '#00d4ff',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="signup" element={<Signup />} />
          <Route path="admin/login" element={<AdminLogin />} />

          {/* User Routes */}
          <Route path="dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="jobs" element={<ProtectedRoute><Jobs /></ProtectedRoute>} />
          <Route path="upload-resume" element={<ProtectedRoute><UploadResume /></ProtectedRoute>} />
          <Route path="my-applications" element={<ProtectedRoute><MyApplications /></ProtectedRoute>} />
          <Route path="analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
          <Route path="feedback" element={<ProtectedRoute><Feedback /></ProtectedRoute>} />
          <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="mock-interview" element={<ProtectedRoute><MockInterview /></ProtectedRoute>} />
          <Route path="video-interview" element={<ProtectedRoute><VideoInterview /></ProtectedRoute>} />

          {/* Admin Routes */}
          <Route path="admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="admin/analytics" element={<AdminRoute><AdminAnalytics /></AdminRoute>} />
          <Route path="admin/applications" element={<AdminRoute><ManageApplications /></AdminRoute>} />
        </Route>
      </Routes>
    </Router>
  )
}

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader className="h-12 w-12 text-bright-teal animate-spin" />
      </div>
    )
  }

  return isAuthenticated ? children : <Navigate to="/login" />
}

function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader className="h-12 w-12 text-bright-teal animate-spin" />
      </div>
    )
  }

  return isAuthenticated && isAdmin ? children : <Navigate to="/admin/login" />
}

export default App
