import { NextResponse } from "next/server";
import { normalizeUkPostcode } from "@/lib/distance";
import { lookupPostcode } from "@/lib/postcodes";

export const runtime = "nodejs";
// Force per-request execution — without this, Next can statically cache
// this route at build time (when GETADDRESS_API_KEY isn't set yet) and
// serve that same cached response for every postcode afterwards.
export const dynamic = "force-dynamic";

export interface AddressResult {
  line1: string;
  line2: string;
  town: string;
  county: string;
}

interface AddressLookupResponse {
  available: boolean;
  latitude?: number;
  longitude?: number;
  town?: string;
  addresses?: AddressResult[];
}

// getAddress.io "Find" API — returns every premise for a postcode plus its
// lat/lon in one call. Optional paid key; we fall back to free sources
// (postcodes.io + OpenStreetMap) so "Find address" still works without it.
const GETADDRESS_FIND_URL = "https://api.getaddress.io/find";
const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

async function lookupViaGetAddress(
  postcode: string,
  apiKey: string
): Promise<AddressLookupResponse | null> {
  try {
    const response = await fetch(
      `${GETADDRESS_FIND_URL}/${encodeURIComponent(postcode)}?api-key=${encodeURIComponent(apiKey)}&expand=true`
    );
    if (!response.ok) return null;
    const data = await response.json();
    const rawAddresses: Array<Record<string, string>> = Array.isArray(data?.addresses) ? data.addresses : [];

    const addresses: AddressResult[] = rawAddresses.map((addr) => {
      const line1 = [addr.line_1, addr.line_2].filter(Boolean).join(", ") || addr.line_1 || "";
      const line2 = [addr.line_3, addr.line_4].filter(Boolean).join(", ");
      return {
        line1,
        line2,
        town: addr.town_or_city || addr.locality || "",
        county: addr.county || "",
      };
    });

    return {
      available: true,
      latitude: typeof data.latitude === "number" ? data.latitude : undefined,
      longitude: typeof data.longitude === "number" ? data.longitude : undefined,
      town: addresses.find((addr) => addr.town)?.town,
      addresses,
    };
  } catch {
    return null;
  }
}

interface OsmTags {
  [key: string]: string | undefined;
}

function addressFromOsmTags(tags: OsmTags, fallbackTown: string): AddressResult | null {
  const unit = tags["addr:unit"] || tags["addr:flats"] || "";
  const houseName = tags["addr:housename"] || "";
  const number = tags["addr:housenumber"] || "";
  const street = tags["addr:street"] || tags["addr:place"] || tags["addr:suburb"] || "";
  const streetLine = [number, street].filter(Boolean).join(" ");
  const line1 = [unit, houseName, streetLine].filter(Boolean).join(", ");
  if (!line1) return null;
  return {
    line1,
    line2: tags["addr:suburb"] && tags["addr:suburb"] !== street ? tags["addr:suburb"] : "",
    town: tags["addr:city"] || tags["addr:town"] || fallbackTown,
    county: tags["addr:county"] || "",
  };
}

async function lookupViaOverpass(postcode: string, fallbackTown: string): Promise<AddressResult[]> {
  const query = `[out:json][timeout:4];(nwr["addr:postcode"="${postcode}"];);out tags;`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4500);
  try {
    const response = await fetch(OVERPASS_URL, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
        "user-agent": "SecureWrapRemovals/1.0 (address lookup)",
      },
      body: `data=${encodeURIComponent(query)}`,
      signal: controller.signal,
    });
    if (!response.ok) return [];
    const data = await response.json();
    const elements: Array<{ tags?: OsmTags }> = Array.isArray(data?.elements) ? data.elements : [];
    const seen = new Set<string>();
    const addresses: AddressResult[] = [];
    for (const element of elements) {
      if (!element.tags) continue;
      const address = addressFromOsmTags(element.tags, fallbackTown);
      if (!address) continue;
      const key = `${address.line1}|${address.town}`.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      addresses.push(address);
    }
    return addresses.sort((a, b) => a.line1.localeCompare(b.line1, "en", { numeric: true }));
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const rawPostcode = searchParams.get("postcode")?.trim();
  if (!rawPostcode) {
    return NextResponse.json<AddressLookupResponse>({ available: false }, { status: 400 });
  }

  const postcode = normalizeUkPostcode(rawPostcode);
  const apiKey = process.env.GETADDRESS_API_KEY;

  if (apiKey) {
    const paid = await lookupViaGetAddress(postcode, apiKey);
    if (paid && paid.addresses && paid.addresses.length > 0) {
      return NextResponse.json<AddressLookupResponse>(paid);
    }
  }

  try {
    const location = await lookupPostcode(postcode);
    if (!location) {
      return NextResponse.json<AddressLookupResponse>({ available: false });
    }

    const addresses = await lookupViaOverpass(postcode, location.town);

    return NextResponse.json<AddressLookupResponse>({
      available: true,
      latitude: location.lat,
      longitude: location.lon,
      town: location.town,
      addresses,
    });
  } catch {
    return NextResponse.json<AddressLookupResponse>({ available: false });
  }
}
