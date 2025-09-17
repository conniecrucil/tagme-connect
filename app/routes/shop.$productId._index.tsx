import { Link, useParams, useNavigate } from "react-router";
import { useConfiguration } from "~/providers/configuration-provider";
import { useState, useEffect } from "react";

export default function ProductDetail() {
  const { product } = useConfiguration();
  const { productId } = useParams();
  const navigate = useNavigate();
  const [hasConfiguration, setHasConfiguration] = useState(false);
  const [quantity, setQuantity] = useState(1);

  // Check if there's existing configuration
  useEffect(() => {
    if (productId) {
      const storageKey = `configuration-${productId}`;
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          const { configuration } = JSON.parse(stored);
          // Check if configuration has meaningful data
          const hasData = configuration.fname || configuration.lname || configuration.email || configuration.phone;
          setHasConfiguration(hasData);
        } catch (error) {
          console.error('Error parsing stored configuration:', error);
        }
      }
    }
  }, [productId]);

  const handlePurchase = () => {
    if (!productId) return;

    const storageKey = `configuration-${productId}`;
    const stored = localStorage.getItem(storageKey);

    if (!stored) {
      // No configuration found, redirect to configure
      navigate('configure');
      return;
    }

    try {
      const { configuration } = JSON.parse(stored);
      const cartItem = {
        productId,
        productType: productId === 'tag-basic-card' ? 'basic' : 'core',
        quantity: quantity,
        configuration,
        price: productId === 'tag-basic-card' ? 40 : 47
      };

      const existingCart = JSON.parse(localStorage.getItem('cart') || '[]');
      existingCart.push(cartItem);
      localStorage.setItem('cart', JSON.stringify(existingCart));

      navigate('/cart');
    } catch (error) {
      console.error('Error processing purchase:', error);
      navigate('configure');
    }
  };

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
                  {hasConfiguration
                    ? "Your card is configured and ready to purchase!"
                    : "Configure your card with your personal information to complete your order."
                  }
                </p>
              </div>

              {/* Configuration Button */}
              <Link to="configure" className="w-full">
                <button className="w-full bg-green-600 hover:bg-green-700 text-white py-4 text-lg rounded">
                  {hasConfiguration ? 'Modify Configuration' : 'Configure Card'}
                </button>
              </Link>

              {/* Quantity and Purchase Controls - only show if configuration exists */}
              {hasConfiguration && (
                <div className="space-y-4 mt-6">
                  <div className="flex items-center justify-between">
                    <label htmlFor="quantity" className="text-sm font-medium text-gray-700">
                      Quantity:
                    </label>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                      >
                        -
                      </button>
                      <span className="w-12 text-center">{quantity}</span>
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handlePurchase}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 text-lg rounded"
                  >
                    Purchase - ${(productId === 'tag-basic-card' ? 40 : 47) * quantity}.00
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}