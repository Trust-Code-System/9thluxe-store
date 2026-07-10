# Analytics Events Contract

Source of truth: [`lib/analytics/events.ts`](../lib/analytics/events.ts). Events are typed and
Zod-validated. **Operational** events (payments/orders) are separated from **marketing** and
**concierge** analytics so they can be routed to different sinks under different consent rules.

Common fields on every event: `requestId?`, `sessionId?`, `userId?`, `ts?` (ISO-8601).

| Event | Category | Key fields |
|-------|----------|-----------|
| `product_viewed` | operational | `productId`, `slug?` |
| `search_submitted` | operational | `query`, `resultCount?` |
| `search_result_clicked` | operational | `query`, `productId`, `position?` |
| `filter_applied` | operational | `filters` |
| `quiz_started` | concierge | `quizVersion` |
| `quiz_completed` | concierge | `quizVersion`, `sessionId` |
| `recommendation_produced` | concierge | `requestId`, `productIds[]` |
| `recommendation_clicked` | concierge | `productId` |
| `recommendation_rejected` | concierge | `productId`, `reason?` |
| `product_compared` | operational | `productIds[]` |
| `sample_added` | operational | `productId`, `variantId?` |
| `product_added_to_cart` | operational | `productId`, `quantity` |
| `checkout_started` | operational | `cartTotalNGN` |
| `payment_verified` | operational | `orderId`, `reference` |
| `order_completed` | operational | `orderId`, `totalNGN` |
| `back_in_stock_requested` | operational | `productId` |
| `gift_concierge_completed` | concierge | `sessionId` |
| `layering_combination_saved` | concierge | `productIds[]` |
| `review_submitted` | operational | `productId`, `rating` |
| `support_escalated` | operational | `conversationId` |

Consent rules:
- Operational events may be recorded for fraud/ops/accounting regardless of marketing consent.
- Marketing/concierge personalization events tied to an identifiable user require marketing consent;
  otherwise store anonymized/aggregated only.
