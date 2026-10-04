import { promises as fs } from "fs";
import path from "path";
import { isIsoDate, todayInLondon } from "./dates";
import { listAcceptedMoveDates } from "./quotes";
import { getSupabaseAdmin } from "./supabase";

const CLOSED_DATES_FILE = path.join(process.cwd(), "data", "closed-dates.json");

async function readClosedDatesFile(): Promise<string[]> {
  try {
    const raw = await fs.readFile(CLOSED_DATES_FILE, "utf8");
    const parsed = JSON.parse(raw) as { dates?: unknown };
    if (!Array.isArray(parsed.dates)) return [];
    return parsed.dates.filter((date): date is string => typeof date === "string" && isIsoDate(date));
  } catch {
    return [];
  }
}

async function writeClosedDatesFile(dates: string[]): Promise<void> {
  const unique = [...new Set(dates)].sort();
  await fs.writeFile(CLOSED_DATES_FILE, `${JSON.stringify({ dates: unique }, null, 2)}\n`, "utf8");
}

/** Days closed by hand. Accepted bookings are tracked separately. */
export async function listClosedDates(): Promise<string[]> {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase.from("closed_dates").select("date");
    if (error || !data) return [];
    return data
      .map((row) => (typeof row.date === "string" ? row.date.slice(0, 10) : ""))
      .filter((date) => isIsoDate(date));
  }
  return readClosedDatesFile();
}

export async function setDateClosed(
  date: string,
  closed: boolean
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isIsoDate(date)) return { ok: false, error: "That isn't a valid date." };

  const supabase = getSupabaseAdmin();
  if (supabase) {
    const result = closed
      ? await supabase.from("closed_dates").upsert({ date }, { onConflict: "date" })
      : await supabase.from("closed_dates").delete().eq("date", date);
    if (result.error) {
      return {
        ok: false,
        error: "Couldn't save that day. Run the closed_dates section of supabase/schema.sql, then try again.",
      };
    }
    return { ok: true };
  }

  try {
    const dates = await readClosedDatesFile();
    const next = closed ? [...dates, date] : dates.filter((entry) => entry !== date);
    await writeClosedDatesFile(next);
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't save that day." };
  }
}

/** A day is free when it isn't in the past, isn't closed by hand, and
 * doesn't already have an accepted booking (other than `exceptQuoteId`). */
export async function isDateAvailable(date: string, exceptQuoteId?: string): Promise<boolean> {
  if (!isIsoDate(date) || date < todayInLondon()) return false;
  const [closed, booked] = await Promise.all([listClosedDates(), listAcceptedMoveDates(date)]);
  if (closed.includes(date)) return false;
  return !booked.some((entry) => entry.moveDate === date && entry.id !== exceptQuoteId);
}

export async function listUnavailableDates(): Promise<string[]> {
  const today = todayInLondon();
  const [closed, booked] = await Promise.all([listClosedDates(), listAcceptedMoveDates(today)]);
  const dates = new Set<string>();
  for (const date of closed) {
    if (date >= today) dates.add(date);
  }
  for (const entry of booked) dates.add(entry.moveDate);
  return [...dates].sort();
}
