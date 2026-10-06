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

export default function EventsPage() {
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<EventRow[]>([])

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
        <div className="mt-12 flex flex-col gap-10">
          {events.map((ev) => (
            <article
              key={ev.id}
              className="overflow-hidden rounded-2xl border border-border"
            >
              {ev.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={ev.image} alt={ev.title} className="w-full object-cover" />
              ) : null}
              <div className="p-6 sm:p-8">
                <h2 className="text-2xl font-semibold tracking-tight">{ev.title}</h2>
                <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                  <span>{formatEventDate(ev.event_at)}</span>
                  {ev.venue ? <span>{ev.venue}</span> : null}
                </div>
                {ev.description ? (
                  <div className="mt-4 whitespace-pre-line text-sm leading-relaxed text-foreground/90">
                    {ev.description}
                  </div>
                ) : null}
                {ev.perks ? (
                  <div className="mt-5 rounded-xl bg-muted px-4 py-3 text-sm">
                    <span className="font-medium">Perks: </span>
                    <span className="text-foreground/90">{ev.perks}</span>
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  )
}
