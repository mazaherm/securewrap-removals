"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, Package, Phone, X } from "lucide-react";

const NAV_LINKS = [
  { href: "/services", label: "Services" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-brand-800 bg-brand-700">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-white">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-gold-400">
            <Package className="h-5 w-5 text-ink-900" strokeWidth={2.25} />
          </span>
          <span className="text-base font-semibold tracking-tight">
            SecureWrap <span className="font-normal text-brand-100">Removals</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-brand-50 transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <a
            href="tel:+441234567890"
            className="flex items-center gap-1.5 text-sm font-medium text-brand-50 hover:text-white"
          >
            <Phone className="h-4 w-4" />
            0123 456 7890
          </a>
          <Link href="/quote" className="btn-gold">
            Get a quote
          </Link>
        </div>

        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-md text-white md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-brand-800 bg-brand-700 px-5 pb-5 pt-2 md:hidden">
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md px-3 py-2.5 text-sm font-medium text-brand-50 hover:bg-brand-600 hover:text-white"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <a
              href="tel:+441234567890"
              className="flex items-center gap-1.5 rounded-md px-3 py-2.5 text-sm font-medium text-brand-50 hover:bg-brand-600 hover:text-white"
            >
              <Phone className="h-4 w-4" />
              0123 456 7890
            </a>
            <Link href="/quote" className="btn-gold mt-2 w-full" onClick={() => setOpen(false)}>
              Get a quote
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
