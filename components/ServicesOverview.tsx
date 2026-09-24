import { Archive, Boxes, Globe, Truck } from "lucide-react";

const SERVICES = [
  {
    icon: Boxes,
    title: "Packing & wrapping",
    description:
      "Furniture, boxes and fragile items packed and protected for the journey - whether that's across town or into storage.",
  },
  {
    icon: Globe,
    title: "Export packing",
    description:
      "Specialist packing for customers moving abroad: export-grade wrapping, boxing and preparation so belongings travel safely overseas.",
  },
  {
    icon: Archive,
    title: "Storage-ready packing",
    description:
      "Extra protection for items heading into long-term storage, including moisture-resistant wrapping on request.",
  },
  {
    icon: Truck,
    title: "Moving & van hire",
    description:
      "Need transport too? Small, medium or large van at a fixed hire price - fuel is added from your collection-to-destination journey.",
  },
];

export function ServicesOverview() {
  return (
    <section className="border-b border-ink-100 py-16 sm:py-20">
      <div className="container-page">
        <div className="max-w-2xl">
          <span className="section-eyebrow">What we do</span>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-ink-900">
            Packing and moving, with export packing as our specialism
          </h2>
          <p className="mt-3 text-ink-500">
            We&rsquo;re a packing and moving company first. If you&rsquo;re
            relocating overseas, we specialise in packing for export so
            everything is protected for a longer journey.
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
