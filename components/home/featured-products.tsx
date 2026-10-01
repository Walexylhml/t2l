import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { SectionHeading } from '@/components/section-heading'
import { ProductCard } from '@/components/store/product-card'
import { getFeaturedProducts } from '@/lib/products'
import { pillClass } from '@/lib/styles'

export async function FeaturedProducts() {
  const products = await getFeaturedProducts()

  return (
    <section aria-labelledby="featured-heading" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Featured"
          title="Fresh off the press"
          description="The pieces everyone keeps asking about. Printed to order, built to last."
        >
          <Link
            href="/store"
            className={pillClass({ variant: 'outline' }, 'hidden self-start md:inline-flex md:self-auto')}
          >
            View all
            <ArrowRight aria-hidden="true" />
          </Link>
        </SectionHeading>
      </div>

      {/* Horizontal scroll-snap on mobile, grid on desktop */}
      <ul className="mx-auto mt-12 flex max-w-7xl snap-x snap-mandatory gap-5 overflow-x-auto scroll-px-4 px-4 pb-4 sm:scroll-px-6 sm:px-6 lg:grid lg:grid-cols-4 lg:gap-6 lg:overflow-visible lg:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {products.map((product) => (
          <li key={product.id} className="w-[75%] shrink-0 snap-start sm:w-[42%] lg:w-auto">
            <ProductCard product={product} />
          </li>
        ))}
      </ul>

      <div className="mt-8 px-4 md:hidden">
        <Link href="/store" className={pillClass({ variant: 'outline' }, 'w-full')}>
          View all products
          <ArrowRight aria-hidden="true" />
        </Link>
      </div>
    </section>
  )
}
