import { Skeleton } from "@/components/ui/skeleton"

const fieldLabel = "font-mono text-[10px] font-medium uppercase tracking-[0.24em] text-muted-foreground"

export function ShopFiltersSkeleton() {
  return (
    <div
      className="grid grid-cols-2 gap-x-6 gap-y-5 border-y border-border py-6 sm:grid-cols-3 lg:grid-cols-[1fr_1fr_1fr_0.8fr_0.8fr_1fr_auto]"
      aria-hidden="true"
    >
      {["Family", "Note", "Brand", "Min", "Max", "Sort"].map((label) => (
        <div key={label} className="space-y-1.5">
          <span className={fieldLabel}>{label}</span>
          <Skeleton className="h-11 w-full rounded-none" />
        </div>
      ))}
      <div className="col-span-2 space-y-1.5 sm:col-span-3 lg:col-span-1">
        <span className={`${fieldLabel} invisible select-none`}>Apply</span>
        <div className="flex h-11 items-center gap-4">
          <Skeleton className="h-11 w-24 rounded-none" />
          <Skeleton className="h-3 w-14 rounded-none" />
        </div>
      </div>
    </div>
  )
}
