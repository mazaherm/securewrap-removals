import { BadgeCheck, ClipboardCheck, ShieldCheck, Users } from "lucide-react";

const POINTS = [
  { icon: ShieldCheck, label: "Goods-in-transit insured" },
  { icon: Users, label: "DBS-checked crews" },
  { icon: ClipboardCheck, label: "Itemised packing checklist" },
  { icon: BadgeCheck, label: "No hidden fees" },
];

export function TrustBar() {
  return (
    <section className="border-b border-ink-100 bg-brand-800 py-8">
      <div className="container-page grid grid-cols-2 gap-6 sm:grid-cols-4">
        {POINTS.map((point) => (
          <div key={point.label} className="flex items-center gap-2.5">
            <point.icon className="h-5 w-5 shrink-0 text-gold-300" />
            <span className="text-sm font-medium text-brand-50">
              {point.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
