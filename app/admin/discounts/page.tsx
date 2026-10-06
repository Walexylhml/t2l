"use client"

import { useEffect, useState } from "react"
import { getSupabaseBrowser } from "@/lib/supabase-browser"

type Discount = {
  code: string
  type: "percent" | "fixed"
  value: number
  active: boolean
  created_at: string
}

function describe(d: Discount) {
  if (d.type === "percent") return `${d.value}% off`
  return `$${(d.value / 100).toFixed(2)} off`
}

export default function AdminDiscountsPage() {
  const [loading, setLoading] = useState(true)
  const [discounts, setDiscounts] = useState<Discount[]>([])
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [code, setCode] = useState("")
  const [type, setType] = useState<"percent" | "fixed">("percent")
  const [amount, setAmount] = useState("")

  async function load() {
    const supabase = getSupabaseBrowser()
    const { data, error: loadError } = await supabase
      .from("discounts")
      .select("*")
      .order("created_at", { ascending: false })
    if (loadError) {
      setError(loadError.message)
      return
    }
    setDiscounts((data as Discount[]) ?? [])
  }

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        await load()
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  async function createCode() {
    setSaving(true)
    setError(null)
    try {
      const normalized = code.trim().toUpperCase().replace(/\s+/g, "")
      if (!normalized) throw new Error("Enter a code.")
      const num = parseFloat(amount || "0")
      if (!Number.isFinite(num) || num <= 0) throw new Error("Enter a valid amount.")
      if (type === "percent" && (num < 1 || num > 100))
        throw new Error("Percent must be between 1 and 100.")

      const value = type === "percent" ? Math.round(num) : Math.round(num * 100)

      const supabase = getSupabaseBrowser()
      const { error: saveError } = await supabase
        .from("discounts")
        .upsert({ code: normalized, type, value, active: true })
      if (saveError) throw saveError

      setCode("")
      setAmount("")
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the code.")
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(d: Discount) {
    setError(null)
    try {
      const supabase = getSupabaseBrowser()
      const { error: toggleError } = await supabase
        .from("discounts")
        .update({ active: !d.active })
        .eq("code", d.code)
      if (toggleError) throw toggleError
      setDiscounts((prev) =>
        prev.map((x) => (x.code === d.code ? { ...x, active: !d.active } : x))
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the code.")
    }
  }

  async function remove(d: Discount) {
    if (!window.confirm(`Delete code "${d.code}"?`)) return
    setError(null)
    try {
      const supabase = getSupabaseBrowser()
      const { error: deleteError } = await supabase.from("discounts").delete().eq("code", d.code)
      if (deleteError) throw deleteError
      setDiscounts((prev) => prev.filter((x) => x.code !== d.code))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the code.")
    }
  }

  const inputClass =
    "rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading discounts...</p>
  }

  return (
    <div>
      <p className="text-sm text-muted-foreground">
        Promo codes customers can use at checkout. {discounts.length} code
        {discounts.length === 1 ? "" : "s"}.
      </p>

      {error ? (
        <p className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      ) : null}

      <div className="mt-4 rounded-xl border border-border p-4">
        <h2 className="text-sm font-semibold">New code</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Code</span>
            <input
              className={inputClass}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="WELCOME10"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Type</span>
            <select
              className={inputClass}
              value={type}
              onChange={(e) => setType(e.target.value as "percent" | "fixed")}
            >
              <option value="percent">Percent off</option>
              <option value="fixed">Fixed amount off (USD)</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">
              {type === "percent" ? "Percent (1-100)" : "Amount (USD)"}
            </span>
            <input
              className={inputClass}
              type="number"
              min="0"
              step={type === "percent" ? "1" : "0.01"}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={type === "percent" ? "10" : "5.00"}
            />
          </label>
        </div>
        <button
          type="button"
          disabled={saving}
          onClick={createCode}
          className="mt-4 inline-flex items-center justify-center rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Create code"}
        </button>
      </div>

      {discounts.length === 0 ? (
        <div className="mt-6 rounded-lg border border-border px-4 py-10 text-center">
          <p className="text-sm text-muted-foreground">No codes yet.</p>
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {discounts.map((d) => (
            <li
              key={d.code}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-medium">{d.code}</span>
                  {!d.active ? (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      Inactive
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{describe(d)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => toggleActive(d)}
                  className="inline-flex items-center justify-center rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                >
                  {d.active ? "Deactivate" : "Activate"}
                </button>
                <button
                  type="button"
                  onClick={() => remove(d)}
                  className="inline-flex items-center justify-center rounded-full border border-border px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
