import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart3, Users, Briefcase, FileText, TrendingUp,
  Calendar, CheckCircle, XCircle, Clock, Search
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts'
import api from '../lib/api'
import toast from 'react-hot-toast'
import Card from '../components/ui/Card'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem('token')
      const { data } = await api.get('/admin/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setStats(data)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-16 h-16 border-4 border-electric-violet border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Transform skill scores for charts
  const skillData = stats?.skill_scores
    ? Object.entries(stats.skill_scores)
      .slice(0, 10)
      .map(([name, value]) => ({ name, value }))
    : []

  // Mock timeline data if not provided (or transform if it is)
  const timelineData = stats?.applications_timeline?.map(item => ({
    name: item._id,
    count: item.count
  })) || [
      { name: 'Jan', count: 4 },
      { name: 'Feb', count: 10 },
      { name: 'Mar', count: 18 },
      { name: 'Apr', count: 12 },
      { name: 'May', count: 25 },
      { name: 'Jun', count: 32 }
    ]

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-400">
            Platform wide statistics and analytics
          </p>
        </div>
        <div className="flex gap-2">
          <div className="bg-white/5 border border-white/10 rounded-lg p-2 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-300">{new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats?.users || 0}
          icon={<Users className="w-6 h-6 text-white" />}
          trend="+12% this month"
          color="bg-gradient-to-br from-bright-teal to-emerald-500"
          delay={0.1}
        />
        <StatCard
          title="Active Jobs"
          value={stats?.jobs || 0}
          icon={<Briefcase className="w-6 h-6 text-white" />}
          trend="8 new today"
          color="bg-gradient-to-br from-electric-violet to-purple-600"
          delay={0.2}
        />
        <StatCard
          title="Total Resumes"
          value={stats?.resumes || 0}
          icon={<FileText className="w-6 h-6 text-white" />}
          trend="+5% vs last week"
          color="bg-gradient-to-br from-amber-400 to-orange-500"
          delay={0.3}
        />
        <StatCard
          title="Applications"
          value={stats?.applications || 0}
          icon={<TrendingUp className="w-6 h-6 text-white" />}
          trend="High activity"
          color="bg-gradient-to-br from-pink-500 to-rose-500"
          delay={0.4}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Applications Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="h-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-bright-teal" />
                Application Trends
              </h3>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData}>
                  <defs>
                    <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2DD4BF" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2DD4BF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e1b4b', border: '1px solid #ffffff20', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#2DD4BF" fillOpacity={1} fill="url(#colorApps)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>

        {/* Top Skills Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="h-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-electric-violet" />
                Top Skills Demand
              </h3>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={skillData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis type="number" stroke="#94a3b8" />
                  <YAxis dataKey="name" type="category" width={100} stroke="#94a3b8" />
                  <Tooltip
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ backgroundColor: '#1e1b4b', border: '1px solid #ffffff20', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="value" fill="#7c3aed" radius={[0, 4, 4, 0]}>
                    {skillData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#2DD4BF', '#7C3AED', '#F59E0B', '#EC4899'][index % 4]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Recent Activity / Quick Stats (Mocked or from API if available) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <Card className="bg-gradient-to-br from-green-500/10 to-green-900/10 border-green-500/20">
          <div className="flex items-start justify-between mb-2">
            <div className="p-2 bg-green-500/20 rounded-lg text-green-400">
              <CheckCircle className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-green-400 bg-green-500/10 px-2 py-1 rounded">Last 24h</span>
          </div>
          <p className="text-gray-400 text-sm">Successful Matches</p>
          <p className="text-2xl font-bold text-white">24</p>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-red-900/10 border-red-500/20">
          <div className="flex items-start justify-between mb-2">
            <div className="p-2 bg-red-500/20 rounded-lg text-red-400">
              <XCircle className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-red-400 bg-red-500/10 px-2 py-1 rounded">Attention</span>
          </div>
          <p className="text-gray-400 text-sm">Reported Jobs</p>
          <p className="text-2xl font-bold text-white">2</p>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-900/10 border-blue-500/20">
          <div className="flex items-start justify-between mb-2">
            <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
              <Clock className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded">Pending</span>
          </div>
          <p className="text-gray-400 text-sm">New Approvals</p>
          <p className="text-2xl font-bold text-white">15</p>
        </Card>
      </motion.div>
    </div>
  )
}

function StatCard({ title, value, icon, trend, color, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
      className="bg-glass-black/50 backdrop-blur-xl border border-white/5 p-6 rounded-2xl relative overflow-hidden group hover:border-white/10 transition-colors"
    >
      <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity rounded-bl-3xl ${color}`}>
        <div className="text-white scale-150 transform translate-x-1 -translate-y-1">{icon}</div>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${color}`}>
          {icon}
        </div>
      </div>

      <div>
        <p className="text-gray-400 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-white mb-2">{value}</h3>
        <p className="text-xs text-bright-teal flex items-center gap-1 font-medium">
          <TrendingUp className="w-3 h-3" />
          {trend}
        </p>
      </div>
    </motion.div>
  )
}
