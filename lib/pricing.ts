import pricesData from "@/data/prices.json";
import { getCatalogEntry } from "./itemCatalog";
import type {
  ItemSize,
  PropertyDetails,
  QuoteBreakdown,
  QuoteItem,
  QuoteLineItem,
  ScheduleDetails,
  TimeSlot,
  VanSize,
  WrapType,
} from "./types";

// ---------------------------------------------------------------------------
// Reference data shown in the UI, read from data/prices.json — that's the
// one place to edit rates. Cast from the JSON's inferred `string` fields to
// our literal union types below, since we own the file and its `value`
// fields are trusted to match WrapType/ItemSize/VanSize. (JSON can't
// express Infinity, so the top van tier's `recommendedUpTo: null` is
// converted to Infinity here.)
// ---------------------------------------------------------------------------

export interface WrapOption {
  value: WrapType;
  label: string;
  description: string;
  factor: number;
}

export interface SizeOption {
  value: ItemSize;
  label: string;
  description: string;
  multiplier: number;
}

export interface VanOption {
  value: VanSize;
  label: string;
  description: string;
  recommendedUpTo: number;
  hireFee: number;
  /** Imperial MPG (diesel), used to estimate journey fuel cost. */
  mpg: number;
}

export const WRAP_OPTIONS = pricesData.wrapTypes as WrapOption[];

// Size adjusts the item type's catalog base price (lib/itemCatalog.ts) up or
// down, rather than setting a price on its own.
export const SIZE_OPTIONS = pricesData.sizes as SizeOption[];

// Fixed van hire (vehicle only). Fuel is added separately from the
// journey: collection → destination + destination → our MK13 0BG depot.
export const VAN_OPTIONS: VanOption[] = (pricesData.vans as Array<Omit<VanOption, "recommendedUpTo"> & { recommendedUpTo: number | null }>).map(
  (van) => ({ ...van, recommendedUpTo: van.recommendedUpTo ?? Infinity })
);

// Rough load contribution per item, used only to suggest a van size —
// not for pricing. Small ≈ a box or side table, large ≈ a sofa/wardrobe.
const ITEM_VOLUME_UNITS: Record<ItemSize, number> = {
  small: 1,
  medium: 2,
  large: 3.5,
};

/** Suggests a van size from the items uploaded so far — e.g. 10 boxes
 * shouldn't recommend a Luton van. Purely advisory; the customer can
 * still pick any size. */
export function recommendVanSize(items: QuoteItem[]): VanSize {
  if (items.length === 0) return "none";
  const totalUnits = items.reduce((sum, item) => sum + ITEM_VOLUME_UNITS[item.size], 0);
  const match = VAN_OPTIONS.find((v) => v.value !== "none" && totalUnits <= v.recommendedUpTo);
  return (match?.value as VanSize | undefined) ?? "large";
}

export const TIME_SLOTS: { value: TimeSlot; label: string; window: string }[] = [
  { value: "morning", label: "Morning", window: "8:00 – 12:00" },
  { value: "afternoon", label: "Afternoon", window: "12:00 – 16:00" },
  { value: "evening", label: "Evening", window: "16:00 – 19:00" },
];

// ---------------------------------------------------------------------------
// Pricing engine
// ---------------------------------------------------------------------------

const CALLOUT_FEE = pricesData.fees.callout;
/** Charged when the customer brings their own van, for loading their items into it. */
export const OWN_VAN_LOADING_FEE = pricesData.fees.ownVanLoading;
const WEEKEND_SURCHARGE_PCT = pricesData.fees.weekendSurchargePct;
const EVENING_SURCHARGE_PCT = pricesData.fees.eveningSurchargePct;
/** Extra charged when the customer pays the crew on the day instead of
 * settling upfront. Pay-now is the quoted price; pay-on-the-day is this
 * amount higher, so booking in advance is always the cheaper option. */
export const PAY_ON_DAY_SURCHARGE = pricesData.fees.payOnDaySurcharge;
/** Service & handling margin, added once wrapping, callout and van costs
 * are totalled. Floors, stairs and extra rooms are covered by this margin
 * rather than shown as their own charges. The higher rate applies beyond
 * LONG_DISTANCE_THRESHOLD_MILES from our Milton Keynes base. Van fuel is
 * costed separately from the collection → destination → depot journey. */
export const STANDARD_MARGIN_PCT = pricesData.fees.standardMarginPct;
export const LONG_DISTANCE_MARGIN_PCT = pricesData.fees.longDistanceMarginPct;
export const LONG_DISTANCE_THRESHOLD_MILES = pricesData.fees.longDistanceThresholdMiles;

// Van fuel costing — editable assumptions.
const DIESEL_PRICE_PER_LITRE = pricesData.fees.dieselPricePerLitre;
const LITRES_PER_IMPERIAL_GALLON = 4.546092; // physical unit conversion, not a rate — stays fixed

function wrapFactor(wrapTypes: WrapType[]): number {
  if (wrapTypes.length === 0) return 1;
  // The primary wrap type counts in full; each additional protection layer
  // (e.g. bubble wrap AND a box) adds at a reduced rate, reflecting shared
  // handling time rather than fully duplicating the cost.
  return wrapTypes.reduce((sum, type, index) => {
    const factor = WRAP_OPTIONS.find((w) => w.value === type)?.factor ?? 1;
    return sum + factor * (index === 0 ? 1 : 0.5);
  }, 0);
}

function sizeMultiplier(size: ItemSize): number {
  return SIZE_OPTIONS.find((s) => s.value === size)?.multiplier ?? 1;
}

/** Estimated wrapping cost for a single item, from the item-type catalog. */
export function estimateItemPrice(item: Pick<QuoteItem, "itemType" | "size" | "wrapTypes">): number {
  const catalogPrice = getCatalogEntry(item.itemType).basePrice;
  return round(catalogPrice * sizeMultiplier(item.size) * wrapFactor(item.wrapTypes));
}

interface VanTravelCosts {
  hireFee: number;
  fuelCost: number;
  journeyMiles: number;
}

/** Fixed hire fee plus fuel for the van journey (collection → destination
 * + destination → MK13 0BG). Fuel: (journey miles / van MPG) converted to
 * litres × diesel price. */
function calculateVanTravelCosts(vanSize: VanSize, journeyMiles: number): VanTravelCosts {
  const van = VAN_OPTIONS.find((v) => v.value === vanSize);
  const hireFee = van?.hireFee ?? 0;
  const fuelLitres = van && van.mpg > 0 ? (journeyMiles / van.mpg) * LITRES_PER_IMPERIAL_GALLON : 0;
  const fuelCost = round(fuelLitres * DIESEL_PRICE_PER_LITRE);
  return { hireFee, fuelCost, journeyMiles };
}

function isWeekend(dateIso: string): boolean {
  if (!dateIso) return false;
  const day = new Date(`${dateIso}T00:00:00`).getDay();
  return day === 0 || day === 6;
}

export function calculateQuote(
  items: QuoteItem[],
  property: PropertyDetails,
  schedule: ScheduleDetails
): QuoteBreakdown {
  const lineItems: QuoteBreakdown["lineItems"] = [];

  lineItems.push({
    label: "Callout & materials fee",
    amount: CALLOUT_FEE,
    detail: "Crew dispatch, protective sheeting and tape",
  });

  const wrappingTotal = items.reduce((sum, item) => sum + estimateItemPrice(item), 0);

  if (items.length > 0) {
    lineItems.push({
      label: `Item wrapping (${items.length} item${items.length === 1 ? "" : "s"})`,
      amount: round(wrappingTotal),
      detail: "Based on item type, size and wrap type(s) selected per item",
    });
  }

  if (schedule.vanSize === "none") {
    lineItems.push({
      label: "Loading into your van",
      amount: OWN_VAN_LOADING_FEE,
      detail: "We'll load your items into the van you arrange",
    });
  } else {
    const van = VAN_OPTIONS.find((v) => v.value === schedule.vanSize);
    if (van) {
      const journeyMiles = property.journeyMiles;
      const costs = calculateVanTravelCosts(schedule.vanSize, journeyMiles ?? 0);
      lineItems.push({
        label: van.label,
        amount: costs.hireFee,
        detail: "Loading and unloading included. Fuel is added separately from your journey",
      });
      if (journeyMiles != null) {
        lineItems.push({
          label: "Van fuel",
          amount: costs.fuelCost,
          detail: `${costs.journeyMiles.toFixed(0)} miles (collection to destination, then back to our MK13 0BG depot) at ${formatGBP(DIESEL_PRICE_PER_LITRE)}/litre diesel${property.journeyApproximate ? " — approximate" : ""}`,
        });
      }
    }
  }

  let subtotal = round(lineItems.reduce((sum, li) => sum + li.amount, 0));

  const surcharges: QuoteBreakdown["lineItems"] = [];
  if (isWeekend(schedule.date)) {
    const amount = round(subtotal * WEEKEND_SURCHARGE_PCT);
    surcharges.push({ label: "Weekend surcharge", amount, detail: "10% for Saturday/Sunday moves" });
  }
  if (schedule.timeSlot === "evening") {
    const amount = round(subtotal * EVENING_SURCHARGE_PCT);
    surcharges.push({ label: "Evening slot surcharge", amount, detail: "8% for 16:00–19:00 arrival" });
  }

  const isLongDistance =
    property.distanceMiles != null && property.distanceMiles > LONG_DISTANCE_THRESHOLD_MILES;
  const marginPct = isLongDistance ? LONG_DISTANCE_MARGIN_PCT : STANDARD_MARGIN_PCT;

  const preMarginSubtotal = round(
    [...lineItems, ...surcharges].reduce((sum, li) => sum + li.amount, 0)
  );
  const serviceMargin = round(preMarginSubtotal * marginPct);
  const marginLine: QuoteLineItem = {
    label: `Service & handling (${Math.round(marginPct * 100)}%)`,
    amount: serviceMargin,
    detail: isLongDistance
      ? `A higher rate applies beyond ${LONG_DISTANCE_THRESHOLD_MILES} miles from our Milton Keynes base, to cover crew travel time and mileage`
      : "Applied to the full quote once all items and fees are calculated",
  };

  const allLineItems = [...lineItems, ...surcharges, marginLine];
  subtotal = round(allLineItems.reduce((sum, li) => sum + li.amount, 0));

  const payNowTotal = subtotal;
  const payOnDayTotal = round(subtotal + PAY_ON_DAY_SURCHARGE);

  return {
    lineItems: allLineItems,
    subtotal,
    payNowTotal,
    payOnDayTotal,
    payOnDaySurcharge: PAY_ON_DAY_SURCHARGE,
  };
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

export function formatGBP(value: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
  }).format(value);
}
