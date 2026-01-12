import { Link } from 'react-router-dom'
import { FileText, Github, Twitter, Linkedin } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-deep-navy border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="bg-gradient-to-r from-bright-teal to-soft-violet p-2 rounded-lg">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">ResumeAI</span>
            </div>
            <p className="text-sm text-lavender-gray">
              AI-powered resume analysis and job matching platform
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-lavender-gray">
              <li><a href="#" className="hover:text-bright-teal transition-colors">Features</a></li>
              <li><a href="#" className="hover:text-bright-teal transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-bright-teal transition-colors">FAQ</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-lavender-gray">
              <li><a href="#" className="hover:text-bright-teal transition-colors">About</a></li>
              <li><a href="#" className="hover:text-bright-teal transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-bright-teal transition-colors">Careers</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-lavender-gray">
              <li><a href="#" className="hover:text-bright-teal transition-colors">Privacy</a></li>
              <li><a href="#" className="hover:text-bright-teal transition-colors">Terms</a></li>
              <li><a href="#" className="hover:text-bright-teal transition-colors">Security</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-lavender-gray mb-4 md:mb-0">
            © 2025 ResumeAI. All rights reserved.
          </p>
          <div className="flex space-x-4">
            <a href="#" className="text-lavender-gray hover:text-bright-teal transition-colors">
              <Twitter className="h-5 w-5" />
            </a>
            <a href="#" className="text-lavender-gray hover:text-bright-teal transition-colors">
              <Linkedin className="h-5 w-5" />
            </a>
            <a href="#" className="text-lavender-gray hover:text-bright-teal transition-colors">
              <Github className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
