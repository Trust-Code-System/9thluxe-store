"use client";

import * as React from "react";
import {
  Sparkles,
  Loader2,
  X,
  ArrowUp,
  ArrowDown,
  Search,
  AlertTriangle,
  CheckCircle2,
  Info,
  Monitor,
  Smartphone,
} from "lucide-react";
import { ScentComposition } from "@/components/pdp/scent-composition";
import { matchIngredient, searchIngredients } from "@/lib/fragrance/normalize";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  Ingredient,
  ScentComposition as ScentCompositionData,
  TemplateId,
  NoteTier,
} from "@/lib/fragrance/types";

const TIERS: { key: NoteTier; label: string }[] = [
  { key: "top", label: "Top notes" },
  { key: "heart", label: "Heart notes" },
  { key: "base", label: "Base notes" },
];

const TEMPLATES: { id: TemplateId; label: string }[] = [
  { id: "vertical_note", label: "Vertical" },
  { id: "ingredient_environment", label: "Environment" },
  { id: "accord_spotlight", label: "Accord spotlight" },
  { id: "educational_grid", label: "Educational grid" },
];

const FAMILIES = [
  "CITRUS",
  "WOODY",
  "FLORAL",
  "ORIENTAL",
  "FRESH",
  "SPICY",
  "GOURMAND",
];

interface InitialData {
  notesTop: string;
  notesHeart: string;
  notesBase: string;
  mainAccords: string;
  fragranceFamily: string;
  olfactoryDesc: string;
  moodTags: string;
  season: string;
  climate: string;
  timeOfDay: string;
  occasion: string;
  bottleImage: string | null;
  productName: string;
  publishStatus: string;
  /** Previously saved template override, or "" for none. */
  scentTemplate: string;
}

const TEMPLATE_IDS: TemplateId[] = [
  "vertical_note",
  "ingredient_environment",
  "accord_spotlight",
  "educational_grid",
];
function asTemplateId(v: string): TemplateId | null {
  return (TEMPLATE_IDS as string[]).includes(v) ? (v as TemplateId) : null;
}

function split(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * The admin "Generate Scent Story" workflow. Lets an administrator enter and reorder notes, move them
 * between tiers, search the ingredient library, correct spellings, set the scent metadata, generate a
 * reviewable composition draft (matched ingredients, prominence, timeline, template recommendation,
 * issue queue), preview desktop and mobile, pick a template, and finally save as draft or publish.
 * Nothing is auto-published; note fields are mirrored into hidden inputs for the parent form action.
 */
export function ScentStoryComposer({ initial }: { initial: InitialData }) {
  const [tiers, setTiers] = React.useState<Record<NoteTier, string[]>>({
    top: split(initial.notesTop),
    heart: split(initial.notesHeart),
    base: split(initial.notesBase),
  });
  const [accords, setAccords] = React.useState<string[]>(
    split(initial.mainAccords),
  );
  const [family, setFamily] = React.useState(initial.fragranceFamily || "");
  const [olfactoryDesc, setOlfactoryDesc] = React.useState(
    initial.olfactoryDesc,
  );
  const [moods, setMoods] = React.useState(initial.moodTags);
  const [season, setSeason] = React.useState(initial.season);
  const [climate, setClimate] = React.useState(initial.climate);
  const [timeOfDay, setTimeOfDay] = React.useState(initial.timeOfDay);
  const [occasion, setOccasion] = React.useState(initial.occasion);

  const [draft, setDraft] = React.useState<ScentCompositionData | null>(null);
  const [suggestedAccords, setSuggestedAccords] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [templateOverride, setTemplateOverride] =
    React.useState<TemplateId | null>(asTemplateId(initial.scentTemplate));
  const [viewport, setViewport] = React.useState<"desktop" | "mobile">(
    "desktop",
  );

  const addNote = (tier: NoteTier, value: string) => {
    const v = value.trim();
    if (!v) return;
    setTiers((t) => {
      const exists = Object.values(t)
        .flat()
        .some((n) => n.toLowerCase() === v.toLowerCase());
      if (exists) return t;
      return { ...t, [tier]: [...t[tier], v] };
    });
    setDraft(null);
  };
  const removeNote = (tier: NoteTier, idx: number) =>
    setTiers((t) => ({ ...t, [tier]: t[tier].filter((_, i) => i !== idx) }));
  const reorderNote = (tier: NoteTier, idx: number, dir: -1 | 1) =>
    setTiers((t) => {
      const arr = [...t[tier]];
      const j = idx + dir;
      if (j < 0 || j >= arr.length) return t;
      [arr[idx], arr[j]] = [arr[j], arr[idx]];
      return { ...t, [tier]: arr };
    });
  const moveNote = (from: NoteTier, idx: number, to: NoteTier) => {
    if (from === to) return;
    setTiers((t) => {
      const value = t[from][idx];
      if (value == null) return t;
      return {
        ...t,
        [from]: t[from].filter((_, i) => i !== idx),
        [to]: [...t[to], value],
      };
    });
  };

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/scent-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          top: tiers.top,
          heart: tiers.heart,
          base: tiers.base,
          accords,
          family: family || null,
          olfactoryDesc: olfactoryDesc || null,
          moods: split(moods),
          season: season || null,
          climate: climate || null,
          timeOfDay: timeOfDay || null,
          occasion: occasion || null,
        }),
      });
      if (!res.ok)
        throw new Error(
          (await res.json().catch(() => ({})))?.error || "Generation failed",
        );
      const json = await res.json();
      setDraft(json.composition as ScentCompositionData);
      setSuggestedAccords(json.suggestedAccords ?? []);
      setTemplateOverride(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  const activeTemplate: TemplateId | undefined =
    templateOverride ?? draft?.recommendedTemplate;

  return (
    <div className="space-y-6 rounded-3xl border border-border bg-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Sparkles className="h-4 w-4 text-accent" /> Scent story
          </h3>
          <p className="text-sm text-muted-foreground">
            Enter the fragrance notes, generate a reviewable visual composition,
            then save as draft or publish.
          </p>
        </div>
        <button
          type="button"
          onClick={generate}
          disabled={loading}
          className="btn inline-flex items-center gap-2"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          Generate Scent Story
        </button>
      </div>

      {/* Note tiers */}
      <div className="grid gap-4 lg:grid-cols-3">
        {TIERS.map((tier) => (
          <TierEditor
            key={tier.key}
            tier={tier.key}
            label={tier.label}
            notes={tiers[tier.key]}
            onAdd={(v) => addNote(tier.key, v)}
            onRemove={(i) => removeNote(tier.key, i)}
            onReorder={(i, d) => reorderNote(tier.key, i, d)}
            onMove={(i, to) => moveNote(tier.key, i, to)}
          />
        ))}
      </div>

      {/* Library search */}
      <LibrarySearch onPick={(ing, tier) => addNote(tier, ing.displayName)} />

      {/* Accords */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Main accords
        </label>
        <TagInput
          values={accords}
          onChange={(next) => {
            setAccords(next);
            setDraft(null);
          }}
          placeholder="Type an accord and press Enter (e.g. woody)"
        />
        {suggestedAccords.length > 0 && accords.length === 0 && (
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>Suggested:</span>
            {suggestedAccords.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() =>
                  setAccords((prev) => (prev.includes(a) ? prev : [...prev, a]))
                }
                className="rounded-full border border-dashed border-accent/50 px-2.5 py-0.5 capitalize text-accent hover:bg-accent/10"
              >
                + {a}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Scent metadata */}
      <div className="grid gap-4 md:grid-cols-2">
        <SelectField
          label="Fragrance family"
          value={family}
          onChange={setFamily}
          options={["", ...FAMILIES]}
        />
        <TextField
          label="Moods (comma-separated)"
          value={moods}
          onChange={setMoods}
          placeholder="confident, warm"
        />
        <TextField
          label="Season"
          value={season}
          onChange={setSeason}
          placeholder="Autumn, Winter"
        />
        <TextField
          label="Climate"
          value={climate}
          onChange={setClimate}
          placeholder="Cool evenings"
        />
        <TextField
          label="Time of day"
          value={timeOfDay}
          onChange={setTimeOfDay}
          placeholder="Evening"
        />
        <TextField
          label="Occasion"
          value={occasion}
          onChange={setOccasion}
          placeholder="Evening, Formal"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Editorial scent description
        </label>
        <textarea
          value={olfactoryDesc}
          onChange={(e) => setOlfactoryDesc(e.target.value)}
          rows={3}
          className="input w-full"
          placeholder="A smoky rose over resinous oud..."
        />
      </div>

      {error && (
        <p className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4" /> {error}
        </p>
      )}

      {/* Draft review + preview */}
      {draft && (
        <DraftReview
          draft={draft}
          activeTemplate={activeTemplate}
          templateOverride={templateOverride}
          onTemplate={setTemplateOverride}
          viewport={viewport}
          onViewport={setViewport}
          bottleImage={initial.bottleImage}
          productName={initial.productName}
        />
      )}

      {/* Hidden inputs mirror state into the parent form action. */}
      <input type="hidden" name="notesTop" value={tiers.top.join(", ")} />
      <input type="hidden" name="notesHeart" value={tiers.heart.join(", ")} />
      <input type="hidden" name="notesBase" value={tiers.base.join(", ")} />
      <input type="hidden" name="mainAccords" value={accords.join(", ")} />
      <input type="hidden" name="fragranceFamily" value={family} />
      <input type="hidden" name="olfactoryDesc" value={olfactoryDesc} />
      <input type="hidden" name="moodTags" value={moods} />
      <input type="hidden" name="season" value={season} />
      <input type="hidden" name="climate" value={climate} />
      <input type="hidden" name="timeOfDay" value={timeOfDay} />
      <input type="hidden" name="occasion" value={occasion} />
      <input
        type="hidden"
        name="scentTemplate"
        value={templateOverride ?? ""}
      />

      <div className="flex flex-wrap gap-3 border-t border-border pt-5">
        <button
          type="submit"
          name="publishStatus"
          value="DRAFT"
          className="btn-outline"
        >
          Save as draft
        </button>
        <button
          type="submit"
          name="publishStatus"
          value="PUBLISHED"
          className="btn"
        >
          Publish
        </button>
        <span className="self-center text-xs text-muted-foreground">
          Current status: {initial.publishStatus}
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------------------------------ */

function TierEditor({
  tier,
  label,
  notes,
  onAdd,
  onRemove,
  onReorder,
  onMove,
}: {
  tier: NoteTier;
  label: string;
  notes: string[];
  onAdd: (v: string) => void;
  onRemove: (i: number) => void;
  onReorder: (i: number, dir: -1 | 1) => void;
  onMove: (i: number, to: NoteTier) => void;
}) {
  const [value, setValue] = React.useState("");
  const otherTiers = (["top", "heart", "base"] as NoteTier[]).filter(
    (t) => t !== tier,
  );
  return (
    <div className="rounded-2xl border border-border bg-background/40 p-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
        {label}
      </p>
      <ul className="space-y-1.5">
        {notes.map((note, i) => {
          const m = matchIngredient(note);
          return (
            <li
              key={`${note}-${i}`}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-2 py-1.5 text-sm"
            >
              <MatchDot status={m.status} />
              <span className="min-w-0 flex-1 truncate" title={note}>
                {note}
                {m.status === "corrected" && m.suggestion && (
                  <span className="ml-1 text-xs text-amber-600">
                    → {m.suggestion}?
                  </span>
                )}
              </span>
              <div className="flex shrink-0 items-center gap-0.5 text-muted-foreground">
                <IconBtn label="Move up" onClick={() => onReorder(i, -1)}>
                  <ArrowUp className="h-3.5 w-3.5" />
                </IconBtn>
                <IconBtn label="Move down" onClick={() => onReorder(i, 1)}>
                  <ArrowDown className="h-3.5 w-3.5" />
                </IconBtn>
                {otherTiers.map((to) => (
                  <IconBtn
                    key={to}
                    label={`Move to ${to}`}
                    onClick={() => onMove(i, to)}
                  >
                    <span className="text-[10px] font-semibold uppercase">
                      {to[0]}
                    </span>
                  </IconBtn>
                ))}
                <IconBtn label="Remove" onClick={() => onRemove(i)}>
                  <X className="h-3.5 w-3.5" />
                </IconBtn>
              </div>
            </li>
          );
        })}
      </ul>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onAdd(value);
          setValue("");
        }}
        className="mt-2 flex gap-1.5"
      >
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="input h-9 flex-1 text-sm"
          placeholder="Add a note..."
          aria-label={`Add a ${tier} note`}
        />
        <button type="submit" className="btn-outline h-9 px-3 text-sm">
          Add
        </button>
      </form>
    </div>
  );
}

function MatchDot({
  status,
}: {
  status: ReturnType<typeof matchIngredient>["status"];
}) {
  const map = {
    matched: { color: "bg-emerald-500", title: "Matched to library" },
    corrected: { color: "bg-amber-500", title: "Possible correction" },
    ambiguous: { color: "bg-orange-500", title: "Ambiguous" },
    unknown: { color: "bg-rose-500", title: "Not in library" },
  }[status];
  return (
    <span
      className={cn("h-2 w-2 shrink-0 rounded-full", map.color)}
      title={map.title}
      aria-label={map.title}
    />
  );
}

function IconBtn({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="grid h-6 w-6 place-items-center rounded transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {children}
    </button>
  );
}

function LibrarySearch({
  onPick,
}: {
  onPick: (ing: Ingredient, tier: NoteTier) => void;
}) {
  const [q, setQ] = React.useState("");
  const [tier, setTier] = React.useState<NoteTier>("heart");
  const results = React.useMemo(
    () => (q.trim() ? searchIngredients(q, 8) : []),
    [q],
  );
  return (
    <div className="rounded-2xl border border-dashed border-border p-4">
      <div className="mb-2 flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">
          Search the ingredient library
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="input h-9 flex-1 text-sm"
          placeholder="oud, vanilla, bergamot..."
          aria-label="Search ingredient library"
        />
        <Select
          value={tier}
          onValueChange={(value) => setTier(value as NoteTier)}
        >
          <SelectTrigger className="h-9 w-36 text-sm" aria-label="Add to tier">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="top">to Top</SelectItem>
            <SelectItem value="heart">to Heart</SelectItem>
            <SelectItem value="base">to Base</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {results.length > 0 && (
        <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
          {results.map((ing) => (
            <li key={ing.id}>
              <button
                type="button"
                onClick={() => {
                  onPick(ing, tier);
                  setQ("");
                }}
                className="flex w-full items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-1.5 text-left text-sm hover:border-accent/50"
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: ing.color }}
                />
                <span className="font-medium">{ing.displayName}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {ing.shortDescription}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DraftReview({
  draft,
  activeTemplate,
  templateOverride,
  onTemplate,
  viewport,
  onViewport,
  bottleImage,
  productName,
}: {
  draft: ScentCompositionData;
  activeTemplate: TemplateId | undefined;
  templateOverride: TemplateId | null;
  onTemplate: (t: TemplateId | null) => void;
  viewport: "desktop" | "mobile";
  onViewport: (v: "desktop" | "mobile") => void;
  bottleImage: string | null;
  productName: string;
}) {
  return (
    <div className="space-y-4 rounded-2xl border border-border bg-background/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {draft.requiresManualReview ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-3.5 w-3.5" /> Requires manual review
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" /> Ready to review
            </span>
          )}
          <span className="text-xs text-muted-foreground">
            Confidence: {draft.confidence}
          </span>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border p-0.5">
          <button
            type="button"
            onClick={() => onViewport("desktop")}
            aria-label="Preview desktop"
            className={cn(
              "grid h-7 w-8 place-items-center rounded",
              viewport === "desktop" && "bg-secondary",
            )}
          >
            <Monitor className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onViewport("mobile")}
            aria-label="Preview mobile"
            className={cn(
              "grid h-7 w-8 place-items-center rounded",
              viewport === "mobile" && "bg-secondary",
            )}
          >
            <Smartphone className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Issues queue */}
      {draft.issues.length > 0 && (
        <ul className="space-y-1.5">
          {draft.issues.map((issue, i) => (
            <li
              key={i}
              className="flex items-start gap-2 rounded-lg bg-secondary/50 px-3 py-2 text-xs"
            >
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span>{issue.message}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Template picker */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">
          Template:
        </span>
        {TEMPLATES.map((t) => {
          const isActive = activeTemplate === t.id;
          const isRecommended = draft.recommendedTemplate === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() =>
                onTemplate(templateOverride === t.id ? null : t.id)
              }
              className={cn(
                "rounded-full border px-3 py-1 text-xs transition-colors",
                isActive
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border hover:bg-secondary",
              )}
            >
              {t.label}
              {isRecommended && (
                <span className="ml-1 text-[10px] opacity-70">
                  (recommended)
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Live preview */}
      <div
        className={cn(
          "mx-auto rounded-2xl border border-border bg-card p-4 transition-all",
          viewport === "mobile" ? "max-w-[390px]" : "max-w-full",
        )}
      >
        <ScentComposition
          composition={draft}
          bottleImage={bottleImage}
          productName={productName}
          productId="admin-preview"
          template={activeTemplate}
          forceViewport={viewport}
        />
      </div>

      <p className="text-[11px] text-muted-foreground">
        Prominence bands are perceived scent character, not chemical
        formulation. Ingredient art is house-generated; the real uploaded bottle
        image is always used for the product.
      </p>
    </div>
  );
}

/* small field helpers ---------------------------------------------------------------------------- */

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="space-y-1.5 text-sm">
      <span className="font-medium text-foreground">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input w-full"
        placeholder={placeholder}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="space-y-1.5 text-sm">
      <span className="font-medium text-foreground">{label}</span>
      <Select
        value={value || "__none__"}
        onValueChange={(next) => onChange(next === "__none__" ? "" : next)}
      >
        <SelectTrigger className="w-full" aria-label={label}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option || "__none__"} value={option || "__none__"}>
              {option === ""
                ? "None"
                : option.charAt(0) + option.slice(1).toLowerCase()}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/** Simple comma-tag input for accords. */
function TagInput({
  values,
  onChange,
  placeholder,
}: {
  values: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  const [value, setValue] = React.useState("");
  const add = () => {
    const v = value.trim();
    if (v && !values.some((x) => x.toLowerCase() === v.toLowerCase()))
      onChange([...values, v]);
    setValue("");
  };
  return (
    <div className="rounded-lg border border-border bg-background/40 p-2">
      {values.length > 0 && (
        <ul className="mb-2 flex flex-wrap gap-1.5">
          {values.map((v, i) => (
            <li
              key={`${v}-${i}`}
              className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-sm capitalize"
            >
              {v}
              <button
                type="button"
                aria-label={`Remove ${v}`}
                onClick={() => onChange(values.filter((_, j) => j !== i))}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add();
          }
        }}
        onBlur={add}
        className="input h-9 w-full text-sm"
        placeholder={placeholder}
      />
    </div>
  );
}
