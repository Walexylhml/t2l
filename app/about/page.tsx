import type { Metadata } from "next"

export const metadata: Metadata = { title: "About" }

export default function AboutPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-16">
      <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
        About
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
        Think it. Wear it. Live it.
      </h1>

      <div className="mt-8 space-y-6 text-base leading-relaxed text-muted-foreground">
        <p>
          Thoughts2Lyfe started with a simple belief: what you think about, you bring to life. 
          We take bold, personal, unfiltered thoughts and turn them into heavyweight streetwear 
          you’ll actually want to wear every day.
        </p>

        <p>
          Beyond the prints, we’re deeply rooted in community. Many of our drops support causes close 
          to our heart—from mental health and suicide prevention to breast cancer awareness and LGBTQ+ 
          history. Every piece has a reason, and every design starts a conversation on your terms.
        </p>

        <p>
          Whether you’re grabbing the latest drop, creating a custom piece, or pulling up to a local pop-up, 
          the mission stays the same:
        </p>

        <p className="text-lg font-semibold text-foreground">Wear your thoughts. Live your life.</p>
      </div>

      <p className="mt-10 text-sm text-muted-foreground">
        Follow the latest on Instagram{" "}
        <a
          href="https://www.instagram.com/thoughts2lyfe/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-4 hover:text-foreground"
        >
          @thoughts2lyfe
        </a>
        .
      </p>
    </main>
  )
}
