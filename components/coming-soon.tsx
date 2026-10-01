import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { pillClass } from '@/lib/styles'

export function ComingSoon({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description: string
}) {
  return (
    <section className="relative mx-auto flex min-h-[70svh] max-w-3xl flex-col items-center justify-center px-4 py-24 text-center sm:px-6">
      <div
        aria-hidden="true"
        className="absolute top-1/3 left-1/2 -z-10 size-80 -translate-x-1/2 rounded-full bg-brand-purple/20 blur-3xl"
      />
      <p className="text-xs font-semibold tracking-[0.25em] text-brand-teal uppercase">{eyebrow}</p>
      <h1 className="mt-4 font-display text-5xl leading-[0.92] tracking-wide text-balance uppercase sm:text-7xl">
        {title}
      </h1>
      <p className="mt-6 max-w-xl text-pretty leading-relaxed text-muted-foreground">
        {description}
      </p>
      <Link href="/store" className={pillClass({ size: 'lg' }, 'mt-10')}>
        Shop the Drop
        <ArrowRight aria-hidden="true" />
      </Link>
    </section>
  )
}
