'use client'

import { createContext, useCallback, useContext, useMemo, useReducer, useState } from 'react'
import type { Product, Size } from '@/lib/products'

export const MAX_QUANTITY = 10

export type CartItem = {
  key: string
  productId: string
  slug: string
  name: string
  image: string
  price: number
  size: Size
  quantity: number
}

type CartAction =
  | { type: 'add'; product: Product; size: Size; quantity: number }
  | { type: 'update'; key: string; quantity: number }
  | { type: 'remove'; key: string }
  | { type: 'clear' }

function clampQuantity(quantity: number) {
  return Math.min(MAX_QUANTITY, Math.max(1, Math.floor(quantity)))
}

function cartReducer(state: CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
    case 'add': {
      const key = `${action.product.id}:${action.size}`
      const existing = state.find((item) => item.key === key)
      if (existing) {
        return state.map((item) =>
          item.key === key
            ? { ...item, quantity: clampQuantity(item.quantity + action.quantity) }
            : item,
        )
      }
      return [
        ...state,
        {
          key,
          productId: action.product.id,
          slug: action.product.slug,
          name: action.product.name,
          image: action.product.image,
          price: action.product.price,
          size: action.size,
          quantity: clampQuantity(action.quantity),
        },
      ]
    }
    case 'update':
      return state.map((item) =>
        item.key === action.key ? { ...item, quantity: clampQuantity(action.quantity) } : item,
      )
    case 'remove':
      return state.filter((item) => item.key !== action.key)
    case 'clear':
      return []
  }
}

type CartContextValue = {
  items: CartItem[]
  itemCount: number
  subtotal: number
  isOpen: boolean
  setOpen: (open: boolean) => void
  openCart: () => void
  addItem: (product: Product, size: Size, quantity: number) => void
  updateQuantity: (key: string, quantity: number) => void
  removeItem: (key: string) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, dispatch] = useReducer(cartReducer, [])
  const [isOpen, setOpen] = useState(false)

  const addItem = useCallback((product: Product, size: Size, quantity: number) => {
    dispatch({ type: 'add', product, size, quantity })
  }, [])
  const updateQuantity = useCallback((key: string, quantity: number) => {
    dispatch({ type: 'update', key, quantity })
  }, [])
  const removeItem = useCallback((key: string) => dispatch({ type: 'remove', key }), [])
  const clearCart = useCallback(() => dispatch({ type: 'clear' }), [])
  const openCart = useCallback(() => setOpen(true), [])

  const value = useMemo<CartContextValue>(() => {
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    return {
      items,
      itemCount,
      subtotal,
      isOpen,
      setOpen,
      openCart,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
    }
  }, [items, isOpen, openCart, addItem, updateQuantity, removeItem, clearCart])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used within a CartProvider')
  return context
}
