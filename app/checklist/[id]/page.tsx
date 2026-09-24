import type { Metadata } from "next";
import { Package } from "lucide-react";
import { getChecklistState, getQuoteById } from "@/lib/quotes";
import { ChecklistView } from "@/components/checklist/ChecklistView";

export const metadata: Metadata = {
  title: "Packing checklist | SecureWrap Removals",
};

export default async function ChecklistPage({ params }: { params: { id: string } }) {
  const quote = await getQuoteById(params.id);

  if (!quote) {
    return (
      <div className="container-page py-16 text-center">
        <p className="text-sm text-ink-500">
          We couldn&rsquo;t find that checklist. If you followed a link from
          your confirmation email, double check it copied correctly.
        </p>
      </div>
    );
  }

  const checklistState = await getChecklistState(quote.id);

  return (
    <div className="border-b border-ink-100 bg-ink-50/40 py-10 sm:py-14">
      <div className="container-page max-w-xl">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-700">
            <Package className="h-4 w-4 text-gold-300" />
          </span>
          <span className="text-sm font-semibold text-ink-900">SecureWrap Removals</span>
        </div>

        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-ink-900">
          Packing checklist
        </h1>
        <p className="mt-1.5 text-sm text-ink-500">
          Booking {quote.bookingRef} · {quote.addressLine1}
          {quote.city ? `, ${quote.city}` : ""}
        </p>
        <p className="mt-1 text-xs text-ink-400">
          Tap an item to check it off as it&rsquo;s wrapped — updates for everyone viewing this page.
        </p>

        <div className="mt-6">
          <ChecklistView quoteId={quote.id} items={quote.items} initialChecked={checklistState} />
        </div>
      </div>
    </div>
  );
}
