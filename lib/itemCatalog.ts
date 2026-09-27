import pricesData from "@/data/prices.json";

// Wrapping price catalog, by item type — read from data/prices.json (the
// one place to edit wrapping prices, e.g. "a TV costs about £30 to wrap").
// `basePrice` is the cost to wrap one item of this type at "medium" size
// with bubble wrap — size and wrap-type selections apply multipliers on
// top of this (see lib/pricing.ts).
export interface ItemCatalogEntry {
  key: string;
  label: string;
  basePrice: number;
  keywords: string[];
}

export const ITEM_CATALOG: ItemCatalogEntry[] = pricesData.itemTypes;

const CATALOG_BY_KEY = new Map(ITEM_CATALOG.map((entry) => [entry.key, entry]));

const UNSET_ENTRY: ItemCatalogEntry = {
  key: "",
  label: "Item type not set",
  basePrice: 0,
  keywords: [],
};

export function getCatalogEntry(key: string): ItemCatalogEntry {
  return CATALOG_BY_KEY.get(key) ?? UNSET_ENTRY;
}

export function isValidCatalogKey(key: string): boolean {
  return CATALOG_BY_KEY.has(key);
}

/** Lightweight keyword match from the photo filename, used as a starting
 * item type the customer can change on the protection step. Returns ""
 * when nothing matches so the customer must pick a real type (we don't
 * offer a generic "Other" with a made-up price). */
export function guessItemTypeFromText(text: string): string {
  const lower = text.toLowerCase();
  for (const entry of ITEM_CATALOG) {
    if (entry.keywords.some((keyword) => lower.includes(keyword))) {
      return entry.key;
    }
  }
  return "";
}
