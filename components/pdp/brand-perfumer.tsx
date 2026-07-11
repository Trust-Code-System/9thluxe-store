import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { SmartProductCard } from "./smart-product-card"
import type { PdpBrand, PdpPerfumer } from "@/lib/pdp/types"

/**
 * Brand & perfumer profiles. Renders only verified information: the brand name/country and the
 * brand's other available products; the perfumer name and their other products. Story/bio copy is
 * shown only when a real value exists, never AI-invented (columns are absent today; see backend R1).
 */
export function BrandPerfumer({ brand, perfumer }: { brand: PdpBrand | null; perfumer: PdpPerfumer | null }) {
  if (!brand && !perfumer) return null

  return (
    <div className="space-y-10">
      {brand && (
        <div>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="font-serif text-xl">{brand.name}</h3>
            <Link
              href={`/shop?brand=${encodeURIComponent(brand.name)}`}
              className="inline-flex items-center gap-1 text-sm text-accent hover:underline"
            >
              All {brand.name} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {brand.country && <p className="mt-1 text-sm text-muted-foreground">{brand.country}</p>}
          {brand.story && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{brand.story}</p>}
          {brand.otherProducts.length > 0 && (
            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {brand.otherProducts.map((card) => (
                <SmartProductCard key={card.id} card={card} />
              ))}
            </div>
          )}
        </div>
      )}

      {perfumer && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-accent">Perfumer</p>
          <h3 className="mt-1 font-serif text-xl">{perfumer.name}</h3>
          {perfumer.bio && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{perfumer.bio}</p>}
          {perfumer.otherProducts.length > 0 && (
            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {perfumer.otherProducts.map((card) => (
                <SmartProductCard key={card.id} card={card} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
