"use client"

import { useEffect, useState } from "react"
import { getSupabaseBrowser } from "@/lib/supabase-browser"

type OrderItem = {
  id: string
  name: string
  size: string | null
  image: string | null
  unit_amount: number
  quantity: number
}

type ShippingAddress = {
  line1?: string
  line2?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
} | null

type Order = {
  id: string
  created_at: string
  status: string
  amount_total: number
  currency: string
  email: string
  phone: string | null
  full_name: string | null
  shipping_address: ShippingAddress
  order_items: OrderItem[]
}

function formatMoney(cents: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: (currency || "usd").toUpperCase(),
    }).format((cents || 0) / 100)
  } catch {
    return "$" + ((cents || 0) / 100).toFixed(2)
  }
}

function formatAddress(addr: ShippingAddress): string {
  if (!addr) return "No address on file"
  const parts = [addr.line1, addr.line2, addr.city, addr.state, addr.postalCode, addr.country]
    .map((p) => (p ? String(p).trim() : ""))
    .filter(Boolean)
  return parts.length ? parts.join(", ") : "No address on file"
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  paid: "bg-emerald-500/10 text-emerald-600",
  fulfilled: "bg-blue-500/10 text-blue-600",
  cancelled: "bg-destructive/10 text-destructive",
}

export default function AdminOrdersPage() {
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<Order[]>([])
  const [error, setError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const supabase = getSupabaseBrowser()
        const { data, error: ordersError } = await supabase
          .from("orders")
          .select(
            "id, created_at, status, amount_total, currency, email, phone, full_name, shipping_address, order_items ( id, name, size, image, unit_amount, quantity )"
          )
          .order("created_at", { ascending: false })

        if (ordersError) throw ordersError
        if (active) setOrders((data as Order[]) ?? [])
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Could not load orders. Please try again.")
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [])

  async function updateStatus(orderId: string, status: string) {
    setUpdatingId(orderId)
    setError(null)
    try {
      const supabase = getSupabaseBrowser()
      const { error: updateError } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", orderId)
      if (updateError) throw updateError
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the order. Please try again.")
    } finally {
      setUpdatingId(null)
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading orders...</p>
  }

  const paidCount = orders.filter((o) => o.status === "paid").length

  return (
    <div>
      <p className="text-sm text-muted-foreground">
        {orders.length} order{orders.length === 1 ? "" : "s"}
        {paidCount ? ` · ${paidCount} paid awaiting fulfilment` : ""}
      </p>

      {error ? (
        <p className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      ) : null}

      {orders.length === 0 ? (
        <div className="mt-6 rounded-lg border border-border px-4 py-12 text-center">
          <p className="text-sm text-muted-foreground">No orders yet.</p>
        </div>
      ) : null}

      <ul className="mt-6 flex flex-col gap-4">
        {orders.map((order) => {
          const badge = STATUS_STYLES[order.status] ?? "bg-muted text-muted-foreground"
          const busy = updatingId === order.id
          return (
            <li key={order.id} className="rounded-xl border border-border p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">#{order.id.slice(0, 8).toUpperCase()}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${badge}`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {new Date(order.created_at).toLocaleString()}
                  </p>
                </div>
                <span className="text-sm font-semibold">
                  {formatMoney(order.amount_total, order.currency)}
                </span>
              </div>

              <div className="mt-3 grid gap-1 text-sm sm:grid-cols-2">
                <p>
                  <span className="text-muted-foreground">Customer: </span>
                  {order.full_name || "—"}
                </p>
                <p>
                  <span className="text-muted-foreground">Email: </span>
                  {order.email}
                </p>
                <p>
                  <span className="text-muted-foreground">Phone: </span>
                  {order.phone || "—"}
                </p>
                <p className="sm:col-span-2">
                  <span className="text-muted-foreground">Ship to: </span>
                  {formatAddress(order.shipping_address)}
                </p>
              </div>

              <ul className="mt-3 flex flex-col gap-1.5 border-t border-border pt-3 text-sm">
                {(order.order_items ?? []).map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-3">
                    <span>
                      {item.name}
                      {item.size ? <span className="text-muted-foreground"> / {item.size}</span> : null}
                      <span className="text-muted-foreground"> x {item.quantity}</span>
                    </span>
                    <span className="text-muted-foreground">
                      {formatMoney(item.unit_amount * item.quantity, order.currency)}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex flex-wrap gap-2">
                {order.status !== "fulfilled" ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => updateStatus(order.id, "fulfilled")}
                    className="inline-flex items-center justify-center rounded-full bg-foreground px-4 py-1.5 text-xs font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    {busy ? "Saving..." : "Mark fulfilled"}
                  </button>
                ) : null}
                {order.status !== "cancelled" ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => updateStatus(order.id, "cancelled")}
                    className="inline-flex items-center justify-center rounded-full border border-border px-4 py-1.5 text-xs font-medium transition-colors hover:bg-muted disabled:opacity-50"
                  >
                    {busy ? "Saving..." : "Cancel order"}
                  </button>
                ) : null}
                {order.status === "cancelled" || order.status === "fulfilled" ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => updateStatus(order.id, "paid")}
                    className="inline-flex items-center justify-center rounded-full border border-border px-4 py-1.5 text-xs font-medium transition-colors hover:bg-muted disabled:opacity-50"
                  >
                    {busy ? "Saving..." : "Reopen (mark paid)"}
                  </button>
                ) : null}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
