import { getSupabaseAdmin } from "@/lib/supabase";

// ---------------------------------------------------------------------------
// Shared checkout/order types and the server-side order writer.
// All monetary values are in CENTS (matching lib/products.ts price fields and
// Stripe unit_amount). Never do math on dollars here.
// ---------------------------------------------------------------------------

export type ShippingAddress = {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
};

export type CheckoutLineItem = {
  productId: string;
  slug?: string;
  name: string;
  size?: string;
  image?: string;
  unitAmount: number; // cents
  quantity: number;
};

export type CheckoutCustomer = {
  email: string;
  phone?: string;
  fullName?: string;
  shippingAddress?: ShippingAddress;
};

export type CreateOrderInput = {
  customer: CheckoutCustomer;
  items: CheckoutLineItem[];
  amountTotal: number; // cents
  currency?: string;
  stripeSessionId?: string;
  status?: "pending" | "paid" | "cancelled";
};

export function calcAmountTotal(items: CheckoutLineItem[]): number {
  return items.reduce((sum, i) => sum + i.unitAmount * i.quantity, 0);
}

// Insert an order and its items using the service-role client (server only).
// Returns the new order id. Safe to call from API routes / webhooks.
export async function createOrder(input: CreateOrderInput): Promise<string> {
  const supabase = getSupabaseAdmin();
  const { customer, items } = input;

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      email: customer.email,
      phone: customer.phone ?? null,
      full_name: customer.fullName ?? null,
      shipping_address: customer.shippingAddress ?? null,
      amount_total: input.amountTotal,
      currency: input.currency ?? "usd",
      status: input.status ?? "pending",
      stripe_session_id: input.stripeSessionId ?? null,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    throw new Error(`Failed to create order: ${orderError?.message ?? "unknown"}`);
  }

  if (items.length > 0) {
    const rows = items.map((i) => ({
      order_id: order.id,
      product_id: i.productId,
      slug: i.slug ?? null,
      name: i.name,
      size: i.size ?? null,
      image: i.image ?? null,
      unit_amount: i.unitAmount,
      quantity: i.quantity,
    }));
    const { error: itemsError } = await supabase.from("order_items").insert(rows);
    if (itemsError) {
      throw new Error(`Failed to create order items: ${itemsError.message}`);
    }
  }

  return order.id as string;
}

// Link a Stripe Checkout Session to an order after the session is created.
// Without this, the webhook (which matches on stripe_session_id) can never
// find the order, so paid orders would stay stuck on "pending".
export async function attachStripeSession(
  orderId: string,
  stripeSessionId: string
): Promise<void> {
  if (!orderId) return;
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("orders")
    .update({ stripe_session_id: stripeSessionId })
    .eq("id", orderId);
  if (error) {
    throw new Error(`Failed to attach Stripe session: ${error.message}`);
  }
}

// Mark an order paid once Stripe confirms payment (called from the webhook).
export async function markOrderPaid(stripeSessionId: string, paymentIntent?: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("orders")
    .update({ status: "paid", stripe_payment_intent: paymentIntent ?? null })
    .eq("stripe_session_id", stripeSessionId);
  if (error) {
    throw new Error(`Failed to mark order paid: ${error.message}`);
  }
}
