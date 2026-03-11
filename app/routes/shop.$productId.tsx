import { useParams, Link, Outlet } from "react-router";
import { ConfigurationProvider, type ProductData } from "~/providers/configuration-provider";

// Main layout component
export default function ProductLayout() {
  const { productId } = useParams();

  const products: Record<string, ProductData> = {
    "tag-basic-card": {
      id: "tag-basic-card",
      name: "TAG Basic Card",
      price: "$50.00",
      description: "One Link. Endless Possibilities.",
      image: "/sample-tag-basic-card.webp"
    },
    "tag-core-card": {
      id: "tag-core-card",
      name: "TAG Core Card",
      price: "$47.00",
      description: "Instant Connection. Full Profile. One Tap.",
      image: "/sample-tag-core-card.webp"
    }
  };

  const product = products[productId as keyof typeof products] || null;

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Product Not Found</h1>
          <p className="text-lg text-gray-600 mb-8">The product you're looking for doesn't exist.</p>
          <Link to="/shop" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
            Back to Shop
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ConfigurationProvider product={product}>
      <div className="min-h-screen bg-background">
        <Outlet />
      </div>
    </ConfigurationProvider>
  );
}
