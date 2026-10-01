import { formatPrice } from "@/lib/products";
import type { CheckoutLineItem } from "@/lib/orders";

// ---------------------------------------------------------------------------
// Order confirmation email via Resend.
// Fully optional: if RESEND_API_KEY is not set we just log and return, so the
// checkout flow never breaks when email is unconfigured.
// ---------------------------------------------------------------------------

type OrderEmailInput = {
to: string;
orderId: string;
items: CheckoutLineItem[];
amountTotal: number; // cents
};

export async function sendOrderConfirmation(input: OrderEmailInput): Promise<void> {
const apiKey = process.env.RESEND_API_KEY;
const from = process.env.ORDER_FROM_EMAIL;

if (!apiKey || !from) {
console.log("[email] RESEND_API_KEY/ORDER_FROM_EMAIL not set - skipping confirmation email for order", input.orderId);
return;
}

const rows = input.items
.map((i) => `<tr><td style="padding:4px 8px">${escapeHtml(i.name)}${i.size ? ` (${escapeHtml(i.size)})` : ""} x ${i.quantity}</td><td style="padding:4px 8px;text-align:right">${formatPrice(i.unitAmount * i.quantity)}</td></tr>`)
.join("");

const html = `<div style="font-family:sans-serif;max-width:560px;margin:0 auto">
<h2>Thanks for your order</h2>
<p>Order reference: <strong>${escapeHtml(input.orderId)}</strong></p>
<table style="width:100%;border-collapse:collapse">${rows}</table>
<p style="text-align:right;font-size:16px"><strong>Total: ${formatPrice(input.amountTotal)}</strong></p>
<p>We'll email you again when your order ships.</p>
</div>`;

try {
const res = await fetch("https://api.resend.com/emails", {
method: "POST",
headers: {
Authorization: `Bearer ${apiKey}`,
"Content-Type": "application/json",
},
body: JSON.stringify({
from,
to: input.to,
subject: "Your Thoughts2Lyfe order",
html,
}),
});
if (!res.ok) {
console.error("[email] Resend returned", res.status, await res.text());
}
} catch (err) {
console.error("[email] Failed to send confirmation:", err);
}
}

function escapeHtml(value: string): string {
return value
.replace(/&/g, "&amp;")
.replace(/</g, "&lt;")
.replace(/>/g, "&gt;")
.replace(/"/g, "&quot;");
}
