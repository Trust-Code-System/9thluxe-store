"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { PdpCard } from "@/lib/pdp/types"

export const MAX_COMPARE = 4

interface CompareStore {
  items: PdpCard[]
  add: (card: PdpCard) => boolean
  remove: (id: string) => void
  toggle: (card: PdpCard) => boolean
  clear: () => void
  has: (id: string) => boolean
  isFull: () => boolean
}

/**
 * Client-side comparison set (up to 4). Persisted so the selection survives navigation and the
 * dedicated /compare page can read it. Stores only public card data; never private fields.
 */
export const useCompareStore = create<CompareStore>()(
  persist(
    (set, get) => ({
      items: [],
      add: (card) => {
        const { items } = get()
        if (items.some((i) => i.id === card.id)) return true
        if (items.length >= MAX_COMPARE) return false
        set({ items: [...items, card] })
        return true
      },
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      toggle: (card) => {
        const { items } = get()
        if (items.some((i) => i.id === card.id)) {
          set({ items: items.filter((i) => i.id !== card.id) })
          return true
        }
        if (items.length >= MAX_COMPARE) return false
        set({ items: [...items, card] })
        return true
      },
      clear: () => set({ items: [] }),
      has: (id) => get().items.some((i) => i.id === id),
      isFull: () => get().items.length >= MAX_COMPARE,
    }),
    { name: "fade-compare" },
  ),
)
