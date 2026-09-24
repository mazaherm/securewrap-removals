/** Splits a `data:image/jpeg;base64,...` string into its parts. */
export function parseDataUrl(dataUrl: string): { mediaType: string; base64: string } | null {
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  return { mediaType: match[1], base64: match[2] };
}

export function extensionForMediaType(mediaType: string): string {
  const subtype = mediaType.split("/")[1] || "jpg";
  return subtype === "jpeg" ? "jpg" : subtype;
}
