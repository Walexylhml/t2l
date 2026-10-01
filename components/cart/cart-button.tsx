'use client'

import { ShoppingBag } from 'lucide-react'
import { useCart } from './cart-provider'

export function CartButton() {
  const { itemCount, openCart } = useCart()
  const label = itemCount === 1 ? '1 item' : `${itemCount} items`

  return (
    <button
      type="button"
      onClick={openCart}
      aria-label={`Open cart, ${label}`}
      className="relative -mr-2 inline-flex size-11 items-center justify-center rounded-full text-foreground transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
    >
      <ShoppingBag className="size-5" aria-hidden="true" />
      {itemCount > 0 && (
        <span
          aria-hidden="true"
          className="absolute top-1 right-0.5 inline-flex min-w-5 items-center justify-center rounded-full bg-chrome px-1 text-[11px] leading-5 font-bold text-background tabular-nums shadow-[0_0_12px_oklch(0.67_0.26_352/60%)] animate-in zoom-in-50"
          key={itemCount}
        >
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </button>
  )
}
