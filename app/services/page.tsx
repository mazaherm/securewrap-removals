import type { Metadata } from "next";
import Link from "next/link";
import { WRAP_OPTIONS, VAN_OPTIONS } from "@/lib/pricing";
import { CallToAction } from "@/components/CallToAction";

export const metadata: Metadata = {
  title: "Services | SecureWrap Removals",
  description:
    "Wrapping options, van hire and packing services offered by SecureWrap Removals.",
};

export default function ServicesPage() {
  return (
    <>
      <section className="border-b border-ink-100 bg-ink-50/60 py-14">
        <div className="container-page">
          <span className="section-eyebrow">Services</span>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
            Wrapping, packing and transport for every kind of move
          </h1>
          <p className="mt-3 max-w-2xl text-ink-500">
            Choose exactly the level of protection each item needs. Prices
            are calculated automatically from what you select in the quote
            tool. We&rsquo;re based in Milton Keynes and travel nationwide —
            jobs more than 40 miles from our base carry a slightly higher
            service rate to cover crew travel time.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container-page">
          <h2 className="text-xl font-semibold text-ink-900">Wrapping options</h2>
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
            {WRAP_OPTIONS.map((wrap) => (
              <div key={wrap.value} className="card p-6">
                <h3 className="text-base font-semibold text-ink-900">{wrap.label}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">
                  {wrap.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-ink-100 bg-ink-50/60 py-16">
        <div className="container-page">
          <h2 className="text-xl font-semibold text-ink-900">Van hire</h2>
          <p className="mt-2 max-w-2xl text-sm text-ink-500">
            Van hire is priced in three parts, worked out from your actual
            address: an estimated vehicle hire fee, real round-trip fuel
            cost, and driver time (including help unloading at your door).
            We hire vans from a trusted transport partner and confirm the
            exact figure nearer your move date — and we&rsquo;ll suggest a
            size based on what you&rsquo;re moving, so you&rsquo;re never
            paying for more van than you need.
          </p>
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
            {VAN_OPTIONS.filter((v) => v.value !== "none").map((van) => (
              <div key={van.value} className="card p-6">
                <h3 className="text-base font-semibold text-ink-900">{van.label}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">
                  {van.description}
                </p>
                <p className="mt-4 text-sm font-semibold text-brand-700">
                  £{van.hireFeeMin.toFixed(2)} – £{van.hireFeeMax.toFixed(2)} (est. hire, plus fuel &amp; driver)
                </p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-sm text-ink-500">
            Not sure what you need?{" "}
            <Link href="/quote" className="font-medium text-brand-700 underline underline-offset-2">
              Start a quote
            </Link>{" "}
            and we&rsquo;ll size it to your property automatically.
          </p>
        </div>
      </section>

      <CallToAction />
    </>
  );
}
