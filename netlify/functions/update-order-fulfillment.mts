import type { Context } from '@netlify/functions';
import { updateOrderFulfillment } from './utils/supabase';

export default async (req: Request, context: Context) => {
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
      });
    }

    const { orderId, shipped, fulfilled } = await req.json();

    if (!orderId) {
      return new Response(JSON.stringify({ error: 'orderId is required' }), {
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
      });
    }

    const updates: { shipped?: boolean; fulfilled?: boolean } = {};
    if (shipped !== undefined) updates.shipped = shipped;
    if (fulfilled !== undefined) updates.fulfilled = fulfilled;

    const updatedOrder = await updateOrderFulfillment(orderId, updates);

    return new Response(JSON.stringify(updatedOrder), {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error updating order fulfillment:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to update order fulfillment',
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

