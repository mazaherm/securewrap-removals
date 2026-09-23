import { jsPDF } from "jspdf";
import { getCatalogEntry } from "./itemCatalog";
import { SIZE_OPTIONS, TIME_SLOTS, VAN_OPTIONS, WRAP_OPTIONS } from "./pricing";
import type { ContactDetails, PropertyDetails, QuoteItem, ScheduleDetails } from "./types";

const PAGE_MARGIN = 14;
const PAGE_WIDTH = 210; // A4 mm
const PAGE_HEIGHT = 297; // A4 mm
const ROW_HEIGHT = 32;
const THUMB_SIZE = 20;

function wrapLabel(values: string[]) {
  return values.map((value) => WRAP_OPTIONS.find((w) => w.value === value)?.label ?? value).join(" + ");
}

function itemTypeLabel(value: string) {
  return getCatalogEntry(value).label;
}

function sizeLabel(value: string) {
  return SIZE_OPTIONS.find((s) => s.value === value)?.label ?? value;
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

/**
 * Generates a printable packing checklist for the crew: one row per item
 * with a tick box, thumbnail photo, and the wrap type/size selected online,
 * so items can be confirmed on-site during the move.
 */
export function generateChecklistPdf(
  items: QuoteItem[],
  contact: ContactDetails,
  property: PropertyDetails,
  schedule: ScheduleDetails,
  bookingRef: string
) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = PAGE_MARGIN;

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("SecureWrap Removals — Packing Checklist", PAGE_MARGIN, y);
  y += 6;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(90, 90, 90);
  doc.text(`Booking reference: ${bookingRef}`, PAGE_MARGIN, y);
  y += 8;
  doc.setTextColor(20, 20, 20);

  const infoLines = [
    `Customer: ${contact.fullName || "-"}   Phone: ${contact.phone || "-"}`,
    `Address: ${[property.addressLine1, property.addressLine2, property.city, property.postcode]
      .filter(Boolean)
      .join(", ") || "-"}`,
    `Property: ${property.propertyType === "flat" ? "Flat" : "House"}${
      property.propertyType === "flat" ? `, floor ${property.floors}, ${property.hasLift ? "lift available" : "no lift"}` : `, ${property.floors} floor(s)`
    }, ${property.rooms} room(s)`,
    `Destination: ${property.destinationType === "storage_facility" ? "Storage facility" : "New home"}`,
    `Move date: ${formatDate(schedule.date)}  —  ${
      TIME_SLOTS.find((t) => t.value === schedule.timeSlot)?.label ?? ""
    } (${TIME_SLOTS.find((t) => t.value === schedule.timeSlot)?.window ?? ""})`,
    `Van: ${VAN_OPTIONS.find((v) => v.value === schedule.vanSize)?.label ?? "Not required"}`,
  ];

  doc.setFontSize(10);
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
  doc.text(`Items to wrap (${items.length})`, PAGE_MARGIN, y);
  y += 3;
  doc.setFont("helvetica", "normal");

  items.forEach((item, index) => {
    if (y + ROW_HEIGHT > PAGE_HEIGHT - PAGE_MARGIN) {
      doc.addPage();
      y = PAGE_MARGIN;
    }
    y += 6;

    const checkboxSize = 6;
    doc.setDrawColor(60, 60, 60);
    doc.rect(PAGE_MARGIN, y, checkboxSize, checkboxSize);

    const thumbX = PAGE_MARGIN + checkboxSize + 4;
    try {
      if (item.photoUrl.startsWith("data:image")) {
        const format = item.photoUrl.includes("image/png") ? "PNG" : "JPEG";
        doc.addImage(item.photoUrl, format, thumbX, y - 2, THUMB_SIZE, THUMB_SIZE);
      }
    } catch {
      // If the image can't be embedded, skip it — the checklist row still lists the item.
    }

    const textX = thumbX + THUMB_SIZE + 6;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`${index + 1}. ${item.label || "Untitled item"}`, textX, y + 4);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(90, 90, 90);
    doc.text(`${itemTypeLabel(item.itemType)}`, textX, y + 9.5);
    doc.text(`Wrap: ${wrapLabel(item.wrapTypes)}   Size: ${sizeLabel(item.size)}`, textX, y + 14.5);
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
      `SecureWrap Removals · Generated for crew use · Page ${p} of ${pageCount}`,
      PAGE_MARGIN,
      PAGE_HEIGHT - 8
    );
  }

  doc.save(`securewrap-checklist-${bookingRef}.pdf`);
}
