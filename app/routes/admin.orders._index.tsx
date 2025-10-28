import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Skeleton } from "~/components/ui/skeleton";
import { toast } from "sonner";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "~/components/ui/table";

export function meta() {
  return [
    { title: "Orders - Admin - TagMe Connections" },
    { name: "description", content: "Manage orders and fulfillment" },
  ];
}

export function handle() {
  return {
    breadcrumb: { label: "Orders" }
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
    [key: string]: any;
  }>;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  shipped: boolean;
  fulfilled: boolean;
  stripe_receipt_url?: string | null;
  created_at: string;
  updated_at: string;
}

export default function AdminOrdersIndex() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<Record<string, boolean>>({});

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/.netlify/functions/get-orders');
      if (!response.ok) throw new Error('Failed to fetch orders');
      const data = await response.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateFulfillment = async (orderId: string, field: 'shipped' | 'fulfilled', value: boolean) => {
    setUpdating(prev => ({ ...prev, [orderId]: true }));
    try {
      const response = await fetch('/.netlify/functions/update-order-fulfillment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, [field]: value }),
      });

      if (!response.ok) throw new Error('Failed to update order');
      
      const updatedOrder = await response.json();
      setOrders(prev => 
        prev.map(order => order.id === orderId ? { ...order, ...updatedOrder } : order)
      );
      
      toast.success(`Order marked as ${value ? field : `not ${field}`}`);
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order');
    } finally {
      setUpdating(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const getStripeReceiptUrl = async (sessionId: string) => {
    try {
      const response = await fetch('/.netlify/functions/get-stripe-receipt-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });

      if (!response.ok) throw new Error('Failed to get receipt URL');
      const data = await response.json();
      
      if (data.receipt_url) {
        window.open(data.receipt_url, '_blank');
      } else {
        toast.info('Receipt URL not available');
      }
    } catch (error) {
      console.error('Error fetching receipt URL:', error);
      toast.error('Failed to get receipt URL');
    }
  };

  const getTotalAmount = (cartData: Order['cart_data']) => {
    return cartData.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold">Orders</h1>
          <p className="text-gray-600">Manage orders and fulfillment</p>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 5 }, (_, i) => i).map((skeletonIdx) => (
              <Skeleton key={skeletonIdx} className="h-20 w-full" />
            ))}
          </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold">Orders</h1>
        <p className="text-gray-600">Manage orders and fulfillment</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Orders</CardTitle>
          <CardDescription>
            {orders.length} {orders.length === 1 ? 'order' : 'orders'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No orders found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Products</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Shipped</TableHead>
                    <TableHead>Fulfilled</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id} className="cursor-pointer hover:bg-gray-50" onClick={() => window.location.href = `/admin/orders/${order.id}`}>
                      <TableCell>
                        <div className="text-sm">
                          {formatDate(order.created_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {order.customer_info.name || 'Unknown'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {order.customer_info.email || 'No email'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {order.cart_data.map((item, idx) => (
                            <div key={`${order.id}-${item.productType}-${idx}`}>
                              {item.productType === 'basic' ? 'Basic' : 'Core'} × {item.quantity}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        ${getTotalAmount(order.cart_data).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          order.status === 'completed' ? 'bg-green-100 text-green-800' :
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Checkbox
                          checked={order.shipped}
                          disabled={updating[order.id]}
                          onCheckedChange={(checked) => 
                            updateFulfillment(order.id, 'shipped', checked === true)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Checkbox
                          checked={order.fulfilled}
                          disabled={updating[order.id]}
                          onCheckedChange={(checked) => 
                            updateFulfillment(order.id, 'fulfilled', checked === true)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `/admin/orders/${order.id}`;
                          }}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

