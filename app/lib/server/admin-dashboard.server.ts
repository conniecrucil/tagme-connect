import { getSupabaseClient, resolveSupabaseEnvConfig } from "~/lib/server/api-legacy/utils/supabase";

export interface DashboardMetrics {
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

export async function getDashboardMetricsData(): Promise<DashboardMetrics> {
  const resolvedSupabase = resolveSupabaseEnvConfig();
  console.log(`Connecting to Supabase at: ${resolvedSupabase.url} (source: ${resolvedSupabase.source})`);

  const supabase = getSupabaseClient();

  const { data: cardsData, error: cardsError } = await supabase.from("cards").select("order_id");
  if (cardsError) throw cardsError;

  const purchasedCount = cardsData?.filter((card) => card.order_id !== null).length || 0;
  const adminCount = cardsData?.filter((card) => card.order_id === null).length || 0;

  const { data: ordersData, error: ordersError } = await supabase
    .from("orders")
    .select("cart_data")
    .eq("status", "completed");
  if (ordersError) throw ordersError;

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

  const { count: totalCustomers, error: totalCustomersError } = await supabase
    .from("customers")
    .select("*", { count: "exact", head: true });
  if (totalCustomersError) throw totalCustomersError;

  const { count: currentQuarterCount, error: currentQuarterError } = await supabase
    .from("customers")
    .select("*", { count: "exact", head: true })
    .gte("created_at", new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());
  if (currentQuarterError) throw currentQuarterError;

  const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString();
  const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const { count: previousQuarterCount, error: previousQuarterError } = await supabase
    .from("customers")
    .select("*", { count: "exact", head: true })
    .gte("created_at", sixMonthsAgo)
    .lt("created_at", threeMonthsAgo);
  if (previousQuarterError) throw previousQuarterError;

  const prevQuarter = previousQuarterCount || 0;
  const currQuarter = currentQuarterCount || 0;
  const change = currQuarter - prevQuarter;
  const changePercent = prevQuarter > 0 ? (change / prevQuarter) * 100 : 0;

  return {
    cards: {
      total: purchasedCount + adminCount,
      purchased: purchasedCount,
      admin: adminCount,
    },
    revenue: {
      total: totalRevenue,
      formatted: new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
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
}
