"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { SocialLinks } from "@/components/footer/SocialLinks";
import { useSiteChrome } from "./site-chrome-context";

type FooterLink = { name: string; href: string };

const defaultShopLinks: FooterLink[] = [
  { name: "All perfumes", href: "/shop" },
  { name: "Collections", href: "/collections" },
  { name: "Limited drops", href: "/drops" },
  { name: "New arrivals", href: "/shop?sort=newest" },
];

const defaultDiscoverLinks: FooterLink[] = [
  { name: "Find your fragrance", href: "/find-your-fragrance" },
  { name: "Scent discovery", href: "/discovery" },
  { name: "Concierge", href: "/concierge" },
  { name: "The Journal", href: "/journal" },
];

const defaultHelpLinks: FooterLink[] = [
  { name: "FAQ", href: "/help/faq" },
  { name: "Contact us", href: "/help/contact" },
  { name: "Returns & exchanges", href: "/help/returns" },
  { name: "Shipping", href: "/help/shipping" },
];

const defaultCompanyLinks: FooterLink[] = [
  { name: "About Fádé", href: "/about" },
  { name: "Privacy policy", href: "/privacy" },
  { name: "Terms of service", href: "/terms" },
  { name: "My account", href: "/account" },
];

export interface FooterProps {
  newsletterHeading?: string;
  newsletterSubtext?: string;
  paymentNote?: string;
  copyrightText?: string;
  social?: import("@/components/footer/SocialLinks").SocialLinksProps;
  shopLinks?: FooterLink[];
  discoverLinks?: FooterLink[];
  helpLinks?: FooterLink[];
  companyLinks?: FooterLink[];
}

function LinkColumn({
  title,
  links,
}: {
  title: string;
  links: { name: string; href: string }[];
}) {
  return (
    <div>
      <h3 className="mb-5 font-mono text-[11px] font-medium uppercase tracking-[0.28em] text-muted-foreground">
        {title}
      </h3>
      <ul className="space-y-3">
        {links.map((link) => (
          <li key={link.name}>
            <Link
              href={link.href}
              className="text-sm text-foreground/75 transition-colors hover:text-foreground"
            >
              {link.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

const asStr = (v: string | boolean | undefined) =>
  typeof v === "string" ? v : undefined;
const toLinks = (items: { label: string; href: string }[] | undefined): FooterLink[] | undefined =>
  items && items.length ? items.map((i) => ({ name: i.label, href: i.href })) : undefined;

export function Footer(props: FooterProps = {}) {
  const [email, setEmail] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const chrome = useSiteChrome();
  const s = chrome?.settings ?? {};
  const nav = chrome?.nav ?? {};

  const newsletterHeading =
    props.newsletterHeading ?? asStr(s.newsletterHeading) ?? "Leave a trail.";
  const newsletterSubtext =
    props.newsletterSubtext ??
    asStr(s.newsletterSubtext) ??
    "New arrivals, limited drops and notes from the atelier. Sent occasionally, written carefully.";
  const paymentNote =
    props.paymentNote ?? asStr(s.footerPaymentNote) ?? "Secure payment via Paystack";
  const copyrightText =
    props.copyrightText ?? asStr(s.copyrightText) ?? "Fádé Essence · Lagos, Nigeria";
  const social =
    props.social ?? {
      instagramUrl: asStr(s.instagramUrl),
      xUrl: asStr(s.xUrl),
      whatsappUrl: asStr(s.whatsappUrl),
      tiktokUrl: asStr(s.tiktokUrl),
      facebookUrl: asStr(s.facebookUrl),
    };
  const shopLinks = props.shopLinks ?? toLinks(nav.FOOTER_SHOP) ?? defaultShopLinks;
  const discoverLinks =
    props.discoverLinks ?? toLinks(nav.FOOTER_DISCOVER) ?? defaultDiscoverLinks;
  const helpLinks = props.helpLinks ?? toLinks(nav.FOOTER_HELP) ?? defaultHelpLinks;
  const companyLinks =
    props.companyLinks ?? toLinks(nav.FOOTER_COMPANY) ?? defaultCompanyLinks;

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error("Invalid email", {
        description: "Please enter a valid email address.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to subscribe");
      }

      if (data.alreadySubscribed) {
        toast.info("Already subscribed", {
          description: "You're already on the list.",
        });
      } else {
        toast.success("Subscribed", {
          description: "Welcome. New scents and stories, occasionally.",
        });
      }
      setEmail("");
    } catch (error) {
      toast.error("Subscription failed", {
        description:
          error instanceof Error ? error.message : "Please try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer
      data-surface="fixed-dark"
      className="relative overflow-hidden border-t border-border bg-background text-foreground"
    >
      <div className="container relative z-10 mx-auto px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        {/* Newsletter */}
        <div className="mb-16 grid gap-10 border-b border-border/70 pb-16 lg:grid-cols-2 lg:items-end">
          <div>
            <p className="eyebrow mb-4">The Sillage letter</p>
            <h2 className="font-serif text-3xl font-light md:text-4xl">
              {newsletterHeading}
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
              {newsletterSubtext}
            </p>
          </div>
          <form
            onSubmit={handleNewsletterSubmit}
            className="flex w-full max-w-md gap-0 lg:ml-auto"
          >
            <label htmlFor="footer-newsletter-email" className="sr-only">
              Email address
            </label>
            <Input
              id="footer-newsletter-email"
              type="email"
              autoComplete="email"
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 rounded-none border-0 border-b border-border bg-transparent px-0 text-sm focus-visible:border-accent focus-visible:ring-0"
            />
            <Button
              type="submit"
              disabled={isSubmitting}
              variant="ghost"
              className="h-12 shrink-0 rounded-none border-b border-border px-4 font-mono text-[11px] uppercase tracking-[0.24em] hover:border-accent hover:bg-transparent hover:text-accent"
            >
              {isSubmitting ? "Sending…" : "Subscribe"}
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </form>
        </div>

        {/* Link columns */}
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4 lg:gap-8">
          <LinkColumn title="Shop" links={shopLinks} />
          <LinkColumn title="Discover" links={discoverLinks} />
          <LinkColumn title="Help" links={helpLinks} />
          <LinkColumn title="Company" links={companyLinks} />
        </div>

        {/* Bottom bar */}
        <div className="mt-16 flex flex-col gap-6 border-t border-border/70 pt-8 md:flex-row md:items-center md:justify-between">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            © {new Date().getFullYear()} {copyrightText}
          </p>
          <div className="flex items-center gap-6">
            {paymentNote && (
              <p className="hidden font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground sm:block">
                {paymentNote}
              </p>
            )}
            <SocialLinks {...(social ?? {})} />
          </div>
        </div>
      </div>

      {/* Watermark wordmark */}
      <div
        aria-hidden
        className="pointer-events-none select-none overflow-hidden pb-2"
      >
        <svg
          aria-hidden="true"
          focusable="false"
          viewBox="0 0 1200 220"
          className="mx-auto block h-auto w-full max-w-[1200px] text-foreground/[0.04]"
        >
          <text
            x="600"
            y="190"
            textAnchor="middle"
            fill="currentColor"
            fontSize="240"
            fontWeight="300"
            style={{ fontFamily: "var(--font-fraunces), Georgia, serif" }}
          >
            Fádé
          </text>
        </svg>
      </div>
    </footer>
  );
}
