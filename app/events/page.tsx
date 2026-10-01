import type { Metadata } from 'next'
import { ComingSoon } from '@/components/coming-soon'

export const metadata: Metadata = { title: 'Events' }

export default function EventsPage() {
  return (
    <ComingSoon
      eyebrow="Events"
      title="Pop-ups incoming"
      description="Our events calendar is on the way. Follow @thoughts2lyfe on Instagram for the next pop-up, convention booth, and community drop."
    />
  )
}
