import { Link, useParams, useNavigate } from "react-router";
import { useConfiguration } from "~/providers/configuration-provider";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function ProductDetail() {
  const { product } = useConfiguration();
  const { productId } = useParams();
  const navigate = useNavigate();
  const [hasConfiguration, setHasConfiguration] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [url, setUrl] = useState("");
  const [isValidUrl, setIsValidUrl] = useState(false);

  // Function to validate URL
  const validateUrl = (urlString: string): boolean => {
    if (!urlString.trim()) return false;
    
    try {
      const url = new URL(urlString);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  };

  // Check if there's existing configuration
  useEffect(() => {
    if (productId && productId !== 'tag-basic-card') {
      // For core card, check for configuration
      const storageKey = `configuration-${productId}`;
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          const { configuration, timestamp } = JSON.parse(stored);
          
          // Check if configuration has expired (1 hour = 3600000 ms)
          const oneHour = 60 * 60 * 1000;
          const isExpired = timestamp && (Date.now() - timestamp) > oneHour;
          
          if (isExpired) {
            console.log('Configuration expired, clearing stored data');
            localStorage.removeItem(storageKey);
            setHasConfiguration(false);
            return;
          }
          
          // Check if configuration has meaningful data
          const hasData = configuration.fname || configuration.lname || configuration.email || configuration.phone;
          setHasConfiguration(hasData);
        } catch (error) {
          console.error('Error parsing stored configuration:', error);
        }
      }
    }
  }, [productId]);

  const handleAddToCart = () => {
    if (!productId) return;

    if (productId === 'tag-basic-card') {
      // For basic card, check if URL is valid
      if (!validateUrl(url)) {
        toast.error('Please enter a valid URL (must start with http:// or https://)');
        return;
      }
      
      const cartItem = {
        productId,
        productType: 'basic',
        quantity: quantity,
        url: url.trim(),
        price: 40,
        id: `basic-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` // Unique ID for each configuration
      };

      const existingCart = JSON.parse(localStorage.getItem('cart') || '[]');
      existingCart.push(cartItem);
      localStorage.setItem('cart', JSON.stringify(existingCart));

      // Dispatch custom event to update header cart count
      window.dispatchEvent(new CustomEvent('cartUpdated'));

      // Show success message and navigate to cart
      toast.success('Item added to cart!');
      navigate('/cart');
    } else {
      // For core card, check for configuration
      const storageKey = `configuration-${productId}`;
      const stored = localStorage.getItem(storageKey);

      if (!stored) {
        // No configuration found, redirect to configure
        navigate('configure');
        return;
      }

      try {
        const { configuration, timestamp } = JSON.parse(stored);
        
        // Check if configuration has expired (1 hour = 3600000 ms)
        const oneHour = 60 * 60 * 1000;
        const isExpired = timestamp && (Date.now() - timestamp) > oneHour;
        
        if (isExpired) {
          console.log('Configuration expired, redirecting to configure');
          localStorage.removeItem(storageKey);
          navigate('configure');
          return;
        }
        
        const cartItem = {
          productId,
          productType: 'core',
          quantity: quantity,
          configuration,
          price: 47,
          id: `core-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` // Unique ID for each configuration
        };

        const existingCart = JSON.parse(localStorage.getItem('cart') || '[]');
        existingCart.push(cartItem);
        localStorage.setItem('cart', JSON.stringify(existingCart));

        // Clear the cached configuration since it's now in the cart
        localStorage.removeItem(storageKey);

        // Dispatch custom event to update header cart count
        window.dispatchEvent(new CustomEvent('cartUpdated'));

        // Show success message and navigate to cart
        toast.success('Item added to cart!');
        navigate('/cart');
      } catch (error) {
        console.error('Error processing add to cart:', error);
        navigate('configure');
      }
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    
    // Validate URL and update state
    const isValid = validateUrl(newUrl);
    setIsValidUrl(isValid);
    setHasConfiguration(isValid);
  };

  const handleClearUrl = () => {
    setUrl("");
    setIsValidUrl(false);
    setHasConfiguration(false);
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

              {productId === 'tag-basic-card' ? (
                // Basic Card - URL Input
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Ready to Order?</h4>
                    <p className="text-sm text-blue-700">
                      {isValidUrl
                        ? "Your URL is set and ready to purchase!"
                        : url.trim() 
                          ? "Please enter a valid URL (must start with http:// or https://)"
                          : "Enter the URL you want your card to link to."
                      }
                    </p>
                  </div>

                  {/* URL Input */}
                  <div className="space-y-2">
                    <label htmlFor="url" className="text-sm font-medium text-gray-700">
                      Website URL:
                    </label>
                    <div className="flex space-x-2">
                      <input
                        id="url"
                        type="url"
                        value={url}
                        onChange={handleUrlChange}
                        placeholder="https://example.com"
                        className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent ${
                          url.trim() 
                            ? isValidUrl 
                              ? 'border-green-500 focus:ring-green-500' 
                              : 'border-red-500 focus:ring-red-500'
                            : 'border-gray-300 focus:ring-green-500'
                        }`}
                        required
                      />
                      <button
                        onClick={handleClearUrl}
                        className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  {/* Quantity and Purchase Controls */}
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
                      onClick={handleAddToCart}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 text-lg rounded"
                    >
                      Add to Cart - ${(40 * quantity).toFixed(2)}
                    </button>
                  </div>
                </div>
              ) : (
                // Core Card - Configuration Flow
                <div className="space-y-4">

                  {/* Mobile-First Site Explanation */}
                  <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                    <h3 className="font-semibold text-green-900 mb-3">Mobile-First Digital Directory</h3>
                    <p className="text-sm text-green-800 mb-3">
                      Your TAG Core card connects to a mobile-first website that serves as a comprehensive directory of your personal information. This creates a seamless networking experience that makes connections much easier.
                    </p>
                    <div className="text-sm text-green-700 space-y-2">
                      <p><strong>How it works:</strong></p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>Tap the card with any NFC-enabled device</li>
                        <li>Instantly access your mobile-optimized profile page</li>
                        <li>View and save your contact information with one tap</li>
                        <li>Access your social media links and website</li>
                      </ul>
                      <p className="mt-3">
                        <strong>Perfect for:</strong> Networking events, business meetings, conferences, and any situation where you want to quickly share your information.
                      </p>
                    </div>
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
                        onClick={handleAddToCart}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 text-lg rounded"
                      >
                        Add to Cart - ${(47 * quantity).toFixed(2)}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}