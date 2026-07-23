# ADMIN CONTENT COVERAGE MATRIX — 9CH / Fádé

Statuses: `Connected` · `Partially connected` · `Hard-coded` · `Missing` · `Broken` ·
`Duplicate` · `Developer-only` · `Not applicable`.

Updated continuously as modules land. This is the source of truth for "are we done?".

| Public route | Public component | Editable content / behaviour | Current source | Admin control | Status | Required action |
| --- | --- | --- | --- | --- | --- | --- |
| `/` | (all sections) | Section order + show/hide | **`HomepageSection` DB** | **`/admin/homepage`** | Connected | Reorder/hide any section from admin |
| `/` | `PermanentHeroSection` | Order + visibility (content = approved product) | `HomepageSection` + `lib/hero/*` | `/admin/homepage` | Connected | Hero internal copy stays motion/data-driven (by design) |
| `/` | `FeaturedProductsSection` | Eyebrow/title/subtitle/view-all copy (+ order/visibility) | Products DB (`isFeatured`) + **`HomepageSection` config** | **`/admin/homepage`** | Connected | Products auto-selected; copy now editable |
| `/` | `FragranceFamilies` | Header copy (+ order/visibility) | **`HomepageSection` config** (families list fixed) | **`/admin/homepage`** | Connected | Family list intentionally fixed |
| `/` | `BrandStorySection` | Eyebrow, quote, paragraphs, CTA | **`HomepageSection` config** | **`/admin/homepage`** | Connected | Rich default preserved until overridden |
| `/` | `ConciergeInvitation` | Heading, subtext, 2 CTAs | **`HomepageSection` config** | **`/admin/homepage`** | Connected | — |
| all | `header.tsx` | Primary/secondary nav labels + links | **`NavigationItem` DB** (fallback: consts) | **`/admin/navigation`** | Connected | Verify reorder + external links after migration |
| all | `announcement-bar.tsx` | Text, secondary text, link, visibility | **`SiteSetting` DB** (fallback: defaults) | **`/admin/settings`** | Connected | — |
| all | `footer.tsx` + `SocialLinks` | Newsletter copy, columns, copyright, payment note, socials | **`SiteSetting` + `NavigationItem` DB** | **`/admin/settings` + `/admin/navigation`** | Connected | Column titles still fixed labels (minor) |
| all | `layout.tsx` `generateMetadata` | Site name, default SEO title/desc, OG image | **`SiteSetting` DB** (fallback: defaults) | **`/admin/settings`** | Connected | Favicon still static (low priority) |
| `/journal` | `journal/page.tsx` | Article list, featured pick, order | **`Story` DB** (fallback: static array) | **`/admin/stories`** | Connected | Apply migration + run `scripts/seed-stories.ts` on dev |
| `/journal/[slug]` | `journal/[slug]/page.tsx` | Title, blocks, cover, related products, SEO, publish/schedule | **`Story` + `StoryBlock` + `StoryProduct` DB** | **`/admin/stories/[id]/edit`** | Connected | Verify create→publish→visible after migration |
| `/shop`, `/category/[slug]` | product grid | Products, filters, sort | Products DB | Product admin | Connected | Verify explicit merch ordering |
| `/product/[slug]` | PDP | Name, media, price, specs, related | Product DB (`ProductMedia`/`Variant`) | Product editor | Connected | Verify media ordering + related-story relation |
| `/collections`, `/collections/[brand]` | collection pages | Collection meta, members, order | `Collection` DB | Collections admin | Connected | Verify image/mobile image + manual ordering |
| `/about` | `about/page.tsx` | Body copy, images, SEO, publish window | **`Page` + `PageBlock` DB** (static fallback) | **`/admin/pages` (`content:manage`)** | Connected | Apply migration + run `scripts/seed-pages.ts` on dev |
| `/faq`, `/help/*` | pages | Q&A, help content, SEO, publish window | **`Page` + `PageBlock` DB** (static fallback) | **`/admin/pages` (`content:manage`)** | Connected | Apply migration + run `scripts/seed-pages.ts` on dev |
| `/privacy`, `/terms` | pages | Legal copy | Hard-coded | None | Hard-coded (acceptable) | Optional Page CMS (legal = low priority) |
| `/drops` | `drops/page.tsx` | Drop/launch content | `Campaign` + products DB | `/admin/campaigns` (`marketing:manage`) | Connected | Scheduled campaign banner, CTA, coupon and linked products |
| `/help/contact` | contact form | Submissions | **`FormSubmission` DB** + email notification | **`/admin/enquiries` (`support:manage`)** | Connected | Search/status/notes/spam/export; verify after migration |
| newsletter block | footer/newsletter | Subscribe, campaign content | DB + admin | Newsletter admin | Connected | — |
| transactional email | `emails/*` | Subject/body templates | `EmailTemplate` DB with code fallback | `/admin/email-templates` (`settings:manage`) | Connected | Safe fixed catalogue and whitelisted variables |
| reviews | PDP tabs | Customer reviews + moderation | Reviews DB + `api/v1/admin/reviews` | **`/admin/reviews` (`content:manage`)** | Connected | Approve/reject with status tabs + counts; reported reviews float to top; audited |
| feature toggles | homepage/hero | Section/feature visibility (view + source) | `FeatureFlag` DB + `FEATURE_FLAGS` env | **`/admin/feature-flags` (`settings:manage`)** | Connected | Read-only by design; env-driven, financial/hero flags owner-controlled |
| admin governance | — | Audit log of admin actions | `AuditLog` DB + `api/v1/admin/audit` | **`/admin/audit` (`audit:view`)** | Connected | Filter by action/target/actor, paginated, read-only |
| customers | `/admin/customers` | Customer records, tags, notes, segment | User/order DB | `/admin/customers` (`customers:view`; mutations `support:manage`) | Connected | Search, segment filter, spend/order summary and audited updates |
| users/roles | `/admin/users` | Users + **admin role assignment** | DB + page | **`/admin/users` (`users:manage`)** | Connected | Assign Super/Content/Product/Order/Marketing/Analyst |
| admin access control | every `/admin/*` page + **all admin APIs** | Who can view/do what | **`AdminRole` + `lib/authz`** | Layout + capability guards on every admin API | Connected | Extended to `app/api/admin/*` + `app/api/v1/admin/*` (30 routes) |
| media (all) | products/stories/homepage imagery | Upload/reuse/alt/caption/delete-protection | **`MediaAsset` DB** | **`/admin/media`** | Connected | Local-disk uploads in dev; prod needs a blob provider |

**Open counts (to drive to zero on non-N/A rows):**
Hard-coded: 0 · Partially connected: 0 · Missing: 0 · Connected: 28.

_Sessions: (1) Journal; (2) navigation + announcement bar + footer + SEO defaults; (3) homepage
sections; (4) media library; (5) audit-log + feature-flag cockpits; (6) reviews moderation;
(7) static Pages CMS + enquiries inbox; (8) publishing/media integration and growth controls.
Legal pages (privacy/terms) remain intentionally static and acceptable._
