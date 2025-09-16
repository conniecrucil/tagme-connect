import { MapPin, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-4">
        {/* Main Footer Content - Three Column Layout */}
        <div className="grid md:grid-cols-3 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-xl font-bold mb-4">TagMe Connections</h3>
            <p className="text-gray-300">
              Revolutionizing professional networking with innovative e-business cards.
            </p>
          </div>

          {/* Location */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Location</h4>
            <div className="flex items-start space-x-3">
              <MapPin className="h-5 w-5 text-green-400 mt-1" />
              <div>
                <p className="text-gray-300">Vancouver Island</p>
                <p className="text-gray-300">British Columbia, Canada</p>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact</h4>
            <div className="flex items-start space-x-3">
              <Mail className="h-5 w-5 text-green-400 mt-1" />
              <div>
                <p className="text-gray-300">contact@tagmeconnections.com</p>
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
