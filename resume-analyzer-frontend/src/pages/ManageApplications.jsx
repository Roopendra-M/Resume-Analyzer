import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../lib/api'
import {
  Search, Filter, Download, Trash2, Eye, CheckCircle, Clock, XCircle,
  X, Mail, Briefcase, GraduationCap, Code, MoreHorizontal, User, Calendar
} from 'lucide-react'
import toast from 'react-hot-toast'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'

export default function ManageApplications() {
  const [applications, setApplications] = useState([])
  const [filteredApps, setFilteredApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedApp, setSelectedApp] = useState(null)
  const [appDetails, setAppDetails] = useState(null)
  const [detailsLoading, setDetailsLoading] = useState(false)

  useEffect(() => {
    fetchApplications()
  }, [])

  useEffect(() => {
    filterAndSortApplications()
  }, [applications, searchTerm, filterStatus])

  const fetchApplications = async () => {
    try {
      const token = localStorage.getItem('token')
      const { data } = await api.get('/admin/applications', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setApplications(data)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to load applications')
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortApplications = () => {
    let filtered = [...applications]
    if (searchTerm) {
      filtered = filtered.filter(app =>
        app.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.job_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.company?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    if (filterStatus !== 'all') {
      filtered = filtered.filter(app => app.status === filterStatus)
    }
    setFilteredApps(filtered)
  }

  const handleDeleteApplication = async (appId) => {
    if (!window.confirm('Delete this application permanently?')) return
    try {
      const token = localStorage.getItem('token')
      await api.delete(`/admin/applications/${appId}`, { headers: { Authorization: `Bearer ${token}` } })
      setApplications(applications.filter(app => app._id !== appId))
      toast.success('Application deleted')
    } catch (error) {
      toast.error('Failed to delete')
    }
  }

  // Simplified fetch details mock/real hybrid
  const fetchApplicationDetails = async (app) => {
    setDetailsLoading(true)
    setSelectedApp(app)
    // Here we would fetch real details if endpoints exist, otherwise simulate
    setTimeout(() => {
      setAppDetails({
        skills: ['React', 'Node.js', 'Typescript', 'Tailwind', 'Python'],
        experience: [
          { title: 'Frontend Developer', company: 'Tech Corp', duration: '2022-Present' },
          { title: 'Intern', company: 'Startup Inc', duration: '2021-2022' }
        ],
        education: [
          { degree: 'BS Computer Science', school: 'University of Tech', year: '2021' }
        ]
      })
      setDetailsLoading(false)
    }, 500)
  }

  if (loading) return <div className="flex justify-center items-center min-h-screen"><div className="w-16 h-16 border-4 border-electric-violet border-t-transparent rounded-full animate-spin" /></div>

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
            Application Management
          </h1>
          <p className="text-gray-400">
            Review and manage incoming candidate applications
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" icon={<Download />}>Export CSV</Button>
        </div>
      </motion.div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by candidate, job, or company..."
            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-bright-teal transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
          {['all', 'pending', 'accepted', 'rejected'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg font-medium capitalize text-sm whitespace-nowrap transition-colors ${filterStatus === status
                  ? 'bg-bright-teal text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Applications Grid/List */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 text-gray-400 font-medium text-sm">Candidate</th>
                <th className="px-6 py-4 text-gray-400 font-medium text-sm">Job Role</th>
                <th className="px-6 py-4 text-gray-400 font-medium text-sm">Match</th>
                <th className="px-6 py-4 text-gray-400 font-medium text-sm">Status</th>
                <th className="px-6 py-4 text-gray-400 font-medium text-sm">Applied</th>
                <th className="px-6 py-4 text-gray-400 font-medium text-sm text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredApps.map((app, idx) => (
                <motion.tr
                  key={app._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group hover:bg-white/5 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-bright-teal to-blue-500 flex items-center justify-center text-white font-bold text-xs ring-2 ring-white/10">
                        {app.user_email?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div className="truncate max-w-[150px]">
                        <p className="text-white font-medium text-sm truncate">{app.user_email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-white font-medium text-sm">{app.job_title}</p>
                    <p className="text-gray-500 text-xs">{app.company}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold border ${getMatchColor(app.match_score)}`}>
                      {app.match_score}%
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(app.status)}
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-sm">
                    {new Date(app.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => fetchApplicationDetails(app)}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-bright-teal transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteApplication(app._id)}
                        className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {filteredApps.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              No applications found matching your filters.
            </div>
          )}
        </div>
      </Card>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedApp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-deep-navy border border-white/10 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-white/10 flex justify-between items-start bg-glass-black/50">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-bright-teal to-electric-violet flex items-center justify-center text-white font-bold text-xl shadow-lg">
                    {selectedApp.user_email?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white mb-1">Application Details</h2>
                    <p className="text-gray-400 text-sm flex items-center gap-2">
                      <Mail className="w-3 h-3" /> {selectedApp.user_email}
                    </p>
                  </div>
                </div>
                <button onClick={() => setSelectedApp(null)} className="text-gray-400 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-deep-navy">
                {/* Job Info */}
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                  <div>
                    <p className="text-gray-400 text-xs uppercase font-bold mb-1">Applied For</p>
                    <h3 className="text-lg font-bold text-white">{selectedApp.job_title}</h3>
                    <p className="text-bright-teal text-sm">{selectedApp.company}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-400 text-xs uppercase font-bold mb-1">Match Score</p>
                    <p className="text-2xl font-bold text-accent-yellow">{selectedApp.match_score}%</p>
                  </div>
                </div>

                {detailsLoading ? (
                  <div className="py-12 flex justify-center">
                    <div className="w-8 h-8 border-2 border-white/20 border-t-bright-teal rounded-full animate-spin" />
                  </div>
                ) : appDetails && (
                  <>
                    {/* Skills */}
                    <div>
                      <h4 className="text-sm font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
                        <Code className="w-4 h-4" /> Skills
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {appDetails.skills.map(skill => (
                          <span key={skill} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-gray-300">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Experience */}
                    <div>
                      <h4 className="text-sm font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
                        <Briefcase className="w-4 h-4" /> Experience
                      </h4>
                      <div className="space-y-4">
                        {appDetails.experience.map((exp, i) => (
                          <div key={i} className="pl-4 border-l-2 border-white/10 relative">
                            <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-bright-teal" />
                            <h5 className="text-white font-bold text-sm">{exp.title}</h5>
                            <p className="text-gray-400 text-xs mb-1">{exp.company} • {exp.duration}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-white/10 bg-glass-black/50 flex justify-end gap-3">
                <Button variant="outline" onClick={() => setSelectedApp(null)}>Close</Button>
                <Button variant="primary" className="bg-red-500 hover:bg-red-600 border-none" icon={<Trash2 />} onClick={() => {
                  handleDeleteApplication(selectedApp._id);
                  setSelectedApp(null);
                }}>
                  Delete Application
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function getMatchColor(score) {
  if (score >= 80) return 'border-green-500/20 text-green-400 bg-green-500/10'
  if (score >= 60) return 'border-yellow-500/20 text-yellow-400 bg-yellow-500/10'
  return 'border-red-500/20 text-red-400 bg-red-500/10'
}

function getStatusBadge(status) {
  const styles = {
    pending: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    accepted: 'text-green-400 bg-green-500/10 border-green-500/20',
    rejected: 'text-red-400 bg-red-500/10 border-red-500/20'
  }
  const s = status?.toLowerCase() || 'pending'
  return (
    <span className={`px-2 py-1 rounded text-xs font-medium border capitalize ${styles[s] || styles.pending}`}>
      {status || 'pending'}
    </span>
  )
}
