# Fàdè Motion System

Motion is calm and editorial — it supports the content, never blocks it. All
animation uses `opacity` and `transform` only (no layout-animating properties).

## Timing
| Category | Duration | Examples |
|---|---|---|
| Micro-interaction | 140–240 ms | button/hover, nav underline, card lift |
| Component entrance | 300–500 ms | image zoom on hover, drawer transitions |
| Ambient hero | 6–12 s | floating scent particles (`animate-atelier-float`) |

## Patterns in use
- **Nav underline:** animated `after` width on hover/active (transform-safe).
- **Product/family/discovery cards:** subtle `-translate-y-1` lift + warm shadow; image `scale-105` on hover.
- **Hero:** static poster + slow amber glow + drifting particles; no video dependency.
- **Concierge:** typing dots (`animate-bounce`), amber pulse on the assistant avatar.

## Reduced motion
`@media (prefers-reduced-motion: reduce)` disables `animate-atelier-float` and
smooth scroll. Every animated surface remains fully legible and complete when
motion is off (nothing is revealed only via animation).

## Avoided
Scroll hijacking, pinned sections, cursor-followers, width/height/top/left
animation, and any motion that delays navigation or blocks keyboard use.
