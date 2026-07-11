"use client";

import * as React from "react";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  Expand,
  Play,
  ImageOff,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trackPdp } from "@/lib/analytics/pdp-events";
import type { PdpMedia } from "@/lib/pdp/types";

interface PdpGalleryProps {
  media: PdpMedia[];
  productName: string;
  productId: string;
}

function BrokenImageFallback() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-secondary/40 text-muted-foreground">
      <ImageOff className="h-8 w-8" aria-hidden />
      <span className="text-xs">Image unavailable</span>
    </div>
  );
}

export function PdpGallery({ media, productName, productId }: PdpGalleryProps) {
  const items = media.length > 0 ? media : [];
  const [active, setActive] = React.useState(0);
  const [fullscreen, setFullscreen] = React.useState(false);
  const [errored, setErrored] = React.useState<Record<number, boolean>>({});
  const touchStartX = React.useRef<number | null>(null);

  const count = items.length;
  const current = items[active];

  const go = React.useCallback(
    (next: number) => {
      if (count === 0) return;
      const idx = (next + count) % count;
      setActive(idx);
      trackPdp("media_viewed", {
        productId,
        index: idx,
        kind: items[idx]?.kind ?? "image",
      });
    },
    [count, items, productId],
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      go(active + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(active - 1);
    } else if (e.key === "Escape" && fullscreen) {
      setFullscreen(false);
    }
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const dx = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
    if (Math.abs(dx) > 40) go(dx < 0 ? active + 1 : active - 1);
    touchStartX.current = null;
  };

  // Fullscreen focus management: focus the dialog, restore on close.
  const dialogRef = React.useRef<HTMLDivElement | null>(null);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  React.useEffect(() => {
    if (fullscreen) {
      dialogRef.current?.focus();
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      triggerRef.current?.focus();
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [fullscreen]);

  if (count === 0) {
    return (
      <div className="aspect-square w-full overflow-hidden rounded-2xl border border-border">
        <BrokenImageFallback />
      </div>
    );
  }

  const renderMedia = (
    item: PdpMedia,
    index: number,
    sizes: string,
    priority = false,
  ) => {
    if (errored[index]) return <BrokenImageFallback />;
    if (item.kind === "video") {
      return (
        <video
          controls
          preload="none"
          className="h-full w-full bg-black object-contain"
          aria-label={item.alt || `${productName} video`}
          onPlay={() => trackPdp("video_played", { productId, index })}
        >
          <source src={item.url} />
        </video>
      );
    }
    return (
      <Image
        src={item.url}
        alt={item.alt || `${productName}, view ${index + 1} of ${count}`}
        fill
        sizes={sizes}
        preload={priority}
        className="object-cover"
        onError={() => setErrored((e) => ({ ...e, [index]: true }))}
      />
    );
  };

  return (
    <div className="flex flex-col gap-3" onKeyDown={onKeyDown}>
      {/* Main stage */}
      <div
        className="group relative aspect-square w-full overflow-hidden rounded-2xl border border-border bg-secondary/30"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        role="group"
        aria-roledescription="carousel"
        aria-label={`${productName} media, ${active + 1} of ${count}`}
      >
        {renderMedia(current, active, "(max-width: 1024px) 100vw, 50vw", true)}

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(active - 1)}
              aria-label="Previous image"
              className="absolute left-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-background/80 text-foreground opacity-0 shadow transition-opacity hover:bg-background focus-visible:opacity-100 group-hover:opacity-100"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => go(active + 1)}
              aria-label="Next image"
              className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-background/80 text-foreground opacity-0 shadow transition-opacity hover:bg-background focus-visible:opacity-100 group-hover:opacity-100"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        <button
          ref={triggerRef}
          type="button"
          onClick={() => setFullscreen(true)}
          aria-label="Open full-screen viewer"
          className="absolute bottom-2 right-2 grid h-9 w-9 place-items-center rounded-full bg-background/80 text-foreground shadow transition-colors hover:bg-background"
        >
          <Expand className="h-4 w-4" />
        </button>
      </div>

      {/* Thumbnails */}
      {count > 1 && (
        <ul
          className="flex gap-2 overflow-x-auto pb-1"
          aria-label="Product image thumbnails"
        >
          {items.map((item, i) => (
            <li key={`${item.url}-${i}`} className="shrink-0">
              <button
                type="button"
                onClick={() => go(i)}
                aria-label={`Show ${item.kind === "video" ? "video" : "image"} ${i + 1}`}
                aria-current={i === active}
                className={cn(
                  "relative block h-16 w-16 overflow-hidden rounded-lg border-2 transition-colors",
                  i === active
                    ? "border-accent"
                    : "border-border hover:border-muted-foreground",
                )}
              >
                {item.kind === "video" ? (
                  <span className="grid h-full w-full place-items-center bg-secondary/60">
                    <Play className="h-4 w-4 text-foreground" />
                  </span>
                ) : errored[i] ? (
                  <span className="grid h-full w-full place-items-center bg-secondary/60">
                    <ImageOff className="h-3.5 w-3.5 text-muted-foreground" />
                  </span>
                ) : (
                  <Image
                    src={item.url}
                    alt=""
                    fill
                    sizes="64px"
                    className="object-cover"
                    onError={() => setErrored((e) => ({ ...e, [i]: true }))}
                  />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Full-screen viewer */}
      {fullscreen && (
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={`${productName} full-screen media viewer`}
          tabIndex={-1}
          className="fixed inset-0 z-[var(--z-modal)] flex flex-col bg-espresso/95 p-4 outline-none backdrop-blur-sm"
          onKeyDown={onKeyDown}
        >
          <div className="flex items-center justify-between text-white">
            <span className="text-sm text-white/80">
              {active + 1} / {count}
            </span>
            <button
              type="button"
              onClick={() => setFullscreen(false)}
              aria-label="Close full-screen viewer"
              className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div
            className="relative flex-1"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            {renderMedia(current, active, "100vw")}
          </div>
          {count > 1 && (
            <div className="flex items-center justify-center gap-4 pt-3">
              <button
                type="button"
                onClick={() => go(active - 1)}
                aria-label="Previous"
                className="grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={() => go(active + 1)}
                aria-label="Next"
                className="grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
