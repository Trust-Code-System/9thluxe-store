// app/loading.tsx
import { ProductCardSkeleton } from "@/components/ui/product-card-skeleton";

export default function Loading() {
  return (
    <section>
      <div className="mb-4 h-6 w-48 animate-pulse rounded bg-muted" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </section>
  );
}
