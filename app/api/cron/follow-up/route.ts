import { NextResponse } from "next/server";
import { listQuotesDueForFollowUp, markFollowUpSent } from "@/lib/quotes";
import { sendFollowUpEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Vercel automatically sends `Authorization: Bearer $CRON_SECRET` when
// invoking a Cron Job, if that env var is set on the project — this checks
// it so the endpoint can't be triggered by anyone who finds the URL.
function isAuthorised(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // not set up yet — allow, but this should be set once deployed
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request): Promise<Response> {
  if (!isAuthorised(request)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const due = await listQuotesDueForFollowUp();
  let sent = 0;
  for (const quote of due) {
    try {
      await sendFollowUpEmail(quote);
      await markFollowUpSent(quote.id);
      sent++;
    } catch {
      // Leave follow_up_sent_at unset so the next run retries this one.
    }
  }

  return NextResponse.json({ ok: true, checked: due.length, sent });
}
