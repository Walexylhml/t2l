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
}

function formatEventDate(iso: string | null): string {
  if (!iso) return "Date to be announced"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "Date to be announced"
  return d.toLocaleString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function EventCard({ ev, onOpenImage }: { ev: EventRow; onOpenImage: (src: string, alt: string) => void }) {
  const [expanded, setExpanded] = useState(false)
  // Show the toggle when there's meaningfully long copy or perks to reveal.
  const hasMore = (ev.description?.length ?? 0) > 180 || Boolean(ev.perks)

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="grid gap-0 sm:grid-cols-[minmax(0,320px)_1fr]">
        {/* Image: fixed frame, any aspect ratio fills it consistently */}
        {ev.image ? (
          <button
            type="button"
            onClick={() => onOpenImage(ev.image as string, ev.title)}
            aria-label={`View full image for ${ev.title}`}
            className="group relative aspect-[4/3] w-full overflow-hidden bg-muted sm:aspect-auto sm:h-full"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ev.image}
              alt={ev.title}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
            <span className="absolute bottom-2 right-2 rounded-full bg-background/80 px-2.5 py-1 text-xs font-medium opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
              Tap to expand
            </span>
          </button>
        ) : (
          <div className="flex aspect-[4/3] w-full items-center justify-center bg-muted text-sm text-muted-foreground sm:aspect-auto sm:h-full">
            Thoughts2Lyfe
          </div>
        )}

        {/* Details */}
        <div className="flex flex-col p-6 sm:p-7">
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{ev.title}</h2>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
            <span>{formatEventDate(ev.event_at)}</span>
            {ev.venue ? <span>{ev.venue}</span> : null}
          </div>

          {ev.description ? (
            <div
              className={`mt-4 whitespace-pre-line text-sm leading-relaxed text-foreground/90 ${
                expanded ? "" : "line-clamp-4"
              }`}
            >
              {ev.description}
            </div>
          ) : null}

          {/* Perks live under "show more", as before */}
          {expanded && ev.perks ? (
            <div className="mt-4 rounded-xl bg-muted px-4 py-3 text-sm">
              <span className="font-medium">Perks: </span>
              <span className="text-foreground/90">{ev.perks}</span>
            </div>
          ) : null}

          {hasMore ? (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-4 self-start text-sm font-medium text-foreground underline underline-offset-4 hover:opacity-70"
            >
              {expanded ? "Show less" : "Show more"}
            </button>
          ) : null}
        </div>
      </div>
    </article>
  )
}

function Lightbox({
  src,
  alt,
  onClose,
}: {
  src: string
  alt: string
  onClose: () => void
}) {
  const [zoomed, setZoomed] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-2xl leading-none text-white hover:bg-white/20"
      >
        &times;
      </button>
      <div className={`overflow-auto ${zoomed ? "h-full w-full" : ""}`} onClick={(e) => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          onClick={() => setZoomed((v) => !v)}
          className={
            zoomed
              ? "max-w-none cursor-zoom-out"
              : "mx-auto max-h-[85vh] max-w-full cursor-zoom-in object-contain"
          }
        />
      </div>
      <p className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-white/70">
        {zoomed ? "Click image to zoom out" : "Click image to zoom in · Esc to close"}
      </p>
    </div>
  )
}

export default function EventsPage() {
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<EventRow[]>([])
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const supabase = getSupabaseBrowser()
        const { data } = await supabase
          .from("events")
          .select("id, title, description, image, event_at, venue, perks")
          .eq("active", true)
          .order("event_at", { ascending: true })
        if (active) setEvents((data as EventRow[]) ?? [])
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-16">
      <header className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Events</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
          Pop-ups, live printing, and everything happening in the Thoughts2Lyfe world. Come through.
        </p>
      </header>

      {loading ? (
        <p className="mt-12 text-center text-sm text-muted-foreground">Loading events...</p>
      ) : events.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-border p-10 text-center">
          <p className="text-base font-medium">No events scheduled right now</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Follow us on Instagram so you&apos;re the first to know when the next one drops.
          </p>
          <a
            href="https://www.instagram.com/thoughts2lyfe/"
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:opacity-90"
          >
            @thoughts2lyfe
          </a>
        </div>
      ) : (
        <div className="mt-12 flex flex-col gap-8">
          {events.map((ev) => (
            <EventCard
              key={ev.id}
              ev={ev}
              onOpenImage={(src, alt) => setLightbox({ src, alt })}
            />
          ))}
        </div>
      )}

      {lightbox ? (
        <Lightbox src={lightbox.src} alt={lightbox.alt} onClose={() => setLightbox(null)} />
      ) : null}
    </main>
  )
}
