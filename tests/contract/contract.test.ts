import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ERROR_CATALOGUE } from '@/lib/http/errors'
import { EventSchemas } from '@/lib/analytics/events'

const root = process.cwd()
const read = (p: string) => readFileSync(join(root, p), 'utf8')

describe('contract: error catalogue stays in sync with code', () => {
  const doc = read('contracts/error-catalogue.md')
  for (const code of Object.keys(ERROR_CATALOGUE)) {
    it(`documents ${code}`, () => {
      expect(doc).toContain(code)
    })
  }
})

describe('contract: analytics events documented', () => {
  const doc = read('contracts/events.md')
  for (const name of Object.keys(EventSchemas)) {
    it(`documents ${name}`, () => {
      expect(doc).toContain(name)
    })
  }
})

describe('contract: OpenAPI exposes the core storefront surface + envelope', () => {
  const spec = read('contracts/storefront-api.openapi.yaml')
  it('defines the Envelope schema', () => {
    expect(spec).toContain('Envelope:')
    expect(spec).toMatch(/requestId/)
  })
  it.each(['/products', '/products/{slug}', '/search', '/cart', '/recommendations'])(
    'documents path %s',
    (path) => {
      expect(spec).toContain(`${path}:`)
    },
  )
})
