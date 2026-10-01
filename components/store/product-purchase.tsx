'use client'

import { useState } from 'react'
import { Check, ShoppingBag } from 'lucide-react'
import { MAX_QUANTITY, useCart } from '@/components/cart/cart-provider'
import { QuantityStepper } from '@/components/quantity-stepper'
import { SIZES, formatPrice, type Product, type Size } from '@/lib/products'
import { pillClass } from '@/lib/styles'
import { cn } from '@/lib/utils'

export function ProductPurchase({ product }: { product: Product }) {
  const { addItem, openCart } = useCart()
  const [size, setSize] = useState<Size | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [showSizeError, setShowSizeError] = useState(false)

  function handleAddToCart() {
    if (!size) {
      setShowSizeError(true)
      return
    }
    addItem(product, size, quantity)
    setQuantity(1)
    openCart()
  }

  return (
    <div className="space-y-8">
      <fieldset aria-describedby={showSizeError ? 'size-error' : undefined}>
        <div className="flex items-center justify-between">
          <legend className="text-sm font-semibold tracking-wide uppercase">Size</legend>
          <span className="text-xs text-muted-foreground">Unisex &middot; relaxed fit</span>
        </div>
        <div className="mt-3 grid grid-cols-5 gap-2">
          {SIZES.map((option) => {
            const selected = option === size
            return (
              <label
                key={option}
                className={cn(
                  'relative flex h-12 cursor-pointer items-center justify-center rounded-xl border text-sm font-semibold transition-all has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring',
                  selected
                    ? 'border-transparent bg-primary text-primary-foreground shadow-[0_8px_24px_-10px_oklch(0.8_0.14_186/70%)]'
                    : 'border-border bg-card/50 hover:border-foreground/40',
                )}
              >
                <input
                  type="radio"
                  name="size"
                  value={option}
                  checked={selected}
                  onChange={() => {
                    setSize(option)
                    setShowSizeError(false)
                  }}
                  className="sr-only"
                />
                {option}
              </label>
            )
          })}
        </div>
        {showSizeError && (
          <p id="size-error" role="alert" className="mt-2 text-sm text-destructive">
            Pick a size to add this to your cart.
          </p>
        )}
      </fieldset>

      <div className="space-y-3">
        <span id="qty-label" className="block text-sm font-semibold tracking-wide uppercase">
          Quantity
        </span>
        <QuantityStepper value={quantity} onChange={setQuantity} max={MAX_QUANTITY} />
      </div>

      <button
        type="button"
        onClick={handleAddToCart}
        className={pillClass({ size: 'lg' }, 'w-full')}
      >
        <ShoppingBag aria-hidden="true" />
        Add to Cart &mdash; {formatPrice(product.price * quantity)}
      </button>

      <ul className="space-y-2 text-sm text-muted-foreground">
        {[
          'Free shipping on orders over $100',
          'Printed to order in small batches',
          '30-day easy returns on ready-made designs',
        ].map((perk) => (
          <li key={perk} className="flex items-center gap-2">
            <Check className="size-4 text-brand-teal" aria-hidden="true" />
            {perk}
          </li>
        ))}
      </ul>
    </div>
  )
}
