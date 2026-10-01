"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getSupabaseBrowser } from "@/lib/supabase-browser"

type OrderItem = {
  id: string
  name: string
  size: string | null
  image: string | null
  unit_amount: number
  quantity: number
}

type Order = {
  id: string
  created_at: string
  status: string
  amount_total: number
  currency: string
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

export default function AccountPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState<string | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const supabase = getSupabaseBrowser()
        const { data: sessionData } = await supabase.auth.getSession()
        const session = sessionData.session

        if (!session) {
          router.replace("/login")
          return
        }

        if (active) setEmail(session.user.email ?? null)

        const { data, error: ordersError } = await supabase
          .from("orders")
          .select(
            "id, created_at, status, amount_total, currency, order_items ( id, name, size, image, unit_amount, quantity )"
          )
          .order("created_at", { ascending: false })

        if (ordersError) throw ordersError
        if (active) setOrders((data as Order[]) ?? [])
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Could not load your orders. Please try again."
          )
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [router])

  async function handleSignOut() {
    const supabase = getSupabaseBrowser()
    await supabase.auth.signOut()
    router.replace("/")
    router.refresh()
  }

  if (loading) {
    return (
      <main className="mx-auto flex min-h-[60vh] w-full max-w-3xl items-center justify-center px-4">
        <p className="text-sm text-muted-foreground">Loading your account...</p>
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Your account</h1>
          {email ? (
            <p className="mt-1 text-sm text-muted-foreground">Signed in as {email}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="inline-flex items-center justify-center rounded-full border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
        >
          Sign out
        </button>
      </div>

      <h2 className="mt-10 text-lg font-semibold">Order history</h2>

      {error ? (
        <p className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      ) : null}

      {!error && orders.length === 0 ? (
        <div className="mt-4 rounded-lg border border-border px-4 py-8 text-center">
          <p className="text-sm text-muted-foreground">
            No orders yet. Orders you placed as a guest with this email are added here automatically
            once your email is confirmed.
          </p>
          <Link
            href="/store"
            className="mt-4 inline-flex rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:opacity-90"
          >
            Shop the store
          </Link>
        </div>
      ) : null}

      <ul className="mt-4 flex flex-col gap-4">
        {orders.map((order) => (
          <li key={order.id} className="rounded-xl border border-border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="font-medium">
                Order #{order.id.slice(0, 8).toUpperCase()}
              </span>
              <span className="text-muted-foreground">
                {new Date(order.created_at).toLocaleDateString()}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="capitalize text-muted-foreground">{order.status}</span>
              <span className="font-medium">
                {formatMoney(order.amount_total, order.currency)}
              </span>
            </div>

            <ul className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
              {(order.order_items ?? []).map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
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
          </li>
        ))}
      </ul>
    </main>
  )
}
