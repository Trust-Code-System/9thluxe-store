import type { Metadata } from "next";
import { Fraunces, Instrument_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/react";
import { CartHydrator } from "@/components/cart/cart-hydrator";
import { ThemeProvider } from "@/components/theme-provider";
import { ScrollToTop } from "@/components/scroll-to-top";
import { Suspense } from "react";

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

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: "Fádé Essence | Luxury Perfumes",
    template: "%s | Fádé Essence",
  },
  description:
    "Discover premium luxury perfumes at Fádé Essence. Curated collection of timeless fragrances and sophistication.",
  keywords: [
    "luxury perfumes",
    "fragrances",
    "Fádé",
    "premium perfume",
    "Nigeria",
  ],
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Fádé",
  },
  formatDetection: { telephone: false },
  authors: [{ name: "Fádé Essence" }],
  creator: "Fádé Essence",
  publisher: "Fádé Essence",
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: siteUrl.toString(),
    siteName: "Fádé Essence",
    title: "Fádé Essence | Luxury Perfumes",
    description: "Discover premium luxury perfumes at Fádé Essence.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Fádé Essence",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Fádé Essence | Luxury Perfumes",
    description: "Discover premium luxury perfumes at Fádé Essence.",
    images: ["/og-image.jpg"],
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
  verification: {
    // Add your verification codes here when available
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
          <Suspense fallback={null}>
            <ScrollToTop />
          </Suspense>
          <CartHydrator />
          {children}
          <Toaster position="top-center" />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
