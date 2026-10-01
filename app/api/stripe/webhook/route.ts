import { NextResponse } from "next/server";
import Stripe from "stripe";
import { markOrderPaid } from "@/lib/orders";

export const runtime = "nodejs";

// Stripe requires the raw, unparsed body to verify the signature, so we read
// request.text() and do NOT use any body parser.
export async function POST(request: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secretKey || !webhookSecret) {
    return NextResponse.json({ error: "Stripe webhook not configured (see SETUP.md)." }, { status: 503 });
    }

  const stripe = new Stripe(secretKey);
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header." }, { status: 400 });
    }

  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err) {
    console.error("[webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
    }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    try {
      const paymentIntent = typeof session.payment_intent === "string" ? session.payment_intent : undefined;
      await markOrderPaid(session.id, paymentIntent);
      } catch (err) {
      console.error("[webhook] Failed to mark order paid:", err);
      // Return 500 so Stripe retries delivery.
      return NextResponse.json({ error: "Failed to update order." }, { status: 500 });
      }
    }

  return NextResponse.json({ received: true });
  }
