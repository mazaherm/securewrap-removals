import { NextResponse } from "next/server";
import { listUnavailableDates } from "@/lib/availability";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Dates the customer cannot book: closed by hand, or already booked. */
export async function GET(): Promise<Response> {
  const unavailable = await listUnavailableDates();
  return NextResponse.json({ unavailable });
}
