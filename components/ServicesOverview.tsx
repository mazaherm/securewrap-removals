const STEPS = [
  {
    number: "01",
    title: "Pack, wrap and box",
    description: "We pack, wrap and box your belongings, and can dismantle furniture such as tables and beds.",
  },
  {
    number: "02",
    title: "Load the van",
    description: "We load everything ready for the journey.",
  },
  {
    number: "03",
    title: "Transport",
    description: "We take it from your collection address to the destination.",
  },
  {
    number: "04",
    title: "Unload",
    description: "We unload at the other end.",
  },
  {
    number: "05",
    title: "Unpack and reassemble",
    description: "We unpack, unwrap and unbox, and put furniture back together.",
  },
];

export function ServicesOverview() {
  return (
    <section className="border-b border-ink-100 py-16 sm:py-20">
      <div className="container-page">
        <div className="max-w-2xl">
          <span className="section-eyebrow">What we do</span>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-ink-900">
            Pack it, move it, and set it back up
          </h2>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.map((step) => (
            <div key={step.number}>
              <span className="text-3xl font-semibold text-brand-200">{step.number}</span>
              <h3 className="mt-3 text-base font-semibold text-ink-900">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
