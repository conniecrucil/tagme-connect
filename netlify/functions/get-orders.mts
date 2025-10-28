import type { Context } from '@netlify/functions';
import { listOrders } from './utils/supabase';

export default async (req: Request, context: Context) => {
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
    const status = searchParams.get('status') || undefined;
    const shipped = searchParams.get('shipped') ? searchParams.get('shipped') === 'true' : undefined;
    const fulfilled = searchParams.get('fulfilled') ? searchParams.get('fulfilled') === 'true' : undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    const result = await listOrders({
      status: status as any,
      shipped,
      fulfilled,
      limit,
      offset,
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch orders',
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

