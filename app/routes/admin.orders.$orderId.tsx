import { useLoaderData, Link } from "react-router";
import type { ClientLoaderFunctionArgs } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { toast } from "sonner";

export function meta() {
  return [
    { title: "Order Details - Admin - TagMe Connections" },
    { name: "description", content: "View detailed information about a specific order." },
  ];
}

export async function clientLoader({ params }: ClientLoaderFunctionArgs) {
  const { orderId } = params;
  
  if (!orderId) {
    throw new Error("Order ID is required");
  }

  try {
    const response = await fetch(`/.netlify/functions/get-order?orderId=${orderId}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Order not found");
      }
      throw new Error(`Failed to fetch order details: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      order: data.order,
      cards: data.cards || [],
      orderId,
    };
  } catch (error) {
    console.error('Error in clientLoader:', error);
    throw error;
  }
}

export function handle() {
  return {
    breadcrumb: { label: "Order Details" }
  };
}

interface Order {
  id: string;
  stripe_session_id: string;
  customer_info: {
    name?: string;
    email?: string;
    phone?: string;
    [key: string]: any;
  };
  cart_data: Array<{
    productType: string;
    quantity: number;
    price: number;
    configuration?: {
      selectedActions?: Array<{ name: string; value: string; color?: string }>;
      name?: string;
      email?: string;
      phone?: string;
      [key: string]: any;
    };
    [key: string]: any;
  }>;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  shipped: boolean;
  fulfilled: boolean;
  stripe_receipt_url?: string | null;
  created_at: string;
  updated_at: string;
}

export default function AdminOrderDetail() {
  const data = useLoaderData<typeof clientLoader>();

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied`);
    } catch (err) {
      console.error('Failed to copy:', err);
      toast.error("Failed to copy");
    }
  };

  if (!data || !data.order) {
    return (
      <div className="space-y-4">
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Error Loading Order</CardTitle>
            <CardDescription>
              Unable to load order details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/admin/orders">Back to All Orders</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { order, cards } = data as { order: Order; cards: any[] };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-100 text-gray-800">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTotalAmount = (cartData: Order['cart_data']) => {
    return cartData.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const getStripeReceiptUrl = async () => {
    if (!order.stripe_receipt_url) {
      try {
        const response = await fetch('/.netlify/functions/get-stripe-receipt-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: order.stripe_session_id }),
        });

        if (!response.ok) throw new Error('Failed to get receipt URL');
        const data = await response.json();
        
        if (data.receipt_url) {
          window.open(data.receipt_url, '_blank');
        }
      } catch (error) {
        console.error('Error fetching receipt URL:', error);
      }
    } else {
      window.open(order.stripe_receipt_url, '_blank');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Order Details</h1>
          <p className="text-gray-600">Order ID: {order.id}</p>
        </div>
        <Button asChild variant="outline">
          <Link to="/admin/orders">Back to Orders</Link>
        </Button>
      </div>

      {/* Order Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Order Overview</CardTitle>
          <CardDescription>Basic order information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Stripe Session ID</p>
              <p className="mt-1 font-mono text-sm">{order.stripe_session_id}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Order Status</p>
                <p className="mt-1">{getStatusBadge(order.status)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Fulfillment</p>
                <p className="mt-1">
                  <Badge className={order.shipped ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}>
                    {order.shipped ? 'Shipped' : 'Not Shipped'}
                  </Badge>
                  {' '}
                  <Badge className={order.fulfilled ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                    {order.fulfilled ? 'Fulfilled' : 'Not Fulfilled'}
                  </Badge>
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Order Date</p>
                <p className="mt-1">{formatDate(order.created_at)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Last Updated</p>
                <p className="mt-1">{formatDate(order.updated_at)}</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Amount</p>
              <p className="mt-1 text-2xl font-bold">${getTotalAmount(order.cart_data).toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Information */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Information</CardTitle>
          <CardDescription>Customer details from this order</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Name</p>
              <p className="mt-1">{order.customer_info.name || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Email</p>
              {order.customer_info.email ? (
                <button 
                  type="button"
                  className="mt-1 cursor-pointer hover:text-green-600 hover:underline text-left" 
                  onClick={() => copyToClipboard(order.customer_info.email || '', 'Email')}
                >
                  {order.customer_info.email}
                </button>
              ) : (
                <p className="mt-1">Not provided</p>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Phone</p>
              {order.customer_info.phone ? (
                <button 
                  type="button"
                  className="mt-1 cursor-pointer hover:text-green-600 hover:underline text-left" 
                  onClick={() => copyToClipboard(order.customer_info.phone || '', 'Phone')}
                >
                  {order.customer_info.phone}
                </button>
              ) : (
                <p className="mt-1">Not provided</p>
              )}
            </div>
          </div>
          
          {/* Shipping Address Section */}
          {order.customer_info.shipping_address && typeof order.customer_info.shipping_address === 'object' && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm font-medium text-gray-500 mb-2">Shipping Address</p>
              <div 
                className="space-y-1 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
                role="button"
                tabIndex={0}
                onClick={() => {
                  const addr = order.customer_info.shipping_address;
                  const addressLines = [];
                  if (addr.street) addressLines.push(addr.street);
                  if (addr.city || addr.state || addr.postal) {
                    const cityStatePostal = [
                      addr.city,
                      addr.state,
                      addr.postal
                    ].filter(Boolean).join(', ');
                    if (cityStatePostal) addressLines.push(cityStatePostal);
                  }
                  if (addr.country) addressLines.push(addr.country);
                  copyToClipboard(addressLines.join('\n'), 'Shipping address');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const addr = order.customer_info.shipping_address;
                    const addressLines = [];
                    if (addr.street) addressLines.push(addr.street);
                    if (addr.city || addr.state || addr.postal) {
                      const cityStatePostal = [
                        addr.city,
                        addr.state,
                        addr.postal
                      ].filter(Boolean).join(', ');
                      if (cityStatePostal) addressLines.push(cityStatePostal);
                    }
                    if (addr.country) addressLines.push(addr.country);
                    copyToClipboard(addressLines.join('\n'), 'Shipping address');
                  }
                }}
              >
                {order.customer_info.shipping_address.street && (
                  <p className="text-gray-900">{order.customer_info.shipping_address.street}</p>
                )}
                {(order.customer_info.shipping_address.city || order.customer_info.shipping_address.state || order.customer_info.shipping_address.postal) && (
                  <p className="text-gray-900">
                    {order.customer_info.shipping_address.city && order.customer_info.shipping_address.city}
                    {order.customer_info.shipping_address.city && (order.customer_info.shipping_address.state || order.customer_info.shipping_address.postal) && ', '}
                    {order.customer_info.shipping_address.state && order.customer_info.shipping_address.state}
                    {order.customer_info.shipping_address.state && order.customer_info.shipping_address.postal && ' '}
                    {order.customer_info.shipping_address.postal && order.customer_info.shipping_address.postal}
                  </p>
                )}
                {order.customer_info.shipping_address.country && (
                  <p className="text-gray-900">{order.customer_info.shipping_address.country}</p>
                )}
              </div>
            </div>
          )}
          
          {/* Display any additional customer info */}
          {Object.keys(order.customer_info).filter(key => !['name', 'email', 'phone', 'address', 'city', 'state', 'postal_code', 'shipping_address'].includes(key)).length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm font-medium text-gray-500 mb-2">Additional Information</p>
              <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto">
                {JSON.stringify(
                  Object.fromEntries(
                    Object.entries(order.customer_info).filter(([key]) => !['name', 'email', 'phone'].includes(key))
                  ),
                  null,
                  2
                )}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle>Order Items</CardTitle>
          <CardDescription>{order.cart_data.length} item(s) in this order</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {order.cart_data.map((item, idx) => (
              <div key={`${order.id}-${item.productType}-${idx}`} className="border rounded-lg p-4">
                <div className="flex flex-col md:flex-row items-start gap-6">
                  <div className="flex-1 w-full md:w-auto">
                    <h4 className="font-semibold text-lg">
                      {item.productType === 'basic' ? 'Basic' : 'Core'} TagMe Card
                    </h4>
                    <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                    <p className="text-sm text-gray-600">Price: ${item.price.toFixed(2)} each</p>
                    <p className="text-lg font-bold mt-2">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                    
                    {/* Download Design Section */}
                    {item.configuration?.images?.cardDesign?.url && (
                      <div className="mt-4">
                        <a 
                          href={item.configuration.images.cardDesign.url} 
                          download
                          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                        >
                          Download Design
                        </a>
                      </div>
                    )}
                  </div>
                  
                  {/* Right column - Card Design Image */}
                  {item.configuration?.images?.cardDesign?.url && (
                    <div className="w-full md:w-1/2 flex-shrink-0 order-first md:order-last">
                      <p className="text-sm font-medium text-gray-700 mb-2">Card Design:</p>
                      <img 
                        src={item.configuration.images.cardDesign.url} 
                        alt="Card design" 
                        className="w-full h-auto object-contain border rounded shadow-sm"
                      />
                    </div>
                  )}
                </div>
                
                {/* Show additional configuration details */}
                {item.configuration && Object.keys(item.configuration).filter(key => key !== 'images').length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm font-medium text-gray-500 mb-2">Additional Details</p>
                    <div className="text-sm text-gray-600 space-y-1">
                      {item.productType === 'basic' && item.configuration.website && (
                        <p><strong>Website:</strong> <a href={item.configuration.website} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">{item.configuration.website}</a></p>
                      )}
                      {item.productType === 'core' && (
                        <>
                          {item.configuration.name && <p><strong>Name:</strong> {item.configuration.name}</p>}
                          {item.configuration.email && <p><strong>Email:</strong> {item.configuration.email}</p>}
                          {item.configuration.phone && <p><strong>Phone:</strong> {item.configuration.phone}</p>}
                          {item.configuration.company && <p><strong>Company:</strong> {item.configuration.company}</p>}
                          {item.configuration.title && <p><strong>Title:</strong> {item.configuration.title}</p>}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
         
        </CardContent>
      </Card>

      
    </div>
  );
}

