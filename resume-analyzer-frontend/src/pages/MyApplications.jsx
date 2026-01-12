import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import {
  Briefcase, MapPin, Calendar, TrendingUp, Loader,
  Building, Clock, MoreVertical, Search, Filter, CheckCircle2
} from 'lucide-react'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'

export default function MyApplications() {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedJob, setSelectedJob] = useState(null)
  const [showJobModal, setShowJobModal] = useState(false)

  useEffect(() => {
    fetchApplications()
  }, [])

  const fetchApplications = async () => {
    try {
      const { data } = await api.get('/apply/me')
      setApplications(data)
    } catch (error) {
      console.error('Failed to fetch applications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewJobDetails = (application) => {
    setSelectedJob(application.job_details || application)
    setShowJobModal(true)
  }

  const filteredApps = applications.filter(app =>
    app.job_details?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.job_details?.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.job_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.company?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-16 h-16 border-4 border-electric-violet border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto min-h-screen space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            My Applications
          </h1>
          <p className="text-gray-400">
            Track and manage your job applications
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Search applications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-bright-teal transition-colors w-full md:w-64"
            />
          </div>
        </div>
      </motion.div>

      {/* Applications List */}
      <div className="space-y-4">
        <AnimatePresence>
          {filteredApps.length > 0 ? (
            filteredApps.map((app, index) => (
              <ApplicationCard
                key={app.id || index}
                application={app}
                index={index}
                onViewDetails={handleViewJobDetails}
              />
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <div className="bg-white/5 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <Briefcase className="w-8 h-8 text-gray-500" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">No applications found</h2>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">
                {searchTerm ? "No applications match your search criteria." : "You haven't applied to any jobs yet. Start exploring opportunities!"}
              </p>
              <Link to="/jobs">
                <Button icon={<Briefcase />}>Browse Jobs</Button>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Job Details Modal */}
      {showJobModal && selectedJob && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowJobModal(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-gray-900 rounded-3xl border-2 border-white/10 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-gray-900/95 backdrop-blur-xl border-b border-white/10 p-6 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">{selectedJob.title}</h2>
                <p className="text-lg text-gray-300">{selectedJob.company}</p>
              </div>
              <button
                onClick={() => setShowJobModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Job Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Location</p>
                  <p className="text-white flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-bright-teal" />
                    {selectedJob.location || 'Remote'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Job Type</p>
                  <p className="text-white">{selectedJob.job_type || 'Full-time'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Remote Type</p>
                  <p className="text-white">{selectedJob.remote_type || 'On-site'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Experience Level</p>
                  <p className="text-white">{selectedJob.experience_level || 'Not specified'}</p>
                </div>
              </div>

              {/* Salary */}
              {selectedJob.salary && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Salary</p>
                  <p className="text-white font-semibold">{selectedJob.salary}</p>
                </div>
              )}

              {/* Description */}
              {selectedJob.description && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Job Description</p>
                  <p className="text-gray-300 whitespace-pre-wrap">{selectedJob.description}</p>
                </div>
              )}

              {/* Required Skills */}
              {selectedJob.required_skills && selectedJob.required_skills.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Required Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedJob.required_skills.map((skill, idx) => (
                      <span key={idx} className="px-3 py-1 bg-soft-violet/10 text-soft-violet rounded-full text-sm border border-soft-violet/20">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* External Link */}
              {selectedJob.job_url && (
                <div className="pt-4 border-t border-white/10">
                  <a
                    href={selectedJob.job_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-bright-teal to-soft-violet text-white rounded-xl hover:shadow-lg transition-all font-bold"
                  >
                    View Original Posting
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

function ApplicationCard({ application, index, onViewDetails }) {
  const getMatchColor = (score) => {
    if (score >= 80) return 'text-green-400 bg-green-500/10 border-green-500/20'
    if (score >= 60) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
    return 'text-red-400 bg-red-500/10 border-red-500/20'
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'interviewing': return 'bg-purple-500/10 text-purple-400 border-purple-500/20'
      case 'rejected': return 'bg-red-500/10 text-red-400 border-red-500/20'
      case 'offer': return 'bg-green-500/10 text-green-400 border-green-500/20'
      default: return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
    }
  }

  // Use job_details if available, fallback to old structure
  const jobTitle = application.job_details?.title || application.job_title
  const company = application.job_details?.company || application.company
  const location = application.job_details?.location || application.location

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="hover:border-bright-teal/50 transition-colors group">
        <div className="flex flex-col md:flex-row md:items-center gap-6">

          {/* Company Logo / Placeholder */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-white/5 to-white/10 flex items-center justify-center border border-white/10 shrink-0">
            <Building className="w-8 h-8 text-white/40" />
          </div>

          {/* Main Info */}
          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
              <h3 className="text-xl font-bold text-white group-hover:text-bright-teal transition-colors">
                {jobTitle}
              </h3>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(application.status || 'applied')}`}>
                  {application.status || 'Applied'}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1 ${getMatchColor(application.match_score)}`}>
                  <TrendingUp className="w-3 h-3" />
                  {Math.round(application.match_score)}% Match
                </span>
              </div>
            </div>

            <p className="text-lg text-gray-300 font-medium mb-2">{company}</p>

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {location || 'Remote'}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Applied on {new Date(application.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 md:self-center">
            {application.resume_filename && (
              <div className="hidden md:flex flex-col items-end mr-4">
                <span className="text-xs text-gray-500">Resume Used:</span>
                <span className="text-xs text-bright-teal font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> {application.resume_filename}
                </span>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              className="hidden md:flex"
              onClick={() => onViewDetails(application)}
            >
              View Details
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
