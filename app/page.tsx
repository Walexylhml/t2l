import { Hero } from '@/components/home/hero'
import { Marquee } from '@/components/home/marquee'
import { FeaturedProducts } from '@/components/home/featured-products'
import { DesignStudioTeaser } from '@/components/home/design-studio-teaser'
import { EventsBand } from '@/components/home/events-band'

export default function HomePage() {
  return (
    <>
      <Hero />
      <Marquee />
      <FeaturedProducts />
      <DesignStudioTeaser />
      <EventsBand />
    </>
  )
}
