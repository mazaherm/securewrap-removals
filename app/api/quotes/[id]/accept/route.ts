import { NextResponse } from "next/server";
import { acceptQuote } from "@/lib/quotes";
import { sendCustomerAcceptanceEmail, sendPackerNotificationEmail } from "@/lib/email";
import type { PaymentOption } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: { id: string } }): Promise<Response> {
  let body: { paymentOption?: PaymentOption };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (body.paymentOption !== "pay_now" && body.paymentOption !== "pay_on_day") {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const record = await acceptQuote(params.id, body.paymentOption);
  if (!record) {
    return NextResponse.json({ ok: false });
  }

  // Best-effort — a failed email shouldn't undo the acceptance already saved.
  await Promise.allSettled([sendCustomerAcceptanceEmail(record), sendPackerNotificationEmail(record)]);

  return NextResponse.json({ ok: true });
}
