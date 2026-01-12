import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../lib/api'
import {
  MessageCircle, X, Send, Loader, Sparkles, User, Bot,
  Minimize2, Maximize2, Trash2, RotateCcw
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversationId, setConversationId] = useState(null)
  const [suggestions, setSuggestions] = useState([])
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Show welcome message
      setMessages([{
        role: 'assistant',
        content: "👋 Hi! I'm your JobCopilot AI assistant. I can help you with:\n\n• Resume tips and optimization\n• Job search strategies\n• Interview preparation\n• Career guidance\n• Platform navigation\n\nWhat would you like to know?",
        timestamp: new Date()
      }])
      fetchSuggestions()
    }
  }, [isOpen])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchSuggestions = async () => {
    try {
      const { data } = await api.post('/chatbot/quick-help')
      setSuggestions(data.suggestions || [])
    } catch (error) {
      console.error('Failed to fetch suggestions:', error)
    }
  }

  const sendMessage = async (text = input) => {
    if (!text.trim()) return

    const userMessage = {
      role: 'user',
      content: text,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const { data } = await api.post('/chatbot/query', {
        query: text,
        conversation_id: conversationId
      })

      if (!conversationId && data.conversation_id) {
        setConversationId(data.conversation_id)
      }

      const assistantMessage = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Failed to send message:', error)
      toast.error('Failed to send message')

      const errorMessage = {
        role: 'assistant',
        content: "I'm sorry, I encountered an error. Please try again.",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: "Chat cleared! How can I help you?",
      timestamp: new Date()
    }])
    setConversationId(null)
  }

  // Floating Button
  if (!isOpen) {
    return (
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 p-4 bg-gradient-to-r from-bright-teal to-electric-violet rounded-full shadow-2xl hover:shadow-bright-teal/50 transition-all"
      >
        <MessageCircle className="h-6 w-6 text-white" />
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
      </motion.button>
    )
  }

  // Chat Widget
  return (
    <motion.div
      initial={{ opacity: 0, y: 100, scale: 0.8 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
        height: isMinimized ? '60px' : '600px'
      }}
      exit={{ opacity: 0, y: 100, scale: 0.8 }}
      className={`fixed bottom-6 right-6 z-50 w-96 bg-gradient-to-br from-deep-navy to-dark-slate rounded-2xl shadow-2xl border border-white/10 overflow-hidden flex flex-col`}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-bright-teal to-electric-violet p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-white">JobCopilot AI</h3>
            <p className="text-xs text-white/80">Your Career Assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            {isMinimized ? (
              <Maximize2 className="h-4 w-4 text-white" />
            ) : (
              <Minimize2 className="h-4 w-4 text-white" />
            )}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="h-4 w-4 text-white" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-deep-navy/50 to-dark-slate/50">
            <AnimatePresence>
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] ${msg.role === 'user'
                      ? 'bg-gradient-to-r from-bright-teal to-electric-violet text-white'
                      : 'bg-white/10 text-gray-200'
                    } rounded-2xl p-3 shadow-lg`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    <p className="text-xs opacity-60 mt-1">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
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
                <div className="bg-white/10 rounded-2xl p-3 flex items-center gap-2">
                  <Loader className="h-4 w-4 text-bright-teal animate-spin" />
                  <span className="text-sm text-gray-300">Thinking...</span>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions */}
          {suggestions.length > 0 && messages.length <= 1 && (
            <div className="p-4 bg-white/5 border-t border-white/10">
              <p className="text-xs text-gray-400 mb-2">Quick actions:</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.slice(0, 3).map((sug, idx) => (
                  <button
                    key={idx}
                    onClick={() => sendMessage(sug.title)}
                    className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-full text-xs text-gray-300 transition-colors flex items-center gap-1"
                  >
                    <span>{sug.icon}</span>
                    <span>{sug.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 bg-white/5 border-t border-white/10">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything..."
                disabled={loading}
                className="flex-1 px-4 py-2 bg-white/10 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-bright-teal focus:outline-none text-sm disabled:opacity-50"
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className="p-2 bg-gradient-to-r from-bright-teal to-electric-violet rounded-xl hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
              >
                <Send className="h-5 w-5 text-white" />
              </button>
              <button
                onClick={clearChat}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
                title="Clear chat"
              >
                <RotateCcw className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Press Enter to send • Shift+Enter for new line
            </p>
          </div>
        </>
      )}
    </motion.div>
  )
}
