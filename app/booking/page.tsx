import type { Metadata } from "next";
import { BookingLookup } from "@/components/booking/BookingLookup";

export const metadata: Metadata = {
  title: "My booking | SecureWrap Removals",
  description: "Look up your SecureWrap booking with your reference and home postcode.",
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
