import { NextResponse } from "next/server";

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
  addresses?: AddressResult[];
}

// getAddress.io "Find" API — returns every premise for a postcode plus its
// lat/lon in one call. Needs a paid API key (getaddress.io); optional — the
// quote form falls back to manual address entry when this isn't configured.
const GETADDRESS_FIND_URL = "https://api.getaddress.io/find";

export async function GET(request: Request): Promise<Response> {
  const apiKey = process.env.GETADDRESS_API_KEY;
  if (!apiKey) {
    return NextResponse.json<AddressLookupResponse>({ available: false });
  }

  const { searchParams } = new URL(request.url);
  const postcode = searchParams.get("postcode")?.trim();
  if (!postcode) {
    return NextResponse.json<AddressLookupResponse>({ available: false }, { status: 400 });
  }

  try {
    const response = await fetch(
      `${GETADDRESS_FIND_URL}/${encodeURIComponent(postcode)}?api-key=${encodeURIComponent(apiKey)}&expand=true`
    );
    if (!response.ok) {
      return NextResponse.json<AddressLookupResponse>({ available: false });
    }
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

    return NextResponse.json<AddressLookupResponse>({
      available: true,
      latitude: typeof data.latitude === "number" ? data.latitude : undefined,
      longitude: typeof data.longitude === "number" ? data.longitude : undefined,
      addresses,
    });
  } catch {
    return NextResponse.json<AddressLookupResponse>({ available: false });
  }
}
