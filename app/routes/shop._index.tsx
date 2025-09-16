import { Link } from "react-router";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { AnimatedImage } from "~/components/AnimatedImage";

export default function Shop() {
  const products = [
    {
      id: "tag-basic-card",
      name: "TAG Basic Card",
      price: "$40.00",
      description: "One Link. Endless Possibilities.",
      image: "/sample-tag-basic-card.webp",
      features: [
        "One custom NFC card with your personalized smart link",
        "Ready to use—no app needed for the person receiving your info",
        "Durable PVC card with your name, logo or handle printed",
        "Option to update the link in the future"
      ]
    },
    {
      id: "tag-core-card",
      name: "TAG Core Card", 
      price: "$47.00",
      description: "Instant Connection. Full Profile. One Tap.",
      image: "/sample-tag-core-card.webp",
      features: [
        "Automatic saving of your name, phone number, email, and website",
        "One-tap access to your complete digital profile",
        "Personalized card layout with your logo or brand identity",
        "Smooth, intuitive experience—no app required"
      ]
    }
  ];

  return (
    <div className="bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-50 to-blue-50 py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Smart Business Cards
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Connect instantly with NFC-powered smart cards. Share your information with a simple tap—no apps required for recipients.
          </p>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Choose Your Perfect Card
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From simple links to complete profiles, we have the right solution for your networking needs.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {products.map((product, index) => (
              <Card key={product.id} className="overflow-hidden hover-lift">
                <Link to={`/shop/${product.id}`} className="block">
                  <div className="aspect-square overflow-hidden cursor-pointer">
                    <AnimatedImage
                      src={product.image}
                      alt={product.name}
                      delay={index * 200}
                      className="w-full h-full"
                    />
                  </div>
                </Link>
                <CardHeader>
                  <CardTitle className="text-2xl">{product.name}</CardTitle>
                  <CardDescription className="text-lg text-gray-600">
                    {product.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-6">
                    {product.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <svg className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                  <div className="text-3xl font-bold text-green-600">
                    {product.price}
                  </div>
                  <Link to={`/shop/${product.id}`} className="w-full">
                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white py-3">
                      View Details
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Shipping Info */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Shipping Information
          </h3>
          <p className="text-lg text-gray-600 mb-8">
            Please consider <strong>15–20 business days</strong> for production and shipping (not including mail delays)
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
