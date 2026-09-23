export interface IdentifyItemResult {
  available: boolean;
  itemType?: string;
}

export interface AddressLookupResult {
  line1: string;
  line2: string;
  town: string;
  county: string;
}

export interface AddressLookupResponse {
  available: boolean;
  latitude?: number;
  longitude?: number;
  addresses?: AddressLookupResult[];
}

/** Looks up every address for a UK postcode (via getAddress.io, if
 * configured), so the customer can pick theirs instead of typing it all
 * out. Never throws — callers should fall back to manual entry when
 * `available` is false or `addresses` is empty. */
export async function lookupAddressesByPostcode(postcode: string): Promise<AddressLookupResponse> {
  const trimmed = postcode.trim();
  if (!trimmed) return { available: false };
  try {
    const response = await fetch(`/api/address/lookup?postcode=${encodeURIComponent(trimmed)}`);
    if (!response.ok) return { available: false };
    const data = await response.json();
    return {
      available: Boolean(data.available),
      latitude: data.latitude,
      longitude: data.longitude,
      addresses: data.addresses,
    };
  } catch {
    return { available: false };
  }
}

export interface DistanceResult {
  available: boolean;
  miles?: number;
  approximate?: boolean;
}

/** Looks up straight-line distance from our Milton Keynes base for a UK
 * postcode, via /api/distance. Never throws — callers should treat an
 * unavailable result as "distance unknown" and skip any surcharge. */
export async function getDistanceFromBase(postcode: string): Promise<DistanceResult> {
  const trimmed = postcode.trim();
  if (!trimmed) return { available: false };
  try {
    const response = await fetch(`/api/distance?postcode=${encodeURIComponent(trimmed)}`);
    if (!response.ok) return { available: false };
    const data = await response.json();
    return { available: Boolean(data.available), miles: data.miles, approximate: Boolean(data.approximate) };
  } catch {
    return { available: false };
  }
}

/** Asks the /api/identify-item route to classify a photo against the item
 * catalog. Never throws — callers should fall back to a manual/keyword
 * guess when `available` is false. */
export async function identifyItemPhoto(imageDataUrl: string): Promise<IdentifyItemResult> {
  try {
    const response = await fetch("/api/identify-item", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ imageDataUrl }),
    });
    if (!response.ok) return { available: false };
    const data = await response.json();
    return { available: Boolean(data.available), itemType: data.itemType };
  } catch {
    return { available: false };
  }
}
