// lib/pdp/policy.ts
// SINGLE SOURCE OF TRUTH for the delivery & returns copy shown on the PDP. Both the near-cart
// summary and the detailed FAQ accordion read from here, so return periods / shipping rules can
// never contradict each other across components (a requirement of the brief).
//
// Shipping numbers come from `lib/config/commerce` (owner-configurable). The returns window is
// defined here once; if the business wants it configurable, promote it to commerce config.
import { getCommerceConfig } from "@/lib/config/commerce"
import { formatPrice } from "@/lib/format"

export const RETURNS_WINDOW_DAYS = 7

// Fallbacks mirror the schema defaults in lib/env.ts. Used only if commerce config can't be read
// (e.g. a misconfigured env in local dev) so the PDP degrades gracefully instead of crashing,
// the purchase area must stay functional even when a dependency fails.
const FALLBACK_FREE_SHIPPING_NGN = 500_000
const FALLBACK_FLAT_SHIPPING_NGN = 2_500

function readShipping(): { freeShippingThreshold: number; flatShippingFee: number } {
  try {
    const { shipping } = getCommerceConfig()
    return { freeShippingThreshold: shipping.freeShippingThreshold, flatShippingFee: shipping.flatShippingFee }
  } catch {
    return { freeShippingThreshold: FALLBACK_FREE_SHIPPING_NGN, flatShippingFee: FALLBACK_FLAT_SHIPPING_NGN }
  }
}

export interface PdpPolicy {
  freeShippingThresholdNGN: number
  flatShippingFeeNGN: number
  returnsWindowDays: number
  /** Structured Q&A pairs reused verbatim by the FAQ accordion AND FAQ structured data. */
  faqs: { q: string; a: string }[]
  shippingSummary: string
  returnsSummary: (returnEligible: boolean) => string
}

export function getPdpPolicy(): PdpPolicy {
  const shipping = readShipping()
  const freeThreshold = shipping.freeShippingThreshold
  const flat = shipping.flatShippingFee

  const shippingSummary =
    flat > 0
      ? `Flat ${formatPrice(flat)} nationwide delivery, free over ${formatPrice(freeThreshold)}.`
      : `Free nationwide delivery over ${formatPrice(freeThreshold)}.`

  const returnsSummary = (returnEligible: boolean) =>
    returnEligible
      ? `Eligible for return within ${RETURNS_WINDOW_DAYS} days if sealed and unused.`
      : `This item is not eligible for return once dispatched.`

  return {
    freeShippingThresholdNGN: freeThreshold,
    flatShippingFeeNGN: flat,
    returnsWindowDays: RETURNS_WINDOW_DAYS,
    shippingSummary,
    returnsSummary,
    faqs: [
      {
        q: "How long does delivery take?",
        a: "Lagos deliveries typically arrive in 1–3 business days; other states in 2–5 business days after dispatch. You receive tracking as soon as your order ships.",
      },
      {
        q: "Where do you deliver?",
        a: "We deliver nationwide across Nigeria. Delivery times vary by state and courier availability.",
      },
      {
        q: "What are the shipping charges?",
        a: shippingSummary,
      },
      {
        q: "Which payment methods can I use?",
        a: "Payments are processed securely through Paystack: cards, bank transfer and USSD are supported.",
      },
      {
        q: "What is your return policy?",
        a: `Eligible items can be returned within ${RETURNS_WINDOW_DAYS} days of delivery if the bottle is sealed and unused. Fragrance is a personal product, so opened bottles cannot be returned for hygiene reasons unless faulty.`,
      },
      {
        q: "Can I exchange or cancel an order?",
        a: "Orders can be cancelled before dispatch. After dispatch, an eligible unopened item can be exchanged within the returns window subject to stock.",
      },
      {
        q: "My order arrived damaged, what now?",
        a: "Contact support within 48 hours of delivery with photos of the packaging and bottle. Verified damaged or faulty items are replaced or refunded at no cost to you.",
      },
      {
        q: "Can I return a sample?",
        a: "Samples and discovery vials are non-returnable once opened, as they are consumable trial sizes.",
      },
      {
        q: "How do I know a fragrance is authentic?",
        a: "Every bottle is inspected and sealed before dispatch. See the Authenticity & sourcing section on this page for the verification status of this specific product.",
      },
    ],
  }
}
