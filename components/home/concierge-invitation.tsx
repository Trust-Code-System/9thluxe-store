"use client";

import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";

import { LogoMark } from "@/components/logo";
import { Reveal } from "@/components/motion";

export function ConciergeInvitation() {
  return (
    <section
      data-surface="night"
      className="veil grain relative overflow-hidden bg-background py-20 text-foreground lg:py-28"
    >
      <div className="container relative z-10 mx-auto max-w-2xl px-4 text-center sm:px-6 lg:px-8">
        <Reveal>
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-border bg-secondary/50">
            <LogoMark className="h-7 w-[21px] text-accent" />
          </span>
        </Reveal>
        <Reveal delay={0.08}>
          <h2 className="mt-8 text-balance">
            Describe a <em className="text-accent">memory</em>.
            <br />
            We&apos;ll find the scent.
          </h2>
        </Reveal>
        <Reveal delay={0.16}>
          <p className="mx-auto mt-5 max-w-md leading-relaxed text-muted-foreground">
            A mood, an evening, someone you remember. The Scent Concierge
            listens and recommends real, in-stock fragrances from our house. no
            guesswork.
          </p>
        </Reveal>
        <Reveal delay={0.24}>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/concierge"
              className="inline-flex h-13 items-center justify-center gap-2.5 bg-primary px-8 font-mono text-[12px] uppercase tracking-[0.2em] text-primary-foreground transition-opacity hover:opacity-90"
            >
              <MessageCircle className="h-4 w-4" />
              Talk to the Concierge
            </Link>
            <Link
              href="/find-your-fragrance"
              className="group inline-flex h-13 items-center justify-center gap-2 border border-border px-8 font-mono text-[12px] uppercase tracking-[0.2em] text-foreground transition-colors hover:border-accent hover:text-accent"
            >
              Take the scent quiz
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
