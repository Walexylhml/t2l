import Image from 'next/image'
import Link from 'next/link'
import { formatPrice, getCategoryLabel, type Product } from '@/lib/products'
import { cn } from '@/lib/utils'

export function ProductCard({
  product,
  priority = false,
  className,
}: {
  product: Product
  priority?: boolean
  className?: string
}) {
  return (
    <article className={cn('group relative', className)}>
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-card ring-1 ring-border transition-all duration-500 ease-out group-hover:-translate-y-1.5 group-hover:shadow-[0_24px_60px_-20px_oklch(0.63_0.24_296/45%)] group-hover:ring-foreground/20 motion-reduce:transition-none motion-reduce:group-hover:translate-y-0">
        <Image
          src={product.image}
          alt={`${product.name} — ${product.garment.toLowerCase()} graphic`}
          fill
          priority={priority}
          sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04] motion-reduce:transition-none"
        />
        {/* Gloss sweep on hover */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -translate-x-full bg-[linear-gradient(115deg,transparent_30%,oklch(1_0_0/14%)_48%,transparent_62%)] transition-transform duration-1000 ease-out group-hover:translate-x-full motion-reduce:hidden"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/50 via-transparent to-transparent"
        />
        {product.badge && (
          <span className="absolute top-3 left-3 rounded-full border border-foreground/15 bg-background/70 px-3 py-1 text-[11px] font-semibold tracking-wider uppercase backdrop-blur-md">
            {product.badge}
          </span>
        )}
      </div>
      <div className="mt-4 flex items-start justify-between gap-3 px-0.5">
        <div className="min-w-0">
          <h3 className="font-medium leading-snug text-pretty">
            <Link
              href={`/store/${product.slug}`}
              className="after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-4 focus-visible:after:outline-ring"
            >
              {product.name}
            </Link>
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {getCategoryLabel(product.category)} &middot; {product.garment}
          </p>
        </div>
        <p className="shrink-0 font-semibold tabular-nums">{formatPrice(product.price)}</p>
      </div>
    </article>
  )
}
