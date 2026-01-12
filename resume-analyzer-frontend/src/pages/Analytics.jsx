import { useState, useEffect } from 'react'
import api from '../lib/api'
import { BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'
import { TrendingUp, Award, Briefcase, Target, Calendar, Lightbulb, Loader, AlertCircle, Star } from 'lucide-react'
import toast from 'react-hot-toast'

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

export default function Analytics() {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)
      const { data } = await api.get('/analytics/user')
      console.log('Analytics data:', data)
      setAnalytics(data)
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
      setError(error.response?.data?.detail || 'Failed to load analytics')
      toast.error('Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#0a0a0f]">
        <div className="text-center">
          <Loader className="animate-spin h-12 w-12 text-bright-teal mx-auto mb-4" />
          <p className="text-gray-400">Loading your analytics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 bg-[#0a0a0f] min-h-screen">
        <div className="bg-red-500/10 border-2 border-red-500/20 rounded-lg p-6 flex items-start backdrop-blur-xl">
          <AlertCircle className="h-6 w-6 text-red-400 mr-4 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-red-300 mb-2">Error Loading Analytics</h3>
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={fetchAnalytics}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 bg-[#0a0a0f] min-h-screen">
        <div className="bg-yellow-500/10 border-2 border-yellow-500/20 rounded-lg p-6 text-center backdrop-blur-xl">
          <p className="text-yellow-400">No analytics data available</p>
        </div>
      </div>
    )
  }

  const { summary, top_skills, match_score_distribution, applications_timeline, top_matching_jobs, recommendations, skill_match_data } = analytics

  // Transform top_skills array into chart format
  const topSkillsChartData = (() => {
    // If we have skill_match_data with counts, use it
    if (skill_match_data && skill_match_data.length > 0) {
      return skill_match_data.map(item => ({
        skill: item.skill,
        count: item.matches || 1
      }))
    }

    // If top_skills is an array of strings, convert to chart format
    if (top_skills && Array.isArray(top_skills) && top_skills.length > 0) {
      return top_skills.slice(0, 10).map((skill, index) => ({
        skill: typeof skill === 'string' ? skill : skill.skill,
        count: typeof skill === 'object' && skill.count ? skill.count : 10 - index
      }))
    }

    return []
  })()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-[#0a0a0f] min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white flex items-center">
          <TrendingUp className="h-10 w-10 text-bright-teal mr-3" />
          My Analytics
        </h1>
        <p className="text-gray-400 mt-2">Track your job search progress and resume performance</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <StatCard
          icon={<Briefcase className="h-6 w-6" />}
          title="Resumes Uploaded"
          value={summary?.total_resumes || 0}
          color="bg-blue-100 text-blue-600"
        />
        <StatCard
          icon={<Target className="h-6 w-6" />}
          title="Jobs Applied"
          value={summary?.total_applications || 0}
          color="bg-green-100 text-green-600"
        />
        <StatCard
          icon={<Award className="h-6 w-6" />}
          title="Total Skills"
          value={summary?.total_skills || 0}
          color="bg-purple-100 text-purple-600"
        />
        <StatCard
          icon={<TrendingUp className="h-6 w-6" />}
          title="Avg Match Score"
          value={`${summary?.average_match_score || summary?.avg_match_score || 0}%`}
          color="bg-orange-100 text-orange-600"
        />
        <StatCard
          icon={<Calendar className="h-6 w-6" />}
          title="Last 30 Days"
          value={summary?.applications_last_30_days || 0}
          color="bg-pink-100 text-pink-600"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top Skills Chart - FIXED */}
        <div className="bg-gray-900/60 backdrop-blur-xl rounded-lg shadow-lg p-6 border border-white/10">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <Award className="h-5 w-5 text-bright-teal mr-2" />
            Your Top Skills
          </h2>
          {topSkillsChartData.length > 0 ? (
            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topSkillsChartData} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="skill"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                  />
                  <YAxis tick={{ fill: '#6b7280' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '8px' }}
                  />
                  <Bar dataKey="count" fill="#3B82F6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center bg-gray-800/30 rounded-lg">
              <div className="text-center">
                <Award className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 mb-2">No skills data yet</p>
                <p className="text-sm text-gray-500">Upload a resume to see your skills!</p>
              </div>
            </div>
          )}
        </div>

        {/* Match Score Distribution */}
        <div className="bg-gray-900/60 backdrop-blur-xl rounded-lg shadow-lg p-6 border border-white/10">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <Target className="h-5 w-5 text-eco-green mr-2" />
            Match Score Distribution
          </h2>
          {match_score_distribution && match_score_distribution.length > 0 && match_score_distribution.some(d => d.count > 0) ? (
            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={match_score_distribution}
                    dataKey="count"
                    nameKey="range"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry) => `${entry.range}: ${entry.count}`}
                  >
                    {match_score_distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center bg-gray-800/30 rounded-lg">
              <div className="text-center">
                <Target className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 mb-2">No applications yet</p>
                <p className="text-sm text-gray-500">Apply to jobs to see your scores!</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Top Skills Badge Display - ADDITIONAL VISUAL */}
      {top_skills && top_skills.length > 0 && (
        <div className="bg-gray-900/60 backdrop-blur-xl rounded-lg shadow-lg p-6 mb-8 border border-white/10">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <Star className="h-5 w-5 text-accent-yellow mr-2" />
            Your Skill Portfolio
          </h2>
          <div className="flex flex-wrap gap-3">
            {top_skills.slice(0, 15).map((skill, idx) => (
              <div
                key={idx}
                className="group relative"
              >
                <div className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg shadow-md hover:shadow-xl transform hover:-translate-y-1 transition-all cursor-pointer">
                  <span className="font-semibold">{typeof skill === 'string' ? skill : skill.skill}</span>
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-xs font-bold text-gray-900 shadow-md">
                  {idx + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Applications Timeline */}
      <div className="bg-gray-900/60 backdrop-blur-xl rounded-lg shadow-lg p-6 mb-8 border border-white/10">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
          <Calendar className="h-5 w-5 text-soft-violet mr-2" />
          Application Activity (Last 30 Days)
        </h2>
        {applications_timeline && applications_timeline.length > 0 ? (
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={applications_timeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                />
                <YAxis tick={{ fill: '#6b7280' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '8px' }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#8B5CF6"
                  strokeWidth={3}
                  name="Applications"
                  dot={{ fill: '#8B5CF6', r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-80 flex items-center justify-center bg-gray-800/30 rounded-lg">
            <div className="text-center">
              <Calendar className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No application activity in the last 30 days</p>
            </div>
          </div>
        )}
      </div>

      {/* Top Matching Jobs */}
      {top_matching_jobs && top_matching_jobs.length > 0 && (
        <div className="bg-gray-900/60 backdrop-blur-xl rounded-lg shadow-lg p-6 mb-8 border border-white/10">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 text-eco-green mr-2" />
            Your Best Matches
          </h2>
          <div className="space-y-3">
            {top_matching_jobs.map((job, idx) => (
              <div key={idx} className="border-2 border-white/10 rounded-lg p-4 hover:shadow-lg hover:border-bright-teal/50 transition-all bg-gray-800/30">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-white text-lg">{job.job_title}</h3>
                    <p className="text-sm text-gray-400">{job.company}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Applied: {new Date(job.applied_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-green-600">{Math.round(job.match_score)}%</div>
                    <div className="text-xs text-gray-600">Match Score</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <div className="bg-gradient-to-r from-bright-teal/10 to-soft-violet/10 border-2 border-bright-teal/20 rounded-lg p-6 mb-8 backdrop-blur-xl">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <Lightbulb className="h-5 w-5 text-accent-yellow mr-2" />
            Personalized Recommendations
          </h2>
          <div className="space-y-3">
            {recommendations.map((rec, idx) => (
              <div key={idx} className="flex items-start bg-gray-800/40 rounded-lg p-4 shadow-sm border-l-4 border-bright-teal">
                <span className="text-2xl mr-4">{rec.split(' ')[0]}</span>
                <p className="text-gray-300 flex-1 pt-1">{rec.substring(rec.indexOf(' ') + 1)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {summary?.total_resumes === 0 && (
        <div className="bg-gradient-to-r from-accent-yellow/10 to-orange-500/10 border-2 border-accent-yellow/30 rounded-lg p-12 text-center backdrop-blur-xl">
          <Briefcase className="h-16 w-16 text-accent-yellow mx-auto mb-4" />
          <h3 className="text-2xl font-semibold text-white mb-2">Start Your Journey</h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Upload your resume to unlock analytics, get matched with jobs, and track your applications!
          </p>
          <a
            href="/upload-resume"
            className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold shadow-lg"
          >
            Upload Your First Resume
          </a>
        </div>
      )}
    </div>
  )
}

function StatCard({ icon, title, value, color }) {
  return (
    <div className="bg-gray-900/60 backdrop-blur-xl rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow border border-white/10">
      <div className={`${color} w-14 h-14 rounded-lg flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <p className="text-sm font-medium text-gray-400 mb-1">{title}</p>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
  )
}
