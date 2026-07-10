import type { Product } from "@/components/ui/product-card"

export const dummyProducts: Product[] = [
  {
    id: "1",
    slug: "tom-ford-oud-wood",
    name: "Oud Wood Eau de Parfum 100ml",
    brand: "Tom Ford",
    price: 485000,
    originalPrice: 550000,
    image: "/tom-ford-oud-wood-perfume-bottle.jpg",
    rating: 4.8,
    reviewCount: 256,
    tags: ["bestseller"],
    category: "perfumes",
  },
  {
    id: "2",
    slug: "creed-aventus",
    name: "Aventus Eau de Parfum 100ml",
    brand: "Creed",
    price: 680000,
    image: "/creed-aventus-perfume-bottle.jpg",
    rating: 4.9,
    reviewCount: 1024,
    tags: ["bestseller"],
    category: "perfumes",
  },
  {
    id: "3",
    slug: "dior-sauvage-elixir",
    name: "Sauvage Elixir 60ml",
    brand: "Dior",
    price: 295000,
    image: "/dior-sauvage-elixir-perfume-bottle.jpg",
    rating: 4.7,
    reviewCount: 567,
    category: "perfumes",
  },
]

export const categoryData = {
  perfumes: {
    title: "Perfumes",
    subtitle: "Fragrances that define you.",
    description: "Explore exquisite scents crafted by master perfumers for the discerning individual.",
    image: "/luxury-perfume-bottles.png",
  },
}

export const brands = [
  "All Brands",
  "Tom Ford",
  "Creed",
  "Dior",
  "Chanel",
  "Fádé",
  "Aurelius",
  "Vesper",
  "Prada",
]
