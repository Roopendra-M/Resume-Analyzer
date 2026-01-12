import { useState, useEffect } from 'react'
import api from '../lib/api'
import { User, Mail, Phone, MapPin, Edit2, Save, X, Camera, Loader, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Profile() {
  const [user, setUser] = useState(null)
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    bio: ''
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/auth/me')
      setUser(data)
      setFormData({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        location: data.location || '',
        bio: data.bio || ''
      })
    } catch (error) {
      console.error('Failed to load profile:', error)
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('Name is required')
      return
    }

    setSaving(true)
    try {
      await api.put('/auth/profile', formData)
      toast.success('✅ Profile updated successfully!')
      setEditing(false)
      fetchProfile()
    } catch (error) {
      console.error('Update error:', error)
      toast.error(error.response?.data?.detail || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      location: user?.location || '',
      bio: user?.bio || ''
    })
    setEditing(false)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader className="h-12 w-12 text-bright-teal animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="card">
        {/* Profile Header */}
        <div className="relative">
          {/* Cover */}
          <div className="h-32 bg-gradient-to-r from-bright-teal via-soft-violet to-accent-yellow rounded-t-xl"></div>
          
          {/* Avatar & Info */}
          <div className="px-6 pb-6">
            <div className="flex flex-col md:flex-row md:items-end md:space-x-6 -mt-16 relative">
              {/* Avatar */}
              <div className="relative group">
                <div className="w-32 h-32 rounded-full bg-gradient-to-r from-bright-teal to-soft-violet flex items-center justify-center text-white text-5xl font-bold border-4 border-white dark:border-gray-800 shadow-xl">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <button className="absolute bottom-2 right-2 p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:shadow-xl transition-all opacity-0 group-hover:opacity-100">
                  <Camera className="h-4 w-4 text-bright-teal" />
                </button>
              </div>

              {/* Name & Role */}
              <div className="flex-1 mt-4 md:mt-0 md:mb-4">
                <h1 className="text-3xl font-bold text-charcoal dark:text-white mb-1">
                  {user?.name || 'User'}
                </h1>
                <p className="text-gray-600 dark:text-lavender-gray flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>{user?.email}</span>
                </p>
                <div className="mt-2">
                  <span className="px-3 py-1 bg-bright-teal/10 text-bright-teal rounded-full text-sm font-semibold border border-bright-teal/30">
                    {user?.role === 'admin' ? '👑 Admin' : '👤 User'}
                  </span>
                </div>
              </div>

              {/* Edit Button */}
              <div className="md:mb-4 mt-4 md:mt-0">
                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="px-6 py-3 bg-gradient-to-r from-bright-teal to-soft-violet text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all font-bold flex items-center space-x-2"
                  >
                    <Edit2 className="h-5 w-5" />
                    <span>Edit Profile</span>
                  </button>
                ) : (
                  <button
                    onClick={handleCancel}
                    className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-charcoal dark:text-white rounded-xl hover:shadow-lg transition-all font-bold flex items-center space-x-2"
                  >
                    <X className="h-5 w-5" />
                    <span>Cancel</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <div className="px-6 pb-6">
          {editing ? (
            <form onSubmit={handleUpdate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-bold text-charcoal dark:text-white mb-2 flex items-center space-x-2">
                    <User className="h-4 w-4 text-bright-teal" />
                    <span>Full Name</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-charcoal dark:text-white focus:outline-none focus:border-bright-teal transition-all"
                    required
                  />
                </div>

                {/* Email (Read-only) */}
                <div>
                  <label className="block text-sm font-bold text-charcoal dark:text-white mb-2 flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-bright-teal" />
                    <span>Email</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 text-gray-500 cursor-not-allowed"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-bold text-charcoal dark:text-white mb-2 flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-bright-teal" />
                    <span>Phone Number</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="+1 (555) 123-4567"
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-charcoal dark:text-white focus:outline-none focus:border-bright-teal transition-all"
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-bold text-charcoal dark:text-white mb-2 flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-bright-teal" />
                    <span>Location</span>
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    placeholder="City, Country"
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-charcoal dark:text-white focus:outline-none focus:border-bright-teal transition-all"
                  />
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-bold text-charcoal dark:text-white mb-2">
                  Bio
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  rows={4}
                  placeholder="Tell us about yourself..."
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-charcoal dark:text-white focus:outline-none focus:border-bright-teal transition-all resize-none"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={saving}
                className="w-full px-6 py-4 bg-gradient-to-r from-bright-teal to-soft-violet text-white rounded-xl hover:shadow-xl transform hover:scale-105 transition-all font-bold text-lg flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {saving ? (
                  <>
                    <Loader className="animate-spin h-5 w-5" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Phone */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-bright-teal/10 rounded-lg">
                    <Phone className="h-5 w-5 text-bright-teal" />
                  </div>
                  <span className="text-sm font-bold text-gray-500 dark:text-gray-400">Phone</span>
                </div>
                <p className="text-lg font-semibold text-charcoal dark:text-white">
                  {user?.phone || 'Not provided'}
                </p>
              </div>

              {/* Location */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-soft-violet/10 rounded-lg">
                    <MapPin className="h-5 w-5 text-soft-violet" />
                  </div>
                  <span className="text-sm font-bold text-gray-500 dark:text-gray-400">Location</span>
                </div>
                <p className="text-lg font-semibold text-charcoal dark:text-white">
                  {user?.location || 'Not provided'}
                </p>
              </div>

              {/* Bio */}
              <div className="md:col-span-2 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-accent-yellow/10 rounded-lg">
                    <User className="h-5 w-5 text-accent-yellow" />
                  </div>
                  <span className="text-sm font-bold text-gray-500 dark:text-gray-400">Bio</span>
                </div>
                <p className="text-base text-charcoal dark:text-white leading-relaxed">
                  {user?.bio || 'No bio added yet'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
