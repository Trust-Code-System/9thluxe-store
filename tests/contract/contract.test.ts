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

describe('contract: background jobs support authenticated schedulers', () => {
  it.each([
    'app/api/internal/jobs/process-outbox/route.ts',
    'app/api/internal/jobs/release-reservations/route.ts',
    'app/api/internal/jobs/reconcile-payments/route.ts',
  ])('supports Vercel GET and external-scheduler POST in %s', (path) => {
    const route = read(path)
    expect(route).toContain('hasValidBearerSecret')
    expect(route).toContain('export async function POST')
    expect(route).toContain('export const GET = POST')
  })
})

describe('contract: payment collection fails closed', () => {
  it.each([
    'app/api/checkout/create-order/route.ts',
    'app/api/paystack/initialize/route.ts',
    'app/api/admin/orders/[id]/refund/route.ts',
  ])('guards provider mutations in %s', (path) => {
    expect(read(path)).toContain('isPaymentCollectionEnabled')
  })
})

describe('contract: high-churn account mutations are abuse controlled', () => {
  it.each([
    'app/api/cart/add/route.ts',
    'app/api/cart/update/route.ts',
    'app/api/cart/remove/route.ts',
    'app/api/cart/clear/route.ts',
    'app/api/account/addresses/route.ts',
    'app/api/account/addresses/[id]/route.ts',
    'app/api/settings/toggle-email/route.ts',
    'app/api/settings/toggle-sms/route.ts',
  ])('checks origin and rate limits in %s', (path) => {
    const route = read(path)
    expect(route).toContain('hasTrustedOrigin')
    expect(route).toContain('consumeRateLimit')
  })
})

describe('contract: growing account and admin lists stay bounded', () => {
  it.each([
    'app/admin/orders/page.tsx',
    'app/admin/users/page.tsx',
    'app/account/orders/page.tsx',
  ])('paginates %s', (path) => {
    const page = read(path)
    expect(page).toContain('pageSize')
  })
  it('bounds the shared admin order query', () => {
    expect(read('lib/services/order-service.ts')).toContain('take: pageSize')
  })
})
