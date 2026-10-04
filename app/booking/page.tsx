import type { Metadata } from "next";
import { BookingLookup } from "@/components/booking/BookingLookup";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `My booking | ${site.name}`,
  description: `Look up your ${site.name} booking with your reference and home postcode.`,
};

export default function BookingPage() {
  return (
    <section className="py-16 sm:py-20">
      <div className="container-page">
        <BookingLookup />
      </div>
    </section>
  );
}
