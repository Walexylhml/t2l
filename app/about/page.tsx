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
          Thoughts2Lyfe is a custom-apparel brand built on one simple idea: what you think about,
          you bring to life. We turn thoughts — bold, personal, a little loud — into heavyweight
          streetwear you actually want to wear.
        </p>

        <p>
          We started on Instagram, printing boutique pieces and designing live at events, and grew
          into a brand known for graphics that span horror, pop-culture, and originals: the stuff
          that says what you&apos;re thinking before you have to.
        </p>

        <p>
          But Thoughts2Lyfe has always been about more than a good print. So much of what we make is
          cause-driven — drops and campaigns for mental health and suicide prevention, breast cancer
          awareness, LGBTQ+ history, and the communities we&apos;re part of. Some pieces give back;
          all of them start a conversation. Your terms, your story.
        </p>

        <p>
          Today you can shop the latest drop, design your own piece, and catch us at pop-ups and
          event activations. However you wear it, the mantra stays the same.
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
