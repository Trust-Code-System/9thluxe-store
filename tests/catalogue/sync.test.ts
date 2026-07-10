import { describe, it, expect } from 'vitest'
import { isPublishable } from '@/lib/catalogue/sync'

describe('catalogue sync — publishing eligibility rule', () => {
  it('requires a name, positive price and at least one image', () => {
    expect(isPublishable({ name: 'Noir', priceNGN: 50_000, images: ['a.jpg'] })).toBe(true)
  })
  it('rejects missing image', () => {
    expect(isPublishable({ name: 'Noir', priceNGN: 50_000, images: [] })).toBe(false)
  })
  it('rejects zero price', () => {
    expect(isPublishable({ name: 'Noir', priceNGN: 0, images: ['a.jpg'] })).toBe(false)
  })
  it('rejects blank name', () => {
    expect(isPublishable({ name: '   ', priceNGN: 50_000, images: ['a.jpg'] })).toBe(false)
  })
})
