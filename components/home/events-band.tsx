import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, HeartHandshake } from 'lucide-react'
import { InstagramIcon } from '@/components/icons/instagram-icon'
import { siteConfig } from '@/lib/site'
import { pillClass } from '@/lib/styles'

const STATS = [
  { value: '12K+', label: 'Community on Instagram' },
  { value: '40+', label: 'Pop-ups & conventions' },
  { value: '20%', label: 'Of cause-line sales donated' },
]

const TESTIMONIALS = [
  {
    quote: 'The Midnight Slasher hoodie is the heaviest, softest thing I own. Got stopped three times at the con.',
    name: 'Jess R.',
    handle: '@jessbooo',
  },
  {
    quote: 'Wore Mind Over Matter to my first therapy session. Felt like armor. Love what this brand stands for.',
    name: 'Marcus T.',
    handle: '@marcust.wav',
  },
]

export function EventsBand() {
  return (
    <section aria-labelledby="events-heading" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-5 lg:gap-12">
          <div className="relative min-h-80 overflow-hidden rounded-3xl ring-1 ring-border lg:col-span-3">
            <Image
              src="/images/events.png"
              alt="Crowd gathered around the Thoughts2Lyfe booth at a night pop-up event"
              fill
              sizes="(min-width: 1024px) 60vw, 100vw"
              className="object-cover"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent"
            />
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10">
              <p className="text-xs font-semibold tracking-[0.25em] text-brand-teal uppercase">
                In the wild
              </p>
              <h2
                id="events-heading"
                className="mt-3 max-w-lg font-display text-4xl leading-[0.95] tracking-wide text-balance uppercase sm:text-5xl"
              >
                Catch us at the next pop-up
              </h2>
              <Link href="/events" className={pillClass({}, 'mt-6')}>
                See upcoming events
                <ArrowRight aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-6 lg:col-span-2">
            <dl className="grid grid-cols-3 gap-3">
              {STATS.map((stat) => (
                <div key={stat.label} className="flex flex-col rounded-2xl bg-card p-4 ring-1 ring-border">
                  <dt className="text-xs leading-snug text-muted-foreground">{stat.label}</dt>
                  <dd className="order-first mb-2 font-display text-3xl tracking-wide text-chrome sm:text-4xl">
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>

            {TESTIMONIALS.map((t) => (
              <figure key={t.handle} className="rounded-2xl bg-card p-6 ring-1 ring-border">
                <blockquote className="text-pretty leading-relaxed">
                  <p>&ldquo;{t.quote}&rdquo;</p>
                </blockquote>
                <figcaption className="mt-4 text-sm">
                  <span className="font-semibold">{t.name}</span>{' '}
                  <span className="text-muted-foreground">{t.handle}</span>
                </figcaption>
              </figure>
            ))}

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
              <a
                href={siteConfig.instagram.url}
                target="_blank"
                rel="noopener noreferrer"
                className={pillClass({ variant: 'outline' }, 'flex-1')}
              >
                <InstagramIcon aria-hidden="true" />
                Follow {siteConfig.instagram.handle}
              </a>
              <p className="flex flex-1 items-center justify-center gap-2 text-sm text-muted-foreground">
                <HeartHandshake className="size-4 text-brand-magenta" aria-hidden="true" />
                Community-first since day one
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
