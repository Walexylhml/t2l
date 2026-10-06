export const siteConfig = {
  name: 'Thoughts2Lyfe',
  tagline: 'Wear Your Thoughts. Live Your Life.',
  description:
    'Thoughts2Lyfe is a streetwear label for pop-culture obsessives, social causes, original designs, and horror heads — people with something to say. Shop graphic tees and hoodies or design your own.',
  instagram: {
    handle: '@thoughts2lyfe',
    url: 'https://instagram.com/thoughts2lyfe',
  },
  nav: [
    { label: 'Store', href: '/store' },
    { label: 'Design Studio', href: '/design-studio' },
    { label: 'Events', href: '/events' },
    { label: 'About', href: '/about' },
  ],
} as const

export function getBaseUrl(): URL {
  const raw = process.env.NEXT_PUBLIC_BASE_URL
  if (raw) {
    try {
      return new URL(raw)
    } catch {
      // Fall through to localhost when the env var is malformed.
    }
  }
  return new URL('http://localhost:3000')
}
