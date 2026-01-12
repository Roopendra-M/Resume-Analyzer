import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../lib/api'
import { Upload, FileText, CheckCircle, Loader, Sparkles, Zap, Briefcase, X } from 'lucide-react'
import toast from 'react-hot-toast'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'

export default function UploadResume() {
  const [resume, setResume] = useState(null)
  const [skills, setSkills] = useState([])
  const [experience, setExperience] = useState([])
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    fetchResumeData()
  }, [])

  const fetchResumeData = async () => {
    try {
      const { data } = await api.get('/resume/me')
      if (data.resume || data._id) {
        setResume(data.resume || data)
        setSkills(data.skills || [])
        setExperience(data.experience || [])
      }
    } catch (error) {
      console.error('Failed to fetch resume:', error)
    }
  }

  const handleFileUpload = async (file) => {
    if (!file) return

    if (!file.name.match(/\.(pdf|docx)$/i)) {
      toast.error('Only PDF and DOCX files are allowed')
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const { data } = await api.post('/resume/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      toast.success('Resume analyzed successfully!')
      setSkills(data.skills || [])
      setExperience(data.experience || [])
      fetchResumeData()
    } catch (error) {
      console.error('Upload error:', error)
      toast.error(error.response?.data?.detail || 'Failed to upload resume')
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files[0]
    handleFileUpload(file)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = () => {
    setDragActive(false)
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Resume <span className="text-bright-teal">Analysis</span>
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Upload your resume to extract skills, experience, and get personalized job recommendations.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-5 gap-8">
        {/* Upload Column */}
        <div className="md:col-span-2 space-y-6">
          <Card className="h-full flex flex-col items-center justify-center p-0 overflow-hidden relative group">
            {/* Animated Gradient Border Effect */}
            <div className={`absolute inset-0 bg-gradient-to-br from-bright-teal/20 to-electric-violet/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none`} />

            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`w-full h-full p-8 flex flex-col items-center justify-center text-center transition-all duration-300 ${dragActive
                ? 'bg-white/10 backdrop-blur-md scale-[0.98]'
                : ''
                }`}
            >
              {uploading ? (
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <div className="w-20 h-20 border-4 border-white/10 border-t-bright-teal rounded-full animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Sparkles className="w-8 h-8 text-bright-teal animate-pulse" />
                    </div>
                  </div>
                  <p className="mt-6 text-white font-medium animate-pulse">Analyzing Resume...</p>
                </div>
              ) : (
                <>
                  <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br from-white/5 to-white/10 border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg ${dragActive ? 'scale-110' : ''}`}>
                    <Upload className="w-8 h-8 text-bright-teal" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Upload Resume</h3>
                  <p className="text-sm text-gray-400 mb-6">Drag & drop your PDF or DOCX<br />file here to start</p>

                  <div className="relative">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.docx"
                      onChange={(e) => handleFileUpload(e.target.files[0])}
                      className="hidden"
                    />
                    <Button
                      icon={<FileText />}
                      onClick={() => fileInputRef.current?.click()}
                      type="button"
                    >
                      Choose File
                    </Button>
                  </div>
                </>
              )}
            </div>
          </Card>
        </div>

        {/* Results Column */}
        <div className="md:col-span-3 space-y-6">
          {resume ? (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              {/* File Info */}
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-white font-medium text-sm">{resume.filename}</p>
                    <p className="text-xs text-green-400">Analysis Complete</p>
                  </div>
                </div>
                <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white" onClick={() => setResume(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Extracted Skills */}
              <Card>
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-5 h-5 text-amber-400" />
                  <h3 className="font-bold text-white">Extracted Skills</h3>
                </div>
                {skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill, idx) => (
                      <motion.span
                        key={idx}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        className="px-3 py-1 bg-white/5 text-gray-300 rounded-full text-sm border border-white/10 hover:border-bright-teal hover:text-bright-teal transition-colors cursor-default"
                      >
                        {skill}
                      </motion.span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No skills found.</p>
                )}
              </Card>
            </motion.div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 border-2 border-dashed border-white/10 rounded-2xl text-center">
              <FileText className="w-16 h-16 text-white/5 mb-4" />
              <p className="text-gray-500">Upload a resume to see the magic happen</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
