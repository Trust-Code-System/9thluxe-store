export interface JournalArticle {
  slug: string
  title: string
  excerpt: string
  date: string
  readTime: string
  category: string
  heroImage: string
  relatedProductSlugs?: string[]
}

export const journalArticles: JournalArticle[] = [
  {
    slug: "best-oud-fragrances-lagos",
    title: "The 5 Best Oud Fragrances for Lagos Heat",
    excerpt:
      "Lagos weather demands fragrances that evolve beautifully in heat. We explore the finest oud-forward scents that thrive in the Nigerian sun.",
    date: "2026-01-15",
    readTime: "5 min read",
    category: "Fragrance Guide",
    heroImage: "/placeholder-flacon.svg",
  },
  {
    slug: "how-to-layer-scents",
    title: "How to Layer Scents for Maximum Longevity",
    excerpt:
      "Master the art of fragrance layering: a technique used by perfumers to create complex, long-lasting scent profiles tailored to your skin.",
    date: "2026-01-28",
    readTime: "7 min read",
    category: "How To",
    heroImage: "/placeholder-flacon.svg",
  },
  {
    slug: "fragrance-harmattan-season",
    title: "Fragrance for the Harmattan Season",
    excerpt:
      "As dry, dusty winds sweep across Nigeria from November to March, your fragrance choices should shift. Here's what to wear during harmattan.",
    date: "2026-02-05",
    readTime: "4 min read",
    category: "Seasonal",
    heroImage: "/placeholder-flacon.svg",
  },
  {
    slug: "understanding-fragrance-families",
    title: "Understanding Fragrance Families: A Beginner's Guide",
    excerpt:
      "Citrus, woody, floral, oriental: every scent belongs to a family. Understanding them transforms how you shop for fragrance forever.",
    date: "2026-02-12",
    readTime: "8 min read",
    category: "Education",
    heroImage: "/placeholder-flacon.svg",
  },
  {
    slug: "signature-scent-personality",
    title: "What Your Signature Scent Says About You",
    excerpt:
      "Fragrance is the most intimate form of self-expression. Discover what your preferred scent family reveals about your personality.",
    date: "2026-02-19",
    readTime: "6 min read",
    category: "Lifestyle",
    heroImage: "/placeholder-flacon.svg",
  },
]

export const articleContent: Record<string, string[]> = {
  "best-oud-fragrances-lagos": [
    "Lagos is a city of contrasts: the ocean breeze off the Atlantic, the humidity of the mainland, the dry heat of the afternoon. When temperatures climb above 35°C and the sun beats down on Lagos Island, not every fragrance survives.",
    "Oud, derived from the resinous heartwood of Aquilaria trees infected with a specific mold, is one of the few fragrance materials that genuinely thrives in heat. Rather than dissipating quickly, oud fragrances bloom in warmth, projecting deeper and further as your body temperature rises.",
    "The key is choosing oud fragrances that are balanced, not so thick that they become overwhelming in Nigerian humidity, but substantial enough to last through a long Lagos day. Look for oud blended with rose (for softness), amber (for warmth), and slight citrus top notes (for freshness on application).",
    "When applying in Lagos weather: less is more. One spray on the neck, one on the wrist. Let the heat do the work. Over-application leads to fragrance fatigue, both for you and everyone around you.",
    "Whether you're heading to a meeting on Victoria Island, a social gathering in Lekki, or an event in Abuja, the right oud fragrance becomes part of your presence, recognized before you enter a room.",
  ],
  "how-to-layer-scents": [
    "Fragrance layering is the art of wearing multiple scents simultaneously to create a unique olfactory signature that belongs only to you. It's a technique practiced by perfumers, luxury hotel designers, and fragrance enthusiasts worldwide.",
    "The foundation principle: start heavy, finish light. Begin with the densest, most persistent base: a woody, musky, or ambery scent applied to pulse points (wrists, neck, inside elbows). This becomes the 'skin scent' that lasts all day.",
    "Next, apply your main fragrance over the base. Choose something complementary rather than contrasting. A floral over a musky base creates depth; a citrus over a woody base creates freshness with staying power.",
    "Finally, if desired, a light misting of a fresh, bright scent over everything adds an immediate impression: the top notes that people smell when you first enter a space.",
    "The best layering combinations follow the fragrance pyramid logic: base notes should support heart notes, which should frame the top notes. When in doubt, fragrances from the same house layer beautifully because they're designed with complementary accords.",
    "Longevity tip: apply fragrance to moisturized skin. The oils in unscented body lotion bind fragrance molecules, dramatically extending how long your layered scent lasts.",
  ],
  "fragrance-harmattan-season": [
    "The harmattan season transforms Nigeria. From November through March, dry, dust-laden winds blow from the Sahara Desert across West Africa. The air becomes drier, visibility drops, and skin and lips crack without proper care.",
    "In this dry, cool air, fragrance behaves differently. The lack of humidity means top notes evaporate faster: fragrances open beautifully but may not last as long as in humid months. The solution: choose denser, warmer fragrances that have strong base note anchoring.",
    "Woody fragrances (sandalwood, cedarwood, vetiver) perform exceptionally well in harmattan. They have excellent longevity on skin and the warm, grounding character suits the season's earthy atmosphere.",
    "Oriental fragrances (those with amber, spice, and vanilla) also excel. The dryness of harmattan air gives these fragrances a clarity they sometimes lack in humidity, allowing complex spice accords to shine without muddiness.",
    "Avoid very light aquatic or fresh citrus fragrances during harmattan. While pleasant, they'll vanish within an hour in the dry air. Save those for the humid months when they last longer and project beautifully.",
    "The harmattan season is also the time of year when Nigerians visit family, attend end-of-year events, and celebrate. A rich, enveloping fragrance that announces your presence is a gift to every room you enter.",
  ],
  "understanding-fragrance-families": [
    "Every fragrance in the world belongs to a family: a broad category defined by its dominant character. Understanding fragrance families is the single most powerful tool for shopping for perfume, especially online when you can't smell before buying.",
    "Citrus: The freshest family. Built around bergamot, lemon, grapefruit, and mandarin. These fragrances open bright and energetic, making them perfect for morning wear or warm weather. They tend to have shorter longevity, so they're often best in lighter concentrations for casual, everyday wear.",
    "Floral: The most popular family globally. Centered on rose, jasmine, lily, and tuberose. Florals range from airy and transparent (single note rose soliflores) to rich and opulent (jasmine and tuberose heavy orientals). They suit virtually any occasion.",
    "Woody: Built on sandalwood, cedarwood, vetiver, and patchouli. These fragrances have excellent longevity and projection. They work beautifully in all seasons and are particularly appreciated in cooler weather. Many masculines live here.",
    "Oriental: The most complex family. Rich, warm, and often sensual, built on amber, benzoin, vanilla, incense, and exotic spices. Orientals are evening fragrances, special occasion scents. They demand attention and command presence.",
    "Fresh/Aquatic: Clean, watery, oceanic. Built on marine accords, cucumber, and transparent musks. These are the easiest fragrances to wear: inoffensive, universally liked, and great for professional environments. They won't overwhelm anyone.",
    "Knowing your preferred family is like knowing your dress code preference. Once you understand that you love orientals, you'll never waste money on aquatics that feel foreign to your skin.",
  ],
  "signature-scent-personality": [
    "The ancient Egyptians believed that perfume was the breath of the gods. The word itself comes from the Latin 'per fumum': through smoke. For millennia, fragrance has been used to communicate identity, status, and intention before a single word was spoken.",
    "Your choice of fragrance is one of the most intimate decisions you make about self-presentation. Unlike clothes, which others see, fragrance is experienced by others at a subconscious level, often before they even register your presence consciously.",
    "If you're drawn to florals (particularly rose and jasmine), you likely value softness with strength. You understand that femininity is not weakness, and you embrace complexity over simplicity. You're often excellent at reading rooms and navigating relationships.",
    "Those who wear woody, earthy fragrances tend to be grounded, reliable, and quietly confident. You don't need to announce yourself. You're often more interested in depth of experience than breadth of attention. You think in systems and long timelines.",
    "Oriental and oud wearers are typically drawn to luxury, history, and the sensory. You appreciate quality above quantity. You probably have strong opinions about food, music, and design. You're comfortable with being memorable.",
    "Citrus and fresh scent lovers are optimists. You live in the present, value clarity and cleanliness of thought, and bring energy to every environment. You're often highly social and naturally warm.",
    "Of course, personality is not destiny in fragrance. The joy of perfume is that you can be whoever you want to be on any given day. A woody amber for Monday, a bright citrus for Friday, a deep oriental for Saturday night: your fragrance wardrobe should be as multidimensional as you are.",
  ],
}
