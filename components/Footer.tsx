import Link from "next/link";
import { Clock, Mail, MapPin, Package, Phone } from "lucide-react";
import { depotLine, emailHref, phoneHref, site } from "@/lib/site";

export function Footer() {
  return (
    <footer className="border-t border-ink-100 bg-ink-50">
      <div className="container-page grid grid-cols-1 gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-700">
              <Package className="h-4 w-4 text-gold-300" />
            </span>
            <span className="text-sm font-semibold text-ink-900">{site.name}</span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-ink-500">
            Packing and moving specialists - including export packing if
            you&rsquo;re relocating abroad. Based in {site.address.city},
            covering the UK nationwide.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-ink-900">Company</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-ink-500">
            <li>
              <Link href="/services" className="hover:text-brand-700">
                Our services
              </Link>
            </li>
            <li>
              <Link href="/quote" className="hover:text-brand-700">
                Get a quote
              </Link>
            </li>
            <li>
              <Link href="/booking" className="hover:text-brand-700">
                My booking
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-brand-700">
                Contact us
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-ink-900">Contact</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-ink-500">
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-brand-600" />
              <a href={phoneHref} className="hover:text-brand-700">
                {site.phoneDisplay}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-brand-600" />
              <a href={emailHref} className="hover:text-brand-700">
                {site.email}
              </a>
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
              <span>{depotLine()}</span>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-ink-900">Opening hours</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-ink-500">
            <li className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-brand-600" />
              {site.hours.weekdays}
            </li>
            <li className="flex items-center gap-2 pl-6">{site.hours.weekend}</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-ink-100">
        <div className="container-page flex flex-col items-center justify-between gap-3 py-5 text-xs text-ink-400 sm:flex-row">
          <span>© {new Date().getFullYear()} {site.legalName}. All rights reserved.</span>
          <span>Company No. {site.companyNumber} · {site.credentials}</span>
        </div>
      </div>
    </footer>
  );
}
