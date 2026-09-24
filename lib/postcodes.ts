import { normalizeUkPostcode } from "./distance";

const POSTCODES_IO_URL = "https://api.postcodes.io/postcodes";
const POSTCODES_IO_OUTCODE_URL = "https://api.postcodes.io/outcodes";

export interface PostcodeLocation {
  lat: number;
  lon: number;
  town: string;
  approximate: boolean;
}

function townFromResult(result: Record<string, unknown> | null | undefined): string {
  if (!result) return "";
  const parish = typeof result.parish === "string" ? result.parish : "";
  const district = typeof result.admin_district === "string" ? result.admin_district : "";
  // "Westminster, unparished area" is the official parish name — prefer
  // the district in those cases. Otherwise parish is usually the suburb.
  if (parish && parish !== district && !/unparished/i.test(parish)) return parish;
  return district || parish;
}

async function lookupFull(postcode: string): Promise<PostcodeLocation | null> {
  const response = await fetch(`${POSTCODES_IO_URL}/${encodeURIComponent(postcode)}`);
  if (!response.ok) return null;
  const data = await response.json();
  const result = data?.result;
  const lat = result?.latitude;
  const lon = result?.longitude;
  if (typeof lat !== "number" || typeof lon !== "number") return null;
  return { lat, lon, town: townFromResult(result), approximate: false };
}

async function lookupOutcode(postcode: string): Promise<PostcodeLocation | null> {
  const outcode = postcode.trim().split(/\s+/)[0]?.toUpperCase();
  if (!outcode) return null;
  const response = await fetch(`${POSTCODES_IO_OUTCODE_URL}/${encodeURIComponent(outcode)}`);
  if (!response.ok) return null;
  const data = await response.json();
  const result = data?.result;
  const lat = result?.latitude;
  const lon = result?.longitude;
  if (typeof lat !== "number" || typeof lon !== "number") return null;
  return { lat, lon, town: townFromResult(result), approximate: true };
}

/** Free UK postcode → lat/lon + town. No API key. Tries the full
 * postcode first, then the outward code (e.g. "MK13") as a fallback. */
export async function lookupPostcode(postcode: string): Promise<PostcodeLocation | null> {
  const normalised = normalizeUkPostcode(postcode);
  if (!normalised) return null;
  const exact = await lookupFull(normalised);
  if (exact) return exact;
  return lookupOutcode(normalised);
}
