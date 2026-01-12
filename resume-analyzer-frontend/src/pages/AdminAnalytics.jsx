import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart3, Users, Briefcase, FileText, TrendingUp,
  Calendar, Download, Filter, Search, ArrowUpRight
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Legend
} from 'recharts'
import api from '../lib/api'
import toast from 'react-hot-toast'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

const COLORS = ['#2DD4BF', '#7C3AED', '#F59E0B', '#EC4899', '#EF4444']

export default function AdminAnalytics() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams()
      if (startDate) params.append('start_date', startDate)
      if (endDate) params.append('end_date', endDate)

      const { data } = await api.get(`/admin/dashboard?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setStats(data)
      toast.success('Analytics loaded')
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  // Transform data for charts
  const pieData = stats ? [
    { name: 'Active Jobs', value: stats.jobs },
    { name: 'Pending Apps', value: stats.applications },
    { name: 'Resumes', value: stats.resumes }
  ] : []

  const barData = stats?.skill_scores
    ? Object.entries(stats.skill_scores)
      .slice(0, 8)
      .map(([name, value]) => ({ name, value }))
    : []

  const areaData = stats?.applications_timeline?.map(item => ({
    name: item._id,
    count: item.count
  })) || []

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
            Analytics & Reports
          </h1>
          <p className="text-gray-400">
            Deep dive into platform performance
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-auto bg-white/5 border-white/10 text-white"
          />
          <span className="text-gray-500">to</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-auto bg-white/5 border-white/10 text-white"
          />
          <Button icon={<Filter />} onClick={fetchAnalytics}>Filter</Button>
          <Button variant="outline" icon={<Download />}>Export</Button>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-16 h-16 border-4 border-electric-violet border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard
              label="Total Applications"
              value={stats?.applications || 0}
              trend="+12.5%"
              icon={<TrendingUp className="w-5 h-5 text-bright-teal" />}
              color="text-bright-teal"
            />
            <MetricCard
              label="Active Jobs"
              value={stats?.jobs || 0}
              trend="+4 new today"
              icon={<Briefcase className="w-5 h-5 text-electric-violet" />}
              color="text-electric-violet"
            />
            <MetricCard
              label="User Growth"
              value={stats?.users || 0}
              trend="+8.2%"
              icon={<Users className="w-5 h-5 text-accent-yellow" />}
              color="text-accent-yellow"
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <Card className="h-full">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-gray-400" />
                    Application Volume
                  </h3>
                </div>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={areaData}>
                      <defs>
                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                      <XAxis dataKey="name" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1e1b4b', border: '1px solid #ffffff20', borderRadius: '8px' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Area type="monotone" dataKey="count" stroke="#7C3AED" fillOpacity={1} fill="url(#colorCount)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <Card className="h-full">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-gray-400" />
                    Top Skills
                  </h3>
                </div>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                      <XAxis type="number" stroke="#94a3b8" />
                      <YAxis dataKey="name" type="category" width={100} stroke="#94a3b8" />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1e1b4b', border: '1px solid #ffffff20', borderRadius: '8px' }}
                        itemStyle={{ color: '#fff' }}
                        cursor={{ fill: 'transparent' }}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {barData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Distribution Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <div className="grid md:grid-cols-3 gap-8 items-center">
                <div className="h-[250px] col-span-1">
                  <h3 className="text-lg font-bold text-white mb-4 text-center">Data Distribution</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1e1b4b', border: '1px solid #ffffff20', borderRadius: '8px' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="col-span-2">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-white">Recent Metrics</h3>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-center">
                      <p className="text-gray-400 text-sm mb-1">Avg Match</p>
                      <p className="text-xl font-bold text-white">78%</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-center">
                      <p className="text-gray-400 text-sm mb-1">Time to Hire</p>
                      <p className="text-xl font-bold text-white">12d</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-center">
                      <p className="text-gray-400 text-sm mb-1">Engagement</p>
                      <p className="text-xl font-bold text-white">High</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-center">
                      <p className="text-gray-400 text-sm mb-1">Users</p>
                      <p className="text-xl font-bold text-white">{stats?.users}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </>
      )}
    </div>
  )
}

function MetricCard({ label, value, trend, icon, color }) {
  return (
    <Card className="hover:border-white/20 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-gray-400 text-sm font-medium">{label}</p>
          <h3 className="text-3xl font-bold text-white mt-1">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl bg-white/5 ${color}`}>
          {icon}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-green-400 text-xs font-bold bg-green-500/10 px-2 py-1 rounded flex items-center gap-1">
          <ArrowUpRight className="w-3 h-3" />
          {trend}
        </span>
        <span className="text-gray-500 text-xs">vs last period</span>
      </div>
    </Card>
  )
}
