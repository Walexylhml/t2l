'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowUpRight, Menu } from 'lucide-react'
import { InstagramIcon } from '@/components/icons/instagram-icon'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { siteConfig } from '@/lib/site'
import { cn } from '@/lib/utils'
import { Wordmark } from './wordmark'

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className="-ml-2 inline-flex size-11 items-center justify-center rounded-full text-foreground transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring md:hidden"
        aria-label="Open menu"
      >
        <Menu className="size-5" aria-hidden="true" />
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[85%] max-w-sm border-border/60 bg-background/95 backdrop-blur-xl"
      >
        <div className="flex h-16 items-center px-6">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <Wordmark />
        </div>
        <nav aria-label="Mobile" className="flex-1 px-3">
          <ul className="flex flex-col gap-1">
            {siteConfig.nav.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex items-center justify-between rounded-xl px-3 py-4 font-display text-3xl uppercase tracking-wide transition-colors',
                      active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {item.label}
                    <ArrowUpRight
                      className={cn('size-5', active ? 'text-brand-teal' : 'opacity-40')}
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
        <div className="border-t border-border/60 p-6">
          <a
            href={siteConfig.instagram.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <InstagramIcon className="size-4" aria-hidden="true" />
            {siteConfig.instagram.handle}
          </a>
        </div>
      </SheetContent>
    </Sheet>
  )
}
