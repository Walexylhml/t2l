import Link from 'next/link'
import { CATEGORIES } from '@/lib/products'
import { cn } from '@/lib/utils'

export function CategoryFilter({ active }: { active?: string }) {
  const options = [{ slug: undefined, label: 'All' }, ...CATEGORIES]

  return (
    <nav aria-label="Filter by category" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex w-max gap-2">
        {options.map((option) => {
          const isActive = option.slug === active
          const href = option.slug ? `/store?category=${option.slug}` : '/store'
          return (
            <li key={option.label}>
              <Link
                href={href}
                scroll={false}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'inline-flex h-10 items-center rounded-full border px-5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                  isActive
                    ? 'border-transparent bg-primary text-primary-foreground'
                    : 'border-border bg-card/40 text-muted-foreground hover:border-foreground/30 hover:text-foreground',
                )}
              >
                {option.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
