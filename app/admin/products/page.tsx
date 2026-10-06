"use client"

import { useEffect, useState } from "react"
import { getSupabaseBrowser } from "@/lib/supabase-browser"
import { CATEGORIES, formatPrice } from "@/lib/products"

type Product = {
  id: string
  slug: string
  name: string
  price: number
  category: string
  garment: string
  image: string
  description: string | null
  featured: boolean
  badge: string | null
  active: boolean
  sort_order: number
}

const GARMENTS = ["Tee", "Hoodie", "Crewneck"] as const

type FormState = {
  id: string | null
  slug: string
  name: string
  priceDollars: string
  category: string
  garment: string
  image: string
  description: string
  badge: string
  featured: boolean
  active: boolean
}

const EMPTY_FORM: FormState = {
  id: null,
  slug: "",
  name: "",
  priceDollars: "",
  category: CATEGORIES[0].slug,
  garment: "Tee",
  image: "",
  description: "",
  badge: "",
  featured: false,
  active: true,
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export default function AdminProductsPage() {
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<Product[]>([])
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<FormState | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  async function loadProducts() {
    const supabase = getSupabaseBrowser()
    const { data, error: loadError } = await supabase
      .from("products")
      .select("*")
      .order("sort_order", { ascending: true })
    if (loadError) {
      setError(loadError.message)
      return
    }
    setProducts((data as Product[]) ?? [])
  }

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        await loadProducts()
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  function startAdd() {
    setError(null)
    setForm({ ...EMPTY_FORM })
  }

  function startEdit(p: Product) {
    setError(null)
    setForm({
      id: p.id,
      slug: p.slug,
      name: p.name,
      priceDollars: (p.price / 100).toFixed(2),
      category: p.category,
      garment: p.garment,
      image: p.image,
      description: p.description ?? "",
      badge: p.badge ?? "",
      featured: p.featured,
      active: p.active,
    })
  }

  async function save() {
    if (!form) return
    setSaving(true)
    setError(null)
    try {
      const supabase = getSupabaseBrowser()
      const slug = form.slug ? slugify(form.slug) : slugify(form.name)
      const priceCents = Math.round(parseFloat(form.priceDollars || "0") * 100)
      if (!form.name.trim()) throw new Error("Name is required.")
      if (!slug) throw new Error("Slug is required.")
      if (!Number.isFinite(priceCents) || priceCents < 0) throw new Error("Enter a valid price.")

      const id = form.id ?? `p_${slug.replace(/-/g, "_")}`
      const row = {
        id,
        slug,
        name: form.name.trim(),
        price: priceCents,
        category: form.category,
        garment: form.garment,
        image: form.image.trim() || "/images/products/placeholder.png",
        description: form.description.trim(),
        badge: form.badge.trim() || null,
        featured: form.featured,
        active: form.active,
      }

      const { error: saveError } = await supabase.from("products").upsert(row)
      if (saveError) throw saveError

      await loadProducts()
      setForm(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the product.")
    } finally {
      setSaving(false)
    }
  }

  async function handleImageUpload(file: File) {
    if (!form) return
    setUploading(true)
    setError(null)
    try {
      const supabase = getSupabaseBrowser()
      const ext = (file.name.split(".").pop() || "png").toLowerCase()
      const path = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: upErr } = await supabase.storage
        .from("images")
        .upload(path, file, { upsert: true, cacheControl: "3600" })
      if (upErr) throw upErr
      const { data } = supabase.storage.from("images").getPublicUrl(path)
      setForm((f) => (f ? { ...f, image: data.publicUrl } : f))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image upload failed.")
    } finally {
      setUploading(false)
    }
  }

  async function remove(p: Product) {
    if (!window.confirm(`Delete "${p.name}"? This cannot be undone.`)) return
    setError(null)
    try {
      const supabase = getSupabaseBrowser()
      const { error: deleteError } = await supabase.from("products").delete().eq("id", p.id)
      if (deleteError) throw deleteError
      setProducts((prev) => prev.filter((x) => x.id !== p.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the product.")
    }
  }

  async function toggleActive(p: Product) {
    setError(null)
    try {
      const supabase = getSupabaseBrowser()
      const { error: toggleError } = await supabase
        .from("products")
        .update({ active: !p.active })
        .eq("id", p.id)
      if (toggleError) throw toggleError
      setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, active: !p.active } : x)))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the product.")
    }
  }

  const inputClass =
    "rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading products...</p>
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{products.length} products</p>
        {!form ? (
          <button
            type="button"
            onClick={startAdd}
            className="inline-flex items-center justify-center rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90"
          >
            + Add product
          </button>
        ) : null}
      </div>

      {error ? (
        <p className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      ) : null}

      {form ? (
        <div className="mt-4 rounded-xl border border-border p-4">
          <h2 className="text-sm font-semibold">{form.id ? "Edit product" : "New product"}</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              <span className="font-medium">Name</span>
              <input
                className={inputClass}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Midnight Slasher Hoodie"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Price (USD)</span>
              <input
                className={inputClass}
                type="number"
                min="0"
                step="0.01"
                value={form.priceDollars}
                onChange={(e) => setForm({ ...form, priceDollars: e.target.value })}
                placeholder="68.00"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Slug (URL)</span>
              <input
                className={inputClass}
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="auto from name if blank"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Category</span>
              <select
                className={inputClass}
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Garment</span>
              <select
                className={inputClass}
                value={form.garment}
                onChange={(e) => setForm({ ...form, garment: e.target.value })}
              >
                {GARMENTS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex flex-col gap-2 text-sm sm:col-span-2">
              <span className="font-medium">Product image</span>
              <div className="flex items-center gap-3">
                {form.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={form.image}
                    alt=""
                    className="h-20 w-20 flex-none rounded-md border border-border object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 flex-none items-center justify-center rounded-md border border-dashed border-border text-xs text-muted-foreground">
                    No image
                  </div>
                )}
                <div className="flex flex-col gap-1">
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleImageUpload(file)
                    }}
                    className="text-sm"
                  />
                  {uploading ? (
                    <span className="text-xs text-muted-foreground">Uploading...</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      PNG or JPG. Uploaded to your store&apos;s image library.
                    </span>
                  )}
                </div>
              </div>
            </div>
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              <span className="font-medium">Description</span>
              <textarea
                className={`${inputClass} min-h-[80px]`}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Badge (optional)</span>
              <input
                className={inputClass}
                value={form.badge}
                onChange={(e) => setForm({ ...form, badge: e.target.value })}
                placeholder="Best Seller"
              />
            </label>
            <div className="flex items-end gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                />
                Featured
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                />
                Active (visible in store)
              </label>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={save}
              className="inline-flex items-center justify-center rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save product"}
            </button>
            <button
              type="button"
              onClick={() => setForm(null)}
              className="inline-flex items-center justify-center rounded-full border border-border px-5 py-2 text-sm font-medium hover:bg-muted"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      <ul className="mt-6 flex flex-col gap-3">
        {products.map((p) => (
          <li
            key={p.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium">{p.name}</span>
                {!p.active ? (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    Hidden
                  </span>
                ) : null}
                {p.badge ? (
                  <span className="rounded-full bg-foreground/5 px-2 py-0.5 text-xs">{p.badge}</span>
                ) : null}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {formatPrice(p.price)} · {p.category} · {p.garment}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => toggleActive(p)}
                className="inline-flex items-center justify-center rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
              >
                {p.active ? "Hide" : "Show"}
              </button>
              <button
                type="button"
                onClick={() => startEdit(p)}
                className="inline-flex items-center justify-center rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => remove(p)}
                className="inline-flex items-center justify-center rounded-full border border-border px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
