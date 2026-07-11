import type { HeroNoteArrangement } from "@/lib/hero/types"

const TIERS: { key: keyof HeroNoteArrangement; label: string }[] = [
  { key: "top", label: "Top" },
  { key: "heart", label: "Heart" },
  { key: "base", label: "Base" },
]

/**
 * Static, always-readable summary of the featured fragrance's approved notes, grouped by tier. This
 * is the accessible source of truth: the perfume can be fully understood here without watching any
 * animation. Empty tiers are omitted rather than padded with placeholder notes.
 */
export function NoteArrangement({ arrangement }: { arrangement: HeroNoteArrangement }) {
  const visible = TIERS.filter(({ key }) => arrangement[key].length > 0)
  if (visible.length === 0) return null

  return (
    <dl className="mt-10 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-3">
      {visible.map(({ key, label }) => (
        <div key={key}>
          <dt className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            {label}
          </dt>
          <dd className="mt-2 text-sm leading-relaxed text-foreground/85">
            {arrangement[key].map((asset) => asset.name).join(", ")}
          </dd>
        </div>
      ))}
    </dl>
  )
}
