import { MapPin, Mail } from "lucide-react";
import { Link } from "react-router";
import { TagMeLogoDark } from "./TagMeLogoDark";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-4">
        {/* Main Footer Content - Four Column Layout */}
        <div className="grid md:grid-cols-4 gap-8">
          {/* Logo */}
          <div>
            <div className="flex items-center mb-4">
              <TagMeLogoDark width={80} height={96} className="mr-8" />
              <span className="text-white font-bold text-xl -ml-2" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                connections
              </span>
            </div>
          </div>

          {/* Company Info */}
          <div>
            <p className="text-gray-300">
              Revolutionizing professional networking with innovative e-business cards.
            </p>
          </div>

          {/* Contact & Location */}
          <div>
            <div className="flex items-start space-x-3 mb-4">
              <Mail className="h-5 w-5 text-green-400 mt-1" />
              <div>
                <a 
                  href="mailto:contact@tagmeconnections.com" 
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  contact@tagmeconnections.com
                </a>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <MapPin className="h-5 w-5 text-green-400 mt-1" />
              <div>
                <p className="text-gray-300">Vancouver Island</p>
                <p className="text-gray-300">British Columbia, Canada</p>
              </div>
            </div>
          </div>

          {/* Links */}
          <div>
            <div className="space-y-2">
              <div>
                <Link to="/about" className="text-gray-300 hover:text-white transition-colors">
                  About
                </Link>
              </div>
              <div>
                <Link to="/privacy-policy" className="text-gray-300 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </div>
              <div>
                <Link to="/terms-and-conditions" className="text-gray-300 hover:text-white transition-colors">
                  Terms and Conditions
                </Link>
              </div>
              <div>
                <Link to="/login" className="text-gray-300 hover:text-white transition-colors">
                  Admin Login
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-700 mt-8 pt-8 text-center">
          <p className="text-gray-400">
            © 2024 TagMe Connections. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
