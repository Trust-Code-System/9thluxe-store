// app/about/page.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About Fàdè',
  description:
    "Fàdè is a fashion and beauty brand specializing in perfumes, sunglasses, wristwatches and other stylish products. High-quality, trendy, and luxurious items for everyday elegance.",
}

export default function AboutPage() {
  return (
    <section className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="text-3xl font-semibold">About</h1>

      <p className="text-lg leading-relaxed text-gray-800 dark:text-neutral-200">
        <strong>Fàdè</strong> is a fashion and beauty brand that specializes in selling
        <strong> perfumes</strong>, <strong>sunglasses</strong>, <strong>wristwatches</strong> and other stylish products.
        Fàdè focuses on providing customers with high-quality, trendy, and luxurious items that enhance personal style
        and everyday elegance.
      </p>

      <div className="rounded border p-4">
        <p className="text-sm text-gray-600 dark:text-neutral-400">
          We deliver across all 36 states and the FCT. Explore our latest drops:
        </p>
        <ul className="mt-2 list-inside list-disc text-sm">
          <li>Premium perfumes crafted for long-lasting presence</li>
          <li>Polarized sunglasses for crisp, UV-safe vision</li>
          <li>Timeless wristwatches built to elevate your fit</li>
        </ul>
      </div>
    </section>
  )
}
