import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createOrder, attachStripeSession, calcAmountTotal } from "@/lib/orders";
import type { CheckoutLineItem, CheckoutCustomer } from "@/lib/orders";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

// POST /api/checkout
// Body: { customer: CheckoutCustomer, items: CheckoutLineItem[], discountCode?: string }
// Creates a pending order, opens a Stripe Checkout Session, returns { url }.
export async function POST(request: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  if (!secretKey) {
    return NextResponse.json({ error: "Payments are not configured yet. Set STRIPE_SECRET_KEY (see SETUP.md)." }, { status: 503 });
  }

  let body: { customer?: CheckoutCustomer; items?: CheckoutLineItem[]; discountCode?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const customer = body.customer;
  const items = body.items ?? [];
  const discountCode =
    typeof body.discountCode === "string" ? body.discountCode.trim().toUpperCase() : "";

  if (!customer?.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(customer.email)) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }
  if (items.length === 0) {
    return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
  }

  const amountTotal = calcAmountTotal(items); // pre-discount, in cents
  const stripe = new Stripe(secretKey);

  // Validate the discount code server-side (never trust the client). Reads the
  // discounts table with the service role so inactive/unknown codes are ignored.
  let discount: { type: string; value: number } | null = null;
  if (discountCode) {
    try {
      const supabase = getSupabaseAdmin();
      const { data } = await supabase
        .from("discounts")
        .select("type, value, active")
        .eq("code", discountCode)
        .maybeSingle();
      if (data && data.active) {
        discount = { type: data.type as string, value: data.value as number };
      }
    } catch (err) {
      console.error("[checkout] discount lookup failed:", err);
    }
  }

  // Work out the discounted order total we store on the order record.
  let discountAmount = 0;
  if (discount) {
    discountAmount =
      discount.type === "percent"
        ? Math.round((amountTotal * discount.value) / 100)
        : Math.min(amountTotal, discount.value);
  }
  const discountedTotal = Math.max(0, amountTotal - discountAmount);

  let orderId: string | null = null;
  try {
    orderId = await createOrder({ customer, items, amountTotal: discountedTotal, status: "pending" });
  } catch (err) {
    console.error("[checkout] createOrder failed:", err);
    // Continue to payment even if the DB write fails, but log loudly.
  }

  try {
    // If a valid code was supplied, create a one-time Stripe coupon and apply it.
    let discounts: { coupon: string }[] | undefined = undefined;
    if (discount) {
      try {
        const coupon =
          discount.type === "percent"
            ? await stripe.coupons.create({ percent_off: discount.value, duration: "once" })
            : await stripe.coupons.create({
                amount_off: discount.value,
                currency: "usd",
                duration: "once",
              });
        discounts = [{ coupon: coupon.id }];
      } catch (err) {
        console.error("[checkout] coupon create failed:", err);
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: customer.email,
      line_items: items.map((i) => ({
        quantity: i.quantity,
        price_data: {
          currency: "usd",
          unit_amount: i.unitAmount,
          product_data: {
            name: i.size ? `${i.name} (${i.size})` : i.name,
            images: i.image ? [i.image.startsWith("http") ? i.image : `${baseUrl}${i.image}`] : [],
          },
        },
      })),
      phone_number_collection: { enabled: true },
      ...(discounts ? { discounts } : {}),
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout?canceled=1`,
      metadata: { orderId: orderId ?? "", discountCode: discount ? discountCode : "" },
    });

    // Link the order to this Stripe session so the webhook can mark it paid.
    if (orderId) {
      try {
        await attachStripeSession(orderId, session.id);
      } catch (err) {
        console.error("[checkout] attachStripeSession failed:", err);
      }
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[checkout] Stripe session failed:", err);
    return NextResponse.json({ error: "Could not start checkout. Please try again." }, { status: 500 });
  }
}
