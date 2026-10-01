import type { Metadata } from 'next'
import { ComingSoon } from '@/components/coming-soon'

export const metadata: Metadata = { title: 'Checkout', robots: { index: false } }

export default function CheckoutPage() {
  return (
    <ComingSoon
      eyebrow="Checkout"
      title="Checkout is almost ready"
      description="Secure checkout is launching soon. Your cart is saved for this session, so keep browsing and we'll have you wearing your thoughts shortly."
    />
  )
}
