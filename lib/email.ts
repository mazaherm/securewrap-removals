import { Resend } from "resend";
import { site } from "./site";
import { formatGBP } from "./pricing";
import { buildReceiptPdf } from "./receiptPdf";
import type { QuoteRecord } from "./quotes";
import type {
  DestinationType,
  PaymentOption,
  PropertyDetails,
  QuoteItem,
  ScheduleDetails,
  TimeSlot,
  VanSize,
} from "./types";

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

const FROM_ADDRESS = process.env.RESEND_FROM_EMAIL || `${site.name} <onboarding@resend.dev>`;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const BOOKINGS_EMAIL = process.env.PACKER_EMAIL || site.email;

interface ItemLike {
  label: string;
  notes?: string;
}

function itemListHtml(items: ItemLike[]): string {
  return items
    .map(
      (item) => `<tr>
        <td style="padding:6px 10px;border-bottom:1px solid #eee;">${escapeHtml(item.label)}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee;">${escapeHtml(item.notes?.trim() || "—")}</td>
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
        <span style="color:#ffffff;font-size:16px;font-weight:600;">${escapeHtml(site.name)}</span>
      </div>
      <div style="padding:24px;">
        <h1 style="font-size:18px;margin:0 0 12px;">${title}</h1>
        ${bodyHtml}
      </div>
    </div>
  </body>
</html>`;
}

/** Builds the receipt PDF bytes for a persisted quote — same shape used for
 * both the acceptance and fallback receipt emails. */
function receiptPdfForQuote(quote: QuoteRecord): Buffer {
  const amount = quote.paymentOption === "pay_now" ? quote.payNowTotal : quote.payOnDayTotal;
  return Buffer.from(
    buildReceiptPdf({
      bookingRef: quote.bookingRef,
      customerName: quote.customerName,
      customerEmail: quote.customerEmail,
      customerPhone: quote.customerPhone,
      paymentOption: quote.paymentOption ?? "pay_on_day",
      amount,
      items: quote.items,
      property: {
        addressLine1: quote.addressLine1,
        addressLine2: quote.addressLine2,
        city: quote.city,
        postcode: quote.postcode,
        destinationType: (quote.destinationType || "new_home") as DestinationType,
        destinationAddressLine1: quote.destinationAddressLine1,
        destinationAddressLine2: quote.destinationAddressLine2,
        destinationCity: quote.destinationCity,
        destinationPostcode: quote.destinationPostcode,
      },
      schedule: {
        date: quote.moveDate,
        timeSlot: quote.timeSlot as TimeSlot,
        vanSize: quote.vanSize as VanSize,
        dismantleFurniture: quote.dismantleFurniture,
      },
    })
  );
}

/** Sent to the customer once they accept a quote. */
export async function sendCustomerAcceptanceEmail(quote: QuoteRecord): Promise<void> {
  const client = getResendClient();
  if (!client) return;

  const amount = quote.paymentOption === "pay_now" ? quote.payNowTotal : quote.payOnDayTotal;
  const checklistUrl = `${SITE_URL}/checklist/${quote.id}`;
  const bookingUrl = `${SITE_URL}/booking`;

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
       <p>To view this booking later, or to ask us to add or remove items, open <a href="${bookingUrl}">My booking</a> and enter your booking reference plus the postcode of the home you're moving from. You don't need an account.</p>
       <p>A PDF receipt with your full item list is attached.</p>
       <p style="color:#788279;font-size:13px;">Questions? Just reply to this email or call us.</p>`
    ),
    attachments: [
      {
        filename: `${site.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-receipt-${quote.bookingRef}.pdf`,
        content: receiptPdfForQuote(quote),
      },
    ],
  });
}

/** Emails the team and the customer when someone asks to change a booking. Returns false when email isn't configured. */
export async function sendBookingChangeRequestEmails(quote: QuoteRecord, message: string): Promise<boolean> {
  const client = getResendClient();
  if (!client) return false;

  const safeMessage = escapeHtml(message).replace(/\n/g, "<br/>");
  const teamHtml = baseLayout(
    "Booking change request",
    `<p><strong>${escapeHtml(quote.customerName)}</strong> (${escapeHtml(quote.customerEmail)}) wants to change booking <strong>${escapeHtml(quote.bookingRef)}</strong>.</p>
     <p style="margin:16px 0;">${safeMessage}</p>`
  );
  const customerHtml = baseLayout(
    "We've got your change request",
    `<p>Thanks ${escapeHtml(quote.customerName)}. We've received your request to change booking <strong>${escapeHtml(quote.bookingRef)}</strong> and will be in touch to confirm any additions or removals.</p>
     <p style="margin:16px 0;">${safeMessage}</p>`
  );

  const results = await Promise.allSettled([
    client.emails.send({
      from: FROM_ADDRESS,
      to: BOOKINGS_EMAIL,
      replyTo: quote.customerEmail,
      subject: `Change request — ${quote.bookingRef}`,
      html: teamHtml,
    }),
    client.emails.send({
      from: FROM_ADDRESS,
      to: quote.customerEmail,
      subject: `Change request received — ${quote.bookingRef}`,
      html: customerHtml,
    }),
  ]);

  return results.some((result) => result.status === "fulfilled");
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
       <strong>Van:</strong> ${escapeHtml(quote.vanSize)}<br/>
       <strong>Dismantle &amp; reassemble:</strong> ${quote.dismantleFurniture ? "Yes" : "No"}</p>
       <table style="width:100%;border-collapse:collapse;margin-top:12px;font-size:14px;">
         <thead><tr>
           <th style="text-align:left;padding:6px 10px;border-bottom:2px solid #ddd;">Item</th>
           <th style="text-align:left;padding:6px 10px;border-bottom:2px solid #ddd;">Note</th>
         </tr></thead>
         <tbody>${itemListHtml(quote.items)}</tbody>
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

export interface ReceiptEmailInput {
  bookingRef: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  paymentOption: PaymentOption;
  amount: number;
  items: QuoteItem[];
  property: PropertyDetails;
  schedule: ScheduleDetails;
}

/** Fallback receipt sent directly from the client-submitted booking data,
 * for when the quote wasn't persisted to Supabase (so there's no
 * QuoteRecord / checklist page to build sendCustomerAcceptanceEmail from).
 * Returns false when email isn't configured, so the caller can degrade
 * without erroring. */
export async function sendReceiptEmail(
  input: ReceiptEmailInput,
  checklistId?: string | null
): Promise<boolean> {
  const client = getResendClient();
  if (!client) return false;

  const addressLine = [input.property.addressLine1, input.property.addressLine2, input.property.city, input.property.postcode]
    .filter(Boolean)
    .join(", ");
  const destinationLine = [
    input.property.destinationAddressLine1,
    input.property.destinationAddressLine2,
    input.property.destinationCity,
    input.property.destinationPostcode,
  ]
    .filter(Boolean)
    .join(", ");

  const checklistSection = checklistId
    ? `<p>You and our crew can check off items as they're wrapped from your phone — no printing needed:</p>
       <p style="margin:20px 0;"><a href="${SITE_URL}/checklist/${checklistId}" style="background:#0f5c39;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:600;">Open your checklist</a></p>`
    : "";

  const receiptPdf = Buffer.from(
    buildReceiptPdf({
      bookingRef: input.bookingRef,
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      customerPhone: input.customerPhone,
      paymentOption: input.paymentOption,
      amount: input.amount,
      items: input.items,
      property: input.property,
      schedule: input.schedule,
    })
  );

  const results = await Promise.allSettled([
    client.emails.send({
      from: FROM_ADDRESS,
      to: input.customerEmail,
      subject: `Booking confirmed — ${input.bookingRef}`,
      html: baseLayout(
        "Your booking is confirmed",
        `<p>Thanks ${escapeHtml(input.customerName)}, your move on ${escapeHtml(input.schedule.date)} is booked.</p>
         <p style="margin:16px 0;"><strong>Booking reference:</strong> ${escapeHtml(input.bookingRef)}<br/>
         <strong>${input.paymentOption === "pay_now" ? "Paid" : "Due on the day"}:</strong> ${formatGBP(input.amount)}</p>
         <p><strong>From:</strong> ${escapeHtml(addressLine || "—")}<br/>
         <strong>To:</strong> ${escapeHtml(destinationLine || "—")}</p>
         <table style="width:100%;border-collapse:collapse;margin-top:12px;font-size:14px;">
           <thead><tr>
             <th style="text-align:left;padding:6px 10px;border-bottom:2px solid #ddd;">Item</th>
             <th style="text-align:left;padding:6px 10px;border-bottom:2px solid #ddd;">Note</th>
           </tr></thead>
           <tbody>${itemListHtml(input.items)}</tbody>
         </table>
         ${checklistSection}
         <p>A PDF receipt with your full item list is attached.</p>
         <p style="color:#788279;font-size:13px;">Keep your booking reference safe — quote it if you need to reach us. Just reply to this email or call us with any questions.</p>`
      ),
      attachments: [{ filename: `${site.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-receipt-${input.bookingRef}.pdf`, content: receiptPdf }],
    }),
    (async () => {
      if (!process.env.PACKER_EMAIL) return;
      await client.emails.send({
        from: FROM_ADDRESS,
        to: process.env.PACKER_EMAIL as string,
        subject: `New job booked — ${input.bookingRef} (${input.schedule.date})`,
        html: baseLayout(
          "New job booked",
          `<p><strong>${escapeHtml(input.customerName)}</strong> — ${escapeHtml(input.customerPhone || input.customerEmail)}</p>
           <p><strong>From:</strong> ${escapeHtml(addressLine || "—")}<br/>
           <strong>To:</strong> ${escapeHtml(destinationLine || "—")}</p>
           <p><strong>Date:</strong> ${escapeHtml(input.schedule.date)} (${escapeHtml(input.schedule.timeSlot)})<br/>
           <strong>Van:</strong> ${escapeHtml(input.schedule.vanSize)}<br/>
           <strong>Dismantle &amp; reassemble:</strong> ${input.schedule.dismantleFurniture ? "Yes" : "No"}</p>
           <table style="width:100%;border-collapse:collapse;margin-top:12px;font-size:14px;">
             <thead><tr>
               <th style="text-align:left;padding:6px 10px;border-bottom:2px solid #ddd;">Item</th>
               <th style="text-align:left;padding:6px 10px;border-bottom:2px solid #ddd;">Note</th>
             </tr></thead>
             <tbody>${itemListHtml(input.items)}</tbody>
           </table>`
        ),
      });
    })(),
  ]);

  return results.some((result) => result.status === "fulfilled");
}
