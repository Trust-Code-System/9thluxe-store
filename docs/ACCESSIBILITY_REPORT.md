# Accessibility Report

Target: WCAG 2.2 AA where applicable. This reflects the state after the Olfactory
Atelier redesign.

## Addressed
- **Contrast:** Parchment/ink and ivory/ink exceed AA. `muted-foreground` darkened
  to keep secondary text ≥ 4.5:1. Amber reserved for emphasis, icons and large text.
- **Landmarks & headings:** pages use `header`/`main`/`footer` (via `MainLayout`) and a
  single `h1` with logical heading order.
- **Keyboard:** nav, cards, filters, cart controls and the concierge composer are
  focusable; visible focus rings via `focus-visible:ring-*` tokens.
- **Breadcrumb:** product page uses `nav[aria-label="Breadcrumb"]`.
- **Concierge:** conversation region is `aria-live="polite"` with `aria-busy` during
  loading; send button has an `sr-only` label; Enter submits, Shift+Enter newlines.
- **Reduced motion:** ambient hero motion and smooth scroll disabled via media query.
- **Images:** `next/image` with descriptive `alt`; decorative glows are `aria-hidden`.
- **Dialogs:** product gallery zoom uses Radix Dialog with a visually-hidden title.

## Known follow-ups
- Full automated axe pass + Playwright a11y assertions across breakpoints (not yet wired).
- Verify focus order inside the mobile nav drawer and cart quantity steppers on WebKit.
- Confirm 200% zoom reflow on the shop filter card and concierge composer.
- Audit color-only status on tier badges (add text labels — currently labelled).
