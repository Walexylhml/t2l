import Link from 'next/link'
import { InstagramIcon } from '@/components/icons/instagram-icon'
import { siteConfig } from '@/lib/site'
import { CATEGORIES } from '@/lib/products'
import { Wordmark } from './wordmark'

export function SiteFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="relative mt-24 border-t border-border/60 bg-card/30">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 -top-px h-px bg-chrome opacity-60"
      />
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div className="space-y-4 lg:col-span-2">
          <Wordmark className="text-3xl" />
          <p className="max-w-sm text-pretty leading-relaxed text-muted-foreground">
            Streetwear for horror heads, pop-culture obsessives, and people with something to
            say. Every piece starts as a thought. We just help it live.
          </p>
          <a
            href={siteConfig.instagram.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium transition-colors hover:border-foreground/40 hover:bg-foreground/5"
          >
            <InstagramIcon className="size-4" aria-hidden="true" />
            {siteConfig.instagram.handle}
          </a>
        </div>

        <FooterColumn title="Explore">
          {siteConfig.nav.map((item) => (
            <FooterLink key={item.href} href={item.href}>
              {item.label}
            </FooterLink>
          ))}
        </FooterColumn>

        <FooterColumn title="Shop">
          {CATEGORIES.map((category) => (
            <FooterLink key={category.slug} href={`/store?category=${category.slug}`}>
              {category.label}
            </FooterLink>
          ))}
        </FooterColumn>
      </div>
      <div className="border-t border-border/60">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>
            &copy; {year} {siteConfig.name}. All rights reserved.
          </p>
          <p>{siteConfig.tagline}</p>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
        {title}
      </h2>
      <ul className="mt-4 space-y-3">{children}</ul>
    </div>
  )
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="text-sm text-foreground/85 transition-colors hover:text-foreground">
        {children}
      </Link>
    </li>
  )
}
