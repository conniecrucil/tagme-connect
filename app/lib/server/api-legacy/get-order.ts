import { getOrderById, getCardsByOrderId } from './utils/supabase';

export default async (req: Request) => {
  try {
    if (req.method !== 'GET') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
      });
    }

    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return new Response(JSON.stringify({ error: 'Order ID is required' }), {
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
      });
    }

    const [order, cards] = await Promise.all([
      getOrderById(orderId),
      getCardsByOrderId(orderId)
    ]);

    if (!order) {
      return new Response(JSON.stringify({ error: 'Order not found' }), {
        status: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
      });
    }

    return new Response(JSON.stringify({ order, cards }), {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch order',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
    });
  }
};

