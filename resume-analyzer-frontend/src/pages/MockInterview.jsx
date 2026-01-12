import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../lib/api'
import {
    Brain, Code, Users, Briefcase, FileQuestion, ArrowRight,
    CheckCircle2, XCircle, Loader, Trophy, Target, Zap,
    Clock, Star, TrendingUp, Award
} from 'lucide-react'
import toast from 'react-hot-toast'

const INTERVIEW_TYPES = [
    {
        id: 'technical',
        name: 'Technical Interview',
        icon: Code,
        description: 'Coding, algorithms, and system design questions',
        color: 'from-blue-500 to-cyan-500',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/30'
    },
    {
        id: 'behavioral',
        icon: Users,
        name: 'Behavioral Interview',
        description: 'STAR method and soft skills questions',
        color: 'from-purple-500 to-pink-500',
        bgColor: 'bg-purple-500/10',
        borderColor: 'border-purple-500/30'
    },
    {
        id: 'hr',
        icon: Briefcase,
        name: 'HR Interview',
        description: 'General HR and culture fit questions',
        color: 'from-green-500 to-emerald-500',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/30'
    },
    {
        id: 'case_study',
        icon: FileQuestion,
        name: 'Case Study',
        description: 'Business case analysis and problem-solving',
        color: 'from-orange-500 to-red-500',
        bgColor: 'bg-orange-500/10',
        borderColor: 'border-orange-500/30'
    }
]

export default function MockInterview() {
    const [selectedType, setSelectedType] = useState(null)
    const [difficulty, setDifficulty] = useState('medium')
    const [jobRole, setJobRole] = useState('Software Engineer')
    const [interviewId, setInterviewId] = useState(null)
    const [currentQuestion, setCurrentQuestion] = useState(null)
    const [answer, setAnswer] = useState('')
    const [loading, setLoading] = useState(false)
    const [feedback, setFeedback] = useState(null)
    const [isCompleted, setIsCompleted] = useState(false)
    const [overallResults, setOverallResults] = useState(null)
    const [history, setHistory] = useState([])

    useEffect(() => {
        fetchHistory()
    }, [])

    const fetchHistory = async () => {
        try {
            const { data } = await api.get('/interview/history?limit=5')
            setHistory(data.interviews || [])
        } catch (error) {
            console.error('Failed to fetch history:', error)
        }
    }

    const startInterview = async (type) => {
        try {
            setLoading(true)
            const { data } = await api.post('/interview/start', {
                interview_type: type,
                job_role: jobRole,
                difficulty: difficulty
            })

            setInterviewId(data.interview_id)
            setCurrentQuestion(data.first_question)
            setSelectedType(type)
            toast.success('Interview started! Good luck! 🚀')
        } catch (error) {
            console.error('Failed to start interview:', error)
            toast.error('Failed to start interview')
        } finally {
            setLoading(false)
        }
    }

    const submitAnswer = async () => {
        if (!answer.trim()) {
            toast.error('Please provide an answer')
            return
        }

        try {
            setLoading(true)
            const { data } = await api.post('/interview/answer', {
                interview_id: interviewId,
                question_number: currentQuestion.question_number,
                answer: answer
            })

            setFeedback(data.feedback)

            if (data.is_last_question) {
                setIsCompleted(true)
                setOverallResults({
                    score: data.overall_score,
                    feedback: data.overall_feedback
                })
                fetchHistory() // Refresh history
            } else {
                // Move to next question after showing feedback
                setTimeout(() => {
                    setCurrentQuestion(data.next_question)
                    setAnswer('')
                    setFeedback(null)
                }, 3000)
            }
        } catch (error) {
            console.error('Failed to submit answer:', error)
            toast.error('Failed to submit answer')
        } finally {
            setLoading(false)
        }
    }

    const resetInterview = () => {
        setSelectedType(null)
        setInterviewId(null)
        setCurrentQuestion(null)
        setAnswer('')
        setFeedback(null)
        setIsCompleted(false)
        setOverallResults(null)
    }

    // Selection Screen
    if (!selectedType) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-deep-navy via-dark-slate to-deep-navy p-6 md:p-8">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-12"
                    >
                        <div className="flex items-center justify-center gap-3 mb-4">
                            <Brain className="h-12 w-12 text-bright-teal" />
                            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-bright-teal to-electric-violet bg-clip-text text-transparent">
                                Mock Interview Practice
                            </h1>
                        </div>
                        <p className="text-xl text-gray-400">
                            Practice with AI-powered interviews and get instant feedback
                        </p>
                    </motion.div>

                    {/* Settings */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 mb-8"
                    >
                        <h2 className="text-xl font-bold text-white mb-4">Interview Settings</h2>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                        {INTERVIEW_TYPES.map((type, idx) => {
                            const Icon = type.icon
                            return (
                                <motion.button
                                    key={type.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 + idx * 0.1 }}
                                    onClick={() => startInterview(type.id)}
                                    disabled={loading}
                                    className={`group p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all text-left ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
                                >
                                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-r ${type.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                        <Icon className="h-7 w-7 text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-bright-teal transition-colors">
                                        {type.name}
                                    </h3>
                                    <p className="text-gray-400 mb-4">{type.description}</p>
                                    <div className="flex items-center text-bright-teal font-semibold">
                                        Start Interview <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </motion.button>
                            )
                        })}
                    </div>

                    {/* History */}
                    {history.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
                        >
                            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <Clock className="h-5 w-5 text-bright-teal" />
                                Recent Interviews
                            </h2>
                            <div className="space-y-3">
                                {history.map((interview) => (
                                    <div
                                        key={interview._id}
                                        className="p-4 bg-white/5 rounded-xl border border-white/10 flex justify-between items-center"
                                    >
                                        <div>
                                            <p className="font-semibold text-white capitalize">
                                                {interview.interview_type.replace('_', ' ')} - {interview.job_role}
                                            </p>
                                            <p className="text-sm text-gray-400">
                                                {new Date(interview.started_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        {interview.overall_score && (
                                            <div className={`px-4 py-2 rounded-lg font-bold ${interview.overall_score >= 80 ? 'bg-green-500/20 text-green-400' :
                                                    interview.overall_score >= 60 ? 'bg-blue-500/20 text-blue-400' :
                                                        'bg-orange-500/20 text-orange-400'
                                                }`}>
                                                {interview.overall_score}%
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        )
    }

    // Interview In Progress
    if (currentQuestion && !isCompleted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-deep-navy via-dark-slate to-deep-navy p-6 md:p-8">
                <div className="max-w-4xl mx-auto">
                    {/* Progress */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-400">
                                Question {currentQuestion.question_number} of 5
                            </span>
                            <span className="text-bright-teal font-semibold capitalize">
                                {currentQuestion.difficulty}
                            </span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-bright-teal to-electric-violet transition-all duration-500"
                                style={{ width: `${(currentQuestion.question_number / 5) * 100}%` }}
                            />
                        </div>
                    </motion.div>

                    {/* Question */}
                    <AnimatePresence mode="wait">
                        {!feedback ? (
                            <motion.div
                                key="question"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 mb-6"
                            >
                                <div className="flex items-start gap-4 mb-6">
                                    <div className="p-3 bg-gradient-to-r from-bright-teal to-electric-violet rounded-xl">
                                        <FileQuestion className="h-6 w-6 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="text-2xl font-bold text-white mb-2">
                                            {currentQuestion.question}
                                        </h2>
                                        <p className="text-gray-400">
                                            Take your time and provide a detailed answer
                                        </p>
                                    </div>
                                </div>

                                <textarea
                                    value={answer}
                                    onChange={(e) => setAnswer(e.target.value)}
                                    placeholder="Type your answer here..."
                                    rows={8}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-bright-teal focus:outline-none resize-none mb-4"
                                />

                                <button
                                    onClick={submitAnswer}
                                    disabled={loading || !answer.trim()}
                                    className="w-full px-6 py-4 bg-gradient-to-r from-bright-teal to-electric-violet rounded-xl font-bold text-white hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <Loader className="h-5 w-5 animate-spin" />
                                            Analyzing...
                                        </>
                                    ) : (
                                        <>
                                            Submit Answer
                                            <ArrowRight className="h-5 w-5" />
                                        </>
                                    )}
                                </button>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="feedback"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 mb-6"
                            >
                                <div className="text-center mb-6">
                                    <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${feedback.score >= 80 ? 'bg-green-500/20' :
                                            feedback.score >= 60 ? 'bg-blue-500/20' :
                                                'bg-orange-500/20'
                                        }`}>
                                        <span className={`text-3xl font-bold ${feedback.score >= 80 ? 'text-green-400' :
                                                feedback.score >= 60 ? 'text-blue-400' :
                                                    'text-orange-400'
                                            }`}>
                                            {feedback.score}
                                        </span>
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-2">
                                        {feedback.score >= 80 ? 'Excellent!' : feedback.score >= 60 ? 'Good Job!' : 'Keep Practicing!'}
                                    </h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div className="p-4 bg-green-500/10 rounded-xl border border-green-500/30">
                                        <div className="flex items-center gap-2 mb-3">
                                            <CheckCircle2 className="h-5 w-5 text-green-400" />
                                            <h4 className="font-bold text-green-400">Strengths</h4>
                                        </div>
                                        <ul className="space-y-2">
                                            {feedback.strengths.map((strength, idx) => (
                                                <li key={idx} className="text-sm text-gray-300">• {strength}</li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="p-4 bg-orange-500/10 rounded-xl border border-orange-500/30">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Target className="h-5 w-5 text-orange-400" />
                                            <h4 className="font-bold text-orange-400">Improvements</h4>
                                        </div>
                                        <ul className="space-y-2">
                                            {feedback.improvements.map((improvement, idx) => (
                                                <li key={idx} className="text-sm text-gray-300">• {improvement}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                                    <p className="text-gray-300 leading-relaxed">{feedback.detailed_feedback}</p>
                                </div>

                                <p className="text-center text-gray-400 text-sm mt-4">
                                    Moving to next question in 3 seconds...
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        )
    }

    // Completed
    if (isCompleted && overallResults) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-deep-navy via-dark-slate to-deep-navy p-6 md:p-8">
                <div className="max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center"
                    >
                        <div className="mb-8">
                            <Trophy className="h-24 w-24 text-bright-teal mx-auto mb-4" />
                            <h1 className="text-4xl font-bold text-white mb-2">
                                Interview Complete!
                            </h1>
                            <p className="text-xl text-gray-400">
                                Great job completing the interview
                            </p>
                        </div>

                        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 mb-6">
                            <div className="text-center mb-6">
                                <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full mb-4 ${overallResults.score >= 80 ? 'bg-green-500/20' :
                                        overallResults.score >= 60 ? 'bg-blue-500/20' :
                                            'bg-orange-500/20'
                                    }`}>
                                    <span className={`text-5xl font-bold ${overallResults.score >= 80 ? 'text-green-400' :
                                            overallResults.score >= 60 ? 'text-blue-400' :
                                                'text-orange-400'
                                        }`}>
                                        {overallResults.score}
                                    </span>
                                </div>
                                <h2 className="text-3xl font-bold text-white mb-2">
                                    Overall Score
                                </h2>
                                <p className="text-gray-300 text-lg">
                                    {overallResults.feedback}
                                </p>
                            </div>
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
