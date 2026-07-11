import {
  Building2,
  User,
  Calendar,
  Globe,
  FlaskConical,
  Layers,
  Leaf,
  Sun,
  Clock,
  Sparkles,
  Hourglass,
  Wind,
  Gauge,
  Check,
  type LucideIcon,
} from "lucide-react";
import { ProvenanceChip } from "./provenance-chip";
import type { PdpProfileFacet } from "@/lib/pdp/types";

const ICONS: Record<string, LucideIcon> = {
  building: Building2,
  user: User,
  calendar: Calendar,
  globe: Globe,
  flask: FlaskConical,
  layers: Layers,
  leaf: Leaf,
  sun: Sun,
  clock: Clock,
  sparkles: Sparkles,
  hourglass: Hourglass,
  wind: Wind,
  gauge: Gauge,
  check: Check,
};

/**
 * At-a-glance fragrance profile. Renders only facets that have real values; each carries a truthful
 * provenance chip so subjective assessments are never presented as lab facts. Icons are decorative
 * (aria-hidden); the text label always carries the meaning.
 */
export function AtAGlance({ facets }: { facets: PdpProfileFacet[] }) {
  if (facets.length === 0) return null;
  return (
    <ul className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3 lg:grid-cols-4">
      {facets.map((f) => {
        const Icon = ICONS[f.icon] ?? Sparkles;
        return (
          <li key={f.label} className="flex items-start gap-3">
            <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary text-accent">
              <Icon className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {f.label}
              </p>
              <p
                className="truncate text-sm font-medium text-foreground"
                title={f.value}
              >
                {f.value}
              </p>
              <ProvenanceChip source={f.source} className="mt-1" />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
