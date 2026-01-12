import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../lib/api'
import {
    Video, Mic, MicOff, VideoOff, Phone, Send, Loader,
    MessageSquare, User, Bot, Volume2, VolumeX, Settings,
    CheckCircle2, XCircle, Award, TrendingUp
} from 'lucide-react'
import toast from 'react-hot-toast'

const INTERVIEW_TYPES = [
    { id: 'technical', name: 'Technical Interview', icon: '💻', color: 'from-blue-500 to-cyan-500' },
    { id: 'behavioral', name: 'Behavioral Interview', icon: '🤝', color: 'from-purple-500 to-pink-500' },
    { id: 'hr', name: 'HR Interview', icon: '💼', color: 'from-green-500 to-emerald-500' },
    { id: 'case_study', name: 'Case Study', icon: '📊', color: 'from-orange-500 to-red-500' }
]

export default function VideoInterview() {
    // Interview state
    const [selectedType, setSelectedType] = useState(null)
    const [sessionId, setSessionId] = useState(null)
    const [conversation, setConversation] = useState([])
    const [isInterviewActive, setIsInterviewActive] = useState(false)
    const [jobRole, setJobRole] = useState('Software Engineer')
    const [difficulty, setDifficulty] = useState('medium')

    // Media state
    const [isVideoOn, setIsVideoOn] = useState(true)
    const [isMicOn, setIsMicOn] = useState(true)
    const [isListening, setIsListening] = useState(false)
    const [isSpeaking, setIsSpeaking] = useState(false)
    const [currentTranscript, setCurrentTranscript] = useState('')

    // Refs
    const videoRef = useRef(null)
    const mediaStreamRef = useRef(null)
    const recognitionRef = useRef(null)
    const synthRef = useRef(window.speechSynthesis)

    // Final results
    const [finalFeedback, setFinalFeedback] = useState(null)
    const [isCompleted, setIsCompleted] = useState(false)

    // Initialize webcam
    useEffect(() => {
        if (isInterviewActive && isVideoOn) {
            startWebcam()
        }
        return () => {
            stopWebcam()
        }
    }, [isInterviewActive, isVideoOn])

    // Initialize speech recognition
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition
            recognitionRef.current = new SpeechRecognition()
            recognitionRef.current.continuous = true
            recognitionRef.current.interimResults = true
            recognitionRef.current.lang = 'en-US'

            recognitionRef.current.onresult = (event) => {
                let interimTranscript = ''
                let finalTranscript = ''

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript + ' '
                    } else {
                        interimTranscript += transcript
                    }
                }

                setCurrentTranscript(finalTranscript || interimTranscript)
            }

            recognitionRef.current.onerror = (event) => {
                console.error('Speech recognition error:', event.error)
                setIsListening(false)
            }

            recognitionRef.current.onend = () => {
                setIsListening(false)
            }
        }
    }, [])

    const startWebcam = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            })
            if (videoRef.current) {
                videoRef.current.srcObject = stream
            }
            mediaStreamRef.current = stream
        } catch (error) {
            console.error('Error accessing webcam:', error)
            toast.error('Failed to access camera/microphone')
        }
    }

    const stopWebcam = () => {
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop())
        }
    }

    const toggleVideo = () => {
        if (mediaStreamRef.current) {
            const videoTrack = mediaStreamRef.current.getVideoTracks()[0]
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled
                setIsVideoOn(videoTrack.enabled)
            }
        }
    }

    const toggleMic = () => {
        if (mediaStreamRef.current) {
            const audioTrack = mediaStreamRef.current.getAudioTracks()[0]
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled
                setIsMicOn(audioTrack.enabled)
            }
        }
    }

    const startListening = () => {
        if (recognitionRef.current && !isListening) {
            setCurrentTranscript('')
            recognitionRef.current.start()
            setIsListening(true)
        }
    }

    const stopListening = () => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop()
            setIsListening(false)
        }
    }

    const speak = (text) => {
        return new Promise((resolve) => {
            if (synthRef.current) {
                synthRef.current.cancel() // Cancel any ongoing speech

                const utterance = new SpeechSynthesisUtterance(text)
                utterance.rate = 0.9
                utterance.pitch = 1
                utterance.volume = 1

                utterance.onstart = () => setIsSpeaking(true)
                utterance.onend = () => {
                    setIsSpeaking(false)
                    resolve()
                }
                utterance.onerror = () => {
                    setIsSpeaking(false)
                    resolve()
                }

                synthRef.current.speak(utterance)
            } else {
                resolve()
            }
        })
    }

    const startInterview = async (type) => {
        try {
            const { data } = await api.post('/ai-interview/start', {
                interview_type: type,
                job_role: jobRole,
                difficulty: difficulty
            })

            setSessionId(data.session_id)
            setSelectedType(type)
            setIsInterviewActive(true)

            const aiMessage = {
                role: 'interviewer',
                content: data.interviewer_message,
                timestamp: new Date()
            }

            setConversation([aiMessage])

            // Speak the greeting
            await speak(data.interviewer_message)

            toast.success('Interview started! 🎥')
        } catch (error) {
            console.error('Failed to start interview:', error)
            toast.error('Failed to start interview')
        }
    }

    const sendAnswer = async (answer) => {
        if (!answer.trim()) return

        try {
            // Add user message to conversation
            const userMessage = {
                role: 'candidate',
                content: answer,
                timestamp: new Date()
            }
            setConversation(prev => [...prev, userMessage])
            setCurrentTranscript('')

            // Send to backend
            const { data } = await api.post('/ai-interview/message', {
                session_id: sessionId,
                message: answer
            })

            // Add AI response to conversation
            const aiMessage = {
                role: 'interviewer',
                content: data.interviewer_message,
                timestamp: new Date()
            }
            setConversation(prev => [...prev, aiMessage])

            // Speak AI response
            await speak(data.interviewer_message)

            // Check if completed
            if (data.status === 'completed') {
                setIsCompleted(true)
                setFinalFeedback(data.final_feedback)
                setIsInterviewActive(false)
                stopWebcam()
            }
        } catch (error) {
            console.error('Failed to send answer:', error)
            toast.error('Failed to send answer')
        }
    }

    const endInterview = async () => {
        try {
            const { data } = await api.post(`/ai-interview/end/${sessionId}`)
            setFinalFeedback(data.final_feedback)
            setIsCompleted(true)
            setIsInterviewActive(false)
            stopWebcam()
            toast.success('Interview ended')
        } catch (error) {
            console.error('Failed to end interview:', error)
            toast.error('Failed to end interview')
        }
    }

    const resetInterview = () => {
        setSelectedType(null)
        setSessionId(null)
        setConversation([])
        setIsInterviewActive(false)
        setIsCompleted(false)
        setFinalFeedback(null)
        setCurrentTranscript('')
    }

    // Selection Screen
    if (!selectedType && !isCompleted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-deep-navy via-dark-slate to-deep-navy p-6 md:p-8">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-12"
                    >
                        <Video className="h-16 w-16 text-bright-teal mx-auto mb-4" />
                        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-bright-teal to-electric-violet bg-clip-text text-transparent mb-4">
                            AI Video Interview
                        </h1>
                        <p className="text-xl text-gray-400">
                            Real-time video interview with AI interviewer • Audio & Video enabled
                        </p>
                    </motion.div>

                    {/* Settings */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 mb-8"
                    >
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <Settings className="h-5 w-5 text-bright-teal" />
                            Interview Settings
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-300 mb-2">
                                    Job Role
                                </label>
                                <input
                                    type="text"
                                    value={jobRole}
                                    onChange={(e) => setJobRole(e.target.value)}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-bright-teal focus:outline-none"
                                    placeholder="e.g., Software Engineer"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-300 mb-2">
                                    Difficulty Level
                                </label>
                                <select
                                    value={difficulty}
                                    onChange={(e) => setDifficulty(e.target.value)}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-bright-teal focus:outline-none"
                                >
                                    <option value="easy">Easy</option>
                                    <option value="medium">Medium</option>
                                    <option value="hard">Hard</option>
                                </select>
                            </div>
                        </div>
                    </motion.div>

                    {/* Interview Types */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {INTERVIEW_TYPES.map((type, idx) => (
                            <motion.button
                                key={type.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 + idx * 0.1 }}
                                onClick={() => startInterview(type.id)}
                                className={`group p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all text-left hover:scale-105`}
                            >
                                <div className={`text-5xl mb-4`}>{type.icon}</div>
                                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-bright-teal transition-colors">
                                    {type.name}
                                </h3>
                                <div className="flex items-center gap-2 text-gray-400">
                                    <Video className="h-4 w-4" />
                                    <span className="text-sm">Video + Audio Interview</span>
                                </div>
                            </motion.button>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    // Video Interview Screen
    if (isInterviewActive) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-deep-navy via-dark-slate to-deep-navy p-4">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-2rem)]">
                        {/* Video Panel */}
                        <div className="lg:col-span-2 space-y-4">
                            {/* AI Interviewer Video (Placeholder) */}
                            <div className="relative bg-gradient-to-br from-bright-teal/20 to-electric-violet/20 rounded-2xl overflow-hidden aspect-video border-2 border-white/10">
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center">
                                        <Bot className="h-24 w-24 text-bright-teal mx-auto mb-4 animate-pulse" />
                                        <p className="text-white text-xl font-bold">AI Interviewer</p>
                                        {isSpeaking && (
                                            <div className="flex items-center justify-center gap-2 mt-4">
                                                <Volume2 className="h-5 w-5 text-bright-teal animate-pulse" />
                                                <span className="text-bright-teal">Speaking...</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Your Video */}
                            <div className="relative bg-black rounded-2xl overflow-hidden aspect-video border-2 border-white/10">
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="w-full h-full object-cover"
                                />
                                {!isVideoOn && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                                        <User className="h-16 w-16 text-gray-600" />
                                    </div>
                                )}
                                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-center gap-4">
                                    <button
                                        onClick={toggleVideo}
                                        className={`p-4 rounded-full ${isVideoOn ? 'bg-white/20' : 'bg-red-500'} hover:scale-110 transition-transform`}
                                    >
                                        {isVideoOn ? <Video className="h-6 w-6 text-white" /> : <VideoOff className="h-6 w-6 text-white" />}
                                    </button>
                                    <button
                                        onClick={toggleMic}
                                        className={`p-4 rounded-full ${isMicOn ? 'bg-white/20' : 'bg-red-500'} hover:scale-110 transition-transform`}
                                    >
                                        {isMicOn ? <Mic className="h-6 w-6 text-white" /> : <MicOff className="h-6 w-6 text-white" />}
                                    </button>
                                    <button
                                        onClick={endInterview}
                                        className="p-4 rounded-full bg-red-500 hover:bg-red-600 hover:scale-110 transition-all"
                                    >
                                        <Phone className="h-6 w-6 text-white" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Chat Panel */}
                        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 flex flex-col">
                            {/* Header */}
                            <div className="p-4 border-b border-white/10">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <MessageSquare className="h-5 w-5 text-bright-teal" />
                                    Conversation
                                </h3>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {conversation.map((msg, idx) => (
                                    <div
                                        key={idx}
                                        className={`flex ${msg.role === 'candidate' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-[80%] p-3 rounded-2xl ${msg.role === 'candidate'
                                                ? 'bg-gradient-to-r from-bright-teal to-electric-violet text-white'
                                                : 'bg-white/10 text-gray-200'
                                            }`}>
                                            <p className="text-sm">{msg.content}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Input */}
                            <div className="p-4 border-t border-white/10">
                                {isListening && (
                                    <div className="mb-2 p-2 bg-red-500/20 rounded-lg border border-red-500/30">
                                        <div className="flex items-center gap-2 text-red-400 text-sm">
                                            <Mic className="h-4 w-4 animate-pulse" />
                                            <span>Listening... {currentTranscript}</span>
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    <button
                                        onClick={isListening ? stopListening : startListening}
                                        disabled={isSpeaking}
                                        className={`px-4 py-2 rounded-xl font-semibold transition-all ${isListening
                                                ? 'bg-red-500 hover:bg-red-600 text-white'
                                                : 'bg-white/10 hover:bg-white/20 text-white'
                                            } disabled:opacity-50`}
                                    >
                                        {isListening ? 'Stop' : 'Speak'}
                                    </button>
                                    <button
                                        onClick={() => sendAnswer(currentTranscript)}
                                        disabled={!currentTranscript.trim() || isSpeaking}
                                        className="flex-1 px-4 py-2 bg-gradient-to-r from-bright-teal to-electric-violet rounded-xl font-semibold text-white hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
                                    >
                                        <Send className="h-4 w-4" />
                                        Send Answer
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // Results Screen
    if (isCompleted && finalFeedback) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-deep-navy via-dark-slate to-deep-navy p-6 md:p-8">
                <div className="max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center"
                    >
                        <Award className="h-24 w-24 text-bright-teal mx-auto mb-6" />
                        <h1 className="text-4xl font-bold text-white mb-4">
                            Interview Complete!
                        </h1>

                        {/* Scores */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            <ScoreCard label="Overall" score={finalFeedback.overall_score} />
                            <ScoreCard label="Communication" score={finalFeedback.communication_score} />
                            <ScoreCard label="Technical" score={finalFeedback.technical_knowledge_score} />
                            <ScoreCard label="Problem Solving" score={finalFeedback.problem_solving_score} />
                        </div>

                        {/* Feedback */}
                        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 mb-6 text-left">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <h3 className="text-lg font-bold text-green-400 mb-3 flex items-center gap-2">
                                        <CheckCircle2 className="h-5 w-5" />
                                        Strengths
                                    </h3>
                                    <ul className="space-y-2">
                                        {finalFeedback.strengths.map((strength, idx) => (
                                            <li key={idx} className="text-gray-300">• {strength}</li>
                                        ))}
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-orange-400 mb-3 flex items-center gap-2">
                                        <TrendingUp className="h-5 w-5" />
                                        Areas for Improvement
                                    </h3>
                                    <ul className="space-y-2">
                                        {finalFeedback.areas_for_improvement.map((area, idx) => (
                                            <li key={idx} className="text-gray-300">• {area}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                            <p className="text-gray-300 leading-relaxed">{finalFeedback.detailed_feedback}</p>
                        </div>

                        <button
                            onClick={resetInterview}
                            className="px-8 py-4 bg-gradient-to-r from-bright-teal to-electric-violet rounded-xl font-bold text-white hover:scale-105 transition-transform"
                        >
                            Start Another Interview
                        </button>
                    </motion.div>
                </div>
            </div>
        )
    }

    return null
}

function ScoreCard({ label, score }) {
    const getColor = (score) => {
        if (score >= 80) return 'text-green-400'
        if (score >= 60) return 'text-blue-400'
        return 'text-orange-400'
    }

    return (
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <p className="text-sm text-gray-400 mb-1">{label}</p>
            <p className={`text-3xl font-bold ${getColor(score)}`}>{score}</p>
        </div>
    )
}
