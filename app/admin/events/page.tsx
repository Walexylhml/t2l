"use client"

import { useEffect, useState } from "react"
import { getSupabaseBrowser } from "@/lib/supabase-browser"

type EventRow = {
  id: string
  title: string
  description: string
  image: string | null
  event_at: string | null
  venue: string | null
  perks: string | null
  active: boolean
  sort_order: number
}

type FormState = {
  id: string | null
  title: string
  description: string
  image: string
  eventAtLocal: string // value for <input type="datetime-local">
  venue: string
  perks: string
  active: boolean
}

const EMPTY_FORM: FormState = {
  id: null,
  title: "",
  description: "",
  image: "",
  eventAtLocal: "",
  venue: "",
  perks: "",
  active: true,
}

// Convert a stored ISO timestamp to the value a datetime-local input expects.
function isoToLocalInput(iso: string | null): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}`
}

function formatEventDate(iso: string | null): string {
  if (!iso) return "Date TBA"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "Date TBA"
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

// True when the event's date/time is in the past.
function isPast(iso: string | null): boolean {
  if (!iso) return false
  const d = new Date(iso)
  return !Number.isNaN(d.getTime()) && d.getTime() < Date.now()
}

export default function AdminEventsPage() {
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<EventRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<FormState | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  async function load() {
    const supabase = getSupabaseBrowser()
    const { data, error: loadError } = await supabase
      .from("events")
      .select("*")
      .order("event_at", { ascending: false })
    if (loadError) {
      setError(loadError.message)
      return
    }
    setEvents((data as EventRow[]) ?? [])
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

  function startEdit(ev: EventRow) {
    setError(null)
    setForm({
      id: ev.id,
      title: ev.title,
      description: ev.description ?? "",
      image: ev.image ?? "",
      eventAtLocal: isoToLocalInput(ev.event_at),
      venue: ev.venue ?? "",
      perks: ev.perks ?? "",
      active: ev.active,
    })
  }

  async function handleImageUpload(file: File) {
    if (!form) return
    setUploading(true)
    setError(null)
    try {
      const supabase = getSupabaseBrowser()
      const ext = (file.name.split(".").pop() || "png").toLowerCase()
      const path = `events/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
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
      if (!form.title.trim()) throw new Error("Title is required.")
      const eventAtIso = form.eventAtLocal ? new Date(form.eventAtLocal).toISOString() : null

      const row = {
        title: form.title.trim(),
        description: form.description.trim(),
        image: form.image.trim() || null,
        event_at: eventAtIso,
        venue: form.venue.trim() || null,
        perks: form.perks.trim() || null,
        active: form.active,
      }

      const supabase = getSupabaseBrowser()
      if (form.id) {
        const { error: updErr } = await supabase.from("events").update(row).eq("id", form.id)
        if (updErr) throw updErr
      } else {
        const { error: insErr } = await supabase.from("events").insert(row)
        if (insErr) throw insErr
      }

      await load()
      setForm(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the event.")
    } finally {
      setSaving(false)
    }
  }

  async function remove(ev: EventRow) {
    if (!window.confirm(`Delete "${ev.title}"?`)) return
    setError(null)
    try {
      const supabase = getSupabaseBrowser()
      const { error: delErr } = await supabase.from("events").delete().eq("id", ev.id)
      if (delErr) throw delErr
      setEvents((prev) => prev.filter((x) => x.id !== ev.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the event.")
    }
  }

  async function toggleActive(ev: EventRow) {
    setError(null)
    try {
      const supabase = getSupabaseBrowser()
      const { error: tErr } = await supabase
        .from("events")
        .update({ active: !ev.active })
        .eq("id", ev.id)
      if (tErr) throw tErr
      setEvents((prev) => prev.map((x) => (x.id === ev.id ? { ...x, active: !ev.active } : x)))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the event.")
    }
  }

  const inputClass =
    "rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading events...</p>
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {events.length} event{events.length === 1 ? "" : "s"}
        </p>
        {!form ? (
          <button
            type="button"
            onClick={startAdd}
            className="inline-flex items-center justify-center rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90"
          >
            + Add event
          </button>
        ) : null}
      </div>

      {error ? (
        <p className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      ) : null}

      {form ? (
        <div className="mt-4 rounded-xl border border-border p-4">
          <h2 className="text-sm font-semibold">{form.id ? "Edit event" : "New event"}</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              <span className="font-medium">Title</span>
              <input
                className={inputClass}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="United Grid League - Live Printing"
              />
            </label>

            <div className="flex flex-col gap-2 text-sm sm:col-span-2">
              <span className="font-medium">Event image</span>
              <div className="flex items-center gap-3">
                {form.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={form.image}
                    alt=""
                    className="h-24 w-40 flex-none rounded-md border border-border object-cover"
                  />
                ) : (
                  <div className="flex h-24 w-40 flex-none items-center justify-center rounded-md border border-dashed border-border text-xs text-muted-foreground">
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
                  <span className="text-xs text-muted-foreground">The designed event flyer.</span>
                </div>
              </div>
            </div>

            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              <span className="font-medium">About the event</span>
              <textarea
                className={`${inputClass} min-h-[120px]`}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="A paragraph (or more) about the event..."
              />
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Date &amp; time</span>
              <input
                type="datetime-local"
                className={inputClass}
                value={form.eventAtLocal}
                onChange={(e) => setForm({ ...form, eventAtLocal: e.target.value })}
              />
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Venue</span>
              <input
                className={inputClass}
                value={form.venue}
                onChange={(e) => setForm({ ...form, venue: e.target.value })}
                placeholder="Where it's happening"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              <span className="font-medium">
                Perks <span className="font-normal text-muted-foreground">(optional)</span>
              </span>
              <input
                className={inputClass}
                value={form.perks}
                onChange={(e) => setForm({ ...form, perks: e.target.value })}
                placeholder="Free live printing, giveaways, early access..."
              />
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
              />
              Active (visible on the Events page)
            </label>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              disabled={saving || uploading}
              onClick={save}
              className="inline-flex items-center justify-center rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save event"}
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
        {events.map((ev) => (
          <li
            key={ev.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3"
          >
            <div className="flex min-w-0 items-center gap-3">
              {ev.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={ev.image}
                  alt=""
                  className="h-14 w-20 flex-none rounded-md border border-border object-cover"
                />
              ) : null}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{ev.title}</span>
                  {isPast(ev.event_at) ? (
                    <span className="rounded-full border border-amber-500/40 px-2 py-0.5 text-xs text-amber-600 dark:text-amber-400">
                      Past
                    </span>
                  ) : null}
                  {!ev.active ? (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      Hidden
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatEventDate(ev.event_at)}
                  {ev.venue ? ` · ${ev.venue}` : ""}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => toggleActive(ev)}
                className="inline-flex items-center justify-center rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
              >
                {ev.active ? "Hide" : "Show"}
              </button>
              <button
                type="button"
                onClick={() => startEdit(ev)}
                className="inline-flex items-center justify-center rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => remove(ev)}
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
