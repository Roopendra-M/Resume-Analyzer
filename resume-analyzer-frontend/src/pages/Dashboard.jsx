import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  FileText, Send, Briefcase, ArrowRight, BarChart3,
  TrendingUp, Clock, Zap, Star, MapPin, DollarSign, Calendar
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import api from '../lib/api'
import toast from 'react-hot-toast'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [recentApplications, setRecentApplications] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const [chartData, setChartData] = useState([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [resumesRes, appsRes, jobsRes, analyticsRes, recsRes] = await Promise.all([
        api.get('/resume/me'),
        api.get('/apply/me'),
        api.get('/jobs/'),
        api.get('/analytics/user'),
        api.get('/jobs/recommendations?limit=3').catch(() => ({ data: { recommendations: [] } }))
      ])

      setStats({
        resumes: resumesRes.data.resume ? 1 : 0,
        applications: appsRes.data.length,
        jobs: jobsRes.data.length,
        avgMatch: appsRes.data.reduce((sum, app) => sum + (app.match_score || 0), 0) / (appsRes.data.length || 1)
      })

      setRecentApplications(appsRes.data.slice(0, 5))
      setRecommendations(recsRes.data.recommendations || [])

      // Mock Chart Data (since backend might not provide daily history yet)
      const mockData = [
        { name: 'Mon', apps: 2 },
        { name: 'Tue', apps: 4 },
        { name: 'Wed', apps: 1 },
        { name: 'Thu', apps: 5 },
        { name: 'Fri', apps: 3 },
        { name: 'Sat', apps: 2 },
        { name: 'Sun', apps: 1 },
      ]
      setChartData(mockData)

    } catch (error) {
      console.error('Dashboard error:', error)
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
            Dashboard
          </h1>
          <p className="text-gray-400">
            Overview of your job search progress
          </p>
        </div>
        <div className="flex gap-3">
          <Link to="/jobs">
            <Button variant="outline" icon={<Briefcase />}>Browse Jobs</Button>
          </Link>
          <Link to="/upload-resume">
            <Button variant="primary" icon={<FileText />}>Analyze Resume</Button>
          </Link>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Applications"
          value={stats?.applications || 0}
          icon={<Send className="w-6 h-6 text-white" />}
          trend="+12% from last week"
          color="bg-gradient-to-br from-electric-violet to-purple-600"
          delay={0.1}
        />
        <StatCard
          title="Interviews"
          value={stats?.applications > 0 ? Math.floor(stats.applications * 0.2) : 0} // Mock calc
          icon={<Calendar className="w-6 h-6 text-white" />}
          trend="3 scheduled"
          color="bg-gradient-to-br from-bright-teal to-emerald-500"
          delay={0.2}
        />
        <StatCard
          title="Avg Match Score"
          value={`${Math.round(stats?.avgMatch || 0)}%`}
          icon={<Zap className="w-6 h-6 text-white" />}
          trend="Top 10% of candidates"
          color="bg-gradient-to-br from-amber-400 to-orange-500"
          delay={0.3}
        />
        <StatCard
          title="Profile Views"
          value="128"
          icon={<TrendingUp className="w-6 h-6 text-white" />}
          trend="+24 new visitors"
          color="bg-gradient-to-br from-pink-500 to-rose-500"
          delay={0.4}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2"
        >
          <Card className="h-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-bright-teal" />
                Application Activity
              </h3>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e1b4b', border: '1px solid #ffffff20', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="apps" stroke="#7c3aed" fillOpacity={1} fill="url(#colorApps)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>

        {/* Recommended Jobs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="h-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Star className="w-5 h-5 text-accent-yellow" />
                Top Picks
              </h3>
              <Link to="/jobs" className="text-sm text-bright-teal hover:text-white transition-colors">
                View All
              </Link>
            </div>
            <div className="space-y-4">
              {recommendations.length > 0 ? recommendations.map((job, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group cursor-pointer" onClick={() => window.location.href = `/jobs`}>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-white group-hover:text-bright-teal transition-colors line-clamp-1">{job.title}</h4>
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/20">
                      {job.match_score}%
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mb-2">{job.company}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {job.location}</span>
                    <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> {job.salary || 'Competitive'}</span>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-gray-500">
                  No recommendations yet. Upload a resume to get matched!
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Recent Applications Table (Simplified) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">Recent Applications</h3>
            <Link to="/my-applications">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 text-sm">
                  <th className="pb-4 font-medium">Role</th>
                  <th className="pb-4 font-medium">Company</th>
                  <th className="pb-4 font-medium">Date Applied</th>
                  <th className="pb-4 font-medium">Status</th>
                  <th className="pb-4 font-medium text-right">Match</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentApplications.map((app) => (
                  <tr key={app._id} className="group hover:bg-white/5 transition-colors">
                    <td className="py-4 text-white font-medium">{app.job_title}</td>
                    <td className="py-4 text-gray-400">{app.company}</td>
                    <td className="py-4 text-gray-400">{new Date(app.created_at).toLocaleDateString()}</td>
                    <td className="py-4">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/20">
                        {app.status || 'Applied'}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <span className="text-bright-teal font-bold">{app.match_score}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {recentApplications.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                You haven't applied to any jobs yet.
              </div>
            )}
          </div>
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
