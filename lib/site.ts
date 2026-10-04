import siteJson from "@/data/site.json";

export const site = siteJson;

export const phoneHref = `tel:${site.phoneTel}`;
export const emailHref = `mailto:${site.email}`;

/** "Milton Keynes, MK13 0BG" */
export function depotLine(): string {
  return `${site.address.city}, ${site.address.postcode}`;
}

/** "Milton Keynes (MK13 0BG)" */
export function depotLabel(): string {
  return `${site.address.city}`;
}
