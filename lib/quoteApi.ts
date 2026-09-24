import type { ContactDetails, PaymentOption, PropertyDetails, QuoteItem, ScheduleDetails } from "./types";

export interface AddressLookupResult {
  line1: string;
  line2: string;
  town: string;
  county: string;
}

export interface AddressLookupResponse {
  available: boolean;
  latitude?: number;
  longitude?: number;
  town?: string;
  addresses?: AddressLookupResult[];
}

/** Looks up addresses for a UK postcode. Prefers getAddress.io when a key
 * is configured; otherwise uses free postcodes.io + OpenStreetMap data.
 * Never throws — callers should fall back to manual entry when
 * `available` is false or `addresses` is empty. */
export async function lookupAddressesByPostcode(postcode: string): Promise<AddressLookupResponse> {
  const trimmed = postcode.trim();
  if (!trimmed) return { available: false };
  try {
    const response = await fetch(`/api/address/lookup?postcode=${encodeURIComponent(trimmed)}`);
    if (!response.ok) return { available: false };
    const data = await response.json();
    return {
      available: Boolean(data.available),
      latitude: data.latitude,
      longitude: data.longitude,
      town: data.town,
      addresses: data.addresses,
    };
  } catch {
    return { available: false };
  }
}

export interface DistanceResult {
  available: boolean;
  miles?: number;
  approximate?: boolean;
  journeyMiles?: number;
  pickupToDestination?: number;
  destinationToBase?: number;
  journeyApproximate?: boolean;
}

/** Looks up straight-line distance from our Milton Keynes base for a UK
 * postcode, via /api/distance. Never throws — callers should treat an
 * unavailable result as "distance unknown" and skip any surcharge. */
export async function getDistanceFromBase(postcode: string): Promise<DistanceResult> {
  const trimmed = postcode.trim();
  if (!trimmed) return { available: false };
  try {
    const response = await fetch(`/api/distance?postcode=${encodeURIComponent(trimmed)}`);
    if (!response.ok) return { available: false };
    const data = await response.json();
    return { available: Boolean(data.available), miles: data.miles, approximate: Boolean(data.approximate) };
  } catch {
    return { available: false };
  }
}

/** Collection → destination + destination → MK13 0BG, plus collection
 * distance from base. Never throws. */
export async function getJourneyDistance(pickup: string, destination: string): Promise<DistanceResult> {
  const from = pickup.trim();
  const to = destination.trim();
  if (!from || !to) return { available: false };
  try {
    const response = await fetch(
      `/api/distance?pickup=${encodeURIComponent(from)}&destination=${encodeURIComponent(to)}`
    );
    if (!response.ok) return { available: false };
    const data = await response.json();
    return {
      available: Boolean(data.available),
      miles: data.miles,
      approximate: Boolean(data.approximate),
      journeyMiles: data.journeyMiles,
      pickupToDestination: data.pickupToDestination,
      destinationToBase: data.destinationToBase,
      journeyApproximate: Boolean(data.journeyApproximate),
    };
  } catch {
    return { available: false };
  }
}

export interface CreatePersistedQuoteResult {
  id: string | null;
  bookingRef: string | null;
}

/** Records the quote server-side (Supabase, if configured) as soon as the
 * customer reaches the final quote step — before they've accepted — so
 * their email is captured for a 24hr follow-up even if they don't book.
 * Never throws; returns null id/bookingRef when the backend isn't set up,
 * so the wizard falls back to its own client-only booking reference. */
export async function createPersistedQuote(payload: {
  items: QuoteItem[];
  contact: ContactDetails;
  property: PropertyDetails;
  schedule: ScheduleDetails;
}): Promise<CreatePersistedQuoteResult> {
  try {
    const response = await fetch("/api/quotes", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) return { id: null, bookingRef: null };
    const data = await response.json();
    return { id: data.id ?? null, bookingRef: data.bookingRef ?? null };
  } catch {
    return { id: null, bookingRef: null };
  }
}

/** Marks a persisted quote as accepted, which triggers the customer and
 * packer confirmation emails server-side (if Resend is configured). */
export async function acceptPersistedQuote(quoteId: string, paymentOption: PaymentOption): Promise<void> {
  try {
    await fetch(`/api/quotes/${quoteId}/accept`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ paymentOption }),
    });
  } catch {
    // Booking already succeeded client-side; a failed notification call
    // shouldn't block the confirmation screen.
  }
}
