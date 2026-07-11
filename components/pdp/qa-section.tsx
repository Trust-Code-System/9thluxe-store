"use client";

import * as React from "react";
import { Search, MessageCircleQuestion } from "lucide-react";
import { trackPdp } from "@/lib/analytics/pdp-events";

const CATEGORIES = [
  "Authenticity",
  "Performance",
  "Delivery",
  "Packaging",
  "Similar perfumes",
  "Climate",
  "Occasion",
  "Sample availability",
  "Returns",
];

/**
 * Product Questions & Answers.
 *
 * There is no Q&A backend model or route yet (see docs/PDP_BACKEND_REQUIREMENTS.md R7). Rather than
 * fabricate questions/answers, this ships the full typed interface behind an honest
 * "not available in this environment" state: the search box and category chips are present so the
 * experience is understood, but submission is disabled and clearly explained. When R7 lands, this
 * component binds to it directly.
 */
export function QaSection({ productId }: { productId: string }) {
  const [query, setQuery] = React.useState("");

  return (
    <div className="max-w-2xl">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          trackPdp("question_searched", { productId });
        }}
        className="flex items-center gap-2"
        role="search"
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search questions about this fragrance"
            aria-label="Search questions"
            className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </form>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {CATEGORIES.map((c) => (
          <span
            key={c}
            className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground"
          >
            {c}
          </span>
        ))}
      </div>

      <div className="mt-6 flex flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-secondary/30 p-8 text-center">
        <MessageCircleQuestion className="h-8 w-8 text-muted-foreground opacity-50" />
        <p className="font-medium">Questions &amp; answers are coming soon</p>
        <p className="max-w-md text-sm text-muted-foreground">
          Community Q&amp;A isn&apos;t enabled in this environment yet. In the
          meantime, our team is happy to help,{" "}
          <a href="/help" className="text-accent underline underline-offset-2">
            contact support
          </a>{" "}
          with any question about authenticity, performance, delivery, or
          samples.
        </p>
      </div>
    </div>
  );
}
