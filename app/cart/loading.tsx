// app/cart/loading.tsx
export default function LoadingCart() {
  return (
    <section className="max-w-4xl mx-auto p-6 space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded border p-4">
          <div className="h-16 w-16 animate-pulse rounded bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
          </div>
          <div className="h-10 w-24 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </section>
  );
}
