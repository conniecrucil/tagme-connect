import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";

// Import image
import contactForestStairs from "../../assets/contact-forest-stairs.jpg";

export function meta() {
  return [
    { title: "Contact - TagMe Connections" },
    { name: "description", content: "Get in touch with TagMe Connections. From solo creators to growing teams, there's a smarter and greener way to connect." },
  ];
}

export default function Contact() {
  return (
    <div className="pt-16">
        {/* Hero Section with Image */}
        <section className="relative py-20 bg-gradient-to-br from-green-50 to-green-100">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              {/* Content */}
              <div>
                <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                  Contact Us
                </h1>
                <p className="text-xl text-gray-600 mb-8">
                  <strong>From solo creators to growing teams, there's a smarter (and greener) way to connect.</strong>
                </p>
                <div className="space-y-4">
                  <p className="text-lg text-gray-700">
                    <strong>Email:</strong> contact@tagmeconnections.com
                  </p>
                  <p className="text-lg text-gray-700">
                    <strong>Phone:</strong> +1 (250) 686-1518
                  </p>
                </div>
              </div>
              
              {/* Image */}
              <div className="relative">
                <img 
                  src={contactForestStairs} 
                  alt="Forest stairs representing connection and growth" 
                  className="w-full h-96 object-cover rounded-lg shadow-lg"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Contact Form */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              <Card className="border-2 border-green-200">
                <CardHeader className="text-center">
                  <CardTitle className="text-3xl font-bold text-green-700 mb-4">
                    Get in Touch
                  </CardTitle>
                  <CardDescription className="text-lg text-gray-600">
                    Fill out the form below and we'll get back to you shortly.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <form className="space-y-6">
                    {/* Name Fields */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                          First Name *
                        </label>
                        <Input 
                          id="firstName" 
                          name="firstName" 
                          type="text" 
                          required 
                          className="w-full"
                          placeholder="Your first name"
                        />
                      </div>
                      <div>
                        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                          Last Name *
                        </label>
                        <Input 
                          id="lastName" 
                          name="lastName" 
                          type="text" 
                          required 
                          className="w-full"
                          placeholder="Your last name"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <Input 
                        id="email" 
                        name="email" 
                        type="text" 
                        required 
                        className="w-full"
                        placeholder="your.email@example.com"
                      />
                    </div>

                    {/* Service Selection */}
                    <div>
                      <label htmlFor="service" className="block text-sm font-medium text-gray-700 mb-2">
                        Service *
                      </label>
                      <select 
                        id="service" 
                        name="service" 
                        required 
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="">Select a service</option>
                        <option value="individual">Individual</option>
                        <option value="teams">Teams</option>
                      </select>
                    </div>

                    {/* Message */}
                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                        Message *
                      </label>
                      <Textarea 
                        id="message" 
                        name="message" 
                        required 
                        rows={6}
                        className="w-full"
                        placeholder="Tell us about your project or how we can help you..."
                      />
                    </div>

                    {/* Submit Button */}
                    <div className="pt-4">
                      <Button 
                        type="submit" 
                        className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg"
                      >
                        Send Message
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Thank You Message */}
        <section className="py-16 bg-green-50">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-green-700 mb-4">
              Thank you!
            </h2>
            <p className="text-lg text-gray-600">
              We appreciate you reaching out and will get back to you as soon as possible.
            </p>
          </div>
        </section>

        {/* Contact Info */}
        <section className="py-16 bg-gray-900 text-white">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">
              <div>
                <h3 className="text-2xl font-bold mb-4">Location</h3>
                <p className="text-gray-300">
                  Vancouver Island<br />
                  British Columbia, Canada
                </p>
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-4">Contact</h3>
                <p className="text-gray-300">
                  contact@tagmeconnections.com
                </p>
              </div>
            </div>
          </div>
        </section>
    </div>
  );
}
