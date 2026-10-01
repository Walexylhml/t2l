import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { ProductPurchase } from '@/components/store/product-purchase'
import { ProductCard } from '@/components/store/product-card'
import {
  formatPrice,
  getCategoryLabel,
  getProductBySlug,
  getProducts,
  getRelatedProducts,
} from '@/lib/products'

type Params = Promise<{ slug: string }>

export async function generateStaticParams() {
  const products = await getProducts()
  return products.map((product) => ({ slug: product.slug }))
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) return { title: 'Product not found' }
  return {
    title: product.name,
    description: product.description,
    alternates: { canonical: `/store/${product.slug}` },
    openGraph: { title: product.name, description: product.description, images: [product.image] },
  }
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) notFound()

  const related = await getRelatedProducts(product)

  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 sm:pt-10 lg:px-8">
      <nav aria-label="Breadcrumb">
        <Link
          href="/store"
          className="inline-flex items-center gap-1 rounded-full py-2 pr-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          Back to Store
        </Link>
      </nav>

      <div className="mt-4 grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-card ring-1 ring-border lg:sticky lg:top-24 lg:self-start">
          <Image
            src={product.image}
            alt={`${product.name} — ${product.garment.toLowerCase()} graphic`}
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,oklch(1_0_0/8%)_0%,transparent_40%)]"
          />
        </div>

        <div className="lg:py-4">
          <p className="text-xs font-semibold tracking-[0.25em] text-brand-teal uppercase">
            {getCategoryLabel(product.category)} &middot; {product.garment}
          </p>
          <h1 className="mt-3 font-display text-5xl leading-[0.92] tracking-wide text-balance uppercase sm:text-6xl">
            {product.name}
          </h1>
          <p className="mt-4 text-2xl font-semibold tabular-nums">{formatPrice(product.price)}</p>
          <p className="mt-6 max-w-prose text-pretty leading-relaxed text-muted-foreground">
            {product.description}
          </p>
          <div className="mt-10">
            <ProductPurchase product={product} />
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="mt-24">
          <h2
            id="related-heading"
            className="font-display text-3xl tracking-wide uppercase sm:text-4xl"
          >
            You might also like
          </h2>
          <ul className="mt-8 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p) => (
              <li key={p.id}>
                <ProductCard product={p} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
