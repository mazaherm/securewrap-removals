"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { getCatalogEntry } from "@/lib/itemCatalog";
import { SIZE_OPTIONS, WRAP_OPTIONS } from "@/lib/pricing";
import type { QuoteRecordItem } from "@/lib/quotes";

function wrapLabel(values: string[]): string {
  return values.map((v) => WRAP_OPTIONS.find((w) => w.value === v)?.label ?? v).join(" + ");
}

function sizeLabel(value: string): string {
  return SIZE_OPTIONS.find((s) => s.value === value)?.label ?? value;
}

export function ChecklistView({
  quoteId,
  items,
  initialChecked,
}: {
  quoteId: string;
  items: QuoteRecordItem[];
  initialChecked: Record<string, boolean>;
}) {
  const [checked, setChecked] = useState<Record<string, boolean>>(initialChecked);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  const checkedCount = items.filter((item) => checked[item.id]).length;

  async function toggle(itemId: string) {
    const next = !checked[itemId];
    setChecked((prev) => ({ ...prev, [itemId]: next }));
    setPendingIds((prev) => new Set(prev).add(itemId));
    try {
      await fetch(`/api/quotes/${quoteId}/checklist`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ itemId, checked: next }),
      });
    } finally {
      setPendingIds((prev) => {
        const nextSet = new Set(prev);
        nextSet.delete(itemId);
        return nextSet;
      });
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-ink-700">
          {checkedCount} of {items.length} wrapped
        </p>
        <div className="h-1.5 w-32 overflow-hidden rounded-full bg-ink-100">
          <div
            className="h-full rounded-full bg-brand-600 transition-all duration-300"
            style={{ width: `${items.length ? (checkedCount / items.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {items.map((item) => {
          const isChecked = Boolean(checked[item.id]);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => toggle(item.id)}
              className={[
                "flex w-full items-center gap-3 rounded-card border p-3 text-left transition-colors",
                isChecked ? "border-brand-300 bg-brand-50" : "border-ink-100 bg-white",
              ].join(" ")}
            >
              <span
                className={[
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
                  isChecked ? "border-brand-600 bg-brand-600" : "border-ink-300 bg-white",
                ].join(" ")}
              >
                {isChecked && <Check className="h-4 w-4 text-white" />}
              </span>
              <span className="h-12 w-12 shrink-0 overflow-hidden rounded-md border border-ink-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.photoUrl} alt={item.label} className="h-full w-full object-cover" />
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={[
                    "block truncate text-sm font-medium",
                    isChecked ? "text-brand-800 line-through decoration-brand-400" : "text-ink-900",
                  ].join(" ")}
                >
                  {item.label || getCatalogEntry(item.itemType).label}
                </span>
                <span className="block text-xs text-ink-500">
                  {wrapLabel(item.wrapTypes)} · {sizeLabel(item.size)}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
