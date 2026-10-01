import type { Metadata } from 'next'
import { SectionHeading } from '@/components/section-heading'
import { CategoryFilter } from '@/components/store/category-filter'
import { ProductGrid } from '@/components/store/product-grid'
import { CATEGORIES, getProducts } from '@/lib/products'

export const metadata: Metadata = {
  title: 'Store',
  description:
    'Shop Thoughts2Lyfe graphic tees, hoodies, and crewnecks — horror, pop culture, social cause, and original designs.',
  alternates: { canonical: '/store' },
}

export default async function StorePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category } = await searchParams
  const activeCategory = CATEGORIES.find((c) => c.slug === category)
  const products = await getProducts(activeCategory?.slug)

  return (
    <div className="mx-auto max-w-7xl px-4 pt-12 pb-8 sm:px-6 sm:pt-16 lg:px-8">
      <SectionHeading
        as="h1"
        eyebrow="The Store"
        title={activeCategory ? activeCategory.label : 'All Designs'}
        description="Ready-made designs, printed to order on heavyweight blanks. Find the one that says what you're thinking."
      />
      <div className="mt-10 flex flex-col gap-4 border-b border-border/60 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <CategoryFilter active={activeCategory?.slug} />
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {products.length} {products.length === 1 ? 'product' : 'products'}
        </p>
      </div>
      <div className="mt-10">
        {products.length > 0 ? (
          <ProductGrid products={products} />
        ) : (
          <p className="py-24 text-center text-muted-foreground">
            No designs in this category yet. Check back after the next drop.
          </p>
        )}
      </div>
    </div>
  )
}
