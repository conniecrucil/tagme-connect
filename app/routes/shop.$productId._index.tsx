import { Link } from "react-router";
import { useConfiguration } from "~/providers/configuration-provider";

export default function ProductDetail() {
  const { product } = useConfiguration();

  if (!product) return null;

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
            <div className="aspect-square overflow-hidden rounded-lg bg-gray-100 flex items-center justify-center">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
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

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Ready to Order?</h4>
                <p className="text-sm text-blue-700">
                  Configure your card with your personal information to complete your order.
                </p>
              </div>

              <Link to="configure" className="w-full">
                <button className="w-full bg-green-600 hover:bg-green-700 text-white py-4 text-lg rounded">
                  Configure Card
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}