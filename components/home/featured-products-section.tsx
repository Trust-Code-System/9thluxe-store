"use client";

import { SectionHeader } from "@/components/ui/section-header";
import { ProductCard, type Product } from "@/components/ui/product-card";
import { Stagger, StaggerItem } from "@/components/motion";

interface FeaturedProductsSectionProps {
  products: Product[];
  /** Optional copy overrides from the homepage CMS; blank/undefined keeps the defaults. */
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  viewAllLabel?: string;
  viewAllHref?: string;
}

/**
 * "The Edit": featured perfumes on a day surface. The first product is
 * staged large; the rest follow in a supporting grid.
 */
export function FeaturedProductsSection({
  products,
  eyebrow,
  title,
  subtitle,
  viewAllLabel,
  viewAllHref,
}: FeaturedProductsSectionProps) {
  if (products.length === 0) return null;

  const [feature, ...rest] = products;
  const supporting = rest.slice(0, 4);

  return (
    <section
      data-surface="day"
      className="bg-background py-20 text-foreground lg:py-28"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow={eyebrow || "The edit"}
          title={title || "Currently coveted"}
          subtitle={
            subtitle ||
            "Hand-picked from the collection: the bottles our clients keep returning to."
          }
          viewAllHref={viewAllHref || "/shop"}
          viewAllLabel={viewAllLabel || "View all perfumes"}
        />

        <Stagger className="grid gap-x-6 gap-y-12 lg:grid-cols-2">
          {/* Feature stage */}
          <StaggerItem className="lg:row-span-2">
            <ProductCard
              product={feature}
              imageLoading="eager"
              className="[&_.line-clamp-2]:text-2xl [&>div:first-child]:aspect-[4/5]"
            />
          </StaggerItem>

          {/* Supporting grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:gap-x-6">
            {supporting.map((product) => (
              <StaggerItem key={product.id}>
                <ProductCard product={product} />
              </StaggerItem>
            ))}
          </div>
        </Stagger>
      </div>
    </section>
  );
}
