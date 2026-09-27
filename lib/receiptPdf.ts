import { jsPDF } from "jspdf";
import { getCatalogEntry } from "./itemCatalog";
import { formatGBP, SIZE_OPTIONS, TIME_SLOTS, VAN_OPTIONS, WRAP_OPTIONS } from "./pricing";
import { destinationTypeLabel, type DestinationType, type PaymentOption, type TimeSlot, type VanSize } from "./types";

const PAGE_MARGIN = 14;
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const ROW_HEIGHT = 32;
const THUMB_SIZE = 20;

// Minimal structural shapes rather than the full client PropertyDetails /
// QuoteItem / ScheduleDetails types, so this builds equally from live
// wizard state (client) or a persisted QuoteRecord (server) without an
// adapter — both already satisfy these shapes.
export interface ReceiptItem {
  label: string;
  itemType: string;
  wrapTypes: string[];
  size: string;
  photoUrl: string;
}

export interface ReceiptProperty {
  addressLine1: string;
  addressLine2: string;
  city: string;
  postcode: string;
  destinationType: DestinationType;
  destinationAddressLine1: string;
  destinationAddressLine2: string;
  destinationCity: string;
  destinationPostcode: string;
}

export interface ReceiptSchedule {
  date: string;
  timeSlot: TimeSlot;
  vanSize: VanSize;
}

export interface ReceiptInput {
  bookingRef: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  paymentOption: PaymentOption;
  amount: number;
  items: ReceiptItem[];
  property: ReceiptProperty;
  schedule: ReceiptSchedule;
}

function wrapLabel(values: string[]) {
  return values.map((value) => WRAP_OPTIONS.find((w) => w.value === value)?.label ?? value).join(" + ");
}

function formatDate(dateIso: string) {
  if (!dateIso) return "Not set";
  return new Date(`${dateIso}T00:00:00`).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function paymentStatusLabel(paymentOption: PaymentOption): string {
  return paymentOption === "pay_now" ? "Payment received" : "Payment due on the day of the job";
}

/** Builds a receipt PDF (item list + payment status) as bytes for email. */
export function buildReceiptPdf(input: ReceiptInput): Uint8Array {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = PAGE_MARGIN;
  const paid = input.paymentOption === "pay_now";

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(20, 20, 20);
  doc.text("SecureWrap Removals", PAGE_MARGIN, y);
  y += 6;
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(90, 90, 90);
  doc.text("Receipt and item list", PAGE_MARGIN, y);
  y += 10;

  doc.setFillColor(paid ? 11 : 180, paid ? 74 : 130, paid ? 47 : 20);
  doc.roundedRect(PAGE_MARGIN, y, PAGE_WIDTH - PAGE_MARGIN * 2, 16, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(paymentStatusLabel(input.paymentOption).toUpperCase(), PAGE_MARGIN + 4, y + 6.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(formatGBP(input.amount), PAGE_WIDTH - PAGE_MARGIN - 4, y + 6.5, { align: "right" });
  y += 22;

  doc.setTextColor(20, 20, 20);
  doc.setFontSize(10);
  const slot = TIME_SLOTS.find((t) => t.value === input.schedule.timeSlot);
  const infoLines = [
    `Booking reference: ${input.bookingRef}`,
    `Customer: ${input.customerName || "-"}`,
    `Email: ${input.customerEmail || "-"}`,
    `Phone: ${input.customerPhone || "-"}`,
    `Collection: ${[input.property.addressLine1, input.property.addressLine2, input.property.city, input.property.postcode].filter(Boolean).join(", ") || "-"}`,
    `Destination (${destinationTypeLabel(input.property.destinationType)}): ${
      [input.property.destinationAddressLine1, input.property.destinationAddressLine2, input.property.destinationCity, input.property.destinationPostcode]
        .filter(Boolean)
        .join(", ") || "-"
    }`,
    `Move date: ${formatDate(input.schedule.date)}  -  ${slot?.label ?? ""} (${slot?.window ?? ""})`,
    `Van: ${VAN_OPTIONS.find((v) => v.value === input.schedule.vanSize)?.label ?? "Not required"}`,
  ];

  infoLines.forEach((line) => {
    const split = doc.splitTextToSize(line, PAGE_WIDTH - PAGE_MARGIN * 2);
    doc.text(split, PAGE_MARGIN, y);
    y += 5 * split.length;
  });

  y += 4;
  doc.setDrawColor(200, 200, 200);
  doc.line(PAGE_MARGIN, y, PAGE_WIDTH - PAGE_MARGIN, y);
  y += 8;

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`Items (${input.items.length})`, PAGE_MARGIN, y);
  y += 3;
  doc.setFont("helvetica", "normal");

  input.items.forEach((item, index) => {
    if (y + ROW_HEIGHT > PAGE_HEIGHT - PAGE_MARGIN) {
      doc.addPage();
      y = PAGE_MARGIN;
    }
    y += 6;

    const thumbX = PAGE_MARGIN;
    try {
      if (item.photoUrl.startsWith("data:image")) {
        const format = item.photoUrl.includes("image/png") ? "PNG" : "JPEG";
        doc.addImage(item.photoUrl, format, thumbX, y - 2, THUMB_SIZE, THUMB_SIZE);
      }
    } catch {
      // Skip images that can't be embedded; the item is still listed.
    }

    const textX = thumbX + THUMB_SIZE + 6;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(20, 20, 20);
    doc.text(`${index + 1}. ${item.label || "Untitled item"}`, textX, y + 4);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(90, 90, 90);
    doc.text(getCatalogEntry(item.itemType).label, textX, y + 9.5);
    doc.text(
      `Wrap: ${wrapLabel(item.wrapTypes)}   Size: ${SIZE_OPTIONS.find((s) => s.value === item.size)?.label ?? item.size}`,
      textX,
      y + 14.5
    );
    doc.setTextColor(20, 20, 20);

    y += ROW_HEIGHT - 6;
    doc.setDrawColor(230, 230, 230);
    doc.line(PAGE_MARGIN, y, PAGE_WIDTH - PAGE_MARGIN, y);
  });

  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `SecureWrap Removals  -  ${paymentStatusLabel(input.paymentOption)}  -  Page ${p} of ${pageCount}`,
      PAGE_MARGIN,
      PAGE_HEIGHT - 8
    );
  }

  return new Uint8Array(doc.output("arraybuffer"));
}
