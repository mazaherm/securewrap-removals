// Straight-line ("as the crow flies") distance helpers. Used in
// lib/pricing.ts for the long-distance service rate and for van fuel
// (collection → destination + destination → base). Real road distance
// will be somewhat higher, but this is a reasonable estimate.

export const BASE_LOCATION = {
  name: "Milton Keynes",
  postcode: "MK13 0BG",
  lat: 52.064303,
  lon: -0.794398,
};

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function haversineMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const earthRadiusMiles = 3958.8;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusMiles * c;
}

export function milesFromBase(lat: number, lon: number): number {
  return haversineMiles(BASE_LOCATION.lat, BASE_LOCATION.lon, lat, lon);
}

export function roundMiles(miles: number): number {
  return Math.round(miles * 10) / 10;
}

/** Normalises a UK postcode to "OUTWARD INWARD" (e.g. "MK130BG" → "MK13 0BG"). */
export function normalizeUkPostcode(postcode: string): string {
  const compact = postcode.replace(/\s+/g, "").toUpperCase();
  if (compact.length < 5) return compact;
  return `${compact.slice(0, -3)} ${compact.slice(-3)}`;
}
