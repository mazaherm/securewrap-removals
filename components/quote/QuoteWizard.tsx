"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { StepIndicator, type StepDef } from "./StepIndicator";
import { StepUpload } from "./StepUpload";
import { StepWrapping } from "./StepWrapping";
import { StepProperty } from "./StepProperty";
import { StepSchedule } from "./StepSchedule";
import { StepQuote } from "./StepQuote";
import { Confirmation } from "./Confirmation";
import { calculateQuote } from "@/lib/pricing";
import type {
  BookingConfirmation,
  ContactDetails,
  PaymentOption,
  PropertyDetails,
  QuoteItem,
  ScheduleDetails,
} from "@/lib/types";

const STEPS: StepDef[] = [
  { key: "upload", label: "Upload photos" },
  { key: "wrapping", label: "Protection" },
  { key: "property", label: "Your details" },
  { key: "schedule", label: "Date & van" },
  { key: "quote", label: "Your quote" },
];

function makeBookingRef() {
  const stamp = Date.now().toString(36).toUpperCase().slice(-5);
  const rand = Math.random().toString(36).toUpperCase().slice(2, 5);
  return `SW-${stamp}${rand}`;
}

export function QuoteWizard() {
  const [stepIndex, setStepIndex] = useState(0);
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [contact, setContact] = useState<ContactDetails>({
    fullName: "",
    email: "",
    phone: "",
  });
  const [property, setProperty] = useState<PropertyDetails>({
    addressLine1: "",
    addressLine2: "",
    city: "",
    postcode: "",
    propertyType: "house",
    floors: 1,
    hasLift: true,
    rooms: 3,
    destinationType: "new_home",
    distanceMiles: null,
    distanceApproximate: false,
  });
  const [schedule, setSchedule] = useState<ScheduleDetails>({
    date: "",
    timeSlot: "morning",
    vanSize: "none",
  });
  const [booking, setBooking] = useState<BookingConfirmation | null>(null);

  function isStepValid(index: number): boolean {
    switch (STEPS[index].key) {
      case "upload":
        return items.length > 0;
      case "wrapping":
        return true;
      case "property":
        return Boolean(
          contact.fullName.trim() &&
            (contact.phone.trim() || contact.email.trim()) &&
            property.addressLine1.trim() &&
            property.city.trim() &&
            property.postcode.trim()
        );
      case "schedule":
        return Boolean(schedule.date);
      default:
        return true;
    }
  }

  const canContinue = isStepValid(stepIndex);

  function goNext() {
    if (!canContinue) return;
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goBack() {
    setStepIndex((i) => Math.max(i - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleAccept(paymentOption: PaymentOption) {
    setBooking({ bookingRef: makeBookingRef(), paymentOption });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (booking) {
    const breakdown = calculateQuote(items, property, schedule);
    const amountDue =
      booking.paymentOption === "pay_now" ? breakdown.payNowTotal : breakdown.payOnDayTotal;
    return (
      <div className="container-page py-12 sm:py-16">
        <Confirmation
          booking={booking}
          items={items}
          contact={contact}
          property={property}
          schedule={schedule}
          amountDue={amountDue}
        />
      </div>
    );
  }

  return (
    <div className="container-page py-10 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <StepIndicator steps={STEPS} currentIndex={stepIndex} />

        <div className="mt-8 sm:mt-10">
          {STEPS[stepIndex].key === "upload" && (
            <StepUpload items={items} onChange={setItems} />
          )}
          {STEPS[stepIndex].key === "wrapping" && (
            <StepWrapping items={items} onChange={setItems} />
          )}
          {STEPS[stepIndex].key === "property" && (
            <StepProperty
              contact={contact}
              property={property}
              onContactChange={setContact}
              onPropertyChange={setProperty}
            />
          )}
          {STEPS[stepIndex].key === "schedule" && (
            <StepSchedule items={items} schedule={schedule} onChange={setSchedule} />
          )}
          {STEPS[stepIndex].key === "quote" && (
            <StepQuote
              items={items}
              contact={contact}
              property={property}
              schedule={schedule}
              onAccept={handleAccept}
            />
          )}
        </div>

        {STEPS[stepIndex].key !== "quote" && (
          <div className="mt-8 flex items-center justify-between gap-3 border-t border-ink-100 pt-6">
            <button
              type="button"
              onClick={goBack}
              disabled={stepIndex === 0}
              className="btn-ghost disabled:invisible"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
            <button type="button" onClick={goNext} disabled={!canContinue} className="btn-primary">
              Continue
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
