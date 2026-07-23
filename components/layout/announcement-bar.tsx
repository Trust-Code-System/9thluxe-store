"use client";

import Link from "next/link";

import { useSiteChrome } from "./site-chrome-context";

export interface AnnouncementBarProps {
  enabled?: boolean;
  text?: string;
  secondaryText?: string;
  link?: string;
}

const asStr = (v: string | boolean | undefined) =>
  typeof v === "string" ? v : undefined;

export function AnnouncementBar(props: AnnouncementBarProps = {}) {
  const chrome = useSiteChrome();
  const s = chrome?.settings ?? {};

  const enabled =
    props.enabled ?? (s.announcementEnabled !== false);
  const text =
    props.text ?? asStr(s.announcementText) ?? "Complimentary delivery on qualifying orders";
  const secondaryText =
    props.secondaryText ?? asStr(s.announcementSecondaryText) ?? "Discover the collection";
  const link = props.link ?? asStr(s.announcementLink) ?? "/shop";

  if (!enabled || !text) return null;

  return (
    <div
      data-surface="fixed-dark"
      className="w-full border-b border-border/60 bg-background text-foreground/70"
      role="complementary"
      aria-label="Promotion"
    >
      <Link
        href={link || "/shop"}
        className="container mx-auto flex items-center justify-center gap-3 px-4 py-2 transition-colors hover:text-foreground"
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.3em]">{text}</span>
        {secondaryText && (
          <>
            <span className="hidden h-px w-6 bg-border sm:block" aria-hidden />
            <span className="hidden font-mono text-[10px] uppercase tracking-[0.3em] sm:inline">
              {secondaryText}
            </span>
          </>
        )}
      </Link>
    </div>
  );
}
