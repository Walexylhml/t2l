import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'
import { pillClass } from '@/lib/styles'

export function Hero() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="dark relative isolate -mt-16 flex bg-background text-foreground min-h-[92svh] items-end overflow-hidden pt-16"
    >
      <Image
        src="/images/hero.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="-z-20 object-cover object-center"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-t from-background via-background/70 to-background/20"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-r from-background/80 via-transparent to-transparent"
      />

      <div className="mx-auto w-full max-w-7xl px-4 pt-24 pb-16 sm:px-6 sm:pb-20 lg:px-8 lg:pb-28">
        <p className="inline-flex items-center gap-2 rounded-full border border-foreground/15 bg-background/50 px-4 py-1.5 text-xs font-semibold tracking-[0.2em] uppercase backdrop-blur-md">
          <span className="size-1.5 rounded-full bg-brand-magenta shadow-[0_0_10px_var(--brand-magenta)]" />
          Drop 01 is live
        </p>
        <h1
          id="hero-heading"
          className="mt-6 max-w-4xl font-display text-[clamp(3.25rem,12vw,9rem)] leading-[0.88] tracking-wide text-balance uppercase"
        >
          Wear Your Thoughts. <span className="text-chrome">Live Your Life.</span>
        </h1>
        <p className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-foreground/80">
          Heavyweight streetwear for horror heads, pop-culture obsessives, and anyone with
          something to say. Shop the latest drop or put your own idea on cotton.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link href="/store" className={pillClass({ size: 'lg' })}>
            Shop the Drop
            <ArrowRight aria-hidden="true" />
          </Link>
          <Link href="/design-studio" className={pillClass({ variant: 'outline', size: 'lg' })}>
            <Sparkles aria-hidden="true" />
            Design Your Own
          </Link>
        </div>
      </div>
    </section>
  )
}
