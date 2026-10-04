"use client";

import { useEffect, useMemo, useState } from "react";
import { Info } from "lucide-react";
import { MonthCalendar } from "@/components/calendar/MonthCalendar";
import { todayInLondon } from "@/lib/dates";
import { DISMANTLE_REASSEMBLE_FEE, OWN_VAN_LOADING_FEE, TIME_SLOTS, VAN_OPTIONS, formatGBP, recommendVanSize } from "@/lib/pricing";
import type { QuoteItem, ScheduleDetails, TimeSlot, VanSize } from "@/lib/types";

export function StepSchedule({
  items,
  schedule,
  onChange,
  dateError,
}: {
  items: QuoteItem[];
  schedule: ScheduleDetails;
  onChange: (schedule: ScheduleDetails) => void;
  dateError?: string;
}) {
  const [unavailable, setUnavailable] = useState<Set<string>>(new Set());
  const today = todayInLondon();

  useEffect(() => {
    if (schedule.date && unavailable.has(schedule.date)) {
      onChange({ ...schedule, date: "" });
    }
    // Only react when the unavailable set or the chosen date changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unavailable, schedule.date]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/availability")
      .then((response) => (response.ok ? response.json() : { unavailable: [] }))
      .then((data: { unavailable?: string[] }) => {
        if (cancelled) return;
        setUnavailable(new Set(data.unavailable ?? []));
      })
      .catch(() => {
        if (!cancelled) setUnavailable(new Set());
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function patch(update: Partial<ScheduleDetails>) {
    onChange({ ...schedule, ...update });
  }

  const recommended = useMemo(() => recommendVanSize(items), [items]);
  const recommendedVan = VAN_OPTIONS.find((v) => v.value === recommended);

  return (
    <div>
      <h2 className="text-lg font-semibold text-ink-900">Move date &amp; transport</h2>
      <p className="mt-1.5 text-sm text-ink-500">
        Choose when you&rsquo;d like the crew to arrive, and whether you need a van.
      </p>

      <div className="mt-6 max-w-md">
        <p className="field-label">Move date</p>
        <p className="mb-3 text-xs text-ink-400">
          Grey days are already taken or we&rsquo;re not working.
        </p>
        <MonthCalendar
          renderDay={(iso) => {
            const past = iso < today;
            const taken = unavailable.has(iso);
            const selected = schedule.date === iso;
            const label = Number(iso.slice(8));
            const disabled = past || taken;
            return (
              <button
                type="button"
                disabled={disabled}
                onClick={() => patch({ date: iso })}
                className={[
                  "flex h-10 w-full items-center justify-center rounded-md border text-sm font-medium transition-colors",
                  selected
                    ? "border-brand-600 bg-brand-600 text-white"
                    : disabled
                      ? "cursor-not-allowed border-transparent bg-ink-50 text-ink-300"
                      : "border-ink-200 bg-white text-ink-800 hover:border-brand-600",
                ].join(" ")}
              >
                {label}
              </button>
            );
          }}
        />
        {dateError && <p className="mt-3 text-sm text-gold-700">{dateError}</p>}
      </div>

      <div className="mt-6">
        <p className="field-label">Arrival window</p>
        <div className="grid grid-cols-2 gap-3">
          {TIME_SLOTS.map((slot) => (
            <button
              key={slot.value}
              type="button"
              onClick={() => patch({ timeSlot: slot.value as TimeSlot })}
              className={[
                "rounded-md border px-4 py-3 text-left text-sm font-medium transition-colors",
                schedule.timeSlot === slot.value
                  ? "border-brand-600 bg-brand-50 text-brand-800"
                  : "border-ink-200 text-ink-600 hover:border-ink-300",
              ].join(" ")}
            >
              <span className="block">{slot.label}</span>
              <span className="mt-0.5 block text-xs font-normal text-ink-400">{slot.window}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <p className="field-label">Dismantle and reassemble furniture?</p>
        <p className="mb-3 text-xs text-ink-400">
          Tables, beds and similar pieces. We take them apart before the move
          and put them back together at the destination.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => patch({ dismantleFurniture: false })}
            className={[
              "rounded-md border px-4 py-3 text-left text-sm font-medium transition-colors",
              !schedule.dismantleFurniture
                ? "border-brand-600 bg-brand-50 text-brand-800"
                : "border-ink-200 text-ink-600 hover:border-ink-300",
            ].join(" ")}
          >
            <span className="block">No thanks</span>
            <span className="mt-0.5 block text-xs font-normal text-ink-400">Leave furniture as it is</span>
          </button>
          <button
            type="button"
            onClick={() => patch({ dismantleFurniture: true })}
            className={[
              "rounded-md border px-4 py-3 text-left text-sm font-medium transition-colors",
              schedule.dismantleFurniture
                ? "border-brand-600 bg-brand-50 text-brand-800"
                : "border-ink-200 text-ink-600 hover:border-ink-300",
            ].join(" ")}
          >
            <span className="block">Yes, please</span>
            <span className="mt-0.5 block text-xs font-normal text-ink-400">
              {formatGBP(DISMANTLE_REASSEMBLE_FEE)} extra
            </span>
          </button>
        </div>
      </div>

      <div className="mt-8">
        <p className="field-label">Do you need a van?</p>
        <p className="mb-3 text-xs text-ink-400">
          Van hire includes loading and unloading. Fuel is added on your
          quote from the journey: collection to destination, then back to
          our depot. If you bring your own van, we charge a small
          fee to load your items into it.
        </p>

        {recommendedVan && recommendedVan.value !== "none" && schedule.vanSize !== recommendedVan.value && (
          <div className="mb-3 flex items-start gap-2 rounded-md border border-gold-200 bg-gold-50 px-3.5 py-2.5 text-xs text-ink-700">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-600" />
            <span>
              Based on {items.length} item{items.length === 1 ? "" : "s"}, a{" "}
              <button
                type="button"
                onClick={() => patch({ vanSize: recommendedVan.value as VanSize })}
                className="font-semibold underline underline-offset-2"
              >
                {recommendedVan.label.toLowerCase()}
              </button>{" "}
              should be enough — but pick whichever suits your move.
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {VAN_OPTIONS.map((van) => (
            <button
              key={van.value}
              type="button"
              onClick={() => patch({ vanSize: van.value as VanSize })}
              className={[
                "relative rounded-md border px-4 py-3 text-left text-sm font-medium transition-colors",
                schedule.vanSize === van.value
                  ? "border-brand-600 bg-brand-50 text-brand-800"
                  : "border-ink-200 text-ink-600 hover:border-ink-300",
              ].join(" ")}
            >
              {van.value === recommended && van.value !== "none" && (
                <span className="absolute -top-2 right-3 rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                  Recommended
                </span>
              )}
              <span className="flex items-center justify-between">
                <span>{van.label}</span>
                <span className="text-right text-xs font-semibold text-ink-500">
                  {van.hireFee > 0 ? (
                    <>
                      {formatGBP(van.hireFee)} + fuel
                      <span className="mt-0.5 block font-normal">Loading and unloading included</span>
                    </>
                  ) : (
                    <>{formatGBP(OWN_VAN_LOADING_FEE)} to load your van</>
                  )}
                </span>
              </span>
              <span className="mt-0.5 block text-xs font-normal text-ink-400">
                {van.description}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
