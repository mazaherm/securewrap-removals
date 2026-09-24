import Link from "next/link";
import { Clock, Mail, MapPin, Package, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-ink-100 bg-ink-50">
      <div className="container-page grid grid-cols-1 gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-700">
              <Package className="h-4 w-4 text-gold-300" />
            </span>
            <span className="text-sm font-semibold text-ink-900">SecureWrap Removals</span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-ink-500">
            Packing and moving specialists - including export packing if
            you&rsquo;re relocating abroad. Based in Milton Keynes,
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
              <a href="tel:+441234567890" className="hover:text-brand-700">
                0123 456 7890
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-brand-600" />
              <a href="mailto:bookings@securewrapremovals.co.uk" className="hover:text-brand-700">
                bookings@securewrapremovals.co.uk
              </a>
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
              <span>Milton Keynes, MK13 0BG</span>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-ink-900">Opening hours</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-ink-500">
            <li className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-brand-600" />
              Mon – Fri: 7:30 – 19:00
            </li>
            <li className="flex items-center gap-2 pl-6">Sat – Sun: 8:00 – 17:00</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-ink-100">
        <div className="container-page flex flex-col items-center justify-between gap-3 py-5 text-xs text-ink-400 sm:flex-row">
          <span>© {new Date().getFullYear()} SecureWrap Removals Ltd. All rights reserved.</span>
          <span>Company No. 00000000 · Fully insured &amp; DBS-checked crews</span>
        </div>
      </div>
    </footer>
  );
}
