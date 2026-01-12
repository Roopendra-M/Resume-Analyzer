import { Briefcase, Zap } from 'lucide-react'

export default function LoadingScreen() {
  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#0f1117] dark:to-deep-navy">
      <div className="text-center space-y-6">
        {/* Animated icon */}
        <div className="relative w-20 h-20 mx-auto">
          <div className="absolute inset-0 border-4 border-transparent border-t-bright-teal border-r-soft-violet rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Briefcase className="h-8 w-8 text-bright-teal animate-pulse" />
          </div>
        </div>

        {/* Text */}
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-bright-teal to-soft-violet bg-clip-text text-transparent">
            Loading...
          </h1>
          <p className="text-gray-600 dark:text-lavender-gray text-sm mt-1">Getting everything ready</p>
        </div>

        {/* Progress bar */}
        <div className="w-48 h-1 bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full w-1/3 bg-gradient-to-r from-bright-teal to-soft-violet animate-pulse"></div>
        </div>
      </div>
    </div>
  )
}
