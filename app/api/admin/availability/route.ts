import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { listClosedDates, setDateClosed } from "@/lib/availability";
import { isIsoDate, todayInLondon } from "@/lib/dates";
import { listAcceptedMoveDates, listPendingMoveDates } from "@/lib/quotes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  if (!isAdminRequest()) return NextResponse.json({ ok: false }, { status: 401 });

  const today = todayInLondon();
  const [closed, booked, requested] = await Promise.all([
    listClosedDates(),
    listAcceptedMoveDates(today),
    listPendingMoveDates(today),
  ]);

  return NextResponse.json({
    closed: closed.filter((date) => date >= today),
    booked: [...new Set(booked.map((entry) => entry.moveDate))].sort(),
    requested,
  });
}

export async function POST(request: Request): Promise<Response> {
  if (!isAdminRequest()) return NextResponse.json({ ok: false }, { status: 401 });

  let body: { date?: string; closed?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const date = body.date ?? "";
  if (!isIsoDate(date) || typeof body.closed !== "boolean") {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const today = todayInLondon();
  const booked = await listAcceptedMoveDates(today);
  if (booked.some((entry) => entry.moveDate === date)) {
    return NextResponse.json(
      { ok: false, error: "That day already has a booking, so it stays closed." },
      { status: 409 }
    );
  }

  const result = await setDateClosed(date, body.closed);
  if (!result.ok) return NextResponse.json(result, { status: 500 });
  return NextResponse.json({ ok: true });
}
