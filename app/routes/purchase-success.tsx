import { Link, useSearchParams } from "react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";

export default function PurchaseSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  return (
    <div className="min-h-screen bg-background">
      {/* Success Content */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            {/* Success Icon */}
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Purchase Successful!
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Thank you for your order. Your smart card is being prepared for production.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
                <CardDescription>Your purchase details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Session ID:</span>
                    <span className="font-mono text-sm">{sessionId || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="text-green-600 font-semibold">Paid</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Method:</span>
                    <span>Stripe Checkout</span>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total Paid:</span>
                      <span className="text-green-600">See Stripe receipt</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Next Steps */}
            <Card>
              <CardHeader>
                <CardTitle>What Happens Next?</CardTitle>
                <CardDescription>Your order processing timeline</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Order Confirmed</h4>
                      <p className="text-sm text-gray-600">Payment processed successfully</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Production Started</h4>
                      <p className="text-sm text-gray-600">Your card is being manufactured (1-2 days)</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Quality Check</h4>
                      <p className="text-sm text-gray-600">Final inspection and packaging (1 day)</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Shipped</h4>
                      <p className="text-sm text-gray-600">Package sent via Canada Post (15-20 business days)</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Email Confirmation */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Email Confirmation</CardTitle>
              <CardDescription>Check your inbox for order details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-50 p-6 rounded-lg">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-2">Confirmation Email Sent</h4>
                    <p className="text-blue-700 mb-3">
                      We've sent a detailed confirmation email to your registered email address with:
                    </p>
                    <ul className="text-blue-700 space-y-1 text-sm">
                      <li>• Order number and payment confirmation</li>
                      <li>• Detailed product specifications</li>
                      <li>• Estimated delivery timeline</li>
                      <li>• Tracking information (when available)</li>
                      <li>• Contact information for support</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Support Information */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
              <CardDescription>We're here to assist you</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Contact Information</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p><strong>Email:</strong> contact@tagmeconnections.com</p>
                    <p><strong>Response Time:</strong> Within 24 hours</p>
                    <p><strong>Business Hours:</strong> Monday - Friday, 9 AM - 5 PM PST</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Common Questions</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>• How to track your order</p>
                    <p>• Delivery timeframes</p>
                    <p>• Card customization options</p>
                    <p>• Return and exchange policy</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/shop">
              <Button variant="outline" className="w-full sm:w-auto">
                Continue Shopping
              </Button>
            </Link>
            <Link to="/contact">
              <Button className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white">
                Contact Support
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
