'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ShoppingBag, Trash2 } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { QuantityStepper } from '@/components/quantity-stepper'
import { formatPrice } from '@/lib/products'
import { pillClass } from '@/lib/styles'
import { MAX_QUANTITY, useCart, type CartItem } from './cart-provider'

export function CartDrawer() {
  const { items, itemCount, subtotal, isOpen, setOpen } = useCart()

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent
        side="right"
        className="w-full gap-0 border-border/60 bg-background/95 backdrop-blur-xl data-[side=right]:sm:max-w-md"
      >
        <SheetHeader className="border-b border-border/60 px-6 py-5">
          <SheetTitle className="font-display text-2xl tracking-wide uppercase">
            Your Cart
          </SheetTitle>
          <SheetDescription>
            {itemCount === 0
              ? 'Nothing here yet.'
              : `${itemCount} ${itemCount === 1 ? 'item' : 'items'} ready to wear`}
          </SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <EmptyCart onClose={() => setOpen(false)} />
        ) : (
          <>
            <ul className="flex-1 divide-y divide-border/60 overflow-y-auto px-6">
              {items.map((item) => (
                <CartLine key={item.key} item={item} onNavigate={() => setOpen(false)} />
              ))}
            </ul>

            <SheetFooter className="gap-4 border-t border-border/60 bg-card/40 px-6 py-6">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <span className="text-xl font-semibold tabular-nums">{formatPrice(subtotal)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Shipping and taxes calculated at checkout.
              </p>
              <Link
                href="/checkout"
                onClick={() => setOpen(false)}
                className={pillClass({ size: 'lg' }, 'w-full')}
              >
                Proceed to Checkout
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
              >
                Continue shopping
              </button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function CartLine({ item, onNavigate }: { item: CartItem; onNavigate: () => void }) {
  const { updateQuantity, removeItem } = useCart()

  return (
    <li className="flex gap-4 py-5">
      <Link
        href={`/store/${item.slug}`}
        onClick={onNavigate}
        className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-card ring-1 ring-border"
      >
        <Image src={item.image} alt={item.name} fill sizes="96px" className="object-cover" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              href={`/store/${item.slug}`}
              onClick={onNavigate}
              className="line-clamp-2 font-medium leading-snug hover:underline underline-offset-4"
            >
              {item.name}
            </Link>
            <p className="mt-1 text-sm text-muted-foreground">Size {item.size}</p>
          </div>
          <p className="font-medium tabular-nums">{formatPrice(item.price * item.quantity)}</p>
        </div>
        <div className="mt-auto flex items-center justify-between pt-3">
          <QuantityStepper
            size="sm"
            value={item.quantity}
            max={MAX_QUANTITY}
            onChange={(q) => updateQuantity(item.key, q)}
            label={`Quantity for ${item.name}, size ${item.size}`}
          />
          <button
            type="button"
            onClick={() => removeItem(item.key)}
            aria-label={`Remove ${item.name}, size ${item.size}`}
            className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive focus-visible:outline-2 focus-visible:outline-ring"
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </li>
  )
}

function EmptyCart({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
      <div className="relative flex size-20 items-center justify-center rounded-full bg-card ring-1 ring-border">
        <ShoppingBag className="size-8 text-muted-foreground" aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <p className="font-display text-2xl uppercase tracking-wide">Your cart is empty</p>
        <p className="text-sm text-muted-foreground">Go find something that says what you think.</p>
      </div>
      <Link href="/store" onClick={onClose} className={pillClass()}>
        Shop the Drop
      </Link>
    </div>
  )
}
