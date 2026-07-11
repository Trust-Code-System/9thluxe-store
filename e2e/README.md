# Fádé storefront verification

This isolated Playwright package verifies the public perfume storefront without changing the application dependency graph.

## Run

```bash
cd e2e
npm ci
npx playwright install chromium
npm test
```

By default the suite targets `https://9thluxe-store-two.vercel.app`.
Set `E2E_BASE_URL` to a local server or Vercel preview deployment when validating branch changes:

```bash
E2E_BASE_URL=http://localhost:3000 npm test
```

## Coverage

- public route health checks
- mobile navigation open, close and route transition behaviour
- mobile horizontal overflow
- custom portalled shop dropdowns
- reduced-motion handling
- visible em-dash regression
- axe WCAG critical and serious violations

Reports, traces, screenshots and videos are retained for failed CI tests.
