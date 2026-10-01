import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Brush, Palette, Shirt } from 'lucide-react'
import { pillClass } from '@/lib/styles'

const STEPS = [
  { icon: Shirt, title: 'Pick a blank', text: 'Tees, hoodies, and crewnecks in heavyweight cotton.' },
  { icon: Palette, title: 'Drop your idea', text: 'Upload art or start from our design library.' },
  { icon: Brush, title: 'We bring it to lyfe', text: 'Printed in small batches and shipped to you.' },
]

export function DesignStudioTeaser() {
  return (
    <section aria-labelledby="studio-heading" className="px-4 sm:px-6 lg:px-8">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-card ring-1 ring-border">
        <div
          aria-hidden="true"
          className="absolute -top-32 -right-32 size-96 rounded-full bg-brand-purple/25 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-40 left-1/3 size-96 rounded-full bg-brand-teal/15 blur-3xl"
        />
        <div className="relative grid items-center gap-10 p-6 sm:p-10 lg:grid-cols-2 lg:gap-16 lg:p-16">
          <div className="order-2 lg:order-1">
            <p className="text-xs font-semibold tracking-[0.25em] text-brand-teal uppercase">
              Design Studio
            </p>
            <h2
              id="studio-heading"
              className="mt-3 font-display text-4xl leading-[0.95] tracking-wide text-balance uppercase sm:text-5xl lg:text-6xl"
            >
              Got a thought? <span className="text-chrome">Wear it.</span>
            </h2>
            <p className="mt-5 max-w-lg text-pretty leading-relaxed text-muted-foreground">
              Turn your inside joke, your fandom, or your cause into a one-of-one piece. Our
              Design Studio makes custom apparel feel as easy as posting a story.
            </p>
            <ol className="mt-8 grid gap-5 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {STEPS.map((step, index) => (
                <li key={step.title} className="flex gap-4 xl:flex-col xl:gap-3">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-background/60 ring-1 ring-border">
                    <step.icon className="size-5 text-brand-teal" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-semibold">
                      <span className="sr-only">Step {index + 1}: </span>
                      {step.title}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <Link href="/design-studio" className={pillClass({ size: 'lg' }, 'mt-10')}>
              Open the Studio
              <ArrowRight aria-hidden="true" />
            </Link>
          </div>
          <div className="relative order-1 aspect-[4/3] overflow-hidden rounded-2xl ring-1 ring-border lg:order-2 lg:aspect-square">
            <Image
              src="/images/design-studio.png"
              alt="Designer sketching a custom hoodie graphic on a tablet in a dark studio"
              fill
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
