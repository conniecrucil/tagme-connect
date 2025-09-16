import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

interface CartItem {
  productId: string;
  productType: 'basic' | 'core';
  quantity: number;
  configuration: any;
  price: number;
}

export default function Checkout() {
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const cartData = JSON.parse(localStorage.getItem('cart') || '[]');
    setCart(cartData);
    
    // Pre-fill customer info from first cart item if available
    if (cartData.length > 0 && cartData[0].configuration) {
      const config = cartData[0].configuration;
      setCustomerInfo({
        name: config.name || '',
        email: config.email || '',
        phone: config.phone || ''
      });
    }
    
    setIsLoading(false);
  }, []);

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleInputChange = (field: string, value: string) => {
    setCustomerInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCheckout = async () => {
    if (!customerInfo.name || !customerInfo.email || !customerInfo.phone) {
      alert('Please fill in all required customer information.');
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cart,
          customerInfo
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // Redirect to Stripe Checkout
        window.location.href = result.url;
      } else {
        alert(`Checkout failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('An error occurred during checkout. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">No Items to Checkout</h1>
            <p className="text-lg text-gray-600 mb-8">
              Your cart is empty. Add some items before proceeding to checkout.
            </p>
            <Link to="/shop">
              <Button className="bg-green-600 hover:bg-green-700 text-white">
                Continue Shopping
              </Button>
            </Link>
          </div>
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
            <Link to="/cart" className="text-gray-600 hover:text-green-600">
              Cart
            </Link>
            <span className="text-gray-400">›</span>
            <span className="text-gray-900">Checkout</span>
          </nav>
        </div>
      </div>

      {/* Checkout Content */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Checkout
            </h1>
            <p className="text-lg text-gray-600">
              Complete your purchase securely with Stripe
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Customer Information */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Customer Information</CardTitle>
                  <CardDescription>
                    This information will be used for shipping and order confirmation.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      type="text"
                      value={customerInfo.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      required
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={customerInfo.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                      placeholder="john@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={customerInfo.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      required
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Order Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {cart.map((item, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b">
                        <div>
                          <div className="font-medium">
                            {item.productType === 'basic' ? 'TAG Basic Card' : 'TAG Core Card'}
                          </div>
                          <div className="text-sm text-gray-600">
                            {item.configuration.name}
                          </div>
                          {item.quantity > 1 && (
                            <div className="text-sm text-gray-600">
                              Quantity: {item.quantity}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            ${(item.price * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <div className="border-t pt-4">
                      <div className="flex justify-between text-lg font-semibold">
                        <span>Total</span>
                        <span>${getTotalPrice().toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Payment Information */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Payment</CardTitle>
                  <CardDescription>
                    Secure payment processing powered by Stripe
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium text-green-800">Secure Payment</span>
                      </div>
                      <p className="text-sm text-green-700">
                        Your payment information is encrypted and processed securely by Stripe. 
                        We never store your payment details.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium">Accepted Payment Methods:</h4>
                      <div className="flex space-x-4 text-sm text-gray-600">
                        <span>💳 Credit Cards</span>
                        <span>🍎 Apple Pay</span>
                        <span>📱 Google Pay</span>
                      </div>
                    </div>

                    <div className="pt-4">
                      <Button 
                        className="w-full bg-green-600 hover:bg-green-700 text-white py-4 text-lg"
                        onClick={handleCheckout}
                        disabled={isProcessing || !customerInfo.name || !customerInfo.email || !customerInfo.phone}
                      >
                        {isProcessing ? 'Processing...' : `Pay $${getTotalPrice().toFixed(2)}`}
                      </Button>
                    </div>

                    <div className="text-xs text-gray-500 text-center">
                      <p>By proceeding, you agree to our Terms of Service</p>
                      <p>Shipping: 15-20 business days</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Back to Cart */}
              <div className="text-center">
                <Link to="/cart">
                  <Button variant="outline">
                    ← Back to Cart
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
