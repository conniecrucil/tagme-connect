import StarBorder from "./StarBorder";

export function StorySection() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          {/* Left side - Cards image */}
          <div className="flex justify-center lg:justify-start">
            <img 
              src="/image-our-story.webp" 
              alt="TAG ME cards showing logo and QR code"
              className="max-w-full h-auto rounded-lg shadow-lg animate-fade-in-left animation-delay-200 hover:scale-105 transition-transform duration-500"
            />
          </div>

          {/* Right side - Text content */}
          <div className="text-left">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 animate-fade-in-up animation-delay-400">
              Our Story
            </h2>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed animate-fade-in-up animation-delay-600">
              TagMe Cards revolutionizes professional networking with innovative e-business cards. Our eco-friendly solution allows users to share contact information instantly, eliminating the need for paper cards. Join us in creating sustainable and personalized networking experiences.
            </p>
            <StarBorder
              as="button"
              type="button"
              color="rgb(34 197 94)"
              speed="4s"
              thickness={1}
              className="tagme-star-cta tagme-star-cta-sm animate-fade-in-up animation-delay-800 hover:scale-105 transition-transform duration-300"
            >
              Learn more
            </StarBorder>
          </div>
        </div>
      </div>
    </section>
  );
}
