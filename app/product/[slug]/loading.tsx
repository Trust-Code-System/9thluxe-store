// app/product/[slug]/loading.tsx
export default function LoadingProduct() {
  return (
    <section className="mx-auto grid max-w-5xl grid-cols-1 gap-8 p-6 md:grid-cols-2">
      <div className="aspect-square w-full animate-pulse rounded bg-muted" />
      <div className="space-y-3">
        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
        <div className="h-6 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-4 w-full animate-pulse rounded bg-muted" />
        <div className="h-10 w-40 animate-pulse rounded bg-muted" />
      </div>
    </section>
  );
}
