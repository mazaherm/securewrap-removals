import Link from "next/link";
import { FileCheck, Globe, Truck } from "lucide-react";

export function Hero() {
  return (
    <section className="border-b border-ink-100 bg-gradient-to-b from-brand-50/70 to-white">
      <div className="container-page grid grid-cols-1 items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
        <div>
          <span className="section-eyebrow">Packing &amp; moving specialists</span>
          <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight text-ink-900 sm:text-5xl">
            Packing and moving you can trust
          </h1>
          <p className="mt-2 text-lg font-medium leading-snug text-ink-600 sm:text-xl">
            including export packing if you&rsquo;re going abroad.
          </p>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-500">
            SecureWrap is a packing and moving service. We wrap, pack and
            move your belongings across the UK - and we specialise in
            packing for export when you&rsquo;re relocating overseas. Upload
            photos, tell us what each item is, and get an instant quote.
          </p>
          <p className="mt-2 text-sm text-ink-400">
            Based in Milton Keynes (MK13 0BG), covering the UK nationwide.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/quote" className="btn-primary">
              Get your instant quote
            </Link>
            <a href="tel:+441234567890" className="btn-outline">
              Call 0123 456 7890
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
            <div className="space-y-4 p-6">
              {[
                { label: "3-seat sofa - Furniture blanket, Large", price: "£19.50" },
                { label: "Dining table - Bubble wrap, Large", price: "£15.00" },
                { label: "6× kitchen boxes - Packing paper, Small", price: "£24.00" },
                { label: "Medium van hire", price: "£200.00" },
                { label: "Van fuel (journey, est.)", price: "£18.50" },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between text-sm">
                  <span className="pr-4 text-ink-600">{row.label}</span>
                  <span className="shrink-0 font-medium text-ink-900">{row.price}</span>
                </div>
              ))}
              <div className="border-t border-ink-100 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-ink-900">Pay now total</span>
                  <span className="text-lg font-semibold text-brand-700">£255.76</span>
                </div>
                <p className="mt-1 text-xs text-ink-400">or £405.76 if you pay on the day</p>
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
