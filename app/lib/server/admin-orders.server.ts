import Stripe from "stripe";
import {
  getCardsByOrderId,
  getOrderById,
  getOrderByStripeSession,
  listOrders,
  updateOrderFulfillment as updateOrderFulfillmentDb,
} from "~/lib/server/api-legacy/utils/supabase";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

export async function listAdminOrdersFromRequest(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || undefined;
  const shipped = searchParams.get("shipped") ? searchParams.get("shipped") === "true" : undefined;
  const fulfilled = searchParams.get("fulfilled") ? searchParams.get("fulfilled") === "true" : undefined;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = (page - 1) * limit;

  return listOrders({
    status: status as any,
    shipped,
    fulfilled,
    limit,
    offset,
  });
}

export async function getAdminOrderDetails(orderId: string) {
  if (!orderId) {
    const err = new Error("Order ID is required");
    (err as Error & { status?: number }).status = 400;
    throw err;
  }

  const [order, cards] = await Promise.all([getOrderById(orderId), getCardsByOrderId(orderId)]);
  if (!order) {
    const err = new Error("Order not found");
    (err as Error & { status?: number }).status = 404;
    throw err;
  }
  return { order, cards };
}

export async function updateAdminOrderFulfillment(input: {
  orderId: string;
  shipped?: boolean;
  fulfilled?: boolean;
}) {
  if (!input.orderId) {
    const err = new Error("orderId is required");
    (err as Error & { status?: number }).status = 400;
    throw err;
  }
  const updates: { shipped?: boolean; fulfilled?: boolean } = {};
  if (input.shipped !== undefined) updates.shipped = input.shipped;
  if (input.fulfilled !== undefined) updates.fulfilled = input.fulfilled;
  return updateOrderFulfillmentDb(input.orderId, updates);
}

export async function getStripeReceiptUrlForSession(sessionId: string) {
  if (!sessionId) {
    const err = new Error("sessionId is required");
    (err as Error & { status?: number }).status = 400;
    throw err;
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);

  let receiptUrl: string | null = null;
  if (session.payment_intent) {
    const paymentIntentId =
      typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent.id;
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ["latest_charge"],
    });
    const latestCharge = (paymentIntent as any).latest_charge as { receipt_url?: string } | null | undefined;
    receiptUrl = latestCharge?.receipt_url ?? null;
  }

  if (receiptUrl) {
    const order = await getOrderByStripeSession(sessionId);
    if (order && !order.stripe_receipt_url) {
      const supabase = (await import("~/lib/server/api-legacy/utils/supabase")).getSupabaseClient();
      await supabase.from("orders").update({ stripe_receipt_url: receiptUrl }).eq("id", order.id);
    }
  }

  return { receipt_url: receiptUrl };
}
