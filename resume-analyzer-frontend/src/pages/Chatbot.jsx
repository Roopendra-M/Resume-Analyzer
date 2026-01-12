import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../lib/api'
import { MessageSquare, Send, Loader, User, Sparkles, Zap } from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import AnimatedRobot from '../components/AnimatedRobot'
import toast from 'react-hot-toast'

// Bot icon component (using Sparkles as the bot avatar)
const Bot = ({ className }) => <Sparkles className={className} />

export default function Chatbot() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '👋 Hi! I\'m your JobCopilot AI assistant. I can help you with:\n\n• Resume optimization tips\n• Job search strategies\n• Interview preparation\n• Career advice\n• Platform navigation\n\nWhat would you like to know?',
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const messagesEndRef = useRef(null)

  useEffect(() => {
    fetchSuggestions()
    scrollToBottom()
  }, [messages])

  const fetchSuggestions = async () => {
    try {
      const { data } = await api.get('/chatbot/suggestions')
      setSuggestions(data.suggestions || [
        'How do I optimize my resume?',
        'What are the best job search strategies?',
        'How can I prepare for interviews?'
      ])
    } catch (error) {
      console.error('Failed to fetch suggestions:', error)
      setSuggestions([
        'How do I optimize my resume?',
        'What are the best job search strategies?',
        'How can I prepare for interviews?'
      ])
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSubmit = async (e, suggestionText = null) => {
    e?.preventDefault()
    const query = suggestionText || input.trim()

    if (!query || loading) return

    // Add user message
    const userMessage = { role: 'user', content: query, timestamp: new Date() }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const { data } = await api.post('/chatbot/query', { query })

      // Add assistant response
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response,
        context: data.context,
        timestamp: new Date()
      }])
    } catch (error) {
      console.error('Chat error:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '❌ Sorry, I encountered an error. Please try again or rephrase your question.',
        timestamp: new Date()
      }])
      toast.error('Failed to get response')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-4 mb-2">
          {/* Animated Robot Avatar */}
          <AnimatedRobot mood={loading ? 'thinking' : 'idle'} size="lg" />
          <div>
            <h1 className="text-3xl font-bold text-white">AI Career Assistant</h1>
            <p className="text-gray-400">Powered by Gemini AI • Available 24/7</p>
          </div>
        </div>
      </motion.div>

      {/* Chat Container */}
      <Card className="shadow-2xl overflow-hidden" style={{ height: 'calc(100vh - 250px)' }}>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4" style={{ height: 'calc(100% - 140px)' }}>
          <AnimatePresence>
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`flex items-start gap-3 max-w-2xl ${msg.role === 'user' ? 'flex-row-reverse' : ''
                    }`}
                >
                  {/* Avatar */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`flex-shrink-0 ${msg.role === 'user'
                      ? 'bg-gradient-to-br from-electric-violet to-purple-600'
                      : 'bg-gradient-to-br from-bright-teal to-emerald-500'
                      } p-2 rounded-full shadow-lg`}
                  >
                    {msg.role === 'user' ? (
                      <User className="h-5 w-5 text-white" />
                    ) : (
                      <Bot className="h-5 w-5 text-white" />
                    )}
                  </motion.div>

                  {/* Message Bubble */}
                  <div
                    className={`rounded-2xl p-4 ${msg.role === 'user'
                      ? 'bg-gradient-to-br from-electric-violet to-purple-600 text-white'
                      : 'bg-white/5 border border-white/10 text-white backdrop-blur-xl'
                      }`}
                  >
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                    {msg.context && (
                      <div className="mt-3 pt-3 border-t border-white/20 text-xs opacity-75 flex items-center gap-2">
                        <Sparkles className="w-3 h-3" />
                        <span>
                          {msg.context.resumes} resumes • {msg.context.applications} applications • {msg.context.available_jobs} jobs
                        </span>
                      </div>
                    )}
                    <p className="text-xs opacity-60 mt-2">
                      {msg.timestamp?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-4 flex items-center gap-3">
                <Loader className="animate-spin h-5 w-5 text-bright-teal" />
                <span className="text-sm text-gray-300">AI is thinking...</span>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions */}
        {suggestions.length > 0 && messages.length <= 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-6 py-3 border-t border-white/10"
          >
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-bright-teal" />
              <p className="text-xs font-medium text-gray-400">Quick questions:</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, idx) => (
                <motion.button
                  key={idx}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => handleSubmit(e, suggestion)}
                  className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs text-gray-300 hover:bg-white/10 hover:border-bright-teal/50 transition-all"
                >
                  {suggestion}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Input */}
        <div className="border-t border-white/10 p-4">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything about your career..."
              className="flex-1 px-5 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-electric-violet focus:ring-1 focus:ring-electric-violet transition-all"
              disabled={loading}
            />
            <Button
              type="submit"
              disabled={loading || !input.trim()}
              variant="glow"
              icon={<Send className="h-5 w-5" />}
              className="px-6"
            >
              Send
            </Button>
          </form>
        </div>
      </Card>
    </div>
  )
}
