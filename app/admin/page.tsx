import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { listQuotes } from "@/lib/quotes";
import { isSupabaseConfigured } from "@/lib/supabase";
import { formatGBP } from "@/lib/pricing";
import { LogoutButton } from "@/components/admin/LogoutButton";

export const metadata: Metadata = {
  title: "Admin | SecureWrap Removals",
};

export const dynamic = "force-dynamic";

function StatusBadge({ createdAt, acceptedAt }: { createdAt: string; acceptedAt: string | null }) {
  if (acceptedAt) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Accepted
      </span>
    );
  }
  const isOverdue = Date.now() - new Date(createdAt).getTime() > 24 * 60 * 60 * 1000;
  if (isOverdue) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-gold-100 px-2.5 py-1 text-xs font-medium text-gold-700">
        <AlertTriangle className="h-3.5 w-3.5" />
        Awaiting reply (24h+)
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-ink-100 px-2.5 py-1 text-xs font-medium text-ink-500">
      <Clock className="h-3.5 w-3.5" />
      Awaiting reply
    </span>
  );
}

export default async function AdminPage() {
  const configured = isSupabaseConfigured();
  const quotes = configured ? await listQuotes() : [];

  return (
    <div className="container-page py-10 sm:py-14">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink-900">Quotes</h1>
          <p className="mt-1 text-sm text-ink-500">
            {quotes.length} recorded quote{quotes.length === 1 ? "" : "s"}
          </p>
        </div>
        <LogoutButton />
      </div>

      {!configured && (
        <div className="mt-8 rounded-card border border-gold-200 bg-gold-50 p-5 text-sm text-ink-700">
          Supabase isn&rsquo;t configured yet, so no quotes are being recorded.
          Set <code>SUPABASE_URL</code> and <code>SUPABASE_SERVICE_ROLE_KEY</code> in
          your environment — see the README&rsquo;s &ldquo;Backend setup&rdquo; section.
        </div>
      )}

      {configured && quotes.length === 0 && (
        <p className="mt-8 text-sm text-ink-400">No quotes yet.</p>
      )}

      {quotes.length > 0 && (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-left text-xs uppercase tracking-wide text-ink-400">
                <th className="py-2 pr-4 font-medium">Submitted</th>
                <th className="py-2 pr-4 font-medium">Customer</th>
                <th className="py-2 pr-4 font-medium">Move date</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 pr-4 font-medium">Total</th>
                <th className="py-2 pr-4 font-medium">Checklist</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((quote) => (
                <tr key={quote.id} className="border-b border-ink-50">
                  <td className="py-3 pr-4 text-ink-500">
                    {new Date(quote.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="py-3 pr-4">
                    <p className="font-medium text-ink-900">{quote.customerName}</p>
                    <p className="text-xs text-ink-400">{quote.customerEmail}</p>
                    {quote.customerPhone && <p className="text-xs text-ink-400">{quote.customerPhone}</p>}
                  </td>
                  <td className="py-3 pr-4 text-ink-600">{quote.moveDate || "—"}</td>
                  <td className="py-3 pr-4">
                    <StatusBadge createdAt={quote.createdAt} acceptedAt={quote.acceptedAt} />
                  </td>
                  <td className="py-3 pr-4 font-medium text-ink-900">
                    {formatGBP(
                      quote.paymentOption === "pay_now"
                        ? quote.payNowTotal
                        : quote.paymentOption === "pay_on_day"
                        ? quote.payOnDayTotal
                        : quote.payOnDayTotal
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    <Link
                      href={`/checklist/${quote.id}`}
                      className="font-medium text-brand-700 underline underline-offset-2"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
