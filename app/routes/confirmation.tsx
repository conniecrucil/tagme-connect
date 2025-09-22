import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";

interface OrderDetails {
  sessionId: string;
  customerEmail: string;
  totalAmount: number;
  items: Array<{
    productType: 'basic' | 'core';
    quantity: number;
    configuration?: any;
    url?: string;
  }>;
}

export function meta() {
  return [
    { title: "Order Confirmation - TagMe Connections" },
    { name: "description", content: "Thank you for your purchase. Your order has been successfully processed and you'll receive a confirmation email shortly." },
  ];
}

export default function Confirmation() {
  const [searchParams] = useSearchParams();
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const sendPurchaseEmails = async (sessionId: string, cart: any[], customerInfo: any) => {
    try {
      const response = await fetch('/.netlify/functions/send-purchase-emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          customerInfo,
          cart
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send purchase emails');
      }

      const result = await response.json();
      console.log('Purchase emails sent successfully:', result);
    } catch (error) {
      console.error('Error sending purchase emails:', error);
      // Don't show error to user as this is a background operation
    }
  };

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    
    if (sessionId) {
      const fetchOrderData = async () => {
        try {
          console.log('Fetching Stripe session data for:', sessionId);
          
          // Try to retrieve the Stripe session to get shipping address and customer info
          let stripeData = null;
          try {
            const stripeResponse = await fetch('/.netlify/functions/get-stripe-session', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ sessionId }),
            });

            console.log('Stripe response status:', stripeResponse.status);

            if (stripeResponse.ok) {
              stripeData = await stripeResponse.json();
              console.log('Retrieved Stripe data:', stripeData);
            } else {
              const errorText = await stripeResponse.text();
              console.warn('Stripe session retrieval failed, falling back to localStorage:', errorText);
            }
          } catch (stripeError) {
            console.warn('Stripe session retrieval error, falling back to localStorage:', stripeError);
          }
          
          // Get cart data from localStorage
          const cart = JSON.parse(localStorage.getItem('cart') || '[]');
          const totalAmount = cart.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
          
          if (cart.length > 0) {
            // Use customer email from Stripe session data if available, otherwise fall back to original logic
            let customerEmail: string;
            
            if (stripeData?.customerInfo?.email) {
              customerEmail = stripeData.customerInfo.email;
            } else {
              // Fall back to original logic
              const firstItem = cart[0];
              
              if (firstItem.productType === 'basic') {
                // For basic cards, we need to get email from customer info stored during checkout
                const storedCustomerInfo = localStorage.getItem('customerInfo');
                if (storedCustomerInfo) {
                  const parsed = JSON.parse(storedCustomerInfo);
                  customerEmail = parsed.email;
                } else {
                  throw new Error('Customer email is required but not found for basic card order');
                }
              } else {
                // For core cards, try to get email from configuration first, then fall back to stored customer info
                customerEmail = firstItem.configuration?.email;
                if (!customerEmail) {
                  // Fall back to stored customer info if core card doesn't have email
                  const storedCustomerInfo = localStorage.getItem('customerInfo');
                  if (storedCustomerInfo) {
                    const parsed = JSON.parse(storedCustomerInfo);
                    customerEmail = parsed.email;
                  } else {
                    throw new Error('Customer email is required but not found in card configuration or stored customer info');
                  }
                }
              }
            }
            
            if (!customerEmail) {
              throw new Error('Customer email is required but not found');
            }
            
            const orderData = {
              sessionId,
              customerEmail,
              totalAmount,
              items: cart.map((item: any) => ({
                productType: item.productType,
                quantity: item.quantity,
                configuration: item.configuration,
                url: item.url // Include URL for basic cards
              }))
            };
            
            setOrderDetails(orderData);
            
            // Create customer info object combining Stripe data with stored data
            const firstItem = cart[0];
            let customerInfo: any;
            
            if (firstItem.productType === 'basic') {
              // For basic cards, use stored customer info but override with Stripe data if available
              const storedCustomerInfo = localStorage.getItem('customerInfo');
              const parsed = storedCustomerInfo ? JSON.parse(storedCustomerInfo) : {};
              customerInfo = {
                email: customerEmail,
                name: stripeData?.customerInfo?.name || parsed.name || 'Customer',
                phone: stripeData?.customerInfo?.phone || parsed.phone || '',
                shipping: stripeData?.shippingAddress || null // Include shipping address from Stripe if available
              };
            } else {
              // For core cards, use configuration data if available, otherwise fall back to stored customer info
              if (firstItem.configuration && firstItem.configuration.email) {
                customerInfo = {
                  ...firstItem.configuration,
                  email: customerEmail, // Use email from Stripe or fallback
                  shipping: stripeData?.shippingAddress || null // Include shipping address from Stripe if available
                };
              } else {
                // Fall back to stored customer info if core card doesn't have complete configuration
                const storedCustomerInfo = localStorage.getItem('customerInfo');
                const parsed = storedCustomerInfo ? JSON.parse(storedCustomerInfo) : {};
                customerInfo = {
                  email: customerEmail,
                  name: stripeData?.customerInfo?.name || parsed.name || 'Customer',
                  phone: stripeData?.customerInfo?.phone || parsed.phone || '',
                  shipping: stripeData?.shippingAddress || null // Include shipping address from Stripe if available
                };
              }
            }
            
            sendPurchaseEmails(sessionId, cart, customerInfo);
            
            // Clear the cart after successful order
            localStorage.removeItem('cart');
          }
        } catch (error) {
          console.error('Error processing order confirmation:', error);
          // Set orderDetails to null to show error state
          setOrderDetails(null);
        }
      };
      
      fetchOrderData();
    }
    
    setIsLoading(false);
  }, [searchParams]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!orderDetails) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Order Not Found</h1>
            <p className="text-lg text-gray-600 mb-8">
              We couldn't find your order details. Please contact support if you believe this is an error.
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
      {/* Success Header */}
      <section className="bg-gradient-to-br from-green-50 to-blue-50 py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Order Confirmed!
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Thank you for your purchase. Your order has been successfully processed and you'll receive a confirmation email shortly.
          </p>
        </div>
      </section>

      {/* Order Details */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Order Information */}
            <Card>
              <CardHeader>
                <CardTitle>Order Information</CardTitle>
                <CardDescription>
                  Your order details and next steps
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Number:</span>
                    <span className="font-medium">{orderDetails.sessionId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Customer Email:</span>
                    <span className="font-medium">{orderDetails.customerEmail}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Amount:</span>
                    <span className="font-medium">${orderDetails.totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Date:</span>
                    <span className="font-medium">{new Date().toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-900 mb-2">What's Next?</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• You'll receive a confirmation email shortly</li>
                    <li>• Your order will be processed within 1-2 business days</li>
                    <li>• Production and shipping: 15-20 business days</li>
                    <li>• You'll receive tracking information when shipped</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Items Ordered */}
            <Card>
              <CardHeader>
                <CardTitle>Items Ordered</CardTitle>
                <CardDescription>
                  Your smart card configurations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orderDetails.items.map((item, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">
                          {item.productType === 'basic' ? 'TAG Basic Card' : 'TAG Core Card'}
                        </h4>
                        <span className="text-sm text-gray-600">
                          Qty: {item.quantity}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        {item.productType === 'basic' ? (
                          /* Basic Card - Show Website URL and Logo */
                          <>
                            <p><strong>Website URL:</strong> 
                              <a 
                                href={item.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-green-600 hover:text-green-700 ml-1"
                              >
                                {item.url}
                              </a>
                            </p>
                            {item.configuration?.images?.logo?.url && (
                              <div className="mt-2">
                                <p className="font-medium text-gray-700 mb-1">Logo Preview:</p>
                                <img 
                                  src={item.configuration.images.logo.url} 
                                  alt="Logo preview" 
                                  className="max-h-16 max-w-full object-contain border rounded"
                                />
                              </div>
                            )}
                            <p className="text-xs text-gray-500 mt-2">
                              This card will redirect users to the website above when tapped.
                            </p>
                          </>
                        ) : (
                          /* Core Card - Show Contact Details and Logo */
                          <>
                            <p><strong>Name:</strong> {item.configuration?.name || 'Not provided'}</p>
                            <p><strong>Email:</strong> <a href={`mailto:${item.configuration?.email}`} className="text-blue-600 hover:underline">{item.configuration?.email || 'Not provided'}</a></p>
                            <p><strong>Phone:</strong> <a href={`tel:${item.configuration?.phone}`} className="text-blue-600 hover:underline">{item.configuration?.phone || 'Not provided'}</a></p>
                            {item.configuration?.company && (
                              <p><strong>Company:</strong> {item.configuration.company}</p>
                            )}
                            {item.configuration?.title && (
                              <p><strong>Title:</strong> {item.configuration.title}</p>
                            )}
                            {item.configuration?.images?.logo?.url && (
                              <div className="mt-2">
                                <p className="font-medium text-gray-700 mb-1">Logo Preview:</p>
                                <img 
                                  src={item.configuration.images.logo.url} 
                                  alt="Logo preview" 
                                  className="max-h-16 max-w-full object-contain border rounded"
                                />
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Support Information */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
              <CardDescription>
                We're here to help with your order
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Contact Support</h4>
                  <p className="text-gray-600 mb-2">
                    Have questions about your order? We're here to help.
                  </p>
                  <p className="text-sm text-gray-600">
                    Email: support@yourcompany.com<br />
                    Include your order number: {orderDetails.sessionId}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Shipping Information</h4>
                  <p className="text-gray-600 mb-2">
                    Your cards will be shipped from Vancouver Island, British Columbia, Canada.
                  </p>
                  <p className="text-sm text-gray-600">
                    Please allow 15-20 business days for production and shipping.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="text-center mt-8 space-x-4">
            <Link to="/shop">
              <Button variant="outline">
                Continue Shopping
              </Button>
            </Link>
            <Link to="/contact">
              <Button className="bg-green-600 hover:bg-green-700 text-white">
                Contact Support
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}


