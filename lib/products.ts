export const SIZES = ['S', 'M', 'L', 'XL', '2XL'] as const
export type Size = (typeof SIZES)[number]

export const CATEGORIES = [
  { slug: 'horror', label: 'Horror' },
  { slug: 'pop-culture', label: 'Pop Culture' },
  { slug: 'social-cause', label: 'Social Cause' },
  { slug: 'originals', label: 'Originals' },
] as const
export type CategorySlug = (typeof CATEGORIES)[number]['slug']

export type Product = {
  id: string
  slug: string
  name: string
  /** Price in cents, ready to map onto Stripe unit_amount. */
  price: number
  category: CategorySlug
  garment: 'Tee' | 'Hoodie' | 'Crewneck'
  image: string
  description: string
  featured?: boolean
  badge?: string
}

/**
 * Placeholder catalog. Swap the body of the async getters below for a
 * Supabase / CMS query later; the rest of the app only consumes these functions.
 */
const PRODUCTS: Product[] = [
  {
    id: 'p_midnight_slasher',
    slug: 'midnight-slasher-hoodie',
    name: 'Midnight Slasher Hoodie',
    price: 6800,
    category: 'horror',
    garment: 'Hoodie',
    image: '/images/products/midnight-slasher-hoodie.png',
    description:
      'A love letter to late-night creature features. 450gsm heavyweight fleece, dropped shoulders, and a distressed moonlit print that only gets better with every wash.',
    featured: true,
    badge: 'Best Seller',
  },
  {
    id: 'p_final_girl',
    slug: 'final-girl-club-tee',
    name: 'Final Girl Club Tee',
    price: 3400,
    category: 'horror',
    garment: 'Tee',
    image: '/images/products/final-girl-tee.png',
    description:
      'For the ones who survive the third act. Garment-dyed washed black cotton with a retro slasher-poster graphic in blood red and cream.',
    featured: true,
  },
  {
    id: 'p_static_channel',
    slug: 'static-channel-tee',
    name: 'Static Channel Tee',
    price: 3400,
    category: 'pop-culture',
    garment: 'Tee',
    image: '/images/products/static-channel-tee.png',
    description:
      "They're here. A glitched-out CRT graphic on a heavyweight off-white tee, printed with water-based inks for a soft, broken-in hand.",
    badge: 'New',
  },
  {
    id: 'p_arcade_ghosts',
    slug: 'arcade-ghosts-hoodie',
    name: 'Arcade Ghosts Hoodie',
    price: 6800,
    category: 'pop-culture',
    garment: 'Hoodie',
    image: '/images/products/arcade-ghosts-hoodie.png',
    description:
      'Insert coin. Deep purple fleece with a pixel-art ghost squad in neon teal and magenta. Kangaroo pocket, ribbed cuffs, zero regrets.',
    featured: true,
  },
  {
    id: 'p_mind_over_matter',
    slug: 'mind-over-matter-tee',
    name: 'Mind Over Matter Tee',
    price: 3600,
    category: 'social-cause',
    garment: 'Tee',
    image: '/images/products/mind-over-matter-tee.png',
    description:
      'Part of our mental health series. 20% of every sale goes directly to community mental health organizations. Wear the conversation.',
    badge: 'Gives Back',
  },
  {
    id: 'p_breathe_again',
    slug: 'breathe-again-hoodie',
    name: 'Breathe Again Hoodie',
    price: 7200,
    category: 'social-cause',
    garment: 'Hoodie',
    image: '/images/products/breathe-again-hoodie.png',
    description:
      'Embroidered floral lungs on a cream heavyweight hoodie — a reminder to slow down. A portion of proceeds supports recovery programs.',
    featured: true,
    badge: 'Gives Back',
  },
  {
    id: 'p_thoughts_become_things',
    slug: 'thoughts-become-things-tee',
    name: 'Thoughts Become Things Tee',
    price: 3200,
    category: 'originals',
    garment: 'Tee',
    image: '/images/products/thoughts-become-things-tee.png',
    description:
      'The mantra that started it all. Heavy condensed type in an iridescent chrome print on a boxy-fit black tee.',
  },
  {
    id: 'p_chrome_heart',
    slug: 'chrome-heart-crewneck',
    name: 'Chrome Heart Crewneck',
    price: 5800,
    category: 'originals',
    garment: 'Crewneck',
    image: '/images/products/chrome-heart-crewneck.png',
    description:
      'Liquid-chrome heart on heather charcoal. Midweight loopback cotton with a relaxed fit made for layering.',
    badge: 'Limited',
  },
]

export async function getProducts(category?: string): Promise<Product[]> {
  if (!category) return PRODUCTS
  return PRODUCTS.filter((product) => product.category === category)
}

export async function getFeaturedProducts(): Promise<Product[]> {
  return PRODUCTS.filter((product) => product.featured)
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  return PRODUCTS.find((product) => product.slug === slug)
}

export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  const sameCategory = PRODUCTS.filter(
    (p) => p.id !== product.id && p.category === product.category,
  )
  const others = PRODUCTS.filter((p) => p.id !== product.id && p.category !== product.category)
  return [...sameCategory, ...others].slice(0, limit)
}

export function getCategoryLabel(slug: CategorySlug): string {
  return CATEGORIES.find((c) => c.slug === slug)?.label ?? slug
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

export function formatPrice(cents: number): string {
  return currencyFormatter.format(cents / 100)
}
