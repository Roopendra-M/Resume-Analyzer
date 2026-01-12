import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../lib/api'
import { MessageSquare, Star, Send, CheckCircle2, Sparkles, Heart } from 'lucide-react'
import toast from 'react-hot-toast'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'

export default function Feedback() {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (rating === 0) {
      toast.error('Please select a rating')
      return
    }

    setSubmitting(true)
    try {
      await api.post('/feedback/', { message, rating })
      setSubmitted(true)
      toast.success('Thank you for your feedback! 🎉')

      // Reset form after 3 seconds
      setTimeout(() => {
        setMessage('')
        setRating(0)
        setSubmitted(false)
      }, 3000)
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit feedback')
    } finally {
      setSubmitting(false)
    }
  }

  const getRatingLabel = (stars) => {
    const labels = {
      1: { emoji: '😢', text: 'Needs Work', color: 'text-red-400' },
      2: { emoji: '😐', text: 'Fair', color: 'text-orange-400' },
      3: { emoji: '👍', text: 'Good', color: 'text-yellow-400' },
      4: { emoji: '😊', text: 'Great', color: 'text-blue-400' },
      5: { emoji: '🎉', text: 'Excellent', color: 'text-green-400' }
    }
    return labels[stars] || { emoji: '', text: '', color: '' }
  }

  if (submitted) {
    return (
      <div className="p-6 max-w-3xl mx-auto min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', duration: 0.6 }}
        >
          <Card className="text-center max-w-md" glowBorder>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1, rotate: 360 }}
              transition={{ delay: 0.2, type: 'spring', duration: 0.8 }}
              className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-bright-teal to-electric-violet flex items-center justify-center shadow-neon"
            >
              <CheckCircle2 className="h-12 w-12 text-white" />
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-3xl font-bold text-white mb-3"
            >
              Thank You! 🎉
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-gray-400 text-lg"
            >
              Your feedback helps us improve
            </motion.p>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl mx-auto min-h-screen flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full"
      >
        <Card className="w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className="relative inline-block mb-6"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-bright-teal to-electric-violet rounded-full blur-xl opacity-50 animate-pulse"></div>
              <div className="relative p-5 bg-gradient-to-r from-bright-teal to-electric-violet rounded-full">
                <Sparkles className="h-12 w-12 text-white" />
              </div>
            </motion.div>
            <h1 className="text-4xl font-bold text-white mb-3">
              We Value Your Feedback
            </h1>
            <p className="text-gray-400 text-lg">
              Help us create a better experience for you
            </p>
          </div>

          {/* Rating Section */}
          <div className="mb-8">
            <label className="block text-lg font-bold text-white mb-6 text-center">
              How would you rate your experience?
            </label>
            <div className="flex justify-center gap-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <motion.button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  whileHover={{ scale: 1.2, rotate: 15 }}
                  whileTap={{ scale: 0.9 }}
                  className="group focus:outline-none"
                  type="button"
                >
                  <Star
                    className={`h-14 w-14 transition-all ${star <= (hoverRating || rating)
                        ? 'fill-accent-yellow text-accent-yellow drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]'
                        : 'text-gray-600 group-hover:text-accent-yellow/50'
                      }`}
                  />
                </motion.button>
              ))}
            </div>
            <AnimatePresence>
              {rating > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-center mt-6"
                >
                  <span className={`inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-lg bg-white/5 border border-white/10 ${getRatingLabel(rating).color}`}>
                    <span className="text-2xl">{getRatingLabel(rating).emoji}</span>
                    {getRatingLabel(rating).text}!
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Message Section */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-white mb-3 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-bright-teal" />
                <span>Tell us more (optional)</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                placeholder="Share your thoughts, suggestions, or report issues..."
                className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-electric-violet focus:ring-1 focus:ring-electric-violet transition-all resize-none"
              />
              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                <Heart className="w-3 h-3" />
                <span>Your feedback is anonymous and helps us improve</span>
              </p>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              isLoading={submitting}
              disabled={rating === 0}
              className="w-full"
              variant="glow"
              size="lg"
              iconPosition="right"
              icon={<Send className="h-6 w-6" />}
            >
              Submit Feedback
            </Button>
          </form>

          {/* Footer Message */}
          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-sm text-gray-400">
              Thank you for taking the time to share your feedback with us! 💙
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}
