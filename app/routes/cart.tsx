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
  configuration?: any;
  url?: string;
  price: number;
  id: string; // Unique identifier for each cart item configuration
}

export default function Cart() {
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const cartData = JSON.parse(localStorage.getItem('cart') || '[]');
    setCart(cartData);
    setIsLoading(false);
  }, []);

  const updateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    const updatedCart = [...cart];
    updatedCart[index].quantity = newQuantity;
    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    
    // Dispatch custom event to update header cart count
    window.dispatchEvent(new CustomEvent('cartUpdated'));
  };

  const removeItem = (index: number) => {
    const itemToRemove = cart[index];
    const updatedCart = cart.filter((_, i) => i !== index);
    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    
    // Clear the cached configuration for this item since it's being removed from cart
    if (itemToRemove) {
      const storageKey = `configuration-${itemToRemove.productId}`;
      localStorage.removeItem(storageKey);
    }
    
    // Dispatch custom event to update header cart count
    window.dispatchEvent(new CustomEvent('cartUpdated'));
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    navigate('/checkout');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading cart...</p>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Your Cart is Empty</h1>
            <p className="text-lg text-gray-600 mb-8">
              Add some smart cards to your cart to get started.
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
            <span className="text-gray-900">Cart</span>
          </nav>
        </div>
      </div>

      {/* Cart Content */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Shopping Cart
            </h1>
            <p className="text-lg text-gray-600">
              Review your items before proceeding to checkout
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-6">
              {cart.map((item, index) => (
                <Card key={item.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>
                          {item.productType === 'basic' ? 'TAG Basic Card' : 'TAG Core Card'}
                        </CardTitle>
                        <CardDescription>
                          {item.productType === 'basic' 
                            ? 'One custom NFC card with personalized smart link'
                            : 'Complete digital profile with automatic contact saving'
                          }
                        </CardDescription>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeItem(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Remove
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Configuration Summary */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-2">Configuration:</h4>
                        <div className="text-sm text-gray-600 space-y-1">
                          {item.productType === 'basic' ? (
                            <div>
                              <p><strong>Website URL:</strong> {item.url}</p>
                              <p className="text-xs text-gray-500 mt-1">This card will redirect to the specified URL when tapped.</p>
                            </div>
                          ) : (
                            <div>
                              <p><strong>Name:</strong> {item.configuration?.name || 'Not set'}</p>
                              <p><strong>Email:</strong> {item.configuration?.email || 'Not set'}</p>
                              <p><strong>Phone:</strong> {item.configuration?.phone || 'Not set'}</p>
                              {item.configuration?.company && (
                                <p><strong>Company:</strong> {item.configuration.company}</p>
                              )}
                              {item.configuration?.title && (
                                <p><strong>Title:</strong> {item.configuration.title}</p>
                              )}
                              {item.configuration?.website && (
                                <p><strong>Website:</strong> {item.configuration.website}</p>
                              )}
                              {item.configuration?.primaryActions && item.configuration.primaryActions.length > 0 && (
                                <p><strong>Primary Actions:</strong> {item.configuration.primaryActions.length} configured</p>
                              )}
                              {item.configuration?.secondaryActions && item.configuration.secondaryActions.length > 0 && (
                                <p><strong>Social Links:</strong> {item.configuration.secondaryActions.length} configured</p>
                              )}
                              <p className="text-xs text-gray-500 mt-1">Complete digital profile with automatic contact saving.</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Quantity and Price */}
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                          <Label htmlFor={`quantity-${index}`}>Quantity:</Label>
                          <Input
                            id={`quantity-${index}`}
                            type="number"
                            min="1"
                            max="5"
                            value={item.quantity}
                            onChange={(e) => updateQuantity(index, parseInt(e.target.value))}
                            className="w-20"
                          />
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-gray-900">
                            ${(item.price * item.quantity).toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-600">
                            ${item.price.toFixed(2)} each
                          </div>
                        </div>
                      </div>

                      {/* Edit Configuration Button */}
                      <div className="pt-2">
                        {item.productType === 'basic' ? (
                          <Link to={`/shop/${item.productId}`}>
                            <Button variant="outline" size="sm">
                              Edit URL
                            </Button>
                          </Link>
                        ) : (
                          <Link to={`/shop/${item.productId}/configure`}>
                            <Button variant="outline" size="sm">
                              Edit Configuration
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-8">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cart.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>
                        {item.productType === 'basic' ? 'TAG Basic Card' : 'TAG Core Card'} 
                        {item.quantity > 1 && ` × ${item.quantity}`}
                      </span>
                      <span>${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total</span>
                      <span>${getTotalPrice().toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button 
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-3"
                      onClick={handleCheckout}
                    >
                      Proceed to Checkout
                    </Button>
                  </div>

                  <div className="text-xs text-gray-500 text-center">
                    <p>Shipping: 15-20 business days</p>
                    <p>Secure payment via Stripe</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}


