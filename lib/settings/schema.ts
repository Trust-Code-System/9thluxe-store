// lib/settings/schema.ts
// The single source of truth for editable site settings. Only keys defined here can be read or
// written; anything else is ignored. This deliberately avoids an open-ended key/value editor.

export type SettingType = "text" | "textarea" | "boolean" | "url" | "email" | "image"

export interface SettingDef {
  key: string
  label: string
  type: SettingType
  group: string
  default: string | boolean
  help?: string
  /** For url/email/image fields, allow empty (optional). Text fields validate non-empty only if required. */
  required?: boolean
}

export const SETTING_GROUPS = [
  "Brand & SEO",
  "Announcement bar",
  "Social links",
  "Footer",
  "Contact",
] as const

export const SETTINGS: SettingDef[] = [
  // Brand & SEO
  { key: "siteName", label: "Site name", type: "text", group: "Brand & SEO", default: "Fádé Essence" },
  { key: "tagline", label: "Tagline", type: "text", group: "Brand & SEO", default: "Luxury Perfumes" },
  { key: "brandDescription", label: "Brand description", type: "textarea", group: "Brand & SEO", default: "Discover premium luxury perfumes at Fádé Essence. Curated collection of timeless fragrances and sophistication." },
  { key: "seoDefaultTitle", label: "Default SEO title", type: "text", group: "Brand & SEO", default: "Fádé Essence | Luxury Perfumes", help: "Used as the homepage title and template default." },
  { key: "seoDefaultDescription", label: "Default meta description", type: "textarea", group: "Brand & SEO", default: "Discover premium luxury perfumes at Fádé Essence." },
  { key: "seoOgImage", label: "Default social share image", type: "image", group: "Brand & SEO", default: "/og-image.jpg", help: "Path or URL to the default Open Graph / Twitter image." },

  // Announcement bar
  { key: "announcementEnabled", label: "Show announcement bar", type: "boolean", group: "Announcement bar", default: true },
  { key: "announcementText", label: "Announcement text", type: "text", group: "Announcement bar", default: "Complimentary delivery on qualifying orders" },
  { key: "announcementSecondaryText", label: "Secondary text (desktop)", type: "text", group: "Announcement bar", default: "Discover the collection" },
  { key: "announcementLink", label: "Announcement link", type: "text", group: "Announcement bar", default: "/shop", help: "Where the bar links to (e.g. /shop)." },

  // Social links (consumed by the footer SocialLinks component)
  { key: "instagramUrl", label: "Instagram URL", type: "url", group: "Social links", default: "https://www.instagram.com/fadeessence1?igsh=MW8zbHV4cXF5ZTQycA%3D%3D&utm_source=qr" },
  { key: "xUrl", label: "X (Twitter) URL", type: "url", group: "Social links", default: "https://x.com/fade_essence?s=21" },
  { key: "whatsappUrl", label: "WhatsApp URL", type: "url", group: "Social links", default: "https://wa.me/2348160591348" },
  { key: "tiktokUrl", label: "TikTok URL", type: "url", group: "Social links", default: "https://www.tiktok.com/@coming_soonnn_?_r=1&_t=ZS-922wBNzhnGK" },
  { key: "facebookUrl", label: "Facebook URL", type: "url", group: "Social links", default: "https://www.facebook.com/profile.php?id=61585007902299&mibextid=wwXIfr" },

  // Footer
  { key: "newsletterHeading", label: "Newsletter heading", type: "text", group: "Footer", default: "Leave a trail." },
  { key: "newsletterSubtext", label: "Newsletter subtext", type: "textarea", group: "Footer", default: "New arrivals, limited drops and notes from the atelier. Sent occasionally, written carefully." },
  { key: "footerPaymentNote", label: "Payment note", type: "text", group: "Footer", default: "Secure payment via Paystack" },
  { key: "copyrightText", label: "Copyright text", type: "text", group: "Footer", default: "Fádé Essence · Lagos, Nigeria", help: "The year is prefixed automatically." },

  // Contact
  { key: "contactEmail", label: "Contact email", type: "email", group: "Contact", default: "" },
  { key: "supportEmail", label: "Support email", type: "email", group: "Contact", default: "" },
  { key: "phone", label: "Phone number", type: "text", group: "Contact", default: "" },
  { key: "address", label: "Address", type: "text", group: "Contact", default: "Lagos, Nigeria · Nationwide delivery" },
]

export const SETTINGS_BY_KEY: Record<string, SettingDef> = Object.fromEntries(
  SETTINGS.map((s) => [s.key, s])
)

export type SettingsValues = Record<string, string | boolean>

/** All defaults as a plain object. */
export function defaultSettings(): SettingsValues {
  const out: SettingsValues = {}
  for (const s of SETTINGS) out[s.key] = s.default
  return out
}

function isSafeUrl(url: string): boolean {
  if (!url) return true // empty allowed for optional fields
  if (url.startsWith("/")) return true
  try {
    const u = new URL(url)
    return u.protocol === "http:" || u.protocol === "https:"
  } catch {
    return false
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Validate + coerce a single value for a known key. Returns { value } or { error }. */
export function validateSetting(
  key: string,
  raw: unknown
): { value: string | boolean } | { error: string } {
  const def = SETTINGS_BY_KEY[key]
  if (!def) return { error: `Unknown setting: ${key}` }

  if (def.type === "boolean") {
    return { value: Boolean(raw) }
  }

  const value = typeof raw === "string" ? raw.trim() : ""
  if (def.required && !value) return { error: `${def.label} is required` }

  if ((def.type === "url" || def.type === "image") && !isSafeUrl(value)) {
    return { error: `${def.label} must be a valid http(s) or site-relative URL` }
  }
  if (def.type === "email" && value && !EMAIL_RE.test(value)) {
    return { error: `${def.label} must be a valid email address` }
  }
  return { value }
}

/** Validate a partial patch. Returns cleaned values or the first error. */
export function validateSettingsPatch(
  patch: Record<string, unknown>
): { values: SettingsValues } | { error: string } {
  const values: SettingsValues = {}
  for (const [key, raw] of Object.entries(patch)) {
    if (!(key in SETTINGS_BY_KEY)) continue // silently drop unknown keys
    const result = validateSetting(key, raw)
    if ("error" in result) return { error: result.error }
    values[key] = result.value
  }
  return { values }
}
