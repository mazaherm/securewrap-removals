import Link from "next/link";

export function CallToAction() {
  return (
    <section className="py-16 sm:py-20">
      <div className="container-page">
        <div className="flex flex-col items-start justify-between gap-6 rounded-card border border-ink-100 bg-white p-8 shadow-card sm:flex-row sm:items-center sm:p-10">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-ink-900">
              Ready to see your price?
            </h2>
            <p className="mt-2 max-w-md text-sm text-ink-500">
              It takes a few minutes to upload your items and get an instant,
              no-obligation quote.
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link href="/quote" className="btn-primary">
              Get your instant quote
            </Link>
            <a href="tel:+441234567890" className="btn-outline">
              Call 0123 456 7890
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
