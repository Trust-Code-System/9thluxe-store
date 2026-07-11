import { MainLayout } from "@/components/layout/main-layout";
import { ProductGridSkeleton } from "@/components/ui/product-card-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { ShopFiltersSkeleton } from "@/components/shop/shop-filters-skeleton";

export function ShopPageLoading() {
  return (
    <MainLayout>
      {/* Night editorial header, mirrors /shop hero */}
      <section
        data-surface="night"
        className="grain relative bg-background text-foreground"
        aria-busy="true"
        aria-label="Loading shop"
      >
        <div className="container relative z-10 mx-auto max-w-[1200px] px-4 pb-12 pt-14 sm:px-6 lg:px-8 lg:pb-16 lg:pt-20">
          <Skeleton className="mx-auto h-2.5 w-28 rounded-none sm:mx-0" />
          <Skeleton className="mx-auto mt-5 h-12 w-64 max-w-full rounded-none sm:mx-0 md:h-14 md:w-80" />
          <Skeleton className="mx-auto mt-4 h-4 w-80 max-w-full rounded-none sm:mx-0" />
          <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.32em] text-muted-foreground/80">
            Curating the collection
            <span className="inline-flex w-6 justify-start" aria-hidden="true">
              <span className="animate-pulse">…</span>
            </span>
          </p>
        </div>
      </section>

      {/* Day commerce surface, mirrors filters + grid */}
      <section
        data-surface="day"
        className="bg-background py-10 text-foreground lg:py-14"
      >
        <div className="container mx-auto max-w-[1200px] space-y-8 px-4 sm:px-6 lg:px-8">
          <ShopFiltersSkeleton />

          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-36 rounded-none" />
          </div>

          <ProductGridSkeleton count={6} />
        </div>
      </section>
    </MainLayout>
  );
}
