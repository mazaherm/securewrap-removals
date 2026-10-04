import Link from "next/link";
import { FileCheck, Globe, Truck } from "lucide-react";
import { calculateQuote, formatGBP } from "@/lib/pricing";
import { depotLabel, phoneHref, site } from "@/lib/site";
import type { PropertyDetails, QuoteItem, ScheduleDetails } from "@/lib/types";

const SAMPLE_ITEM_COUNT = 4;

const sampleItems: QuoteItem[] = Array.from({ length: SAMPLE_ITEM_COUNT }, (_, index) => ({
  id: `sample-${index}`,
  photoName: "",
  photoUrl: "",
  label: "",
  notes: "",
}));

const sampleProperty: PropertyDetails = {
  addressLine1: "",
  addressLine2: "",
  city: "",
  postcode: "",
  propertyType: "house",
  floors: 1,
  hasLift: false,
  rooms: 2,
  destinationType: "new_home",
  destinationAddressLine1: "",
  destinationAddressLine2: "",
  destinationCity: "",
  destinationPostcode: "",
  distanceMiles: 6,
  distanceApproximate: false,
  journeyMiles: 28,
  journeyApproximate: false,
};

/** A Wednesday, so the sample stays on the standard rate. */
const sampleSchedule: ScheduleDetails = {
  date: "2026-11-04",
  timeSlot: "morning",
  vanSize: "small",
  dismantleFurniture: false,
};

const sampleQuote = calculateQuote(sampleItems, sampleProperty, sampleSchedule);

export function Hero() {
  return (
    <section className="border-b border-ink-100 bg-gradient-to-b from-brand-50/70 to-white">
      <div className="container-page grid grid-cols-1 items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
        <div>
          <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight text-ink-900 sm:text-5xl">
            Packing and moving you can trust
          </h1>
          <p className="mt-2 text-lg font-medium leading-snug text-ink-600 sm:text-xl">
            including export packing when you&rsquo;re moving abroad.
          </p>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-500">
            We wrap, pack and
            move your belongings across the UK - and we specialise in
            packing for export when you&rsquo;re relocating overseas.
          </p>
          <p className="mt-2 text-base leading-relaxed text-ink-500">
            Get an instant quote now.
          </p>
          <p className="mt-2 text-sm text-ink-400">
            Based in {depotLabel()}, covering the UK nationwide.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/quote" className="btn-primary">
              Get your instant quote
            </Link>
            <a href={phoneHref} className="btn-outline">
              Call {site.phoneDisplay}
            </a>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-5 border-t border-ink-100 pt-8 sm:grid-cols-3">
            <div className="flex items-start gap-2.5">
              <Globe className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
              <div>
                <p className="text-sm font-semibold text-ink-900">Export packing</p>
                <p className="text-xs text-ink-500">Specialist for moves abroad</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Truck className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
              <div>
                <p className="text-sm font-semibold text-ink-900">Van optional</p>
                <p className="text-xs text-ink-500">Fixed hire + journey fuel</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <FileCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
              <div>
                <p className="text-sm font-semibold text-ink-900">Transparent pricing</p>
                <p className="text-xs text-ink-500">Full itemised quote</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="card overflow-hidden">
            <div className="border-b border-ink-100 bg-ink-50 px-5 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                Sample quote
              </p>
            </div>
            <div className="divide-y divide-ink-100">
              {sampleQuote.lineItems.map((line) => (
                <div key={line.label} className="flex items-start justify-between gap-4 px-5 py-3.5">
                  <div>
                    <p className="text-sm text-ink-800">{line.label}</p>
                    {line.detail && <p className="text-xs text-ink-400">{line.detail}</p>}
                  </div>
                  <p className="shrink-0 text-sm font-medium text-ink-900">{formatGBP(line.amount)}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-ink-100 bg-ink-50 px-5 py-3.5">
              <p className="text-sm font-semibold text-ink-900">Standard total</p>
              <p className="text-sm font-semibold text-ink-900">{formatGBP(sampleQuote.subtotal)}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 p-4">
              <div className="rounded-md border border-brand-600 bg-brand-50 px-3 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gold-700">
                  Pay now
                </p>
                <p className="mt-1 text-lg font-semibold text-brand-700">
                  {formatGBP(sampleQuote.payNowTotal)}
                </p>
              </div>
              <div className="rounded-md border border-ink-200 px-3 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                  Pay on the day
                </p>
                <p className="mt-1 text-lg font-semibold text-ink-900">
                  {formatGBP(sampleQuote.payOnDayTotal)}
                </p>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-4 -right-4 hidden rounded-card bg-gold-400 px-4 py-2.5 text-xs font-semibold text-ink-900 shadow-panel sm:block">
            Instant, no obligation
          </div>
        </div>
      </div>
    </section>
  );
}
