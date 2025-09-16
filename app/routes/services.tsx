import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";

// Import images
import servicesNetworking1 from "../../assets/services-networking-1.jpg";
import servicesNetworking2 from "../../assets/services-networking-2.jpg";

export function meta() {
  return [
    { title: "Services - TagMe Connections" },
    { name: "description", content: "Choose your green connection path with TagMe Connections. Smart networking solutions for individuals and teams." },
  ];
}

export default function Services() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-16">
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-br from-green-50 to-green-100">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Choose Your Green Connection Path
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Whether you're an individual professional or part of a team, we have the perfect smart networking solution for you.
            </p>
          </div>
        </section>

        {/* Services Grid */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
              {/* For Individuals */}
              <Card className="border-2 border-green-200 hover:border-green-300 transition-colors">
                <CardHeader className="text-center pb-8">
                  <div className="mb-6">
                    <img 
                      src={servicesNetworking1} 
                      alt="Networking for individuals" 
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </div>
                  <CardTitle className="text-3xl font-bold text-green-700 mb-4">
                    For Individuals
                  </CardTitle>
                  <CardDescription className="text-lg text-gray-600 mb-6">
                    For Freelancers, Creatives & Everyday Connectors
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-gray-700 leading-relaxed">
                    Whether you're a creative professional, entrepreneur, or just someone who loves connecting with intention — this card was made for you.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    With just one tap, you can share your contact info, socials, or portfolio — all while reducing waste and making a memorable impression.
                  </p>
                  <div className="pt-6">
                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white text-lg py-6">
                      Make It
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* For Teams */}
              <Card className="border-2 border-green-200 hover:border-green-300 transition-colors">
                <CardHeader className="text-center pb-8">
                  <div className="mb-6">
                    <img 
                      src={servicesNetworking2} 
                      alt="Networking for teams" 
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </div>
                  <CardTitle className="text-3xl font-bold text-green-700 mb-4">
                    For Teams | +50 cards
                  </CardTitle>
                  <CardDescription className="text-lg text-gray-600 mb-6">
                    Equip Your Team. Empower Your Brand.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-gray-700 leading-relaxed">
                    Whether you're a small business, a growing organization, or hosting a significant event, our smart cards make it easy for your team to connect, share, and represent your brand with impact.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    Thoughtfully designed and waste-free, our cards help you build stronger connections while staying aligned with your values.
                  </p>
                  <div className="pt-6">
                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white text-lg py-6">
                      Make It
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Detailed Services */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-16 max-w-6xl mx-auto">
              {/* Individuals Detail */}
              <div className="space-y-8">
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Individuals</h2>
                  <h3 className="text-2xl font-semibold text-green-700 mb-6">For Individuals</h3>
                  <p className="text-lg text-gray-600 mb-8">Your Smart Networking Solution</p>
                  <Button className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg">
                    Book now
                  </Button>
                </div>
              </div>

              {/* Teams Detail */}
              <div className="space-y-8">
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Teams</h2>
                  <h3 className="text-2xl font-semibold text-green-700 mb-6">For Teams</h3>
                  <p className="text-lg text-gray-600 mb-4">
                    Ready to equip your team with the next generation of eco-friendly business cards?
                  </p>
                  <p className="text-gray-600 mb-8">
                    Save on bulk orders, personalize for every member, and help your business lead the change.
                  </p>
                  <Button className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg">
                    Book now
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact CTA */}
        <section className="py-20 bg-green-600">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold text-white mb-6">
              Let's connect ;)
            </h2>
            <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
              Interested in working together? Fill out some info, and we will contact you shortly. We can't wait to hear from you!
            </p>
            <Button variant="outline" className="bg-white text-green-600 hover:bg-green-50 border-white px-8 py-3 text-lg">
              Get in Touch
            </Button>
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
      </main>
      <Footer />
    </div>
  );
}
