import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import {
  Sparkles, Target, Zap, Shield, TrendingUp, Users,
  Briefcase, Brain, ChevronRight, Star, CheckCircle2,
  Play
} from 'lucide-react'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'

export default function Home() {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 200]);
  const y2 = useTransform(scrollY, [0, 500], [0, -150]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-deep-navy">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-electric-violet/20 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-bright-teal/10 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]" />
      </div>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8 hover:bg-white/10 transition-colors cursor-default"
          >
            <Sparkles className="w-4 h-4 text-bright-teal" />
            <span className="text-sm font-medium text-gray-300">New: AI Video Mock Interviews</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-6xl md:text-8xl font-bold mb-8 tracking-tight font-heading"
          >
            <span className="block text-white mb-2">Master Your</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-electric-violet via-bright-teal to-white animate-gradient-x">
              Career Journey
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed"
          >
            The all-in-one platform to find jobs, analyze resumes, and practice interviews with AI.
            <span className="text-white font-semibold"> Get hired faster.</span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link to="/signup">
              <Button size="lg" className="shadow-neon group px-10">
                Start For Free
                <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>

            <button className="flex items-center gap-3 px-8 py-4 rounded-xl text-white font-semibold hover:bg-white/5 transition-all group">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-electric-violet transition-colors">
                <Play className="w-4 h-4 fill-current ml-1" />
              </div>
              Watch Demo
            </button>
          </motion.div>
        </div>

        {/* Floating UI Elements Parallax */}
        <motion.div style={{ y: y1 }} className="absolute top-40 left-10 lg:left-20 hidden lg:block pointer-events-none opacity-60">
          <Card className="w-64 !p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-white font-bold">Resume Score</p>
                <p className="text-green-400 text-sm">98/100 Excellent</p>
              </div>
            </div>
            <div className="h-1.5 w-full bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full w-[98%] bg-green-400 rounded-full" />
            </div>
          </Card>
        </motion.div>

        <motion.div style={{ y: y2 }} className="absolute bottom-20 right-10 lg:right-20 hidden lg:block pointer-events-none opacity-60">
          <Card className="w-72 !p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-white font-bold">Senior Developer</p>
                <p className="text-gray-400 text-sm">Google Inc.</p>
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              <span className="text-xs bg-white/10 px-2 py-1 rounded text-gray-300">Remote</span>
              <span className="text-xs bg-white/10 px-2 py-1 rounded text-gray-300">$150k+</span>
            </div>
          </Card>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Supercharge Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-bright-teal to-electric-violet">Job Search</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Everything you need to stand out and get hired, all in one dashboard.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <FeatureCard key={idx} feature={feature} index={idx} />
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section with Glassmorphism */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-glass-black/50 backdrop-blur-2xl rounded-3xl border border-white/5 p-12 lg:p-20 relative overflow-hidden">

            {/* Background glow for stats */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-electric-violet/10 rounded-full blur-[80px]" />

            <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/10 relative z-10">
              <div className="text-center p-8">
                <div className="text-4xl md:text-6xl font-bold text-white mb-2">10k+</div>
                <p className="text-gray-400 font-medium">Active Job Listings</p>
              </div>
              <div className="text-center p-8">
                <div className="text-4xl md:text-6xl font-bold text-bright-teal mb-2">95%</div>
                <p className="text-gray-400 font-medium">Interview Success Rate</p>
              </div>
              <div className="text-center p-8">
                <div className="text-4xl md:text-6xl font-bold text-electric-violet mb-2">24/7</div>
                <p className="text-gray-400 font-medium">AI Career Support</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-24 text-center px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto relative z-10">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-8">
            Ready to Launch Your Career?
          </h2>
          <p className="text-xl text-gray-400 mb-10">
            Join thousands of professionals finding their dream jobs with JobCopilot.
          </p>
          <Link to="/signup">
            <Button size="lg" className="shadow-neon hover:scale-105 transition-transform px-12 py-5 text-lg">
              Create Free Account
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}

function FeatureCard({ feature, index }) {
  const Icon = feature.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Card className="h-full hover:bg-white/5 transition-colors group">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white/5 to-white/10 border border-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
          <Icon className="w-7 h-7 text-bright-teal group-hover:text-electric-violet transition-colors" />
        </div>
        <h3 className="text-xl font-bold text-white mb-3 group-hover:text-bright-teal transition-colors">
          {feature.title}
        </h3>
        <p className="text-gray-400 leading-relaxed text-sm">
          {feature.description}
        </p>
      </Card>
    </motion.div>
  )
}

const features = [
  {
    icon: Target,
    title: "Precision Job Matching",
    description: "Our advanced algorithm analyzes your skills and preferences to match you with jobs that fit perfectly. No more scrolling through irrelevant listings."
  },
  {
    icon: Zap,
    title: "Automated Scraping",
    description: "We scrape jobs from LinkedIn, Indeed, Glassdoor, and more every single day. Access hidden opportunities before anyone else."
  },
  {
    icon: Brain,
    title: "AI Interview Coach",
    description: "Practice with our realistic AI interviewer. Get real-time feedback on your answers, body language, and speaking pace."
  },
  {
    icon: TrendingUp,
    title: "Application Tracker",
    description: "Kanban-style board to manage all your applications. Track your progress from 'Applied' to 'Offer Received'."
  },
  {
    icon: Shield,
    title: "Resume Optimization",
    description: "Get an instant ATS score for your resume. Our AI suggests keywords and formatting changes to help you pass automated filters."
  },
  {
    icon: Users,
    title: "24/7 Career Assistant",
    description: "Have questions about salary negotiation or cover letters? Our AI Chatbot is always ready to provide expert advice."
  }
]
