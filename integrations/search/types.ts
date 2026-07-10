// integrations/search/types.ts
// Search-provider abstraction. MVP = Postgres FTS + trigram; swap in Algolia/Typesense/Elastic
// later by implementing this interface. Hard filters are applied by the provider BEFORE any AI
// ranking so the AI can never surface products outside the validated result set.
export interface SearchFilters {
  brand?: string
  family?: string
  note?: string
  accord?: string
  occasion?: string
  mood?: string
  climate?: string
  concentration?: string
  inStock?: boolean
  sampleAvailable?: boolean
  minPriceNGN?: number
  maxPriceNGN?: number
}

export interface SearchQuery {
  q?: string
  filters?: SearchFilters
  limit?: number
  cursor?: string
}

export interface SearchHit {
  productId: string
  slug: string
  name: string
  brand: string | null
  priceNGN: number
  inStock: boolean
  score: number
}

export interface SearchResult {
  hits: SearchHit[]
  total: number
  nextCursor: string | null
}

export interface SearchProvider {
  readonly name: 'postgres' | 'algolia' | 'typesense'
  search(query: SearchQuery): Promise<SearchResult>
}
