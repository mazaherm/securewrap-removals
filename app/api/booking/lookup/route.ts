import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase";
import { findAcceptedBooking } from "@/lib/quotes";
import { toPublicBooking } from "@/lib/publicBooking";
import { allowRequest, clientIp } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WINDOW_MS = 15 * 60 * 1000;
const LIMIT = 8;

export async function POST(request: Request): Promise<Response> {
  if (!allowRequest(`booking-lookup:${clientIp(request)}`, LIMIT, WINDOW_MS)) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  let body: { bookingRef?: string; postcode?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  const bookingRef = body.bookingRef?.trim() ?? "";
  const postcode = body.postcode?.trim() ?? "";
  if (!bookingRef || !postcode) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, error: "unavailable" }, { status: 503 });
  }

  const record = await findAcceptedBooking(bookingRef, postcode);
  if (!record) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, booking: toPublicBooking(record) });
}
