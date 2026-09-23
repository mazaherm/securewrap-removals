const STEPS = [
  {
    number: "01",
    title: "Upload photos",
    description: "Add a photo of each item you need wrapped — furniture, appliances, boxes and more.",
  },
  {
    number: "02",
    title: "Choose protection",
    description: "Pick the wrap type and size for every item, based on what it is and how fragile it is.",
  },
  {
    number: "03",
    title: "Set your move",
    description: "Tell us your address, property details, moving date and whether you need a van.",
  },
  {
    number: "04",
    title: "Confirm your quote",
    description: "Get an instant price with two payment options, then accept online or call us to talk it through.",
  },
];

export function HowItWorks() {
  return (
    <section className="border-b border-ink-100 bg-ink-50/60 py-16 sm:py-20">
      <div className="container-page">
        <div className="max-w-2xl">
          <span className="section-eyebrow">How it works</span>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-ink-900">
            A quote in four simple steps
          </h2>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => (
            <div key={step.number}>
              <span className="text-3xl font-semibold text-brand-200">
                {step.number}
              </span>
              <h3 className="mt-3 text-base font-semibold text-ink-900">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
