import { NextResponse } from "next/server";
import { calculateQuote } from "@/lib/pricing";
import { makeBookingRef } from "@/lib/bookingRef";
import { createQuote } from "@/lib/quotes";
import type { ContactDetails, PropertyDetails, QuoteItem, ScheduleDetails } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CreateQuoteBody {
  items: QuoteItem[];
  contact: ContactDetails;
  property: PropertyDetails;
  schedule: ScheduleDetails;
}

export async function POST(request: Request): Promise<Response> {
  let body: CreateQuoteBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ id: null, bookingRef: null }, { status: 400 });
  }

  const { items, contact, property, schedule } = body;
  if (!contact?.email?.trim() || !Array.isArray(items)) {
    return NextResponse.json({ id: null, bookingRef: null }, { status: 400 });
  }

  // Prices are recalculated server-side rather than trusting client totals.
  const breakdown = calculateQuote(items, property, schedule);
  const bookingRef = makeBookingRef();

  const record = await createQuote({
    bookingRef,
    customerName: contact.fullName,
    customerEmail: contact.email,
    customerPhone: contact.phone,
    addressLine1: property.addressLine1,
    addressLine2: property.addressLine2,
    city: property.city,
    postcode: property.postcode,
    propertyType: property.propertyType,
    floors: property.floors,
    hasLift: property.hasLift,
    rooms: property.rooms,
    destinationType: property.destinationType,
    destinationAddressLine1: property.destinationAddressLine1,
    destinationAddressLine2: property.destinationAddressLine2,
    destinationCity: property.destinationCity,
    destinationPostcode: property.destinationPostcode,
    distanceMiles: property.distanceMiles,
    distanceApproximate: property.distanceApproximate,
    journeyMiles: property.journeyMiles,
    moveDate: schedule.date,
    timeSlot: schedule.timeSlot,
    vanSize: schedule.vanSize,
    items: items.map((item) => ({
      id: item.id,
      label: item.label,
      itemType: item.itemType,
      wrapTypes: item.wrapTypes,
      size: item.size,
      photoUrl: item.photoUrl,
    })),
    lineItems: breakdown.lineItems,
    subtotal: breakdown.subtotal,
    payNowTotal: breakdown.payNowTotal,
    payOnDayTotal: breakdown.payOnDayTotal,
  });

  if (!record) {
    // Supabase not configured (or the insert failed) — not an error the
    // customer should see; the wizard just skips server-side persistence.
    return NextResponse.json({ id: null, bookingRef: null });
  }

  return NextResponse.json({ id: record.id, bookingRef: record.bookingRef });
}
