// Straight-line ("as the crow flies") distance from our depot, used in
// lib/pricing.ts to apply a higher service rate for jobs a long way from
// base (covering crew travel time). Real road distance will be somewhat
// higher, but this is a reasonable estimate for that purpose.
export const BASE_LOCATION = {
  name: "Milton Keynes",
  lat: 52.0406,
  lon: -0.7594,
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
