import type { Metadata } from 'next'
import { ComingSoon } from '@/components/coming-soon'

export const metadata: Metadata = { title: 'About' }

export default function AboutPage() {
  return (
    <ComingSoon
      eyebrow="About"
      title="Thoughts become things"
      description="Thoughts2Lyfe started with a simple idea: what you think about, you bring to life. Our full story is coming soon."
    />
  )
}
