import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { Button } from "../components/ui/button";
import { Link } from "react-router";
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
                  As a Vocational Counselor in the Cowichan Region, I work  with people who face barriers to communication and employment. TagMe was born from that experience — the belief that everyone deserves a professional way to say "this is who I am" with a single tap.

                </p>

                <blockquote className="text-2xl font-semibold text-green-700 italic text-center my-12 p-8 bg-green-50 rounded-lg border-l-4 border-green-500">
                  "In 2024, I created a TagMe card for a client with speech challenges who is a non-speaker. When they tapped the card on a stranger's phone, their name, photo, and story appeared instantly. For the first time, they didn't need someone else to introduce them. That card became their voice"
                </blockquote>
                
                 <p className="text-lg text-gray-700 leading-relaxed mb-6">
                  That's when TagMe was born.
                </p>

                <p className="text-lg text-gray-700 leading-relaxed mb-6">
                  Today, TagMe serves small business owners, freelancers, nonprofit organizations, and individuals with diverse abilities across British Columbia. Every card we make is a step toward a more connected, sustainable, and inclusive world.
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
            <Link to="/contact" className=" rounded bg-white text-green-600 hover:bg-green-50 border-white px-8 py-3 text-lg">
              Get in Touch
            </Link>
          </div>
        </section>

       
      </main>
    </div>
  );
}
