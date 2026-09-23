import { NextResponse } from "next/server";
import { ITEM_CATALOG, isValidCatalogKey } from "@/lib/itemCatalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const DEFAULT_MODEL = "claude-sonnet-5";

interface IdentifyRequestBody {
  imageDataUrl?: string;
}

interface IdentifyResponse {
  available: boolean;
  itemType?: string;
  error?: string;
}

function parseDataUrl(dataUrl: string): { mediaType: string; base64: string } | null {
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  return { mediaType: match[1], base64: match[2] };
}

function extractItemType(text: string): string | null {
  try {
    const parsed = JSON.parse(text.trim());
    if (typeof parsed.itemType === "string" && isValidCatalogKey(parsed.itemType)) {
      return parsed.itemType;
    }
  } catch {
    // Fall through to a looser match below.
  }
  const lower = text.toLowerCase();
  const found = ITEM_CATALOG.find((entry) => lower.includes(entry.key));
  return found?.key ?? null;
}

export async function POST(request: Request): Promise<Response> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // Not configured — the client falls back to a filename-based guess and
    // manual selection, so this is a normal, non-error outcome.
    return NextResponse.json<IdentifyResponse>({ available: false, error: "not_configured" });
  }

  let body: IdentifyRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<IdentifyResponse>({ available: false, error: "invalid_body" }, { status: 400 });
  }

  const imageDataUrl = body.imageDataUrl;
  if (!imageDataUrl) {
    return NextResponse.json<IdentifyResponse>({ available: false, error: "missing_image" }, { status: 400 });
  }

  const parsed = parseDataUrl(imageDataUrl);
  if (!parsed) {
    return NextResponse.json<IdentifyResponse>({ available: false, error: "unsupported_image" }, { status: 400 });
  }

  const catalogList = ITEM_CATALOG.map((entry) => `${entry.key} — ${entry.label}`).join("\n");

  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_VISION_MODEL || DEFAULT_MODEL,
        max_tokens: 64,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: { type: "base64", media_type: parsed.mediaType, data: parsed.base64 },
              },
              {
                type: "text",
                text: `This is a photo of a household item a removal company needs to wrap for a move. Pick the single best-matching item type from this list, by its key:\n\n${catalogList}\n\nReply with ONLY a JSON object like {"itemType":"tv"} — no other text.`,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      return NextResponse.json<IdentifyResponse>({ available: false, error: `api_error_${response.status}` });
    }

    const data = await response.json();
    const textBlock = Array.isArray(data.content)
      ? data.content.find((block: { type: string }) => block.type === "text")
      : null;
    const text = textBlock?.text ?? "";
    const itemType = extractItemType(text);

    if (!itemType) {
      return NextResponse.json<IdentifyResponse>({ available: false, error: "no_match" });
    }

    return NextResponse.json<IdentifyResponse>({ available: true, itemType });
  } catch {
    return NextResponse.json<IdentifyResponse>({ available: false, error: "request_failed" });
  }
}
