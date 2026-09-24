import { NextResponse } from "next/server";
import { haversineMiles, milesFromBase, roundMiles } from "@/lib/distance";
import { lookupPostcode } from "@/lib/postcodes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface DistanceResponse {
  available: boolean;
  miles?: number;
  /** True when we only matched the outward part of the postcode (e.g.
   * "MK9"), so the distance is an area-level estimate, not exact. */
  approximate?: boolean;
  journeyMiles?: number;
  pickupToDestination?: number;
  destinationToBase?: number;
  journeyApproximate?: boolean;
}

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const postcode = searchParams.get("postcode")?.trim();
  const pickup = searchParams.get("pickup")?.trim() || postcode;
  const destination = searchParams.get("destination")?.trim();

  if (!pickup) {
    return NextResponse.json<DistanceResponse>({ available: false }, { status: 400 });
  }

  try {
    const pickupLocation = await lookupPostcode(pickup);
    if (!pickupLocation) {
      return NextResponse.json<DistanceResponse>({ available: false });
    }

    const miles = roundMiles(milesFromBase(pickupLocation.lat, pickupLocation.lon));
    const response: DistanceResponse = {
      available: true,
      miles,
      approximate: pickupLocation.approximate,
    };

    if (destination) {
      const destLocation = await lookupPostcode(destination);
      if (destLocation) {
        const pickupToDestination = roundMiles(
          haversineMiles(pickupLocation.lat, pickupLocation.lon, destLocation.lat, destLocation.lon)
        );
        const destinationToBase = roundMiles(milesFromBase(destLocation.lat, destLocation.lon));
        response.pickupToDestination = pickupToDestination;
        response.destinationToBase = destinationToBase;
        response.journeyMiles = roundMiles(pickupToDestination + destinationToBase);
        response.journeyApproximate = pickupLocation.approximate || destLocation.approximate;
      }
    }

    return NextResponse.json<DistanceResponse>(response);
  } catch {
    return NextResponse.json<DistanceResponse>({ available: false });
  }
}
