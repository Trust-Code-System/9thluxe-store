# Owner Copilot

A private, **approval-based** business assistant. It analyzes and proposes; it never executes
outward-facing or financial actions on its own. Status: schema + AI service (`ownerBrief`) +
Approval Centre model implemented; assistant surfaces are scaffolded and tracked in the TODO.

## Principles
- **Every metric traceable to source data.** `ownerBrief` claims must derive from the metrics JSON
  it is given; the service prompt enforces this and output is schema-validated.
- **No auto-execution of high-risk actions.** Refunds, discounts, price changes, publications,
  reorders, compensation, campaign sends, stock adjustments, and AI-content publication all create
  an `ApprovalRequest` and require a human decision.
- **No fabricated numbers.** When cost/supplier inputs are absent, margin outputs return
  `insufficient_data` rather than invented figures.

## Daily brief (data sources)
Revenue/orders/AOV (Order), failed payments (IntegrationEvent/Order), delivery exceptions,
low-stock/stockout risk (Product.stock vs reorderPoint), slow movers, most-viewed vs inventory
(analytics events), frequently-searched-unavailable (search events), abandoned carts, support/return/
review themes (SupportConversation/Review), gross-margin warnings, recommended actions.

## Inventory assistant
Reorder recommendations (lead time from Supplier), demand signals (views/recommendation demand vs
stock), stockout prediction, dead-stock detection, sample allocation, supplier discrepancy flags —
presented with confidence + assumptions.

## Marketing assistant
Campaign briefs, email/WhatsApp drafts, launch plans, gift guides, journal outlines, SEO briefs,
segments, offers, post-campaign summaries. **Never sends** — drafts only (`draftMarketing`).

## Customer-insight + margin assistants
Aggregated cohort/return/support/repeat-purchase analysis; margin = revenue − COGS − payment fee −
delivery subsidy − discount − refund (only when inputs exist).

## Live endpoints (all ADMIN-gated, read-only aggregation unless noted)
- Daily brief: `GET /api/v1/admin/daily-brief` (`lib/copilot/daily-brief.ts`)
- Inventory assistant: `GET /api/v1/admin/copilot/inventory` (`lib/copilot/inventory-assistant.ts`)
- Margin assistant: `GET /api/v1/admin/copilot/margin?days=30` (`lib/copilot/margin.ts`)
- Customer-insight assistant: `GET /api/v1/admin/copilot/insights` (`lib/copilot/insights.ts`)
- Marketing assistant (draft only, never sends): `POST /api/v1/admin/copilot/marketing`
- AI cost + prompt versions: `GET /api/v1/admin/ai-cost`
- Inventory health + set-stock: `GET/POST /api/v1/admin/inventory`

Every assistant returns a `sources` map making each metric traceable to its query, and reports
missing inputs honestly (e.g. margin → `no_cost_price_data`) instead of fabricating values.

## Approval Centre (`ApprovalRequest`)
Fields: action, reason, dataSource, riskLevel, createdBy, requiredApprover, status, decidedBy,
decidedAt, executed, payload — with an `AuditLog` trail. High-risk actions never auto-execute.
Create/list: `GET/POST /api/v1/admin/approvals`; decide/execute (two separate steps):
`POST /api/v1/admin/approvals/[id]` `{ op: 'approve' | 'reject' | 'execute' }`. Referral-reward
requests and customer compensation flow through here (action `compensation`).
