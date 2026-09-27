"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { formatGBP } from "@/lib/pricing";
import type { PublicBooking } from "@/lib/publicBooking";

const BOOKINGS_EMAIL = "bookings@securewrapremovals.co.uk";

type LookupError = "not_found" | "rate_limited" | "unavailable" | null;

function formatMoveDate(value: string): string {
  if (!value) return "Date to be confirmed";
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export function BookingLookup() {
  const [bookingRef, setBookingRef] = useState("");
  const [postcode, setPostcode] = useState("");
  const [booking, setBooking] = useState<PublicBooking | null>(null);
  const [lookupError, setLookupError] = useState<LookupError>(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [message, setMessage] = useState("");
  const [changeError, setChangeError] = useState<LookupError | "invalid" | null>(null);
  const [changeSent, setChangeSent] = useState(false);
  const [sendingChange, setSendingChange] = useState(false);

  async function handleLookup(event: FormEvent) {
    event.preventDefault();
    setLookingUp(true);
    setLookupError(null);
    setBooking(null);
    setChangeSent(false);
    setChangeError(null);
    try {
      const response = await fetch("/api/booking/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingRef, postcode }),
      });
      const data = await response.json();
      if (!response.ok || !data.booking) {
        setLookupError(data.error === "rate_limited" || data.error === "unavailable" ? data.error : "not_found");
        return;
      }
      setBooking(data.booking);
    } catch {
      setLookupError("unavailable");
    } finally {
      setLookingUp(false);
    }
  }

  async function handleChange(event: FormEvent) {
    event.preventDefault();
    if (!booking) return;
    setSendingChange(true);
    setChangeError(null);
    try {
      const response = await fetch("/api/booking/change-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingRef, postcode, message }),
      });
      const data = await response.json();
      if (!response.ok) {
        setChangeError(
          data.error === "rate_limited" || data.error === "unavailable" || data.error === "invalid"
            ? data.error
            : "not_found"
        );
        return;
      }
      setChangeSent(true);
      setMessage("");
    } catch {
      setChangeError("unavailable");
    } finally {
      setSendingChange(false);
    }
  }

  const mailto = `mailto:${BOOKINGS_EMAIL}?subject=${encodeURIComponent(
    `Change request — ${booking?.bookingRef ?? bookingRef}`
  )}`;

  return (
    <div className="mx-auto max-w-2xl">
      <span className="section-eyebrow">My booking</span>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink-900">Find your booking</h1>
      <p className="mt-3 text-sm leading-relaxed text-ink-500">
        Enter your booking reference and the postcode of the home you&rsquo;re moving from. You don&rsquo;t need an account.
      </p>

      <form onSubmit={handleLookup} className="card mt-8 space-y-4 p-6">
        <div>
          <label className="field-label" htmlFor="booking-ref">
            Booking reference
          </label>
          <input
            id="booking-ref"
            className="field-input uppercase"
            value={bookingRef}
            onChange={(event) => setBookingRef(event.target.value)}
            placeholder="SW-XXXXX"
            autoComplete="off"
            required
          />
        </div>
        <div>
          <label className="field-label" htmlFor="home-postcode">
            Home postcode
          </label>
          <input
            id="home-postcode"
            className="field-input uppercase"
            value={postcode}
            onChange={(event) => setPostcode(event.target.value)}
            placeholder="MK13 0BG"
            autoComplete="postal-code"
            required
          />
        </div>
        <button type="submit" className="btn-primary w-full sm:w-auto" disabled={lookingUp}>
          {lookingUp ? "Looking up…" : "View booking"}
        </button>
        {lookupError === "not_found" && (
          <p className="text-sm text-ink-600">We couldn&rsquo;t find a booking with that reference and postcode.</p>
        )}
        {lookupError === "rate_limited" && (
          <p className="text-sm text-ink-600">Too many attempts. Wait a few minutes and try again.</p>
        )}
        {lookupError === "unavailable" && (
          <p className="text-sm text-ink-600">
            Booking lookup isn&rsquo;t available right now. Email{" "}
            <a className="font-medium text-brand-700" href={`mailto:${BOOKINGS_EMAIL}`}>
              {BOOKINGS_EMAIL}
            </a>{" "}
            with your reference.
          </p>
        )}
      </form>

      {booking && (
        <div className="mt-8 space-y-6">
          <div className="card p-6">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-ink-100 pb-4">
              <div>
                <p className="text-sm font-semibold text-ink-900">{booking.customerName}</p>
                <p className="mt-1 text-sm text-ink-600">{formatMoveDate(booking.moveDate)}</p>
                <p className="text-xs text-ink-500">{booking.timeSlot}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-ink-900">{formatGBP(booking.amountDue)}</p>
                <p className="text-xs text-ink-500">{booking.paymentLabel}</p>
                <p className="mt-1 text-xs font-medium text-ink-700">{booking.bookingRef}</p>
              </div>
            </div>

            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-ink-400">From</dt>
                <dd className="text-ink-800">{booking.pickup || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-ink-400">To</dt>
                <dd className="text-ink-800">{booking.destination || "—"}</dd>
                <dd className="text-xs text-ink-500">{booking.destinationType}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-ink-400">Van</dt>
                <dd className="text-ink-800">{booking.van || "—"}</dd>
              </div>
            </dl>

            <div className="mt-5">
              <p className="text-sm font-medium text-ink-900">
                Items ({booking.items.length})
              </p>
              <ul className="mt-2 divide-y divide-ink-50">
                {booking.items.map((item, index) => (
                  <li key={`${item.label}-${index}`} className="py-2 text-sm">
                    <p className="font-medium text-ink-800">{item.label || item.type}</p>
                    <p className="text-xs text-ink-500">
                      {item.type}
                      {item.wrap ? ` · ${item.wrap}` : ""}
                      {item.size ? ` · ${item.size}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            </div>

            {booking.lineItems.length > 0 && (
              <ul className="mt-4 space-y-1 border-t border-ink-100 pt-4 text-sm">
                {booking.lineItems.map((line) => (
                  <li key={line.label} className="flex justify-between gap-4 text-ink-600">
                    <span>{line.label}</span>
                    <span>{formatGBP(line.amount)}</span>
                  </li>
                ))}
              </ul>
            )}

            <Link href={booking.checklistPath} className="btn-outline mt-5">
              Open checklist
            </Link>
          </div>

          <div className="card p-6">
            <h2 className="text-base font-semibold text-ink-900">Add or remove items</h2>
            <p className="mt-1 text-sm leading-relaxed text-ink-500">
              Tell us what to add or remove. We&rsquo;ll confirm the updated price before anything changes. For date or address changes, use the same form or{" "}
              <Link href="/contact" className="font-medium text-brand-700">
                contact us
              </Link>
              .
            </p>
            {changeSent ? (
              <p className="mt-4 text-sm text-brand-700">Request sent. We&rsquo;ll email you to confirm.</p>
            ) : (
              <form onSubmit={handleChange} className="mt-4 space-y-3">
                <label className="field-label" htmlFor="change-message">
                  What should we change?
                </label>
                <textarea
                  id="change-message"
                  className="field-input min-h-28"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  maxLength={2000}
                  required
                  minLength={10}
                  placeholder="For example: please add a second sofa, and remove the coffee table."
                />
                <button type="submit" className="btn-primary" disabled={sendingChange}>
                  {sendingChange ? "Sending…" : "Request a change"}
                </button>
                {changeError === "invalid" && (
                  <p className="text-sm text-ink-600">Add a short note of at least 10 characters.</p>
                )}
                {changeError === "rate_limited" && (
                  <p className="text-sm text-ink-600">Too many requests. Try again later, or email us.</p>
                )}
                {(changeError === "unavailable" || changeError === "not_found") && (
                  <p className="text-sm text-ink-600">
                    We couldn&rsquo;t send that just now. Email{" "}
                    <a className="font-medium text-brand-700" href={mailto}>
                      {BOOKINGS_EMAIL}
                    </a>{" "}
                    with your booking reference.
                  </p>
                )}
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
