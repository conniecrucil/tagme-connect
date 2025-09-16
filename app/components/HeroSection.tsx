import { Button } from "./ui/button";

export function HeroSection() {
  return (
    <section className="relative bg-white py-20 lg:py-32">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Text content */}
          <div className="text-left">
            {/* Main tagline */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6">
              <span className="block animate-fade-in-up animation-delay-100">STAY</span>
              <span className="block text-green-600 italic animate-fade-in-up animation-delay-300">Connected</span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-gray-600 mb-8 animate-fade-in-up animation-delay-500">
              Your brand in their pocket—always.
            </p>
            
            {/* CTA Button */}
            <Button size="lg" className="bg-black hover:bg-gray-800 text-white text-lg px-8 py-6 animate-fade-in-up animation-delay-700 hover:scale-105 transition-transform duration-300 pulse-glow">
              Start Today
            </Button>
          </div>

          {/* Right side - Image */}
          <div className="flex justify-center lg:justify-end">
            <img 
              src="/assets/homepage-image-tagme.webp" 
              alt="Hands holding smartphone and TAG ME card demonstrating digital connection"
              className="max-w-full h-auto rounded-lg shadow-lg animate-fade-in-left animation-delay-500 hover:scale-105 transition-transform duration-500"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
