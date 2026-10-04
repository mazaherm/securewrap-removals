import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { emailHref, phoneHref, site } from "@/lib/site";

export const metadata: Metadata = {
  title: `Contact | ${site.name}`,
  description: `Get in touch with ${site.name} for a quote or to discuss your move.`,
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
                <a href={phoneHref} className="text-sm text-ink-500 hover:text-brand-700">
                  {site.phoneDisplay}
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
                  href={emailHref}
                  className="text-sm text-ink-500 hover:text-brand-700"
                >
                  {site.email}
                </a>
              </div>
            </li>
            
            <li className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-brand-50">
                <Clock className="h-5 w-5 text-brand-700" />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink-900">Opening hours</p>
                <p className="text-sm text-ink-500">{site.hours.weekdays}</p>
                <p className="text-sm text-ink-500">{site.hours.weekend}</p>
              </div>
            </li>
          </ul>
        </div>

        <div className="card p-8">
          <h2 className="text-lg font-semibold text-ink-900">Get an instant quote instead</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-500">
            Upload photos of what needs wrapping, tell us about your move,
            and get a price in minutes - pay now to lock in the quote, or
            pay on the day for £150 more.
          </p>
          <Link href="/quote" className="btn-primary mt-6">
            Start your quote
          </Link>
        </div>
      </div>
    </section>
  );
}
