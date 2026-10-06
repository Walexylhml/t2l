"use client"

import { useState } from "react"
import Link from "next/link"
import { useCart } from "@/components/cart/cart-provider"
import { formatPrice } from "@/lib/products"
import { getSupabaseBrowser } from "@/lib/supabase-browser"

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

type AppliedDiscount = { code: string; type: "percent" | "fixed"; value: number }

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart()
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [fullName, setFullName] = useState("")
  const [line1, setLine1] = useState("")
  const [line2, setLine2] = useState("")
  const [city, setCity] = useState("")
  const [stateRegion, setStateRegion] = useState("")
  const [postalCode, setPostalCode] = useState("")
  const [country, setCountry] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [promoInput, setPromoInput] = useState("")
  const [applied, setApplied] = useState<AppliedDiscount | null>(null)
  const [promoMsg, setPromoMsg] = useState<string | null>(null)
  const [promoBusy, setPromoBusy] = useState(false)

  const discountAmount = applied
    ? applied.type === "percent"
      ? Math.round((subtotal * applied.value) / 100)
      : Math.min(subtotal, applied.value)
    : 0
  const total = Math.max(0, subtotal - discountAmount)

  const emailValid = EMAIL_RE.test(email)
  const canSubmit =
    emailValid &&
    fullName.trim().length > 0 &&
    line1.trim().length > 0 &&
    city.trim().length > 0 &&
    postalCode.trim().length > 0 &&
    country.trim().length > 0 &&
    items.length > 0 &&
    !submitting

  async function applyPromo() {
    const code = promoInput.trim().toUpperCase().replace(/\s+/g, "")
    setPromoMsg(null)
    if (!code) return
    setPromoBusy(true)
    try {
      const supabase = getSupabaseBrowser()
      const { data } = await supabase
        .from("discounts")
        .select("code, type, value, active")
        .eq("code", code)
        .maybeSingle()
      if (data && data.active) {
        setApplied({ code: data.code, type: data.type, value: data.value })
        setPromoMsg(null)
      } else {
        setApplied(null)
        setPromoMsg("That code isn't valid.")
      }
    } catch {
      setApplied(null)
      setPromoMsg("Couldn't check that code. Try again.")
    } finally {
      setPromoBusy(false)
    }
  }

  function removePromo() {
    setApplied(null)
    setPromoInput("")
    setPromoMsg(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!canSubmit) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            email,
            phone,
            fullName,
            shippingAddress: { line1, line2, city, state: stateRegion, postalCode, country },
          },
          items: items.map((i) => ({
            productId: i.productId,
            slug: i.slug,
            name: i.name,
            size: i.size,
            image: i.image,
            unitAmount: i.price,
            quantity: i.quantity,
          })),
          discountCode: applied?.code,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Unable to start checkout. Please try again.")
      }
      clearCart()
      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.")
      setSubmitting(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-2xl font-semibold">Your cart is empty</h1>
        <p className="mt-2 text-muted-foreground">Add a few pieces before checking out.</p>
        <Link href="/shop" className="mt-6 inline-block rounded-md bg-black px-6 py-3 text-white">
          Continue shopping
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-3xl font-bold">Checkout</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Checkout as a guest. Use the same email when you create an account later and your orders will be linked automatically.
      </p>
      <div className="mt-8 grid gap-10 md:grid-cols-[1fr_380px]">
        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Contact</h2>
            <Field label="Email" required>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border px-3 py-2"
                placeholder="you@example.com"
                required
              />
            </Field>
            <Field label="Phone">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-md border px-3 py-2"
                placeholder="+1 555 000 0000"
              />
            </Field>
          </section>
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Shipping</h2>
            <Field label="Full name" required>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-md border px-3 py-2"
                required
              />
            </Field>
            <Field label="Address line 1" required>
              <input
                value={line1}
                onChange={(e) => setLine1(e.target.value)}
                className="w-full rounded-md border px-3 py-2"
                required
              />
            </Field>
            <Field label="Address line 2">
              <input
                value={line2}
                onChange={(e) => setLine2(e.target.value)}
                className="w-full rounded-md border px-3 py-2"
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="City" required>
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full rounded-md border px-3 py-2"
                  required
                />
              </Field>
              <Field label="State / Region">
                <input
                  value={stateRegion}
                  onChange={(e) => setStateRegion(e.target.value)}
                  className="w-full rounded-md border px-3 py-2"
                />
              </Field>
              <Field label="Postal code" required>
                <input
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="w-full rounded-md border px-3 py-2"
                  required
                />
              </Field>
              <Field label="Country" required>
                <input
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full rounded-md border px-3 py-2"
                  placeholder="United States"
                  required
                />
              </Field>
            </div>
          </section>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full rounded-md bg-black px-6 py-3 text-white disabled:opacity-50"
          >
            {submitting ? "Redirecting to payment..." : "Proceed to payment"}
          </button>
        </form>
        <aside className="h-fit rounded-lg border p-6">
          <h2 className="text-lg font-semibold">Order summary</h2>
          <ul className="mt-4 space-y-4">
            {items.map((item) => (
              <li key={item.key} className="flex justify-between gap-4 text-sm">
                <span>
                  {item.name}
                  {item.size ? ` (${item.size})` : ""} &times; {item.quantity}
                </span>
                <span>{formatPrice(item.price * item.quantity)}</span>
              </li>
            ))}
          </ul>

          <div className="mt-6 border-t pt-4">
            <label className="text-sm font-medium">Promo code</label>
            {applied ? (
              <div className="mt-2 flex items-center justify-between gap-3 rounded-md bg-muted px-3 py-2 text-sm">
                <span>
                  <span className="font-mono font-medium">{applied.code}</span> applied
                </span>
                <button
                  type="button"
                  onClick={removePromo}
                  className="text-xs underline underline-offset-2 hover:no-underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="mt-2 flex gap-2">
                <input
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  placeholder="Enter code"
                />
                <button
                  type="button"
                  onClick={applyPromo}
                  disabled={promoBusy || !promoInput.trim()}
                  className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
                >
                  {promoBusy ? "..." : "Apply"}
                </button>
              </div>
            )}
            {promoMsg ? <p className="mt-2 text-xs text-red-600">{promoMsg}</p> : null}
          </div>

          <div className="mt-6 space-y-2 border-t pt-4 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            {applied ? (
              <div className="flex justify-between text-emerald-600">
                <span>Discount ({applied.code})</span>
                <span>-{formatPrice(discountAmount)}</span>
              </div>
            ) : null}
            <div className="flex justify-between border-t pt-2 text-base font-semibold">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Shipping &amp; taxes calculated at payment.
          </p>
        </aside>
      </div>
    </div>
  )
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </span>
      {children}
    </label>
  )
}
