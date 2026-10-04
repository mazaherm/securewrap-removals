import { TIME_SLOTS, VAN_OPTIONS } from "./pricing";
import type { QuoteRecord } from "./quotes";
import { destinationTypeLabel, type DestinationType } from "./types";

export interface PublicBookingItem {
  label: string;
  notes: string;
}

export interface PublicBookingLine {
  label: string;
  amount: number;
  detail?: string;
}

export interface PublicBooking {
  bookingRef: string;
  customerName: string;
  moveDate: string;
  timeSlot: string;
  van: string;
  dismantleFurniture: boolean;
  pickup: string;
  destination: string;
  destinationType: string;
  items: PublicBookingItem[];
  lineItems: PublicBookingLine[];
  amountDue: number;
  paymentLabel: string;
  checklistPath: string;
}

function joinAddress(parts: string[]): string {
  return parts.map((part) => part.trim()).filter(Boolean).join(", ");
}

export function toPublicBooking(quote: QuoteRecord): PublicBooking {
  const slot = TIME_SLOTS.find((entry) => entry.value === quote.timeSlot);
  const van = VAN_OPTIONS.find((entry) => entry.value === quote.vanSize);
  const payNow = quote.paymentOption === "pay_now";

  return {
    bookingRef: quote.bookingRef,
    customerName: quote.customerName,
    moveDate: quote.moveDate,
    timeSlot: slot ? `${slot.label} (${slot.window})` : quote.timeSlot,
    van: van?.label ?? quote.vanSize,
    dismantleFurniture: quote.dismantleFurniture,
    pickup: joinAddress([quote.addressLine1, quote.addressLine2, quote.city, quote.postcode]),
    destination: joinAddress([
      quote.destinationAddressLine1,
      quote.destinationAddressLine2,
      quote.destinationCity,
      quote.destinationPostcode,
    ]),
    destinationType: destinationTypeLabel(quote.destinationType as DestinationType),
    items: quote.items.map((item) => ({
      label: item.label,
      notes: item.notes ?? "",
    })),
    lineItems: quote.lineItems.map((line) => ({
      label: line.label,
      amount: line.amount,
      detail: line.detail,
    })),
    amountDue: payNow ? quote.payNowTotal : quote.payOnDayTotal,
    paymentLabel: payNow ? "Paid" : "Due on the day",
    checklistPath: `/checklist/${quote.id}`,
  };
}
