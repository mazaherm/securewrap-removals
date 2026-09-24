import type { Metadata } from "next";
import Link from "next/link";
import { WRAP_OPTIONS, VAN_OPTIONS, formatGBP } from "@/lib/pricing";
import { CallToAction } from "@/components/CallToAction";

export const metadata: Metadata = {
  title: "Services | SecureWrap Removals",
  description:
    "Packing, moving, export packing and van hire from SecureWrap Removals.",
};

export default function ServicesPage() {
  return (
    <>
      <section className="border-b border-ink-100 bg-ink-50/60 py-14">
        <div className="container-page">
          <span className="section-eyebrow">Services</span>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
            Packing, moving and specialist export packing
          </h1>
          <p className="mt-3 max-w-2xl text-ink-500">
            We&rsquo;re a packing and moving service. Choose the protection
            each item needs — and if you&rsquo;re relocating overseas, we
            specialise in packing for export. Prices are calculated from
            what you select in the quote tool. We&rsquo;re based in Milton
            Keynes (MK13 0BG) and travel nationwide — jobs more than 40
            miles from our base carry a slightly higher service rate to
            cover crew travel time.
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

      <section className="border-t border-ink-100 py-16">
        <div className="container-page">
          <h2 className="text-xl font-semibold text-ink-900">Export packing</h2>
          <p className="mt-2 max-w-2xl text-sm text-ink-500">
            If you&rsquo;re moving abroad, this is our specialism. We pack
            and protect belongings to export standard so they travel safely
            — then, if you need it, we can take them to a UK freight depot,
            port or packing warehouse. Overseas shipping itself is arranged
            separately; tell us you&rsquo;re moving abroad in the quote and
            we&rsquo;ll take it from there.
          </p>
        </div>
      </section>

      <section className="border-t border-ink-100 bg-ink-50/60 py-16">
        <div className="container-page">
          <h2 className="text-xl font-semibold text-ink-900">Van hire</h2>
          <p className="mt-2 max-w-2xl text-sm text-ink-500">
            Van hire is a fixed price. Fuel is added from your actual
            journey: collection address to destination, then back to our
            MK13 0BG depot. We&rsquo;ll suggest a size based on what
            you&rsquo;re moving, so you&rsquo;re never paying for more van
            than you need.
          </p>
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
            {VAN_OPTIONS.filter((v) => v.value !== "none").map((van) => (
              <div key={van.value} className="card p-6">
                <h3 className="text-base font-semibold text-ink-900">{van.label}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">
                  {van.description}
                </p>
                <p className="mt-4 text-sm font-semibold text-brand-700">
                  {formatGBP(van.hireFee)} + fuel
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
