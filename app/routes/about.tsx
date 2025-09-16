import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { Button } from "../components/ui/button";

// Import images
import conniePhoto from "../../assets/connie-photo.jpg";
import tagmeLogo from "../../assets/tagme-logo.png";

export function meta() {
  return [
    { title: "About - TagMe Connections" },
    { name: "description", content: "Meet Connie, founder of TagMe Connections. Learn about our mission to make networking easier and more sustainable." },
  ];
}

export default function About() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-16">
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-br from-green-50 to-green-100">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Who we are
            </h1>
          </div>
        </section>

        {/* Connie's Story */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="prose prose-lg max-w-none">
                {/* Connie's Photo */}
                <div className="text-center mb-12">
                  <img 
                    src={conniePhoto} 
                    alt="Connie, founder of TagMe Connections" 
                    className="w-64 h-64 object-cover rounded-full mx-auto shadow-lg"
                  />
                </div>
                
                <p className="text-xl text-gray-700 leading-relaxed mb-8">
                  Hi, I'm Connie, the founder of <strong className="text-green-700">TagMe Connections</strong>.
                </p>

                <p className="text-lg text-gray-700 leading-relaxed mb-6">
                  The idea behind this project came to me during my work as a Job Coach, supporting people with diverse abilities. I often attended networking events, community meetings, and professional gatherings—but more than once, I found myself without my own business cards. I had to borrow a colleague's or quickly scribble my details on a napkin.
                </p>

                <p className="text-lg text-gray-700 leading-relaxed mb-6">
                  One day, I noticed someone had saved a photo of a colleague's card on their phone. That moment sparked a question in me:
                </p>

                <blockquote className="text-2xl font-semibold text-green-700 italic text-center my-12 p-8 bg-green-50 rounded-lg border-l-4 border-green-500">
                  "How can I make it easier for people to remember me and save my contact info instantly—especially in busy, on-the-go situations?"
                </blockquote>

                <p className="text-lg text-gray-700 leading-relaxed mb-6">
                  That's when TagMe was born.
                </p>

                <p className="text-lg text-gray-700 leading-relaxed mb-6">
                  I created TagMe Connections to solve a real problem—one I faced myself. It's a practical tool for real life, designed to help people connect faster and more effectively, whether they're networking, collaborating, or performing.
                </p>

                <div className="bg-gray-50 p-8 rounded-lg my-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">My Journey</h2>
                  <p className="text-lg text-gray-700 leading-relaxed mb-6">
                    My path to this project hasn't been linear.<br />
                    In Chile, I trained as a journalist—drawn to stories, communication, and human connection. After moving to Canada, I built a career that blends structure and creativity: I work as a bookkeeper, supporting businesses with clarity and organization, and I also teach aqua fitness and dance, where I guide others through movement and rhythm.
                  </p>

                  <p className="text-lg text-gray-700 leading-relaxed mb-6">
                    These roles may seem different, but they're connected by one core idea:
                  </p>

                  <blockquote className="text-xl font-semibold text-green-700 italic text-center my-8 p-6 bg-white rounded-lg border-l-4 border-green-500">
                    helping people move with confidence—whether in their bodies, in their businesses, or in their communities.
                  </blockquote>
                </div>

                <div className="bg-green-50 p-8 rounded-lg my-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Water & Connection</h2>
                  <p className="text-lg text-gray-700 leading-relaxed mb-6">
                    Water, especially, plays a central role in my life. It's where I feel most at home—fluid, grounded, and energized.<br />
                    And just like water, I see connection as something that flows.
                  </p>

                  <p className="text-lg text-gray-700 leading-relaxed mb-6">
                    Through movement and water, I help people reconnect with themselves.<br />
                    Through technology and TagMe, I help them reconnect with each other.
                  </p>
                </div>

                <div className="bg-gray-900 text-white p-8 rounded-lg my-12">
                  <h2 className="text-2xl font-bold mb-6">My Story</h2>
                  <p className="text-lg leading-relaxed mb-6">
                    Born in Chile and now living on Vancouver Island, Canada, I've learned to adapt, to bridge cultures, and to build something meaningful from everything I've lived.
                  </p>

                  <p className="text-lg leading-relaxed mb-6">
                    TagMe is a reflection of that journey—a tool rooted in real experience, made for real people who want to connect with purpose.
                  </p>

                  <p className="text-lg leading-relaxed">
                    Thank you for being here.
                  </p>

                  <p className="text-lg font-semibold mt-8 text-green-400">
                    — Connie
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact CTA */}
        <section className="py-20 bg-green-600">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold text-white mb-6">
              Contact us
            </h2>
            <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
              Interested in working together? Fill out some info and we will be in touch shortly. We can't wait to hear from you!
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
