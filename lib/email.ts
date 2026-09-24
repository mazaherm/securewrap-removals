import { Resend } from "resend";
import { getCatalogEntry } from "./itemCatalog";
import { WRAP_OPTIONS, SIZE_OPTIONS, formatGBP } from "./pricing";
import type { QuoteRecord } from "./quotes";

let cachedClient: Resend | null | undefined;

function getResendClient(): Resend | null {
  if (cachedClient !== undefined) return cachedClient;
  const apiKey = process.env.RESEND_API_KEY;
  cachedClient = apiKey ? new Resend(apiKey) : null;
  return cachedClient;
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

const FROM_ADDRESS = process.env.RESEND_FROM_EMAIL || "SecureWrap Removals <onboarding@resend.dev>";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

function wrapLabel(values: string[]): string {
  return values.map((v) => WRAP_OPTIONS.find((w) => w.value === v)?.label ?? v).join(" + ");
}

function sizeLabel(value: string): string {
  return SIZE_OPTIONS.find((s) => s.value === value)?.label ?? value;
}

function itemListHtml(quote: QuoteRecord): string {
  return quote.items
    .map(
      (item) => `<tr>
        <td style="padding:6px 10px;border-bottom:1px solid #eee;">${escapeHtml(item.label)}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee;">${escapeHtml(getCatalogEntry(item.itemType).label)}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee;">${escapeHtml(wrapLabel(item.wrapTypes))}, ${escapeHtml(sizeLabel(item.size))}</td>
      </tr>`
    )
    .join("");
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}

function baseLayout(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html>
  <body style="font-family:Arial,Helvetica,sans-serif;background:#f6f7f7;padding:24px;color:#1a1d1b;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:10px;overflow:hidden;border:1px solid #e8eae9;">
      <div style="background:#0b4a2f;padding:20px 24px;">
        <span style="color:#ffffff;font-size:16px;font-weight:600;">SecureWrap Removals</span>
      </div>
      <div style="padding:24px;">
        <h1 style="font-size:18px;margin:0 0 12px;">${title}</h1>
        ${bodyHtml}
      </div>
    </div>
  </body>
</html>`;
}

/** Sent to the customer once they accept a quote. */
export async function sendCustomerAcceptanceEmail(quote: QuoteRecord): Promise<void> {
  const client = getResendClient();
  if (!client) return;

  const amount = quote.paymentOption === "pay_now" ? quote.payNowTotal : quote.payOnDayTotal;
  const checklistUrl = `${SITE_URL}/checklist/${quote.id}`;

  await client.emails.send({
    from: FROM_ADDRESS,
    to: quote.customerEmail,
    subject: `Booking confirmed — ${quote.bookingRef}`,
    html: baseLayout(
      "Your booking is confirmed",
      `<p>Thanks ${escapeHtml(quote.customerName)}, your move on ${escapeHtml(quote.moveDate)} is booked.</p>
       <p style="margin:16px 0;"><strong>Booking reference:</strong> ${escapeHtml(quote.bookingRef)}<br/>
       <strong>${quote.paymentOption === "pay_now" ? "Paid" : "Due on the day"}:</strong> ${formatGBP(amount)}</p>
       <p>You and our crew can check off items as they're wrapped from your phone — no printing needed:</p>
       <p style="margin:20px 0;"><a href="${checklistUrl}" style="background:#0f5c39;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:600;">Open your checklist</a></p>
       <p style="color:#788279;font-size:13px;">Questions? Just reply to this email or call us.</p>`
    ),
  });
}

/** Sent to the packer/business owner once a customer accepts, so there's
 * always a copy of the job even if the customer never opens the checklist. */
export async function sendPackerNotificationEmail(quote: QuoteRecord): Promise<void> {
  const client = getResendClient();
  const packerEmail = process.env.PACKER_EMAIL;
  if (!client || !packerEmail) return;

  const checklistUrl = `${SITE_URL}/checklist/${quote.id}`;
  const addressLine = [quote.addressLine1, quote.addressLine2, quote.city, quote.postcode].filter(Boolean).join(", ");
  const destinationLine = [quote.destinationAddressLine1, quote.destinationAddressLine2, quote.destinationCity, quote.destinationPostcode].filter(Boolean).join(", ");

  await client.emails.send({
    from: FROM_ADDRESS,
    to: packerEmail,
    subject: `New job booked — ${quote.bookingRef} (${quote.moveDate})`,
    html: baseLayout(
      "New job booked",
      `<p><strong>${escapeHtml(quote.customerName)}</strong> — ${escapeHtml(quote.customerPhone || quote.customerEmail)}</p>
       <p><strong>From:</strong> ${escapeHtml(addressLine || "—")}<br/>
       <strong>To:</strong> ${escapeHtml(destinationLine || "—")}</p>
       <p><strong>Date:</strong> ${escapeHtml(quote.moveDate)} (${escapeHtml(quote.timeSlot)})<br/>
       <strong>Van:</strong> ${escapeHtml(quote.vanSize)}</p>
       <table style="width:100%;border-collapse:collapse;margin-top:12px;font-size:14px;">
         <thead><tr>
           <th style="text-align:left;padding:6px 10px;border-bottom:2px solid #ddd;">Item</th>
           <th style="text-align:left;padding:6px 10px;border-bottom:2px solid #ddd;">Type</th>
           <th style="text-align:left;padding:6px 10px;border-bottom:2px solid #ddd;">Wrap / Size</th>
         </tr></thead>
         <tbody>${itemListHtml(quote)}</tbody>
       </table>
       <p style="margin:20px 0;"><a href="${checklistUrl}" style="background:#0f5c39;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:600;">Open checklist on your phone</a></p>`
    ),
  });
}

/** Sent by the 24-hour follow-up cron job to customers who reached a quote
 * but haven't accepted it yet. */
export async function sendFollowUpEmail(quote: QuoteRecord): Promise<void> {
  const client = getResendClient();
  if (!client) return;

  const quoteUrl = `${SITE_URL}/quote`;

  await client.emails.send({
    from: FROM_ADDRESS,
    to: quote.customerEmail,
    subject: `Still want your move quote, ${quote.customerName.split(" ")[0]}?`,
    html: baseLayout(
      "Your quote is still available",
      `<p>Hi ${escapeHtml(quote.customerName)}, you got a quote from us for your move on ${escapeHtml(quote.moveDate)} but haven't confirmed it yet.</p>
       <p style="margin:16px 0;"><strong>Pay now:</strong> ${formatGBP(quote.payNowTotal)}<br/>
       <strong>Pay on the day:</strong> ${formatGBP(quote.payOnDayTotal)}</p>
       <p style="margin:20px 0;"><a href="${quoteUrl}" style="background:#0f5c39;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:600;">Get your quote again</a></p>
       <p style="color:#788279;font-size:13px;">Prices and availability can change, so if you'd like to lock this in, book soon — or call us if you have questions.</p>`
    ),
  });
}
