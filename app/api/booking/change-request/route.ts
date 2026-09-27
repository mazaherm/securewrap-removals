import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase";
import { findAcceptedBooking } from "@/lib/quotes";
import { sendBookingChangeRequestEmails } from "@/lib/email";
import { allowRequest, clientIp } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WINDOW_MS = 60 * 60 * 1000;
const LIMIT = 5;
const MAX_MESSAGE = 2000;

export async function POST(request: Request): Promise<Response> {
  if (!allowRequest(`booking-change:${clientIp(request)}`, LIMIT, WINDOW_MS)) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  let body: { bookingRef?: string; postcode?: string; message?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  const bookingRef = body.bookingRef?.trim() ?? "";
  const postcode = body.postcode?.trim() ?? "";
  const message = body.message?.trim() ?? "";
  if (!bookingRef || !postcode || message.length < 10 || message.length > MAX_MESSAGE) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, error: "unavailable" }, { status: 503 });
  }

  const record = await findAcceptedBooking(bookingRef, postcode);
  if (!record) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  const sent = await sendBookingChangeRequestEmails(record, message);
  if (!sent) {
    return NextResponse.json({ ok: false, error: "unavailable" }, { status: 503 });
  }

  return NextResponse.json({ ok: true });
}
