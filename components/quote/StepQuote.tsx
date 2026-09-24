"use client";

import { useMemo, useState } from "react";
import { Phone } from "lucide-react";
import { calculateQuote, formatGBP } from "@/lib/pricing";
import type {
  ContactDetails,
  PaymentOption,
  PropertyDetails,
  QuoteItem,
  ScheduleDetails,
} from "@/lib/types";

export function StepQuote({
  items,
  contact,
  property,
  schedule,
  onAccept,
}: {
  items: QuoteItem[];
  contact: ContactDetails;
  property: PropertyDetails;
  schedule: ScheduleDetails;
  onAccept: (paymentOption: PaymentOption) => void;
}) {
  const breakdown = useMemo(
    () => calculateQuote(items, property, schedule),
    [items, property, schedule]
  );
  const [paymentOption, setPaymentOption] = useState<PaymentOption>("pay_now");

  return (
    <div>
      <h2 className="text-lg font-semibold text-ink-900">Your quote</h2>
      <p className="mt-1.5 text-sm text-ink-500">
        Here&rsquo;s the breakdown for {contact.fullName || "your"} move on{" "}
        {schedule.date ? new Date(`${schedule.date}T00:00:00`).toLocaleDateString("en-GB") : "your selected date"}.
      </p>

      <div className="mt-6 card overflow-hidden">
        <div className="border-b border-ink-100 bg-ink-50 px-5 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
            Price breakdown
          </p>
        </div>
        <div className="divide-y divide-ink-100">
          {breakdown.lineItems.map((line) => (
            <div key={line.label} className="flex items-start justify-between gap-4 px-5 py-3.5">
              <div>
                <p className="text-sm text-ink-800">{line.label}</p>
                {line.detail && <p className="text-xs text-ink-400">{line.detail}</p>}
              </div>
              <p className="shrink-0 text-sm font-medium text-ink-900">
                {formatGBP(line.amount)}
              </p>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-ink-100 bg-ink-50 px-5 py-3.5">
          <p className="text-sm font-semibold text-ink-900">Standard total</p>
          <p className="text-sm font-semibold text-ink-900">{formatGBP(breakdown.subtotal)}</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setPaymentOption("pay_now")}
          className={[
            "rounded-card border-2 p-5 text-left transition-colors",
            paymentOption === "pay_now"
              ? "border-brand-600 bg-brand-50"
              : "border-ink-200 bg-white hover:border-ink-300",
          ].join(" ")}
        >
          <span className="inline-block rounded-full bg-gold-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-gold-700">
            Save {formatGBP(breakdown.payOnDaySurcharge)}
          </span>
          <p className="mt-3 text-sm font-semibold text-ink-900">Pay now</p>
          <p className="mt-1 text-2xl font-semibold text-brand-700">
            {formatGBP(breakdown.payNowTotal)}
          </p>
          <p className="mt-1 text-xs text-ink-500">Paid securely online today</p>
        </button>

        <button
          type="button"
          onClick={() => setPaymentOption("pay_on_day")}
          className={[
            "rounded-card border-2 p-5 text-left transition-colors",
            paymentOption === "pay_on_day"
              ? "border-brand-600 bg-brand-50"
              : "border-ink-200 bg-white hover:border-ink-300",
          ].join(" ")}
        >
          <span className="inline-block rounded-full bg-ink-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-ink-500">
            +{formatGBP(breakdown.payOnDaySurcharge)}
          </span>
          <p className="mt-3 text-sm font-semibold text-ink-900">Pay on the day</p>
          <p className="mt-1 text-2xl font-semibold text-ink-900">
            {formatGBP(breakdown.payOnDayTotal)}
          </p>
          <p className="mt-1 text-xs text-ink-500">Pay the crew when they arrive</p>
        </button>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => onAccept(paymentOption)}
          className="btn-primary w-full sm:w-auto"
        >
          Accept quote{paymentOption === "pay_now" ? " & pay now" : ""}
        </button>
        <a href="tel:+441234567890" className="btn-outline w-full sm:w-auto">
          <Phone className="h-4 w-4" />
          Call to discuss instead
        </a>
      </div>
      <p className="mt-3 text-xs text-ink-400">
        This quote is an estimate based on the details provided and isn&rsquo;t a
        final invoice. No payment is taken until you confirm.
        {property.journeyMiles == null && schedule.vanSize !== "none" &&
          " We couldn't confirm the journey between your addresses yet, so van fuel may be adjusted once both postcodes are confirmed."}
      </p>
    </div>
  );
}
