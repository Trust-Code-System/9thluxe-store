import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Fádé Essence · Luxury Perfumes",
    short_name: "Fádé",
    description: "Curated luxury perfumes for the discerning individual.",
    start_url: "/",
    display: "standalone",
    background_color: "#111310",
    theme_color: "#111310",
    orientation: "portrait",
    categories: ["shopping", "lifestyle"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
