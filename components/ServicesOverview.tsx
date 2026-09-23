import { Archive, Boxes, Sofa, Truck } from "lucide-react";

const SERVICES = [
  {
    icon: Sofa,
    title: "Furniture wrapping",
    description:
      "Sofas, wardrobes, tables and beds wrapped in quilted furniture blankets or shrink wrap to prevent scuffs and moisture damage.",
  },
  {
    icon: Boxes,
    title: "Boxing & bubble wrap",
    description:
      "Crockery, electronics and fragile items individually bubble-wrapped and boxed with void-fill for a secure fit.",
  },
  {
    icon: Archive,
    title: "Storage-ready packing",
    description:
      "Extra protection for items heading into long-term storage, including moisture-resistant wrapping on request.",
  },
  {
    icon: Truck,
    title: "Van hire & driver",
    description:
      "Need transport too? Add a van sized to your move — hire, fuel and a driver are all included in one price.",
  },
];

export function ServicesOverview() {
  return (
    <section className="border-b border-ink-100 py-16 sm:py-20">
      <div className="container-page">
        <div className="max-w-2xl">
          <span className="section-eyebrow">What we do</span>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-ink-900">
            Protection built around what you&rsquo;re moving
          </h2>
          <p className="mt-3 text-ink-500">
            Every item is wrapped to match its size, weight and fragility —
            so nothing arrives at your new home or storage unit with a
            scratch.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map((service) => (
            <div key={service.title} className="card p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-md bg-brand-50">
                <service.icon className="h-5 w-5 text-brand-700" />
              </span>
              <h3 className="mt-4 text-base font-semibold text-ink-900">
                {service.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">
                {service.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
