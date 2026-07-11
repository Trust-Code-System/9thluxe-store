"use client"

import { create } from "zustand"

/** Shape returned by GET /api/cart/summary */
export interface CartSummaryItem {
  productId: string
  slug: string
  name: string
  brand: string | null
  image: string
  quantity: number
  priceNGN: number
  lineTotal: number
}

export interface CartItem {
  id: string
  slug: string
  name: string
  brand: string
  price: number
  image: string
  quantity: number
}

interface CartStore {
  items: CartItem[]
  couponCode: string | null
  couponId: string | null
  discount: number
  /** True once the first server sync has completed (guards empty-cart redirects). */
  hasHydrated: boolean
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number, maxStock?: number) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number, maxStock?: number) => void
  clearCart: () => void
  applyCoupon: (code: string, subtotal: number) => Promise<boolean>
  removeCoupon: () => void
  getTotalPrice: () => number
  getTotalItems: () => number
  getUniqueItemsCount: () => number
  /** Replace items from server (cookie cart). Single source of truth. */
  setItemsFromServer: (items: CartSummaryItem[]) => void
  /** Fetch /api/cart/summary and update store. Call after any cart mutation. */
  syncFromServer: () => Promise<void>
}

export const useCartStore = create<CartStore>()((set, get) => ({
  items: [],
  couponCode: null,
  couponId: null,
  discount: 0,
  hasHydrated: false,
  addItem: (item, quantity = 1, maxStock) => {
    set((state) => {
      const existingItem = state.items.find((i) => i.id === item.id)
      const newQuantity = existingItem ? existingItem.quantity + quantity : quantity
      if (maxStock !== undefined && newQuantity > maxStock) return state
      if (existingItem) {
        return {
          items: state.items.map((i) =>
            i.id === item.id
              ? { ...i, quantity: Math.min(newQuantity, maxStock ?? newQuantity) }
              : i
          ),
        }
      }
      return {
        items: [...state.items, { ...item, quantity: Math.min(quantity, maxStock ?? quantity) }],
      }
    })
  },
  removeItem: (id) => {
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    }))
  },
  updateQuantity: (id, quantity, maxStock) => {
    if (quantity <= 0) {
      get().removeItem(id)
      return
    }
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id
          ? { ...item, quantity: maxStock !== undefined ? Math.min(quantity, maxStock) : quantity }
          : item
      ),
    }))
  },
  clearCart: () => {
    set({ items: [], couponCode: null, couponId: null, discount: 0 })
  },
  applyCoupon: async (code, subtotal) => {
    try {
      const res = await fetch("/api/coupons/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim().toUpperCase(), subtotalNGN: subtotal }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) return false
      set({ couponCode: code.trim().toUpperCase(), couponId: data.couponId, discount: data.discountNGN })
      return true
    } catch {
      return false
    }
  },
  removeCoupon: () => {
    set({ couponCode: null, couponId: null, discount: 0 })
  },
  getTotalPrice: () => {
    return get().items.reduce((total, item) => total + item.price * item.quantity, 0)
  },
  getTotalItems: () => {
    return get().items.reduce((total, item) => total + item.quantity, 0)
  },
  getUniqueItemsCount: () => {
    return get().items.length
  },
  setItemsFromServer: (items) => {
    set({
      items: items.map((i) => ({
        id: i.productId,
        slug: i.slug,
        name: i.name,
        brand: i.brand ?? "",
        price: i.priceNGN,
        image: i.image,
        quantity: i.quantity,
      })),
    })
  },
  syncFromServer: async () => {
    try {
      const res = await fetch("/api/cart/summary", {
        credentials: "include",
        cache: "no-store",
      })
      const data = await res.json()
      get().setItemsFromServer(data.items ?? [])
    } catch {
      // Offline or API error; leave store as-is
    } finally {
      set({ hasHydrated: true })
    }
  },
}))
