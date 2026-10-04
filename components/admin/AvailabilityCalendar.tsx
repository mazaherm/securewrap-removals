"use client";

import { useCallback, useEffect, useState } from "react";
import { MonthCalendar } from "@/components/calendar/MonthCalendar";
import { todayInLondon } from "@/lib/dates";

interface Availability {
  closed: string[];
  booked: string[];
  requested: string[];
}

export function AvailabilityCalendar() {
  const [availability, setAvailability] = useState<Availability>({ closed: [], booked: [], requested: [] });
  const [error, setError] = useState("");
  const [pendingDate, setPendingDate] = useState<string | null>(null);

  const load = useCallback(async () => {
    const response = await fetch("/api/admin/availability");
    if (!response.ok) return;
    const data = (await response.json()) as Availability;
    setAvailability({
      closed: data.closed ?? [],
      booked: data.booked ?? [],
      requested: data.requested ?? [],
    });
  }, []);

  useEffect(() => {
    load().catch(() => setError("Couldn't load your availability."));
  }, [load]);

  async function toggle(date: string) {
    if (availability.booked.includes(date) || pendingDate) return;
    const closed = !availability.closed.includes(date);
    setPendingDate(date);
    setError("");
    try {
      const response = await fetch("/api/admin/availability", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ date, closed }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error || "Couldn't update that day.");
        return;
      }
      await load();
    } catch {
      setError("Couldn't update that day.");
    } finally {
      setPendingDate(null);
    }
  }

  const today = todayInLondon();

  return (
    <section className="card mt-8 p-5 sm:p-6">
      <h2 className="text-base font-semibold text-ink-900">Your availability</h2>
      <p className="mt-1.5 max-w-2xl text-sm text-ink-500">
        One booking per day. Click a free day to close it, or a closed day to open it again.
        A day with an accepted booking stays closed.
      </p>

      <div className="mt-4 flex flex-wrap gap-4 text-xs text-ink-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm border border-ink-200 bg-white" /> Open
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm border border-ink-300 bg-ink-100" /> Closed
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-gold-200" /> Booked
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-brand-600" /> Quote requested
        </span>
      </div>

      {error && <p className="mt-3 text-sm text-gold-700">{error}</p>}

      <div className="mt-4 max-w-md">
        <MonthCalendar
          renderDay={(iso) => {
            const booked = availability.booked.includes(iso);
            const closed = availability.closed.includes(iso);
            const requested = availability.requested.includes(iso);
            const past = iso < today;
            const label = Number(iso.slice(8));

            if (past) {
              return (
                <div className="flex h-10 items-center justify-center rounded-md text-sm text-ink-300">{label}</div>
              );
            }

            if (booked) {
              return (
                <div
                  className="flex h-10 items-center justify-center rounded-md bg-gold-100 text-sm font-medium text-ink-700"
                  title="Booked"
                >
                  {label}
                </div>
              );
            }

            return (
              <button
                type="button"
                onClick={() => toggle(iso)}
                disabled={pendingDate === iso}
                title={closed ? "Closed — click to open" : requested ? "A quote has been requested" : "Open — click to close"}
                className={[
                  "relative flex h-10 w-full items-center justify-center rounded-md border text-sm font-medium transition-colors",
                  closed
                    ? "border-ink-300 bg-ink-100 text-ink-500"
                    : "border-ink-200 bg-white text-ink-800 hover:border-brand-600",
                ].join(" ")}
              >
                {label}
                {requested && (
                  <span className="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-brand-600" aria-hidden />
                )}
              </button>
            );
          }}
        />
      </div>
    </section>
  );
}
