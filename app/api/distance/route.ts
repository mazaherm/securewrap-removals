import { NextResponse } from "next/server";
import { milesFromBase } from "@/lib/distance";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface DistanceResponse {
  available: boolean;
  miles?: number;
  /** True when we only matched the outward part of the postcode (e.g.
   * "MK9"), so the distance is an area-level estimate, not exact. */
  approximate?: boolean;
}

// Free UK postcode lookup — no API key required. https://postcodes.io
const POSTCODES_IO_URL = "https://api.postcodes.io/postcodes";
const POSTCODES_IO_OUTCODE_URL = "https://api.postcodes.io/outcodes";

async function lookupFullPostcode(postcode: string): Promise<{ lat: number; lon: number } | null> {
  const response = await fetch(`${POSTCODES_IO_URL}/${encodeURIComponent(postcode)}`);
  if (!response.ok) return null;
  const data = await response.json();
  const lat = data?.result?.latitude;
  const lon = data?.result?.longitude;
  if (typeof lat !== "number" || typeof lon !== "number") return null;
  return { lat, lon };
}

/** Falls back to the outward code only (e.g. "MK9" from "MK9 2AF", or a
 * postcode typed without its inward half) — gives an area-level centroid
 * rather than failing outright when the full postcode isn't recognised. */
async function lookupOutcode(postcode: string): Promise<{ lat: number; lon: number } | null> {
  const outcode = postcode.trim().split(/\s+/)[0]?.toUpperCase();
  if (!outcode) return null;
  const response = await fetch(`${POSTCODES_IO_OUTCODE_URL}/${encodeURIComponent(outcode)}`);
  if (!response.ok) return null;
  const data = await response.json();
  const lat = data?.result?.latitude;
  const lon = data?.result?.longitude;
  if (typeof lat !== "number" || typeof lon !== "number") return null;
  return { lat, lon };
}

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const postcode = searchParams.get("postcode")?.trim();

  if (!postcode) {
    return NextResponse.json<DistanceResponse>({ available: false }, { status: 400 });
  }

  try {
    const exact = await lookupFullPostcode(postcode);
    if (exact) {
      const miles = Math.round(milesFromBase(exact.lat, exact.lon) * 10) / 10;
      return NextResponse.json<DistanceResponse>({ available: true, miles });
    }

    const approx = await lookupOutcode(postcode);
    if (approx) {
      const miles = Math.round(milesFromBase(approx.lat, approx.lon) * 10) / 10;
      return NextResponse.json<DistanceResponse>({ available: true, miles, approximate: true });
    }

    return NextResponse.json<DistanceResponse>({ available: false });
  } catch {
    return NextResponse.json<DistanceResponse>({ available: false });
  }
}
