import { NextResponse } from "next/server";
import { setChecklistItemState } from "@/lib/quotes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: { id: string } }): Promise<Response> {
  let body: { itemId?: string; checked?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (typeof body.itemId !== "string" || typeof body.checked !== "boolean") {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  await setChecklistItemState(params.id, body.itemId, body.checked);
  return NextResponse.json({ ok: true });
}
