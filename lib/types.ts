export type WrapType = "bubble" | "paper" | "blanket" | "shrink" | "box";

export type ItemSize = "small" | "medium" | "large";

export interface QuoteItem {
  id: string;
  photoName: string;
  photoUrl: string;
  label: string;
  /** One or more protection types for this item (e.g. bubble wrap + box) — always at least one. */
  wrapTypes: WrapType[];
  size: ItemSize;
  /** Catalog key from lib/itemCatalog.ts, drives the wrapping base price. */
  itemType: string;
}

export interface ContactDetails {
  fullName: string;
  email: string;
  phone: string;
}

export type PropertyType = "house" | "flat";

export type DestinationType = "new_home" | "storage_facility" | "abroad";

export const DESTINATION_OPTIONS: { value: DestinationType; label: string }[] = [
  { value: "new_home", label: "New home" },
  { value: "storage_facility", label: "Storage facility" },
  { value: "abroad", label: "Abroad (export packing)" },
];

export function destinationTypeLabel(type: DestinationType): string {
  return DESTINATION_OPTIONS.find((option) => option.value === type)?.label ?? "New home";
}

export interface PropertyDetails {
  addressLine1: string;
  addressLine2: string;
  city: string;
  postcode: string;
  propertyType: PropertyType;
  floors: number; // for a house: floors to move items from/to; for a flat: the floor number
  hasLift: boolean; // relevant when propertyType is "flat"
  rooms: number;
  destinationType: DestinationType;
  destinationAddressLine1: string;
  destinationAddressLine2: string;
  destinationCity: string;
  destinationPostcode: string;
  /** Straight-line miles from our Milton Keynes base (MK13 0BG) to the
   * collection postcode. Used for the long-distance service margin. */
  distanceMiles: number | null;
  /** True when distanceMiles came from an outward-code-only match (e.g.
   * "MK9"), so it's an area-level estimate rather than an exact address. */
  distanceApproximate: boolean;
  /** Van journey miles: collection → destination + destination → base
   * (MK13 0BG). Null until both postcodes have been looked up. */
  journeyMiles: number | null;
  journeyApproximate: boolean;
}

export type VanSize = "none" | "small" | "medium" | "large";

export type TimeSlot = "morning" | "afternoon" | "evening";

export interface ScheduleDetails {
  date: string; // ISO date, yyyy-mm-dd
  timeSlot: TimeSlot;
  vanSize: VanSize;
}

export interface QuoteRequest {
  items: QuoteItem[];
  contact: ContactDetails;
  property: PropertyDetails;
  schedule: ScheduleDetails;
}

export interface QuoteLineItem {
  label: string;
  amount: number;
  detail?: string;
}

export interface QuoteBreakdown {
  lineItems: QuoteLineItem[];
  subtotal: number;
  payNowTotal: number;
  payOnDayTotal: number;
  payOnDaySurcharge: number;
}

export type PaymentOption = "pay_now" | "pay_on_day";

export interface BookingConfirmation {
  bookingRef: string;
  paymentOption: PaymentOption;
}
