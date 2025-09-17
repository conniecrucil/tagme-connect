import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Skeleton, SkeletonCard, SkeletonImage, SkeletonButton } from "./ui/skeleton";
import { AnimatedImage } from "./AnimatedImage";
import { Droplets, Smartphone, Palette, Leaf } from "lucide-react";
import { useLoadingState } from "../lib/useLoadingState";

export function TagMeCardsSection() {
  const isLoading = useLoadingState(200);
  
  const features = [
    {
      icon: <Droplets className="h-8 w-8 text-green-600" />,
      title: "Durable plastic card",
      description: "Built to last, rain or shine — just like your reputation. (Perfect for the West Coast weather!)"
    },
    {
      icon: <Smartphone className="h-8 w-8 text-green-600" />,
      title: "Tap to share",
      description: "No apps, no awkward asks — just one smooth tap and your contact info is saved."
    },
    {
      icon: <Palette className="h-8 w-8 text-green-600" />,
      title: "Let your brand speak for you",
      description: "Every share is a moment to stand out and stay remembered."
    },
    {
      icon: <Leaf className="h-8 w-8 text-green-600" />,
      title: "Keep it Green",
      description: "No stacks of business cards. Just one — and the planet thanks you."
    }
  ];

  const products = [
    {
      name: "TAG Basic Card",
      price: "$40",
      description: "Essential features for professional networking",
      image: "/sample-tag-basic-card.webp"
    },
    {
      name: "TAG Core Card", 
      price: "$47",
      description: "Advanced features with premium customization",
      image: "/sample-tag-core-card.webp"
    }
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 md:h-10 w-64 mx-auto" />
              <Skeleton className="h-6 md:h-8 w-48 mx-auto" />
              <div className="space-y-2 max-w-4xl mx-auto">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-4/5 mx-auto" />
                <Skeleton className="h-5 w-3/4 mx-auto" />
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 animate-fade-in-up animation-delay-100">
                TAG Me Cards
              </h2>
              <h3 className="text-xl md:text-2xl text-green-600 font-semibold mb-6 animate-fade-in-up animation-delay-300">
                Tap Into Connection
              </h3>
              <p className="text-lg text-gray-600 max-w-4xl mx-auto animate-fade-in-up animation-delay-500">
                Made for professionals who care about connection <em>and</em> the planet, this product saves your information with just one tap—no apps, no paper waste, no reprints. It is personalized to <strong>reflect</strong> <em>you,</em> built to last, and crafted for a greener future.
              </p>
            </>
          )}
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="text-center">
                <Skeleton className="h-8 w-8 mx-auto mb-4" />
                <Skeleton className="h-6 w-3/4 mx-auto mb-2" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6 mx-auto" />
                </div>
              </div>
            ))
          ) : (
            features.map((feature, index) => (
              <div 
                key={index} 
                className="text-center animate-fade-in-up hover:scale-105 transition-transform duration-300"
                style={{ animationDelay: `${index * 150 + 700}ms` }}
              >
                <div className="flex justify-center mb-4 hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h4>
                <p className="text-gray-600 text-sm">
                  {feature.description}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Product Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {isLoading ? (
            Array.from({ length: 2 }).map((_, index) => (
              <SkeletonCard key={index} className="text-center">
                <div className="space-y-4">
                  <SkeletonImage className="w-32 h-32 mx-auto" />
                  <Skeleton className="h-6 w-3/4 mx-auto" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3 mx-auto" />
                  <Skeleton className="h-8 w-20 mx-auto" />
                  <SkeletonButton className="w-full h-10" />
                </div>
              </SkeletonCard>
            ))
          ) : (
            products.map((product, index) => (
              <Card 
                key={index} 
                className="text-center border-2 hover:border-green-600 transition-all duration-300 overflow-hidden animate-fade-in-up hover-lift"
                style={{ animationDelay: `${index * 200 + 1200}ms` }}
              >
                <div className="p-6">
                  <AnimatedImage
                    src={product.image}
                    alt={product.name}
                    className="w-32 h-32 mx-auto mb-6 object-contain rounded-lg shadow-md hover:scale-110 transition-transform duration-300"
                    placeholderClassName="w-32 h-32 mx-auto mb-6"
                    aspectRatio="square"
                  />
                </div>
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-gray-900">
                    {product.name}
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    {product.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600 mb-6">
                    {product.price}
                  </div>
                  <Button className="w-full bg-green-600 hover:bg-green-700 text-white hover:scale-105 transition-transform duration-300">
                    Get Started
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
