import { beforeEach, describe, expect, it, vi } from "vitest"

const { findMany } = vi.hoisted(() => ({ findMany: vi.fn() }))
vi.mock("@/lib/prisma", () => ({ prisma: { product: { findMany }, productVariant: { findMany: vi.fn() } } }))
import { searchFadeCatalogue } from "@/lib/concierge/tools/catalogue"

describe("Concierge catalogue evidence policy", () => {
  beforeEach(() => findMany.mockReset())

  it("does not replace a failed scent match with unrelated bestsellers", async () => {
    findMany.mockResolvedValue([])
    const result = await searchFadeCatalogue({ notes: ["grape"], inStockOnly: true })
    expect(result.products).toEqual([])
    expect(findMany).toHaveBeenCalledTimes(1)
  })

  it("treats an available variant as live stock and labels samples only when selected", async () => {
    findMany.mockResolvedValue([{ id: "p1", slug: "one", name: "One", brand: "House", images: [], priceNGN: 90_000, stock: 0, isPreorder: false, isWaitlist: false, notesTop: null, notesHeart: null, notesBase: null, mainAccords: "woody", fragranceFamily: "woody", olfactoryDesc: null, climate: null, occasion: null, variants: [{ size: "2ml", priceNGN: 4_000, isSample: true, stock: 2 }] }])
    const normal = await searchFadeCatalogue({ inStockOnly: true })
    expect(normal.products[0]).toMatchObject({ availability: "in_stock", priceNGN: 90_000, sampleAvailable: true })
    expect(normal.products[0].variantLabel).toBeUndefined()
    const sample = await searchFadeCatalogue({ inStockOnly: true, sampleFirst: true })
    expect(sample.products[0]).toMatchObject({ priceNGN: 4_000, variantLabel: "2ml" })
  })
})
