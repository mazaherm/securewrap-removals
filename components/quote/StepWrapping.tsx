"use client";

import { useState, type Dispatch, SetStateAction } from "react";
import { ITEM_CATALOG, getCatalogEntry, isValidCatalogKey } from "@/lib/itemCatalog";
import { SIZE_OPTIONS, WRAP_OPTIONS, estimateItemPrice, formatGBP } from "@/lib/pricing";
import type { ItemSize, QuoteItem, WrapType } from "@/lib/types";

const DONT_KNOW_WRAPS: WrapType[] = ["bubble", "box"];
const DONT_KNOW_SIZE: ItemSize = "large";

export function StepWrapping({
  items,
  onChange,
}: {
  items: QuoteItem[];
  onChange: Dispatch<SetStateAction<QuoteItem[]>>;
}) {
  const [editingType, setEditingType] = useState<Record<string, boolean>>({});

  function update(id: string, patch: Partial<QuoteItem>) {
    onChange((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function toggleWrapType(item: QuoteItem, wrapType: WrapType) {
    const isSelected = item.wrapTypes.includes(wrapType);
    if (isSelected) {
      // Always leave at least one protection type selected.
      if (item.wrapTypes.length === 1) return;
      update(item.id, { wrapTypes: item.wrapTypes.filter((w) => w !== wrapType) });
    } else {
      update(item.id, { wrapTypes: [...item.wrapTypes, wrapType] });
    }
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-ink-900">Choose protection for each item</h2>
      <p className="mt-1.5 text-sm text-ink-500">
        We&rsquo;ve suggested what each item is from the name. Correct it if that&rsquo;s wrong, then pick the wrap and size — or use I don&rsquo;t know for both.
      </p>

      <div className="mt-6 space-y-5">
        {items.map((item) => {
          const hasType = isValidCatalogKey(item.itemType);
          const price = hasType ? estimateItemPrice(item) : null;
          return (
            <div key={item.id} className="card flex flex-col gap-4 p-4 sm:flex-row sm:p-5">
              <div className="flex items-center gap-3 sm:w-48 sm:shrink-0 sm:flex-col sm:items-start">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md border border-ink-100 sm:h-24 sm:w-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.photoUrl}
                    alt={item.label}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0 sm:mt-1">
                  <p className="truncate text-sm font-semibold text-ink-900">
                    {item.label || "Untitled item"}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-brand-700">
                    {price != null ? `≈ ${formatGBP(price)}` : "Select a type"}
                  </p>
                </div>
              </div>

              <div className="flex-1 space-y-4">
                <div>
                  <p className="field-label mb-0">Item type</p>
                  {hasType && !editingType[item.id] ? (
                    <p className="mt-1.5 text-sm text-ink-700">
                      We think this is {getCatalogEntry(item.itemType).label}.{" "}
                      <button
                        type="button"
                        onClick={() => setEditingType((prev) => ({ ...prev, [item.id]: true }))}
                        className="font-medium text-brand-700 underline underline-offset-2 hover:text-brand-800"
                      >
                        Change
                      </button>
                    </p>
                  ) : (
                    <select
                      className="field-select mt-1.5"
                      value={item.itemType}
                      onChange={(e) => {
                        update(item.id, { itemType: e.target.value });
                        setEditingType((prev) => ({ ...prev, [item.id]: false }));
                      }}
                    >
                      <option value="" disabled>
                        {hasType ? "Select item type…" : "We couldn’t tell — choose the closest type"}
                      </option>
                      {ITEM_CATALOG.map((entry) => (
                        <option key={entry.key} value={entry.key}>
                          {entry.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <p className="field-label">
                    Wrap type <span className="font-normal text-ink-400">(choose one or more)</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {WRAP_OPTIONS.map((wrap) => {
                      const selected = item.wrapTypes.includes(wrap.value);
                      return (
                        <button
                          key={wrap.value}
                          type="button"
                          onClick={() => toggleWrapType(item, wrap.value)}
                          aria-pressed={selected}
                          className={[
                            "rounded-md border px-3 py-2 text-xs font-medium transition-colors",
                            selected
                              ? "border-brand-600 bg-brand-50 text-brand-800"
                              : "border-ink-200 text-ink-600 hover:border-ink-300",
                          ].join(" ")}
                          title={wrap.description}
                        >
                          {wrap.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="field-label">Size</p>
                  <div className="flex flex-wrap gap-2">
                    {SIZE_OPTIONS.map((size) => (
                      <button
                        key={size.value}
                        type="button"
                        onClick={() => update(item.id, { size: size.value as ItemSize })}
                        className={[
                          "rounded-md border px-3 py-2 text-xs font-medium transition-colors",
                          item.size === size.value
                            ? "border-brand-600 bg-brand-50 text-brand-800"
                            : "border-ink-200 text-ink-600 hover:border-ink-300",
                        ].join(" ")}
                        title={size.description}
                      >
                        {size.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    update(item.id, { wrapTypes: [...DONT_KNOW_WRAPS], size: DONT_KNOW_SIZE })
                  }
                  className="text-sm font-medium text-brand-700 underline underline-offset-2 hover:text-brand-800"
                >
                  I don&rsquo;t know
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
