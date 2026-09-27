import { NextResponse } from "next/server";
import { sendReceiptEmail } from "@/lib/email";
import type { PaymentOption, PropertyDetails, QuoteItem, ScheduleDetails } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ReceiptBody {
  bookingRef?: string;
  checklistId?: string | null;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  paymentOption?: PaymentOption;
  amount?: number;
  items?: QuoteItem[];
  property?: PropertyDetails;
  schedule?: ScheduleDetails;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export async function POST(request: Request): Promise<Response> {
  let body: ReceiptBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ sent: false }, { status: 400 });
  }

  const email = body.customerEmail?.trim() ?? "";
  if (
    !body.bookingRef?.trim() ||
    !isValidEmail(email) ||
    (body.paymentOption !== "pay_now" && body.paymentOption !== "pay_on_day") ||
    typeof body.amount !== "number" ||
    !Array.isArray(body.items) ||
    !body.property ||
    !body.schedule
  ) {
    return NextResponse.json({ sent: false }, { status: 400 });
  }

  const sent = await sendReceiptEmail(
    {
      bookingRef: body.bookingRef,
      customerName: body.customerName ?? "",
      customerEmail: email,
      customerPhone: body.customerPhone ?? "",
      paymentOption: body.paymentOption,
      amount: body.amount,
      items: body.items,
      property: body.property,
      schedule: body.schedule,
    },
    body.checklistId
  );

  return NextResponse.json({ sent });
}
