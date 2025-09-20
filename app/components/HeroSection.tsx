import { Button } from "./ui/button";
import { Skeleton, SkeletonButton } from "./ui/skeleton";
import { AnimatedImage } from "./AnimatedImage";
import { useLoadingState } from "../lib/useLoadingState";
import { Link } from "react-router";

export function HeroSection() {
  const isLoading = useLoadingState(100);

  return (
    <section className="relative bg-white py-20 lg:py-32">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Text content */}
          <div className="text-left">
            {isLoading ? (
              <div className="space-y-6">
                {/* Main tagline skeleton */}
                <div className="space-y-4">
                  <Skeleton className="h-16 md:h-20 lg:h-24 w-3/4" />
                  <Skeleton className="h-16 md:h-20 lg:h-24 w-1/2" />
                </div>
                
                {/* Subtitle skeleton */}
                <Skeleton className="h-6 md:h-8 w-4/5" />
                
                {/* CTA Button skeleton */}
                <SkeletonButton className="h-14 w-32" />
              </div>
            ) : (
              <>
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
                <Link to="/shop">
                  <Button size="lg" className="bg-black hover:bg-gray-800 text-white text-lg px-8 py-6 animate-fade-in-up animation-delay-700 hover:scale-105 transition-transform duration-300 pulse-glow">
                    Start Today
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Right side - Image */}
          <div className="flex justify-center lg:justify-end">
            <AnimatedImage
              src="/homepage-image-tagme.webp"
              alt="Hands holding smartphone and TAG ME card demonstrating digital connection"
              className="max-w-full h-auto rounded-lg shadow-lg hover:scale-105 transition-transform duration-500"
              placeholderClassName="w-full max-w-md h-64 md:h-80 lg:h-96"
              aspectRatio="auto"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
