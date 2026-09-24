// Wrapping price catalog, by item type. This is the one place to edit
// wrapping prices for specific item types (e.g. "a TV costs about £30 to
// wrap"). `basePrice` is the cost to wrap one item of this type at
// "medium" size with bubble wrap — size and wrap-type selections apply
// multipliers on top of this (see lib/pricing.ts).
export interface ItemCatalogEntry {
  key: string;
  label: string;
  basePrice: number;
  keywords: string[];
}

export const ITEM_CATALOG: ItemCatalogEntry[] = [
  { key: "tv", label: "TV / Monitor", basePrice: 30, keywords: ["tv", "television", "monitor", "screen"] },
  { key: "sofa", label: "Sofa / Settee", basePrice: 45, keywords: ["sofa", "settee", "couch"] },
  { key: "armchair", label: "Armchair / Chair", basePrice: 15, keywords: ["chair", "armchair", "stool", "recliner"] },
  { key: "wardrobe", label: "Wardrobe / Cabinet", basePrice: 40, keywords: ["wardrobe", "cabinet", "closet"] },
  { key: "table", label: "Table (dining / coffee / desk)", basePrice: 25, keywords: ["table", "desk"] },
  { key: "bed", label: "Bed Frame / Mattress", basePrice: 35, keywords: ["bed", "mattress", "headboard"] },
  {
    key: "chest_of_drawers",
    label: "Chest of Drawers / Dresser",
    basePrice: 28,
    keywords: ["drawer", "dresser", "chest", "sideboard"],
  },
  { key: "fridge", label: "Fridge / Freezer", basePrice: 50, keywords: ["fridge", "freezer", "refrigerator"] },
  {
    key: "large_appliance",
    label: "Washing Machine / Large Appliance",
    basePrice: 35,
    keywords: ["washing", "dishwasher", "appliance", "oven", "cooker"],
  },
  {
    key: "mirror_art",
    label: "Mirror / Artwork / Picture Frame",
    basePrice: 18,
    keywords: ["mirror", "art", "picture", "frame", "painting"],
  },
  { key: "box", label: "Box of Items", basePrice: 8, keywords: ["box", "crate", "carton"] },
  {
    key: "lamp_decor",
    label: "Lamp / Small Decor",
    basePrice: 6,
    keywords: ["lamp", "vase", "decor", "ornament", "plant"],
  },
  { key: "other", label: "Other Item", basePrice: 12, keywords: [] },
];

const CATALOG_BY_KEY = new Map(ITEM_CATALOG.map((entry) => [entry.key, entry]));

export function getCatalogEntry(key: string): ItemCatalogEntry {
  return CATALOG_BY_KEY.get(key) ?? ITEM_CATALOG[ITEM_CATALOG.length - 1];
}

export function isValidCatalogKey(key: string): boolean {
  return CATALOG_BY_KEY.has(key);
}

/** Lightweight keyword match from the photo filename, used as a starting
 * item type the customer can change on the protection step. */
export function guessItemTypeFromText(text: string): string {
  const lower = text.toLowerCase();
  for (const entry of ITEM_CATALOG) {
    if (entry.keywords.some((keyword) => lower.includes(keyword))) {
      return entry.key;
    }
  }
  return "other";
}
