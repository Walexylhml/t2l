import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createOrder, calcAmountTotal } from "@/lib/orders";
import type { CheckoutLineItem, CheckoutCustomer } from "@/lib/orders";

export const runtime = "nodejs";

// POST /api/checkout
// Body: { customer: CheckoutCustomer, items: CheckoutLineItem[] }
// Creates a pending order, opens a Stripe Checkout Session, returns { url }.
export async function POST(request: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  if (!secretKey) {
    return NextResponse.json({ error: "Payments are not configured yet. Set STRIPE_SECRET_KEY (see SETUP.md)." }, { status: 503 });
    }

  let body: { customer?: CheckoutCustomer; items?: CheckoutLineItem[] };
  try {
    body = await request.json();
    } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

  const customer = body.customer;
  const items = body.items ?? [];

  if (!customer?.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(customer.email)) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
    }
  if (items.length === 0) {
    return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
    }

  const amountTotal = calcAmountTotal(items);
  const stripe = new Stripe(secretKey);

  let orderId: string | null = null;
  try {
    orderId = await createOrder({ customer, items, amountTotal, status: "pending" });
    } catch (err) {
    console.error("[checkout] createOrder failed:", err);
    // Continue to payment even if the DB write fails, but log loudly.
    }

  try {
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
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout?canceled=1`,
      metadata: { orderId: orderId ?? "" },
      });

    return NextResponse.json({ url: session.url });
    } catch (err) {
    console.error("[checkout] Stripe session failed:", err);
    return NextResponse.json({ error: "Could not start checkout. Please try again." }, { status: 500 });
    }
  }
