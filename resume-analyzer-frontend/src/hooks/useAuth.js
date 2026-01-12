import { useState, useEffect } from 'react'
import api from '../lib/api'

export default function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const role = localStorage.getItem('role')
    const userData = localStorage.getItem('user')

    console.log('🔍 useAuth Debug:')
    console.log('  Token:', token ? '✅ Found' : '❌ Missing')
    console.log('  Role:', role)
    console.log('  User:', userData)

    if (token && userData) {
      try {
        setIsAuthenticated(true)
        setIsAdmin(role === 'admin')
        setUser(JSON.parse(userData))
        
        // Set default auth header
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        console.log('✅ Auth initialized successfully')
      } catch (error) {
        console.error('❌ Failed to parse user data:', error)
        localStorage.removeItem('user')
        localStorage.removeItem('token')
        localStorage.removeItem('role')
        setIsAuthenticated(false)
        setIsAdmin(false)
        setUser(null)
      }
    } else {
      console.log('⚠️ No token/userData found')
      setIsAuthenticated(false)
      setIsAdmin(false)
      setUser(null)
    }

    setLoading(false)
  }, [])

  return {
    isAuthenticated,
    isAdmin,
    user,
    loading,
  }
}
