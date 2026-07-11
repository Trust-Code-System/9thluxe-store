// lib/fragrance/ingredients.ts
// The reusable Fragrance Ingredient Library. A single source of truth that every perfume in the
// catalogue (and every future upload) draws from. Entries are hand-curated and approved; images are
// house-generated deterministic art (see lib/fragrance/art.ts), never scraped. Adding an ingredient
// here immediately upgrades every product that references it, no per-product design work required.

import type { Ingredient, IngredientFamily, ApprovalStatus } from "./types"

/** Last human review date applied to the seeded library entries. */
const REVIEWED = "2026-07-11"

interface IngredientSeed {
  canonicalName: string
  displayName: string
  altNames?: string[]
  misspellings?: string[]
  family: IngredientFamily
  descriptors: string[]
  shortDescription: string
  longDescription: string
  color: string
  related?: string[]
  searchKeywords?: string[]
  alt?: string
  approval?: ApprovalStatus
}

/**
 * Build a full Ingredient from a compact seed. Image metadata is uniform: every seeded asset is
 * house-generated deterministic art with a recorded licence, marked approved and reviewed. This keeps
 * provenance honest and traceable for all 20+ entries without repeating boilerplate.
 */
function ing(seed: IngredientSeed): Ingredient {
  const alt =
    seed.alt ?? `A stylised illustration of ${seed.displayName.toLowerCase()}, in Fàdè house art direction.`
  return {
    id: `ingredient_${seed.canonicalName.replace(/[^a-z0-9]+/g, "_")}`,
    canonicalName: seed.canonicalName,
    displayName: seed.displayName,
    altNames: seed.altNames ?? [],
    misspellings: seed.misspellings ?? [],
    family: seed.family,
    descriptors: seed.descriptors,
    shortDescription: seed.shortDescription,
    longDescription: seed.longDescription,
    color: seed.color,
    related: seed.related ?? [],
    searchKeywords: seed.searchKeywords ?? [],
    image: {
      provenance: "generated",
      licence: "house-svg-v1",
      sourceNote:
        "Deterministic vector art generated in-house from the ingredient family and colour. Contains no text, logos or third-party imagery.",
      approval: "approved",
      lastReviewed: REVIEWED,
    },
    alt,
    approval: seed.approval ?? "approved",
    lastReviewed: REVIEWED,
  }
}

const SEEDS: Ingredient[] = [
  ing({
    canonicalName: "oud",
    displayName: "Oud",
    altNames: ["oudh", "agarwood", "aoud", "oud wood", "agar wood"],
    misspellings: [" oud", "ud", "ood"],
    family: "woody",
    descriptors: ["woody", "smoky", "resinous", "animalic", "warm"],
    shortDescription: "Dark, resinous heartwood prized for its deep, smoky warmth.",
    longDescription:
      "Oud is the resin-soaked heartwood of the agar tree, one of the most treasured materials in perfumery. It reads as woody and smoky with a leathery, almost animalic depth that lingers close to the skin and gives a fragrance its gravity.",
    color: "#6b4a2f",
    related: ["sandalwood", "amber", "saffron", "rose"],
    searchKeywords: ["agarwood", "oriental", "middle east", "resin"],
  }),
  ing({
    canonicalName: "bergamot",
    displayName: "Bergamot",
    altNames: ["bergamote"],
    misspellings: ["bergamont", "bergamott", "bergomot"],
    family: "citrus",
    descriptors: ["citrus", "bright", "green", "fresh"],
    shortDescription: "A bright, slightly bitter citrus that lifts the opening of a fragrance.",
    longDescription:
      "Bergamot is a small, fragrant citrus grown mainly in southern Italy. Sparkling and a touch bitter, it is the classic top note that gives an opening its lift and elegance before the heart emerges.",
    color: "#c7b24a",
    related: ["lemon", "petitgrain", "lavender"],
    searchKeywords: ["citrus", "earl grey", "italy", "top note"],
  }),
  ing({
    canonicalName: "vanilla",
    displayName: "Vanilla",
    altNames: ["bourbon vanilla", "vanille"],
    misspellings: ["vanila", "vannilla", "vanillla"],
    family: "gourmand",
    descriptors: ["sweet", "creamy", "balsamic", "warm"],
    shortDescription: "Sweet, creamy warmth that softens and rounds a base.",
    longDescription:
      "Vanilla is the cured pod of a climbing orchid. In perfumery it brings a sweet, creamy, faintly boozy warmth that rounds sharp edges and lends a comforting, enveloping finish to the dry-down.",
    color: "#d8b877",
    related: ["tonka bean", "caramel", "amber", "sandalwood"],
    searchKeywords: ["gourmand", "sweet", "dessert", "base note"],
  }),
  ing({
    canonicalName: "amber",
    displayName: "Amber",
    altNames: ["ambre", "amber accord"],
    misspellings: ["ambar", "ambre "],
    family: "amber",
    descriptors: ["warm", "resinous", "sweet", "powdery"],
    shortDescription: "A warm, golden accord of resins and balsams.",
    longDescription:
      "Amber in perfumery is not a single raw material but a warm, glowing accord built from resins such as labdanum and benzoin. It feels golden, soft and enveloping, and anchors many oriental compositions.",
    color: "#c8862b",
    related: ["vanilla", "oud", "tonka bean", "incense"],
    searchKeywords: ["oriental", "resin", "labdanum", "benzoin", "warm"],
  }),
  ing({
    canonicalName: "rose",
    displayName: "Rose",
    altNames: ["rose absolute", "damask rose", "rosa", "taif rose"],
    misspellings: ["roze", "rosé", "ros"],
    family: "floral",
    descriptors: ["floral", "fresh", "honeyed", "green"],
    shortDescription: "The queen of flowers, ranging from fresh and dewy to deep and jammy.",
    longDescription:
      "Rose is perhaps the most storied note in perfumery. Depending on the variety and extraction it can read fresh and dewy, green and lemony, or deep and honeyed. It pairs beautifully with oud, saffron and patchouli.",
    color: "#c06079",
    related: ["oud", "saffron", "patchouli", "geranium", "jasmine"],
    searchKeywords: ["floral", "rosa", "petals", "heart note"],
  }),
  ing({
    canonicalName: "jasmine",
    displayName: "Jasmine",
    altNames: ["jasmin", "sambac", "jasmine sambac", "jasmine grandiflorum"],
    misspellings: ["jasmin ", "jazmine", "jasmyne"],
    family: "floral",
    descriptors: ["floral", "heady", "indolic", "sweet"],
    shortDescription: "A heady white floral, lush and slightly narcotic.",
    longDescription:
      "Jasmine is a rich white flower whose absolute is intensely floral, warm and faintly animalic. It brings a sensual, radiant fullness to the heart of a fragrance and amplifies the flowers around it.",
    color: "#e8dca0",
    related: ["rose", "ylang-ylang", "tuberose", "sandalwood"],
    searchKeywords: ["white floral", "indolic", "heart note"],
  }),
  ing({
    canonicalName: "sandalwood",
    displayName: "Sandalwood",
    altNames: ["santal", "sandal", "mysore sandalwood"],
    misspellings: ["sandlewood", "sandal wood", "sandelwood"],
    family: "woody",
    descriptors: ["woody", "creamy", "milky", "soft"],
    shortDescription: "A soft, creamy wood with a milky, meditative warmth.",
    longDescription:
      "Sandalwood is a smooth, creamy wood with a milky, almost lactonic warmth. Less sharp than cedar, it is a gentle base note that adds a rounded, meditative softness and helps florals and spices last.",
    color: "#c9a877",
    related: ["oud", "vanilla", "rose", "cedarwood"],
    searchKeywords: ["santal", "woody", "creamy", "base note"],
  }),
  ing({
    canonicalName: "musk",
    displayName: "Musk",
    altNames: ["white musk", "musc"],
    misspellings: ["musc ", "musk "],
    family: "animalic",
    descriptors: ["soft", "clean", "skin-like", "powdery"],
    shortDescription: "A soft, skin-like warmth that makes a fragrance feel intimate.",
    longDescription:
      "Modern musks are clean, soft and skin-like, lending a fragrance an intimate, second-skin quality. They extend other notes, smooth transitions and give the dry-down its lingering, comforting hum.",
    color: "#d9cbb8",
    related: ["amber", "vanilla", "sandalwood", "iris"],
    searchKeywords: ["clean", "skin", "base note", "soft"],
  }),
  ing({
    canonicalName: "saffron",
    displayName: "Saffron",
    altNames: ["safran"],
    misspellings: ["safron", "saffran", "saffon"],
    family: "spicy",
    descriptors: ["spicy", "leathery", "warm", "suede"],
    shortDescription: "A warm, leathery spice with a soft, suede-like glow.",
    longDescription:
      "Saffron brings a warm, slightly leathery and suede-like spice to a composition. Precious and radiant, it is a favourite partner for rose and oud in modern oriental fragrances.",
    color: "#c96a2b",
    related: ["oud", "rose", "leather", "amber"],
    searchKeywords: ["spice", "leather", "oriental", "heart note"],
  }),
  ing({
    canonicalName: "tobacco",
    displayName: "Tobacco",
    altNames: ["tobacco leaf", "tabac"],
    misspellings: ["tabaco", "tobaco", "tobacoo"],
    family: "gourmand",
    descriptors: ["warm", "sweet", "dry", "aromatic"],
    shortDescription: "Dry, sweet cured leaf with a honeyed, aromatic warmth.",
    longDescription:
      "Tobacco in perfumery is the sweet, dry, honeyed character of cured leaf rather than smoke. It reads warm and slightly boozy, and sits beautifully alongside tonka, vanilla and spice in cosy base accords.",
    color: "#8a5a32",
    related: ["tonka bean", "vanilla", "leather", "amber"],
    searchKeywords: ["tabac", "leaf", "cosy", "base note"],
  }),
  ing({
    canonicalName: "leather",
    displayName: "Leather",
    altNames: ["cuir", "suede"],
    misspellings: ["leathe", "lether", "leatther"],
    family: "animalic",
    descriptors: ["leathery", "smoky", "dry", "animalic"],
    shortDescription: "A smoky, refined leather accord, from soft suede to dark hide.",
    longDescription:
      "Leather is an accord rather than a raw material, evoking anything from soft suede to smoky, tarry hide. It gives a fragrance a confident, sophisticated backbone and pairs with saffron, oud and tobacco.",
    color: "#6a4a35",
    related: ["saffron", "oud", "tobacco", "birch tar"],
    searchKeywords: ["cuir", "suede", "smoky", "base note"],
  }),
  ing({
    canonicalName: "peach",
    displayName: "Peach",
    altNames: ["peach nectar", "white peach"],
    misspellings: ["peech", "peatch"],
    family: "fruity",
    descriptors: ["fruity", "juicy", "soft", "sweet"],
    shortDescription: "A soft, velvety stone fruit, juicy and gently sweet.",
    longDescription:
      "Peach lends a juicy, velvety sweetness to the top and heart of a fragrance. Soft and rounded rather than sharp, it flatters florals like rose and jasmine and adds an approachable, sunlit warmth.",
    color: "#e6a06a",
    related: ["rose", "jasmine", "vanilla"],
    searchKeywords: ["fruit", "stone fruit", "juicy", "top note"],
  }),
  ing({
    canonicalName: "vetiver",
    displayName: "Vetiver",
    altNames: ["vetivert", "khus"],
    misspellings: ["vetivor", "vetever", "vetivert "],
    family: "woody",
    descriptors: ["earthy", "woody", "green", "smoky"],
    shortDescription: "A rooty, earthy grass with a smoky, green woodiness.",
    longDescription:
      "Vetiver is distilled from the roots of a tropical grass. It is earthy, rooty and green with a dry, smoky woodiness that grounds a fragrance and reads especially elegant in fresh and woody compositions.",
    color: "#5f6b3f",
    related: ["cedarwood", "patchouli", "bergamot", "sandalwood"],
    searchKeywords: ["earthy", "root", "khus", "base note"],
  }),
  ing({
    canonicalName: "patchouli",
    displayName: "Patchouli",
    altNames: ["patchouly", "pachouli"],
    misspellings: ["patchoulli", "patchuli", "pathouli"],
    family: "woody",
    descriptors: ["earthy", "woody", "camphoraceous", "sweet"],
    shortDescription: "A dark, earthy leaf with a sweet, wine-like depth.",
    longDescription:
      "Patchouli is a richly earthy, slightly sweet and camphoraceous note from a tropical leaf. It adds depth and a wine-like darkness to chypre and oriental accords and lasts remarkably well on skin.",
    color: "#5a4a30",
    related: ["rose", "vetiver", "amber", "vanilla"],
    searchKeywords: ["earthy", "chypre", "leaf", "base note"],
  }),
  ing({
    canonicalName: "tonka bean",
    displayName: "Tonka Bean",
    altNames: ["tonka", "tonka beans", "fève tonka"],
    misspellings: ["tonca", "tonka been", "tonkabean"],
    family: "gourmand",
    descriptors: ["sweet", "almond", "warm", "hay-like"],
    shortDescription: "A warm, almond-and-hay sweetness with a coumarin glow.",
    longDescription:
      "Tonka bean carries a warm, sweet character of almond, hay and toasted vanilla thanks to its coumarin content. It is a cosy base note that blends seamlessly with vanilla, tobacco and amber.",
    color: "#a9743e",
    related: ["vanilla", "tobacco", "amber", "caramel"],
    searchKeywords: ["coumarin", "almond", "sweet", "base note"],
  }),
  ing({
    canonicalName: "caramel",
    displayName: "Caramel",
    altNames: ["caramel accord", "toffee"],
    misspellings: ["carmel", "carammel", "caramael"],
    family: "gourmand",
    descriptors: ["sweet", "buttery", "toasted", "warm"],
    shortDescription: "Toasted, buttery sweetness like warm burnt sugar.",
    longDescription:
      "Caramel brings a toasted, buttery sweetness reminiscent of warm burnt sugar. A gourmand note used with care, it adds indulgent comfort alongside vanilla, coffee and tonka.",
    color: "#b5772f",
    related: ["vanilla", "coffee", "tonka bean"],
    searchKeywords: ["gourmand", "toffee", "sugar", "sweet"],
  }),
  ing({
    canonicalName: "coffee",
    displayName: "Coffee",
    altNames: ["coffee bean", "espresso", "café"],
    misspellings: ["cofee", "coffe", "coffie"],
    family: "gourmand",
    descriptors: ["roasted", "bitter", "warm", "aromatic"],
    shortDescription: "Dark roasted beans, bittersweet and energising.",
    longDescription:
      "Coffee lends a dark, roasted, bittersweet aroma that feels warm and awake. It cuts sweetness with a pleasant bitterness and pairs strikingly with vanilla, caramel and amber in modern gourmands.",
    color: "#4a2f22",
    related: ["vanilla", "caramel", "tobacco", "amber"],
    searchKeywords: ["espresso", "roasted", "gourmand", "heart note"],
  }),
  ing({
    canonicalName: "lavender",
    displayName: "Lavender",
    altNames: ["lavande", "lavandin"],
    misspellings: ["lavendar", "lavander", "lavendor"],
    family: "aromatic",
    descriptors: ["aromatic", "herbal", "fresh", "floral"],
    shortDescription: "A clean, herbal-floral note, calming and classic.",
    longDescription:
      "Lavender is a clean, aromatic herb with a fresh floral edge. A cornerstone of fougère and barbershop styles, it feels calming and timeless and bridges citrus tops with warm, mossy bases.",
    color: "#8a86c0",
    related: ["bergamot", "tonka bean", "vetiver"],
    searchKeywords: ["fougère", "herbal", "aromatic", "top note"],
  }),
  ing({
    canonicalName: "cedarwood",
    displayName: "Cedarwood",
    altNames: ["cedar", "cedre", "virginia cedar", "atlas cedar"],
    misspellings: ["cedarwod", "ceder", "cederwood"],
    family: "woody",
    descriptors: ["woody", "dry", "pencil-shaving", "clean"],
    shortDescription: "A dry, clean pencil-shaving wood with a sharpened edge.",
    longDescription:
      "Cedarwood is a dry, clean, slightly pencil-shaving wood that gives structure and a sharpened backbone to a composition. Crisp and versatile, it supports both fresh and woody accords.",
    color: "#9c7b4f",
    related: ["sandalwood", "vetiver", "bergamot"],
    searchKeywords: ["cedar", "dry wood", "base note"],
  }),
  ing({
    canonicalName: "pink pepper",
    displayName: "Pink Pepper",
    altNames: ["pink peppercorn", "baies roses"],
    misspellings: ["pink peper", "pink peppe"],
    family: "spicy",
    descriptors: ["spicy", "sparkling", "rosy", "fresh"],
    shortDescription: "A sparkling, rosy spice that fizzes at the opening.",
    longDescription:
      "Pink pepper adds a bright, sparkling spice with a faint rosy fruitiness. Lighter than black pepper, it gives an opening a modern, effervescent lift and flatters rose and citrus.",
    color: "#cf7a86",
    related: ["rose", "bergamot", "saffron"],
    searchKeywords: ["peppercorn", "spice", "sparkling", "top note"],
  }),
  ing({
    canonicalName: "incense",
    displayName: "Incense",
    altNames: ["frankincense", "olibanum", "encens"],
    misspellings: ["insense", "incence", "frankinsense"],
    family: "resinous",
    descriptors: ["resinous", "smoky", "sacred", "cool"],
    shortDescription: "Cool, smoky resin with a meditative, sacred air.",
    longDescription:
      "Incense, or frankincense, is a cool, smoky tree resin with a peppery, meditative quality. It lends a sacred, contemplative depth and pairs strikingly with oud, amber and rose.",
    color: "#8f8577",
    related: ["oud", "amber", "rose", "sandalwood"],
    searchKeywords: ["frankincense", "olibanum", "smoke", "resin"],
  }),
  ing({
    canonicalName: "iris",
    displayName: "Iris",
    altNames: ["orris", "orris root", "iris pallida"],
    misspellings: ["irus", "orriss", "iriss"],
    family: "powdery",
    descriptors: ["powdery", "buttery", "cool", "elegant"],
    shortDescription: "A cool, powdery, buttery root, quietly luxurious.",
    longDescription:
      "Iris, from the root of the flower, is one of perfumery's most refined materials. It is powdery and cool with a buttery, faintly rooty elegance that feels understated and expensive.",
    color: "#b7aecb",
    related: ["musk", "sandalwood", "violet"],
    searchKeywords: ["orris", "powder", "elegant", "heart note"],
  }),
  ing({
    canonicalName: "cardamom",
    displayName: "Cardamom",
    altNames: ["cardamon", "cardamome", "elaichi"],
    misspellings: ["cardomom", "cardamum", "cardomon"],
    family: "spicy",
    descriptors: ["spicy", "aromatic", "fresh", "green"],
    shortDescription: "A fresh, aromatic spice, bright and slightly minty.",
    longDescription:
      "Cardamom is a green, aromatic spice with a fresh, faintly eucalyptus-like lift. It brightens an opening with an elegant warmth and is a favourite in refined masculine and oriental accords.",
    color: "#8fa060",
    related: ["bergamot", "saffron", "oud", "coffee"],
    searchKeywords: ["spice", "elaichi", "aromatic", "top note"],
  }),
  ing({
    canonicalName: "ylang-ylang",
    displayName: "Ylang-Ylang",
    altNames: ["ylang", "ylang ylang", "cananga"],
    misspellings: ["ilang ilang", "ylang-ilang", "yang ylang"],
    family: "floral",
    descriptors: ["floral", "creamy", "banana-like", "exotic"],
    shortDescription: "A creamy, exotic tropical flower, sweet and sunlit.",
    longDescription:
      "Ylang-ylang is a lush tropical flower with a creamy, slightly banana-like sweetness. It brings a sunlit, exotic richness to a floral heart and rounds out jasmine and rose beautifully.",
    color: "#e3d488",
    related: ["jasmine", "rose", "sandalwood", "vanilla"],
    searchKeywords: ["tropical", "creamy floral", "cananga", "heart note"],
  }),
]

/** The immutable, in-memory ingredient library. Ordered by insertion (broadly by prominence). */
export const INGREDIENT_LIBRARY: readonly Ingredient[] = SEEDS

/** Fast lookup by canonical name. */
export const INGREDIENTS_BY_CANONICAL: ReadonlyMap<string, Ingredient> = new Map(
  INGREDIENT_LIBRARY.map((i) => [i.canonicalName, i]),
)

/** Total count, handy for admin dashboards and tests. */
export const INGREDIENT_COUNT = INGREDIENT_LIBRARY.length

/** Get an approved ingredient by its exact canonical name, or null. */
export function getIngredient(canonicalName: string): Ingredient | null {
  return INGREDIENTS_BY_CANONICAL.get(canonicalName.toLowerCase().trim()) ?? null
}
