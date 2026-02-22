import { useState, useEffect } from "react";
import { useLoaderData, Link } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { toast } from "sonner";
import { listAdminOrdersFromRequest } from "~/lib/server/admin-orders.server";
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

export async function loader(_args: LoaderFunctionArgs) {
  try {
    const data = await listAdminOrdersFromRequest(_args.request);
    return {
      orders: data.orders || [],
    };
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
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
  const { orders: initialOrders } = useLoaderData<typeof loader>();
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [updating, setUpdating] = useState<Record<string, boolean>>({});

  // Sync with loader data when it changes
  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  const updateFulfillment = async (orderId: string, field: 'shipped' | 'fulfilled', value: boolean) => {
    setUpdating(prev => ({ ...prev, [orderId]: true }));
    try {
      const response = await fetch('/api/update-order-fulfillment', {
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
                    <TableRow key={order.id}>
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
                          asChild
                        >
                          <Link to={`/admin/orders/${order.id}`}>
                            View
                          </Link>
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
