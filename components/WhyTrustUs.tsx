import { ClipboardList, PhoneCall, Receipt, ShieldCheck } from "lucide-react";

const POINTS = [
  {
    icon: ShieldCheck,
    title: "Fully insured, every move",
    description:
      "We carry goods-in-transit insurance and every crew member is DBS-checked, so your belongings - and your home - are covered from the moment we arrive.",
  },
  {
    icon: Receipt,
    title: "See exactly what you're paying for",
    description:
      "No lump-sum guesswork. Your quote breaks down every fee - packing, access, van hire and journey fuel - so there's nothing hidden and nothing to question later.",
  },
  {
    icon: ClipboardList,
    title: "A checklist, not a guess",
    description:
      "Every item you upload becomes a line on a checklist the crew ticks off on the day, and you get a copy - so nothing gets missed or mixed up.",
  },
  {
    icon: PhoneCall,
    title: "A real person, one call away",
    description:
      "Not sure about your quote? Call us before you book - we'll talk it through rather than leaving you to accept a number on a screen.",
  },
];

export function WhyTrustUs() {
  return (
    <section className="border-b border-ink-100 py-16 sm:py-20">
      <div className="container-page">
        <h2 className="text-3xl font-semibold tracking-tight text-ink-900">
          Why customers choose us
        </h2>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {POINTS.map((point) => (
            <div key={point.title} className="card flex gap-4 p-6">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-brand-50">
                <point.icon className="h-5 w-5 text-brand-700" />
              </span>
              <div>
                <h3 className="text-base font-semibold text-ink-900">{point.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-500">
                  {point.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
