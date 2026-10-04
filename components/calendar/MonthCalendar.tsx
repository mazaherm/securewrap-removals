"use client";

import { useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { monthCells, todayInLondon } from "@/lib/dates";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS_AHEAD = 6;

function addMonths(year: number, monthIndex: number, amount: number): { year: number; monthIndex: number } {
  const date = new Date(year, monthIndex + amount, 1);
  return { year: date.getFullYear(), monthIndex: date.getMonth() };
}

export function MonthCalendar({
  renderDay,
}: {
  renderDay: (iso: string) => ReactNode;
}) {
  const today = todayInLondon();
  const [todayYear, todayMonth] = today.split("-").map(Number);
  const start = { year: todayYear, monthIndex: todayMonth - 1 };
  const end = addMonths(start.year, start.monthIndex, MONTHS_AHEAD);
  const [cursor, setCursor] = useState(start);

  const atStart = cursor.year === start.year && cursor.monthIndex === start.monthIndex;
  const atEnd = cursor.year === end.year && cursor.monthIndex === end.monthIndex;
  const title = new Date(cursor.year, cursor.monthIndex, 1).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <button
          type="button"
          className="btn-ghost px-2 py-2"
          disabled={atStart}
          onClick={() => setCursor((current) => addMonths(current.year, current.monthIndex, -1))}
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="text-sm font-semibold text-ink-900">{title}</p>
        <button
          type="button"
          className="btn-ghost px-2 py-2"
          disabled={atEnd}
          onClick={() => setCursor((current) => addMonths(current.year, current.monthIndex, 1))}
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] font-medium uppercase tracking-wide text-ink-400">
        {WEEKDAYS.map((day) => (
          <div key={day} className="py-1">
            {day}
          </div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {monthCells(cursor.year, cursor.monthIndex).map((iso, index) => (
          <div key={iso ?? `empty-${index}`} className="min-h-[2.5rem]">
            {iso ? renderDay(iso) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
