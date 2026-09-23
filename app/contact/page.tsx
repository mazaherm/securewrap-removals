import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Mail, MapPin, Phone } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact | SecureWrap Removals",
  description: "Get in touch with SecureWrap Removals for a quote or to discuss your move.",
};

export default function ContactPage() {
  return (
    <section className="py-16 sm:py-20">
      <div className="container-page grid grid-cols-1 gap-12 lg:grid-cols-2">
        <div>
          <span className="section-eyebrow">Contact us</span>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
            Talk to the team
          </h1>
          <p className="mt-3 max-w-md text-ink-500">
            Prefer to talk it through? Call us directly, or start an online
            quote and call to finalise the details.
          </p>

          <ul className="mt-8 space-y-5">
            <li className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-brand-50">
                <Phone className="h-5 w-5 text-brand-700" />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink-900">Phone</p>
                <a href="tel:+441234567890" className="text-sm text-ink-500 hover:text-brand-700">
                  0123 456 7890
                </a>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-brand-50">
                <Mail className="h-5 w-5 text-brand-700" />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink-900">Email</p>
                <a
                  href="mailto:bookings@securewrapremovals.co.uk"
                  className="text-sm text-ink-500 hover:text-brand-700"
                >
                  bookings@securewrapremovals.co.uk
                </a>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-brand-50">
                <MapPin className="h-5 w-5 text-brand-700" />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink-900">Depot</p>
                <p className="text-sm text-ink-500">12 Silbury Boulevard, Milton Keynes, MK9 2AF</p>
                <p className="mt-1 text-xs text-ink-400">Nationwide coverage — travel cost scales with distance from base</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-brand-50">
                <Clock className="h-5 w-5 text-brand-700" />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink-900">Opening hours</p>
                <p className="text-sm text-ink-500">Mon – Fri: 7:30 – 19:00</p>
                <p className="text-sm text-ink-500">Sat – Sun: 8:00 – 17:00</p>
              </div>
            </li>
          </ul>
        </div>

        <div className="card p-8">
          <h2 className="text-lg font-semibold text-ink-900">Get an instant quote instead</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-500">
            Upload photos of what needs wrapping, tell us about your move,
            and get a price in minutes — with the option to pay now for a
            lower rate or pay on the day.
          </p>
          <Link href="/quote" className="btn-primary mt-6">
            Start your quote
          </Link>
        </div>
      </div>
    </section>
  );
}
