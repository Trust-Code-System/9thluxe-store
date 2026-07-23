import type { Metadata } from "next";
import { Fraunces, Instrument_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/next";
import { CartHydrator } from "@/components/cart/cart-hydrator";
import { ThemeProvider } from "@/components/theme-provider";
import { ScrollToTop } from "@/components/scroll-to-top";
import { NavigationProgress } from "@/components/loading/navigation-progress";
import { Suspense } from "react";
import { SiteChromeProvider } from "@/components/layout/site-chrome-context";
import { getSiteSettings } from "@/lib/settings/service";
import { getNavigation } from "@/lib/navigation/service";

const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
});

const instrument = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

function resolveSiteUrl() {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.APP_URL ||
    "http://localhost:3000";

  try {
    return new URL(raw);
  } catch {
    try {
      return new URL(`https://${raw}`);
    } catch {
      return new URL("http://localhost:3000");
    }
  }
}

const siteUrl = resolveSiteUrl();

const str = (v: unknown, fallback: string): string =>
  typeof v === "string" && v.trim() ? v : fallback;

// SEO defaults are admin-editable (Site settings). Falls back to the built-in copy if unset or
// if the settings store is unavailable.
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings().catch(() => ({}) as Record<string, unknown>);

  const siteName = str(settings.siteName, "Fádé Essence");
  const defaultTitle = str(settings.seoDefaultTitle, "Fádé Essence | Luxury Perfumes");
  const description = str(
    settings.seoDefaultDescription,
    "Discover premium luxury perfumes at Fádé Essence. Curated collection of timeless fragrances and sophistication.",
  );
  const ogImage = str(settings.seoOgImage, "/og-image.jpg");

  return {
    metadataBase: siteUrl,
    title: { default: defaultTitle, template: `%s | ${siteName}` },
    description,
    keywords: ["luxury perfumes", "fragrances", "Fádé", "premium perfume", "Nigeria"],
    icons: {
      icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
      apple: [{ url: "/apple-icon" }],
    },
    manifest: "/manifest.webmanifest",
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: "Fádé",
    },
    formatDetection: { telephone: false },
    authors: [{ name: siteName }],
    creator: siteName,
    publisher: siteName,
    openGraph: {
      type: "website",
      locale: "en_NG",
      url: siteUrl.toString(),
      siteName,
      title: defaultTitle,
      description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: siteName }],
    },
    twitter: {
      card: "summary_large_image",
      title: defaultTitle,
      description,
      images: [ogImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, nav] = await Promise.all([
    getSiteSettings().catch(() => ({})),
    getNavigation().catch(() => ({}) as Awaited<ReturnType<typeof getNavigation>>),
  ]);

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${fraunces.variable} ${instrument.variable} ${plexMono.variable}`}
    >
      <head>
        <meta name="theme-color" content="#111310" />
      </head>
      <body className="font-sans">
        <ThemeProvider>
          <SiteChromeProvider value={{ settings, nav }}>
            <Suspense fallback={null}>
              <NavigationProgress />
              <ScrollToTop />
            </Suspense>
            <CartHydrator />
            {children}
            <Toaster position="top-center" />
            <Analytics />
          </SiteChromeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
