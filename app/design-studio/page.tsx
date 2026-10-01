import type { Metadata } from 'next'
import { ComingSoon } from '@/components/coming-soon'

export const metadata: Metadata = { title: 'Design Studio' }

export default function DesignStudioPage() {
  return (
    <ComingSoon
      eyebrow="Design Studio"
      title="Your idea. Our press."
      description="The Design Studio is being built right now. Soon you'll be able to upload your own art or remix designs from our library and put them on any blank."
    />
  )
}
