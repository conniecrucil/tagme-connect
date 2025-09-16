import { Link, useParams } from "react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { AnimatedImage } from "~/components/AnimatedImage";

export default function ProductDetail() {
  const { productId } = useParams();
  
  const products = {
    "tag-basic-card": {
      id: "tag-basic-card",
      name: "TAG Basic Card",
      price: "$40.00",
      description: "One Link. Endless Possibilities.",
      image: "/sample-tag-basic-card.webp",
      tagline: "The TAG Basic Card is perfect for professionals, artists, freelancers, and small business owners who want to be remembered—quickly and effortlessly.",
      useCase: "Whether you're at a networking event, meeting a potential client, or performing on stage, all it takes is a single tap to share your key link. No more searching for paper cards or typing long usernames.",
      features: [
        "One custom NFC card with your personalized smart link (e.g., LinkedIn, Instagram, website, portfolio, or booking page)",
        "Ready to use—no app needed for the person receiving your info",
        "Durable PVC card with your name, logo or handle printed",
        "Option to update the link in the future (contact us for reprogramming)"
      ],
      summary: "This card is great for people who just need **one strong connection point** to direct others to their online presence—clean, efficient, and always with you."
    },
    "tag-core-card": {
      id: "tag-core-card", 
      name: "TAG Core Card",
      price: "$47.00",
      description: "Instant Connection. Full Profile. One Tap.",
      image: "/sample-tag-core-card.webp",
      tagline: "The TAG Core Card is designed for professionals who want to go beyond a link—it's for those who want to make lasting impressions and stay top of mind.",
      useCase: "With just one tap, your full contact profile is saved directly to someone's phone—making it easier for potential clients, collaborators, or contacts to reach you again, without digging through emails or messages.",
      features: [
        "Automatic saving of your name, phone number, email, and website",
        "One-tap access to your complete digital profile (bio, links, location, social media, booking tools, etc.)",
        "Personalized card layout with your logo or brand identity",
        "Smooth, intuitive experience—no app required",
        "Future updates made easy—just reach out when you need to refresh your link, and we'll handle the rest"
      ],
      summary: "This card is ideal if you want to create trust at first contact and make it effortless for people to stay in touch with you. If the Basic Card is your quick hello, the **Core Card is your full introduction.**"
    }
  };

  const product = products[productId as keyof typeof products];

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Product Not Found</h1>
          <p className="text-lg text-gray-600 mb-8">The product you're looking for doesn't exist.</p>
          <Link to="/shop">
            <Button className="bg-green-600 hover:bg-green-700 text-white">
              Back to Shop
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="bg-gray-50 py-4">
        <div className="container mx-auto px-4">
          <nav className="flex items-center space-x-2 text-sm">
            <Link to="/shop" className="text-gray-600 hover:text-green-600">
              Shop
            </Link>
            <span className="text-gray-400">›</span>
            <span className="text-gray-900">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* Product Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Product Image */}
            <div className="aspect-square overflow-hidden rounded-lg">
              <AnimatedImage
                src={product.image}
                alt={product.name}
                delay={300}
                className="w-full h-full"
              />
            </div>

            {/* Product Info */}
            <div className="space-y-8">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                  {product.name}
                </h1>
                <div className="text-3xl font-bold text-green-600 mb-6">
                  {product.price}
                </div>
                <p className="text-lg text-gray-600 mb-6">
                  {product.description}
                </p>
              </div>

              {/* Product Description */}
              <div className="space-y-4">
                <p className="text-gray-700">
                  {product.tagline}
                </p>
                <p className="text-gray-700">
                  {product.useCase}
                </p>
              </div>

              {/* Features */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  What's included:
                </h3>
                <ul className="space-y-3">
                  {product.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <svg className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Summary */}
              <div className="bg-green-50 p-6 rounded-lg">
                <p className="text-gray-700" dangerouslySetInnerHTML={{ __html: product.summary.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
              </div>

              {/* Configure Card */}
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Ready to Order?</h4>
                  <p className="text-sm text-blue-700">
                    Configure your card with your personal information to complete your order.
                  </p>
                </div>
                <Link to={`/configure/${productId}`} className="w-full">
                  <Button className="w-full bg-green-600 hover:bg-green-700 text-white py-4 text-lg">
                    Configure & Add To Cart
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Shipping Info */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-lg text-gray-600 mb-8">
            * Please consider <strong>15–20 business days</strong> (not including mail delays)
          </p>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Location</h4>
              <p className="text-gray-600">Vancouver Island<br />British Columbia, Canada</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Contact</h4>
              <p className="text-gray-600">contact@tagmeconnections.com</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
