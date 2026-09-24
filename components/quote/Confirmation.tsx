"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, Download, ListChecks, Phone } from "lucide-react";
import { generateChecklistPdf } from "@/lib/checklist";
import { formatGBP } from "@/lib/pricing";
import type {
  BookingConfirmation,
  ContactDetails,
  PropertyDetails,
  QuoteItem,
  ScheduleDetails,
} from "@/lib/types";

export function Confirmation({
  booking,
  items,
  contact,
  property,
  schedule,
  amountDue,
  quoteId,
}: {
  booking: BookingConfirmation;
  items: QuoteItem[];
  contact: ContactDetails;
  property: PropertyDetails;
  schedule: ScheduleDetails;
  amountDue: number;
  quoteId: string | null;
}) {
  const [downloaded, setDownloaded] = useState(false);

  function handleDownload() {
    generateChecklistPdf(items, contact, property, schedule, booking.bookingRef);
    setDownloaded(true);
  }

  return (
    <div className="mx-auto max-w-2xl text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-50">
        <CheckCircle2 className="h-7 w-7 text-brand-600" />
      </span>
      <h1 className="mt-5 text-2xl font-semibold tracking-tight text-ink-900">
        {booking.paymentOption === "pay_now" ? "Payment confirmed" : "Booking confirmed"}
      </h1>
      <p className="mt-2 text-sm text-ink-500">
        Booking reference <span className="font-semibold text-ink-800">{booking.bookingRef}</span>.
        {quoteId
          ? ` A confirmation has been sent to ${contact.email || "your email"}.`
          : " Keep this reference for your records."}
      </p>

      <div className="card mt-8 p-6 text-left">
        <div className="flex items-center justify-between border-b border-ink-100 pb-4">
          <div>
            <p className="text-sm font-semibold text-ink-900">
              {schedule.date
                ? new Date(`${schedule.date}T00:00:00`).toLocaleDateString("en-GB", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })
                : "Move date"}
            </p>
            <p className="text-xs text-ink-500">
              {property.addressLine1}
              {property.city ? `, ${property.city}` : ""}
              {property.destinationAddressLine1
                ? ` → ${property.destinationAddressLine1}${property.destinationCity ? `, ${property.destinationCity}` : ""}`
                : ""}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-ink-900">{formatGBP(amountDue)}</p>
            <p className="text-xs text-ink-500">
              {booking.paymentOption === "pay_now" ? "Paid" : "Due on the day"}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-sm font-medium text-ink-900">
            Crew checklist ({items.length} item{items.length === 1 ? "" : "s"})
          </p>
          <p className="mt-1 text-xs leading-relaxed text-ink-500">
            {quoteId
              ? "Check items off from your phone as they're wrapped — no printing needed. A PDF copy is there too if you'd like one."
              : "Download a checklist with a photo, wrap type and size for every item, for the crew to tick off on the day."}
          </p>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {quoteId && (
              <Link href={`/checklist/${quoteId}`} className="btn-primary w-full sm:w-auto">
                <ListChecks className="h-4 w-4" />
                Open checklist
              </Link>
            )}
            <button
              type="button"
              onClick={handleDownload}
              className={quoteId ? "btn-outline w-full sm:w-auto" : "btn-primary w-full sm:w-auto"}
            >
              <Download className="h-4 w-4" />
              Download checklist (PDF)
            </button>
          </div>
          {downloaded && (
            <p className="mt-2 text-xs text-brand-700">Checklist downloaded.</p>
          )}
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link href="/" className="btn-outline w-full sm:w-auto">
          Back to home
        </Link>
        <a href="tel:+441234567890" className="btn-ghost w-full sm:w-auto">
          <Phone className="h-4 w-4" />
          Questions? Call us
        </a>
      </div>
    </div>
  );
}
