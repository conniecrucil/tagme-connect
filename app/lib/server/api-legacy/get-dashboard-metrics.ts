import { getSupabaseClient, resolveSupabaseEnvConfig } from './utils/supabase';

interface DashboardMetrics {
  cards: {
    total: number;
    purchased: number;
    admin: number;
  };
  revenue: {
    total: number;
    formatted: string;
  };
  customers: {
    total: number;
    currentQuarter: number;
    previousQuarter: number;
    change: number;
    changePercent: number;
  };
}

export default async (req: Request, _context: any) => {
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

    const resolvedSupabase = resolveSupabaseEnvConfig();
    console.log(`Connecting to Supabase at: ${resolvedSupabase.url} (source: ${resolvedSupabase.source})`);

    const supabase = getSupabaseClient();

    // Get card counts: purchased vs admin
    const { data: cardsData, error: cardsError } = await supabase
      .from('cards')
      .select('order_id');

    if (cardsError) throw cardsError;

    const purchasedCount = cardsData?.filter((card) => card.order_id !== null).length || 0;
    const adminCount = cardsData?.filter((card) => card.order_id === null).length || 0;

    // Get completed orders for revenue calculation
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('cart_data')
      .eq('status', 'completed');

    if (ordersError) throw ordersError;

    // Calculate total revenue from cart_data
    let totalRevenue = 0;
    ordersData?.forEach((order) => {
      if (order.cart_data && Array.isArray(order.cart_data)) {
        order.cart_data.forEach((item: { quantity?: number; price?: number }) => {
          if (item.quantity && item.price) {
            totalRevenue += item.quantity * item.price;
          }
        });
      }
    });

    // Get customer counts by quarter
    const { count: totalCustomers, error: totalCustomersError } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });

    if (totalCustomersError) throw totalCustomersError;

    // Get customers from current quarter (last 3 months)
    const { count: currentQuarterCount, error: currentQuarterError } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());

    if (currentQuarterError) throw currentQuarterError;

    // Get customers from previous quarter (3-6 months ago)
    const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString();
    const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

    const { count: previousQuarterCount, error: previousQuarterError } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sixMonthsAgo)
      .lt('created_at', threeMonthsAgo);

    if (previousQuarterError) throw previousQuarterError;

    // Calculate quarter-over-quarter change
    const prevQuarter = previousQuarterCount || 0;
    const currQuarter = currentQuarterCount || 0;
    const change = currQuarter - prevQuarter;
    const changePercent = prevQuarter > 0 ? (change / prevQuarter) * 100 : 0;

    const metrics: DashboardMetrics = {
      cards: {
        total: purchasedCount + adminCount,
        purchased: purchasedCount,
        admin: adminCount,
      },
      revenue: {
        total: totalRevenue,
        formatted: new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(totalRevenue),
      },
      customers: {
        total: totalCustomers || 0,
        currentQuarter: currQuarter,
        previousQuarter: prevQuarter,
        change,
        changePercent: Math.round(changePercent * 100) / 100,
      },
    };

    return new Response(JSON.stringify(metrics), {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    
    // Extract error message from various error types
    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (error && typeof error === 'object') {
      // Handle Supabase errors which have message and details
      const err = error as any;
      errorMessage = err.message || err.details || err.hint || JSON.stringify(error);
    } else {
      errorMessage = String(error);
    }
    
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Error details:', { errorMessage, errorStack, rawError: error });
    
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch dashboard metrics',
      details: errorMessage,
      stack: process.env.NODE_ENV === 'production' ? undefined : errorStack
    }), {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
    });
  }
};
