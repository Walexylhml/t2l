"use client"

import { useEffect, useState } from "react"
import { getSupabaseBrowser } from "@/lib/supabase-browser"
import { formatPrice } from "@/lib/products"
import { GARMENT_VIEWS, VIEW_LABELS, type GarmentView } from "@/lib/garments"

type GarmentRow = {
  id: string
  slug: string
  name: string
  base_price: number
  views: string[] | null
  sizes: string[] | null
  colors: string[] | null
  image_front: string | null
  image_back: string | null
  image_arm: string | null
  active: boolean
  sort_order: number
}

type ImageSlot = "front" | "back" | "arm"

type FormState = {
  id: string | null
  slug: string
  name: string
  basePriceDollars: string
  views: GarmentView[]
  sizesText: string
  colorsText: string
  imageFront: string
  imageBack: string
  imageArm: string
  active: boolean
}

const EMPTY_FORM: FormState = {
  id: null,
  slug: "",
  name: "",
  basePriceDollars: "",
  views: [...GARMENT_VIEWS],
  sizesText: "S, M, L, XL, 2XL",
  colorsText: "",
  imageFront: "",
  imageBack: "",
  imageArm: "",
  active: true,
}

type FeesForm = {
  front: string
  back: string
  arm: string
  text: string
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function parseList(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
}

function centsToDollars(cents: number): string {
  return (cents / 100).toFixed(2)
}

function dollarsToCents(value: string): number {
  return Math.round(parseFloat(value || "0") * 100)
}

export default function AdminGarmentsPage() {
  const [loading, setLoading] = useState(true)
  const [garments, setGarments] = useState<GarmentRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<FormState | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState<ImageSlot | null>(null)

  const [fees, setFees] = useState<FeesForm | null>(null)
  const [savingFees, setSavingFees] = useState(false)
  const [feesSaved, setFeesSaved] = useState(false)

  async function load() {
    const supabase = getSupabaseBrowser()
    const [{ data: gData, error: gErr }, { data: sData }] = await Promise.all([
      supabase.from("garments").select("*").order("sort_order", { ascending: true }),
      supabase.from("studio_settings").select("*").eq("id", 1).maybeSingle(),
    ])
    if (gErr) {
      setError(gErr.message)
      return
    }
    setGarments((gData as GarmentRow[]) ?? [])
    const s = sData as
      | { print_fee_front: number; print_fee_back: number; print_fee_arm: number; text_fee: number }
      | null
    setFees({
      front: centsToDollars(s?.print_fee_front ?? 0),
      back: centsToDollars(s?.print_fee_back ?? 0),
      arm: centsToDollars(s?.print_fee_arm ?? 0),
      text: centsToDollars(s?.text_fee ?? 0),
    })
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

  function startAdd() {
    setError(null)
    setForm({ ...EMPTY_FORM })
  }

  function startEdit(g: GarmentRow) {
    setError(null)
    const views = (g.views ?? []).filter((v): v is GarmentView =>
      (GARMENT_VIEWS as readonly string[]).includes(v)
    )
    setForm({
      id: g.id,
      slug: g.slug,
      name: g.name,
      basePriceDollars: centsToDollars(g.base_price),
      views: views.length ? views : [...GARMENT_VIEWS],
      sizesText: (g.sizes ?? []).join(", "),
      colorsText: (g.colors ?? []).join(", "),
      imageFront: g.image_front ?? "",
      imageBack: g.image_back ?? "",
      imageArm: g.image_arm ?? "",
      active: g.active,
    })
  }

  function toggleView(view: GarmentView) {
    if (!form) return
    const has = form.views.includes(view)
    setForm({
      ...form,
      views: has ? form.views.filter((v) => v !== view) : [...form.views, view],
    })
  }

  async function handleImageUpload(file: File, slot: ImageSlot) {
    if (!form) return
    setUploading(slot)
    setError(null)
    try {
      const supabase = getSupabaseBrowser()
      const ext = (file.name.split(".").pop() || "png").toLowerCase()
      const path = `garments/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: upErr } = await supabase.storage
        .from("images")
        .upload(path, file, { upsert: true, cacheControl: "3600" })
      if (upErr) throw upErr
      const { data } = supabase.storage.from("images").getPublicUrl(path)
      setForm((f) => {
        if (!f) return f
        if (slot === "front") return { ...f, imageFront: data.publicUrl }
        if (slot === "back") return { ...f, imageBack: data.publicUrl }
        return { ...f, imageArm: data.publicUrl }
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image upload failed.")
    } finally {
      setUploading(null)
    }
  }

  async function save() {
    if (!form) return
    setSaving(true)
    setError(null)
    try {
      const slug = form.slug ? slugify(form.slug) : slugify(form.name)
      const basePrice = dollarsToCents(form.basePriceDollars)
      if (!form.name.trim()) throw new Error("Name is required.")
      if (!slug) throw new Error("Slug is required.")
      if (!Number.isFinite(basePrice) || basePrice < 0) throw new Error("Enter a valid base price.")
      if (form.views.length === 0) throw new Error("Pick at least one view (front, back, or arm).")

      const row = {
        slug,
        name: form.name.trim(),
        base_price: basePrice,
        views: form.views,
        sizes: parseList(form.sizesText),
        colors: parseList(form.colorsText),
        image_front: form.imageFront.trim() || null,
        image_back: form.imageBack.trim() || null,
        image_arm: form.imageArm.trim() || null,
        active: form.active,
      }

      const supabase = getSupabaseBrowser()
      if (form.id) {
        const { error: updErr } = await supabase.from("garments").update(row).eq("id", form.id)
        if (updErr) throw updErr
      } else {
        const { error: insErr } = await supabase.from("garments").insert(row)
        if (insErr) throw insErr
      }

      await load()
      setForm(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the garment.")
    } finally {
      setSaving(false)
    }
  }

  async function remove(g: GarmentRow) {
    if (!window.confirm(`Delete "${g.name}"? This cannot be undone.`)) return
    setError(null)
    try {
      const supabase = getSupabaseBrowser()
      const { error: delErr } = await supabase.from("garments").delete().eq("id", g.id)
      if (delErr) throw delErr
      setGarments((prev) => prev.filter((x) => x.id !== g.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the garment.")
    }
  }

  async function toggleActive(g: GarmentRow) {
    setError(null)
    try {
      const supabase = getSupabaseBrowser()
      const { error: tErr } = await supabase
        .from("garments")
        .update({ active: !g.active })
        .eq("id", g.id)
      if (tErr) throw tErr
      setGarments((prev) => prev.map((x) => (x.id === g.id ? { ...x, active: !g.active } : x)))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the garment.")
    }
  }

  async function saveFees() {
    if (!fees) return
    setSavingFees(true)
    setFeesSaved(false)
    setError(null)
    try {
      const supabase = getSupabaseBrowser()
      const { error: fErr } = await supabase
        .from("studio_settings")
        .update({
          print_fee_front: dollarsToCents(fees.front),
          print_fee_back: dollarsToCents(fees.back),
          print_fee_arm: dollarsToCents(fees.arm),
          text_fee: dollarsToCents(fees.text),
        })
        .eq("id", 1)
      if (fErr) throw fErr
      setFeesSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save print pricing.")
    } finally {
      setSavingFees(false)
    }
  }

  const inputClass =
    "rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"

  function imageSlot(slot: ImageSlot, value: string) {
    return (
      <div className="flex flex-col gap-2 text-sm">
        <span className="font-medium">{VIEW_LABELS[slot]} mockup</span>
        <div className="flex items-center gap-3">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value}
              alt=""
              className="h-20 w-20 flex-none rounded-md border border-border object-contain"
            />
          ) : (
            <div className="flex h-20 w-20 flex-none items-center justify-center rounded-md border border-dashed border-border text-center text-[10px] leading-tight text-muted-foreground">
              Placeholder
            </div>
          )}
          <label className="inline-flex w-fit cursor-pointer items-center justify-center rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted">
            {uploading === slot ? "Uploading..." : value ? "Change" : "Upload"}
            <input
              type="file"
              accept="image/*"
              disabled={uploading !== null}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleImageUpload(file, slot)
              }}
              className="sr-only"
            />
          </label>
        </div>
      </div>
    )
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading garments...</p>
  }

  return (
    <div>
      {/* Print pricing ------------------------------------------------------ */}
      {fees ? (
        <div className="rounded-xl border border-border p-4">
          <h2 className="text-sm font-semibold">Print pricing</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            A custom piece is priced as the garment base price plus a fee for each place a design is
            added, plus a fee per text block. Set the fees here (USD).
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-4">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Front print</span>
              <input
                className={inputClass}
                type="number"
                min="0"
                step="0.01"
                value={fees.front}
                onChange={(e) => {
                  setFees({ ...fees, front: e.target.value })
                  setFeesSaved(false)
                }}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Back print</span>
              <input
                className={inputClass}
                type="number"
                min="0"
                step="0.01"
                value={fees.back}
                onChange={(e) => {
                  setFees({ ...fees, back: e.target.value })
                  setFeesSaved(false)
                }}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Arm print</span>
              <input
                className={inputClass}
                type="number"
                min="0"
                step="0.01"
                value={fees.arm}
                onChange={(e) => {
                  setFees({ ...fees, arm: e.target.value })
                  setFeesSaved(false)
                }}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Per text block</span>
              <input
                className={inputClass}
                type="number"
                min="0"
                step="0.01"
                value={fees.text}
                onChange={(e) => {
                  setFees({ ...fees, text: e.target.value })
                  setFeesSaved(false)
                }}
              />
            </label>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              disabled={savingFees}
              onClick={saveFees}
              className="inline-flex items-center justify-center rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
            >
              {savingFees ? "Saving..." : "Save pricing"}
            </button>
            {feesSaved ? <span className="text-xs text-muted-foreground">Saved.</span> : null}
          </div>
        </div>
      ) : null}

      {/* Garments ----------------------------------------------------------- */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {garments.length} garment{garments.length === 1 ? "" : "s"} · the blank types customers
          design on
        </p>
        {!form ? (
          <button
            type="button"
            onClick={startAdd}
            className="inline-flex items-center justify-center rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90"
          >
            + Add garment
          </button>
        ) : null}
      </div>

      {error ? (
        <p className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      ) : null}

      {form ? (
        <div className="mt-4 rounded-xl border border-border p-4">
          <h2 className="text-sm font-semibold">{form.id ? "Edit garment" : "New garment"}</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Name</span>
              <input
                className={inputClass}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Adult Hoodie"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Base price (USD)</span>
              <input
                className={inputClass}
                type="number"
                min="0"
                step="0.01"
                value={form.basePriceDollars}
                onChange={(e) => setForm({ ...form, basePriceDollars: e.target.value })}
                placeholder="50.00"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              <span className="font-medium">Slug (URL)</span>
              <input
                className={inputClass}
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="auto from name if blank"
              />
            </label>

            <div className="flex flex-col gap-1 text-sm sm:col-span-2">
              <span className="font-medium">Views (where designs can go)</span>
              <div className="flex flex-wrap gap-4">
                {GARMENT_VIEWS.map((v) => (
                  <label key={v} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.views.includes(v)}
                      onChange={() => toggleView(v)}
                    />
                    {VIEW_LABELS[v]}
                  </label>
                ))}
              </div>
            </div>

            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Sizes</span>
              <input
                className={inputClass}
                value={form.sizesText}
                onChange={(e) => setForm({ ...form, sizesText: e.target.value })}
                placeholder="S, M, L, XL, 2XL"
              />
              <span className="text-xs text-muted-foreground">Comma separated.</span>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Colors (optional)</span>
              <input
                className={inputClass}
                value={form.colorsText}
                onChange={(e) => setForm({ ...form, colorsText: e.target.value })}
                placeholder="Black, White, Sand"
              />
              <span className="text-xs text-muted-foreground">Comma separated.</span>
            </label>

            <div className="grid gap-4 sm:col-span-2 sm:grid-cols-3">
              {imageSlot("front", form.imageFront)}
              {imageSlot("back", form.imageBack)}
              {imageSlot("arm", form.imageArm)}
            </div>

            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
              />
              Active (available in the studio)
            </label>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              disabled={saving || uploading !== null}
              onClick={save}
              className="inline-flex items-center justify-center rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save garment"}
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
        {garments.map((g) => {
          const views = (g.views ?? []).filter((v): v is GarmentView =>
            (GARMENT_VIEWS as readonly string[]).includes(v)
          )
          return (
            <li
              key={g.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{g.name}</span>
                  {!g.active ? (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      Hidden
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatPrice(g.base_price)} · {(g.sizes ?? []).length} sizes ·{" "}
                  {views.map((v) => VIEW_LABELS[v]).join(" / ") || "no views"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => toggleActive(g)}
                  className="inline-flex items-center justify-center rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                >
                  {g.active ? "Hide" : "Show"}
                </button>
                <button
                  type="button"
                  onClick={() => startEdit(g)}
                  className="inline-flex items-center justify-center rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => remove(g)}
                  className="inline-flex items-center justify-center rounded-full border border-border px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10"
                >
                  Delete
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
