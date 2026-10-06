"use client"

import { useEffect, useState } from "react"
import { getSupabaseBrowser } from "@/lib/supabase-browser"
import { PLACEMENTS, PLACEMENT_LABELS, type DesignPlacement } from "@/lib/designs"

type DesignRow = {
  id: string
  name: string
  image: string
  placement: string
  active: boolean
  sort_order: number
}

type FormState = {
  id: string | null
  name: string
  image: string
  placement: DesignPlacement
  active: boolean
}

const EMPTY_FORM: FormState = {
  id: null,
  name: "",
  image: "",
  placement: "any",
  active: true,
}

const PLACEMENT_OPTIONS: DesignPlacement[] = ["any", ...PLACEMENTS]

export default function AdminDesignsPage() {
  const [loading, setLoading] = useState(true)
  const [designs, setDesigns] = useState<DesignRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<FormState | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  async function load() {
    const supabase = getSupabaseBrowser()
    const { data, error: loadError } = await supabase
      .from("designs")
      .select("*")
      .order("sort_order", { ascending: true })
    if (loadError) {
      setError(loadError.message)
      return
    }
    setDesigns((data as DesignRow[]) ?? [])
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

  function startEdit(d: DesignRow) {
    setError(null)
    setForm({
      id: d.id,
      name: d.name,
      image: d.image,
      placement: (["front", "back", "arm", "any"].includes(d.placement)
        ? d.placement
        : "any") as DesignPlacement,
      active: d.active,
    })
  }

  async function handleImageUpload(file: File) {
    if (!form) return
    setUploading(true)
    setError(null)
    try {
      const supabase = getSupabaseBrowser()
      const ext = (file.name.split(".").pop() || "png").toLowerCase()
      const path = `designs/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
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

  async function save() {
    if (!form) return
    setSaving(true)
    setError(null)
    try {
      if (!form.name.trim()) throw new Error("Name is required.")
      if (!form.image.trim()) throw new Error("Please upload a design image.")

      const row = {
        name: form.name.trim(),
        image: form.image.trim(),
        placement: form.placement,
        active: form.active,
      }

      const supabase = getSupabaseBrowser()
      if (form.id) {
        const { error: updErr } = await supabase.from("designs").update(row).eq("id", form.id)
        if (updErr) throw updErr
      } else {
        const { error: insErr } = await supabase.from("designs").insert(row)
        if (insErr) throw insErr
      }

      await load()
      setForm(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the design.")
    } finally {
      setSaving(false)
    }
  }

  async function remove(d: DesignRow) {
    if (!window.confirm(`Delete "${d.name}"? This cannot be undone.`)) return
    setError(null)
    try {
      const supabase = getSupabaseBrowser()
      const { error: delErr } = await supabase.from("designs").delete().eq("id", d.id)
      if (delErr) throw delErr
      setDesigns((prev) => prev.filter((x) => x.id !== d.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the design.")
    }
  }

  async function toggleActive(d: DesignRow) {
    setError(null)
    try {
      const supabase = getSupabaseBrowser()
      const { error: tErr } = await supabase
        .from("designs")
        .update({ active: !d.active })
        .eq("id", d.id)
      if (tErr) throw tErr
      setDesigns((prev) => prev.map((x) => (x.id === d.id ? { ...x, active: !d.active } : x)))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the design.")
    }
  }

  const inputClass =
    "rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading designs...</p>
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {designs.length} design{designs.length === 1 ? "" : "s"} · the library customers drag onto
          garments
        </p>
        {!form ? (
          <button
            type="button"
            onClick={startAdd}
            className="inline-flex items-center justify-center rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90"
          >
            + Add design
          </button>
        ) : null}
      </div>

      {error ? (
        <p className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      ) : null}

      {form ? (
        <div className="mt-4 rounded-xl border border-border p-4">
          <h2 className="text-sm font-semibold">{form.id ? "Edit design" : "New design"}</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              <span className="font-medium">Name</span>
              <input
                className={inputClass}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Skull flames"
              />
            </label>

            <div className="flex flex-col gap-2 text-sm sm:col-span-2">
              <span className="font-medium">Design image</span>
              <div className="flex items-center gap-3">
                {form.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={form.image}
                    alt=""
                    className="h-20 w-20 flex-none rounded-md border border-border object-contain"
                  />
                ) : (
                  <div className="flex h-20 w-20 flex-none items-center justify-center rounded-md border border-dashed border-border text-xs text-muted-foreground">
                    No image
                  </div>
                )}
                <div className="flex flex-col gap-1">
                  <label className="inline-flex w-fit cursor-pointer items-center justify-center rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90">
                    {uploading ? "Uploading..." : form.image ? "Change image" : "Choose image"}
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploading}
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleImageUpload(file)
                      }}
                      className="sr-only"
                    />
                  </label>
                  <span className="text-xs text-muted-foreground">
                    PNG with a transparent background works best.
                  </span>
                </div>
              </div>
            </div>

            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Placement</span>
              <select
                className={inputClass}
                value={form.placement}
                onChange={(e) =>
                  setForm({ ...form, placement: e.target.value as DesignPlacement })
                }
              >
                {PLACEMENT_OPTIONS.map((p) => (
                  <option key={p} value={p}>
                    {PLACEMENT_LABELS[p]}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-end gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
              />
              Active (shown in the studio)
            </label>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              disabled={saving || uploading}
              onClick={save}
              className="inline-flex items-center justify-center rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save design"}
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

      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {designs.map((d) => (
          <li
            key={d.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-border p-3"
          >
            <div className="flex min-w-0 items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={d.image}
                alt=""
                className="h-14 w-14 flex-none rounded-md border border-border object-contain"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium">{d.name}</span>
                  {!d.active ? (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      Hidden
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {PLACEMENT_LABELS[
                    (["front", "back", "arm", "any"].includes(d.placement)
                      ? d.placement
                      : "any") as DesignPlacement
                  ]}
                </p>
              </div>
            </div>
            <div className="flex flex-none flex-col gap-1.5">
              <button
                type="button"
                onClick={() => startEdit(d)}
                className="inline-flex items-center justify-center rounded-full border border-border px-3 py-1 text-xs font-medium hover:bg-muted"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => toggleActive(d)}
                className="inline-flex items-center justify-center rounded-full border border-border px-3 py-1 text-xs font-medium hover:bg-muted"
              >
                {d.active ? "Hide" : "Show"}
              </button>
              <button
                type="button"
                onClick={() => remove(d)}
                className="inline-flex items-center justify-center rounded-full border border-border px-3 py-1 text-xs font-medium text-destructive hover:bg-destructive/10"
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
