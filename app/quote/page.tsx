import type { Metadata } from "next";
import { QuoteWizard } from "@/components/quote/QuoteWizard";

export const metadata: Metadata = {
  title: "Get a quote | SecureWrap Removals",
  description:
    "Upload photos of your items, choose your wrapping, and get an instant quote for your move.",
};

export default function QuotePage() {
  return (
    <div className="border-b border-ink-100 bg-ink-50/40">
      <QuoteWizard />
    </div>
  );
}
