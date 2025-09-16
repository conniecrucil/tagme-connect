import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { MapPin, Mail } from "lucide-react";
import { useState } from "react";

export function ContactSection() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    service: '',
    message: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Add form submission logic
    console.log('Form submitted:', formData);
  };

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 animate-fade-in-up animation-delay-100">
              Contact Us
            </h2>
            <p className="text-lg text-gray-600 animate-fade-in-up animation-delay-300">
              <strong>From solo creators to growing teams, there's a smarter (and greener) way to connect.</strong>
            </p>
            <div className="mt-4 text-gray-600 animate-fade-in-up animation-delay-500">
              <p>contact@tagmeconnections.com</p>
              <p>(555) 555-5555</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <Card className="animate-fade-in-left animation-delay-700 hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <CardTitle>Send us a message</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        First Name *
                      </label>
                      <Input 
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        placeholder="First Name" 
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Last Name *
                      </label>
                      <Input 
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        placeholder="Last Name" 
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Email *
                    </label>
                    <Input 
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="your@email.com" 
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Service *
                    </label>
                    <select
                      name="service"
                      value={formData.service}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      required
                    >
                      <option value="">Select a service</option>
                      <option value="individual">Individual</option>
                      <option value="teams">Teams</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Message *
                    </label>
                    <Textarea 
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="Tell us about your project..." 
                      rows={6}
                      required
                    />
                  </div>
                  <Button 
                    type="submit"
                    className="w-full bg-green-600 hover:bg-green-700 text-white hover:scale-105 transition-transform duration-300"
                  >
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <div className="space-y-8">
              <div className="bg-green-50 p-6 rounded-lg border border-green-200 animate-fade-in-right animation-delay-900 hover:scale-105 transition-transform duration-300">
                <h4 className="text-2xl font-bold text-green-800 mb-4">Thank you!</h4>
                <p className="text-green-700 text-lg">
                  We appreciate you reaching out and will get back to you as soon as possible.
                </p>
              </div>

              <div className="animate-fade-in-up animation-delay-1100">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Location</h3>
                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-green-600 mt-1 hover:scale-110 transition-transform duration-300" />
                  <div>
                    <p className="text-gray-600">Vancouver Island</p>
                    <p className="text-gray-600">British Columbia, Canada</p>
                  </div>
                </div>
              </div>

              <div className="animate-fade-in-up animation-delay-1300">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Contact</h3>
                <div className="flex items-start space-x-3">
                  <Mail className="h-5 w-5 text-green-600 mt-1 hover:scale-110 transition-transform duration-300" />
                  <div>
                    <p className="text-gray-600">contact@tagmeconnections.com</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
