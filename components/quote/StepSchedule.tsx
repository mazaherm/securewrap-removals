"use client";

import { useMemo } from "react";
import { Info } from "lucide-react";
import { TIME_SLOTS, VAN_OPTIONS, formatGBP, recommendVanSize } from "@/lib/pricing";
import type { QuoteItem, ScheduleDetails, TimeSlot, VanSize } from "@/lib/types";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function StepSchedule({
  items,
  schedule,
  onChange,
}: {
  items: QuoteItem[];
  schedule: ScheduleDetails;
  onChange: (schedule: ScheduleDetails) => void;
}) {
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

      <div className="mt-6">
        <label className="field-label" htmlFor="moveDate">
          Move date
        </label>
        <input
          id="moveDate"
          type="date"
          min={todayIso()}
          className="field-input sm:max-w-xs"
          value={schedule.date}
          onChange={(e) => patch({ date: e.target.value })}
        />
      </div>

      <div className="mt-6">
        <p className="field-label">Arrival window</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
        <p className="field-label">Do you need a van?</p>
        <p className="mb-3 text-xs text-ink-400">
          Van hire is a fixed price. Fuel is added on your quote from the
          journey: collection to destination, then back to our MK13 0BG depot.
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
                {van.hireFee > 0 && (
                  <span className="text-xs font-semibold text-ink-500">
                    {formatGBP(van.hireFee)} + fuel
                  </span>
                )}
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
