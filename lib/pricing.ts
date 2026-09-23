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
// Reference data shown in the UI. Prices are indicative and intended to be
// wired up to real rate cards / a pricing service later.
// ---------------------------------------------------------------------------

export const WRAP_OPTIONS: {
  value: WrapType;
  label: string;
  description: string;
  factor: number;
}[] = [
  {
    value: "bubble",
    label: "Bubble wrap",
    description: "Cushioned protection for fragile and delicate items.",
    factor: 1,
  },
  {
    value: "paper",
    label: "Packing paper",
    description: "Lightweight protection for crockery, glassware and decor.",
    factor: 0.8,
  },
  {
    value: "blanket",
    label: "Furniture blanket",
    description: "Heavy-duty quilted covers for large furniture pieces.",
    factor: 1.3,
  },
  {
    value: "shrink",
    label: "Shrink wrap",
    description: "Weatherproof, secure wrap for sofas, mattresses and boxed sets.",
    factor: 1.15,
  },
  {
    value: "box",
    label: "Cardboard box",
    description: "Boxed for stacking and extra rigidity — combine with another wrap for fragile contents.",
    factor: 0.9,
  },
];

// Size adjusts the item type's catalog base price (lib/itemCatalog.ts) up or
// down, rather than setting a price on its own.
export const SIZE_OPTIONS: {
  value: ItemSize;
  label: string;
  description: string;
  multiplier: number;
}[] = [
  { value: "small", label: "Small", description: "Smaller / lighter than typical for this item", multiplier: 0.7 },
  { value: "medium", label: "Medium", description: "Typical size for this item", multiplier: 1 },
  { value: "large", label: "Large", description: "Larger / bulkier than typical for this item", multiplier: 1.4 },
];

// Vans are hired from a third-party partner, so the bare vehicle hire cost
// varies by availability — we show a range and use the midpoint. Fuel and
// driver cost are calculated separately from actual round-trip distance
// (see vanTravelCosts below), so they aren't baked into this range.
export const VAN_OPTIONS: {
  value: VanSize;
  label: string;
  description: string;
  recommendedUpTo: number;
  hireFeeMin: number;
  hireFeeMax: number;
  /** Imperial MPG (diesel), used to estimate round-trip fuel cost. */
  mpg: number;
}[] = [
  {
    value: "none",
    label: "No van needed",
    description: "I'll arrange my own transport",
    recommendedUpTo: 0,
    hireFeeMin: 0,
    hireFeeMax: 0,
    mpg: 0,
  },
  {
    value: "small",
    label: "Small van",
    description: "Short wheelbase — a few items or boxes, studio/1-bed",
    recommendedUpTo: 8,
    hireFeeMin: 40,
    hireFeeMax: 55,
    mpg: 38,
  },
  {
    value: "medium",
    label: "Medium van (LWB)",
    description: "2 to 3 bedroom home's worth of furniture and boxes",
    recommendedUpTo: 20,
    hireFeeMin: 55,
    hireFeeMax: 75,
    mpg: 30,
  },
  {
    value: "large",
    label: "Luton van + tail lift",
    description: "3+ bedroom home, full house move or bulky furniture",
    recommendedUpTo: Infinity,
    hireFeeMin: 75,
    hireFeeMax: 100,
    mpg: 22,
  },
];

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

const CALLOUT_FEE = 39;
const EXTRA_FLOOR_FEE = 9; // per floor beyond the first, when no lift is available
const EXTRA_ROOM_THRESHOLD = 2;
const EXTRA_ROOM_FEE = 12; // per room beyond the threshold, for crew time
const WEEKEND_SURCHARGE_PCT = 0.1;
const EVENING_SURCHARGE_PCT = 0.08;
const PAY_NOW_DISCOUNT_PCT = 0.08;
/** Service & handling margin, added to the full subtotal (items, access
 * fees, van, surcharges) once everything else has been calculated. The
 * higher rate applies beyond LONG_DISTANCE_THRESHOLD_MILES from our Milton
 * Keynes base, covering crew travel time and mileage on the wrapping side
 * of the job — there's no separate per-mile line item for that, distance
 * is reflected here instead. (Van travel has its own real fuel/driver
 * costing below, since that's a distinct cost the business actually pays.) */
export const STANDARD_MARGIN_PCT = 0.2;
export const LONG_DISTANCE_MARGIN_PCT = 0.3;
export const LONG_DISTANCE_THRESHOLD_MILES = 40;

// Van trip costing — editable assumptions.
const DIESEL_PRICE_PER_LITRE = 1.9;
const LITRES_PER_IMPERIAL_GALLON = 4.546092;
const DRIVER_HOURLY_RATE = 25;
const DRIVER_UNLOAD_HELP_FLAT = 60; // driver helps unload at the destination
const AVERAGE_ROAD_SPEED_MPH = 35; // mixed A-road/urban driving assumption

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
  driverCost: number;
  driveHours: number;
  roundTripMiles: number;
}

/** Real fuel + driver cost for a van trip, from actual round-trip distance.
 * Fuel: (round-trip miles / van MPG) converted to litres × diesel price.
 * Driver: driving time (round-trip miles / average speed) × hourly rate,
 * plus a flat fee since the driver also helps unload at the destination. */
function calculateVanTravelCosts(vanSize: VanSize, distanceMiles: number): VanTravelCosts {
  const van = VAN_OPTIONS.find((v) => v.value === vanSize);
  const roundTripMiles = distanceMiles * 2;
  const hireFee = van ? round((van.hireFeeMin + van.hireFeeMax) / 2) : 0;
  const fuelLitres = van && van.mpg > 0 ? (roundTripMiles / van.mpg) * LITRES_PER_IMPERIAL_GALLON : 0;
  const fuelCost = round(fuelLitres * DIESEL_PRICE_PER_LITRE);
  const driveHours = roundTripMiles / AVERAGE_ROAD_SPEED_MPH;
  const driverCost = round(driveHours * DRIVER_HOURLY_RATE + DRIVER_UNLOAD_HELP_FLAT);
  return { hireFee, fuelCost, driverCost, driveHours, roundTripMiles };
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

  if (property.propertyType === "flat" && !property.hasLift && property.floors > 0) {
    const floorFee = property.floors * EXTRA_FLOOR_FEE;
    lineItems.push({
      label: `Stairs access (floor ${property.floors}, no lift)`,
      amount: floorFee,
      detail: "Additional crew time to carry items up/down stairs",
    });
  } else if (property.propertyType === "house" && property.floors > 1) {
    const floorFee = (property.floors - 1) * EXTRA_FLOOR_FEE;
    lineItems.push({
      label: `Multi-storey access (${property.floors} floors)`,
      amount: floorFee,
      detail: "Additional crew time moving between floors",
    });
  }

  if (property.rooms > EXTRA_ROOM_THRESHOLD) {
    const extraRooms = property.rooms - EXTRA_ROOM_THRESHOLD;
    lineItems.push({
      label: `Additional rooms (${property.rooms} total)`,
      amount: extraRooms * EXTRA_ROOM_FEE,
      detail: "Extra crew time for larger properties",
    });
  }

  if (schedule.vanSize !== "none") {
    const van = VAN_OPTIONS.find((v) => v.value === schedule.vanSize);
    if (van && property.distanceMiles != null) {
      const costs = calculateVanTravelCosts(schedule.vanSize, property.distanceMiles);
      lineItems.push({
        label: van.label,
        amount: costs.hireFee,
        detail: `Estimated ${formatGBP(van.hireFeeMin)}–${formatGBP(van.hireFeeMax)} vehicle hire — hired from our transport partner and confirmed nearer your move date`,
      });
      lineItems.push({
        label: "Van fuel (round trip)",
        amount: costs.fuelCost,
        detail: `${costs.roundTripMiles.toFixed(0)} miles round trip from our Milton Keynes base, at ${formatGBP(DIESEL_PRICE_PER_LITRE)}/litre diesel`,
      });
      lineItems.push({
        label: "Driver — travel & unloading help",
        amount: costs.driverCost,
        detail: `${formatGBP(DRIVER_HOURLY_RATE)}/hr for ~${costs.driveHours.toFixed(1)} hrs travel, plus ${formatGBP(DRIVER_UNLOAD_HELP_FLAT)} flat for helping unload at your address`,
      });
    } else if (van) {
      // Distance unknown — fall back to a single rough estimate rather
      // than blocking the quote; it's refined once the address is confirmed.
      lineItems.push({
        label: van.label,
        amount: round((van.hireFeeMin + van.hireFeeMax) / 2 + 40),
        detail: "Rough estimate including vehicle, fuel and driver — we'll confirm the exact cost once we have your full address",
      });
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

  const payNowTotal = round(subtotal * (1 - PAY_NOW_DISCOUNT_PCT));
  const payOnDayTotal = subtotal;

  return {
    lineItems: allLineItems,
    subtotal,
    payNowTotal,
    payOnDayTotal,
    payNowDiscountPct: PAY_NOW_DISCOUNT_PCT,
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
