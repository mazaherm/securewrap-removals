"use client";

import { useRef, useState, type Dispatch, type SetStateAction } from "react";
import { Camera, ImagePlus, X } from "lucide-react";
import { guessItemTypeFromText } from "@/lib/itemCatalog";
import type { QuoteItem } from "@/lib/types";

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function makeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `item-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function StepUpload({
  items,
  onChange,
}: {
  items: QuoteItem[];
  onChange: Dispatch<SetStateAction<QuoteItem[]>>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setIsLoading(true);
    const files = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    const newItems: QuoteItem[] = [];
    for (const file of files) {
      try {
        const dataUrl = await readAsDataUrl(file);
        const label = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ");
        newItems.push({
          id: makeId(),
          photoName: file.name,
          photoUrl: dataUrl,
          label,
          wrapTypes: ["bubble"],
          size: "medium",
          itemType: guessItemTypeFromText(label),
        });
      } catch {
        // Skip files that fail to read.
      }
    }
    onChange((prev) => [...prev, ...newItems]);
    setIsLoading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function updateLabel(id: string, label: string) {
    onChange((prev) => prev.map((item) => (item.id === id ? { ...item, label } : item)));
  }

  function removeItem(id: string) {
    onChange((prev) => prev.filter((item) => item.id !== id));
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-ink-900">Upload your items</h2>
      <p className="mt-1.5 text-sm text-ink-500">
        Add a photo for each item you need packed. You can use your camera
        or choose from your photo library — you&rsquo;ll name each item and
        choose protection on the next step.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isLoading}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={[
          "mt-5 flex w-full flex-col items-center justify-center gap-2.5 rounded-card border-2 border-dashed px-6 py-10 text-center transition-colors disabled:opacity-60",
          isDragOver ? "border-brand-500 bg-brand-50/60" : "border-ink-200 bg-ink-50/50 hover:border-brand-400 hover:bg-brand-50/40",
        ].join(" ")}
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-card">
          {isLoading ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-300 border-t-brand-600" />
          ) : (
            <ImagePlus className="h-6 w-6 text-brand-600" />
          )}
        </span>
        <span className="text-sm font-semibold text-ink-900">
          {isLoading ? "Adding photos…" : isDragOver ? "Drop to add photos" : "Tap or drag photos here"}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-ink-400">
          <Camera className="h-3.5 w-3.5" />
          Camera, photo library, or drag and drop
        </span>
      </button>

      {items.length > 0 && (
        <div className="mt-8">
          <p className="text-sm font-medium text-ink-700">
            {items.length} item{items.length === 1 ? "" : "s"} added
          </p>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((item) => (
              <div key={item.id} className="group relative">
                <div className="relative aspect-square overflow-hidden rounded-card border border-ink-100 bg-ink-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.photoUrl}
                    alt={item.label || item.photoName}
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    aria-label={`Remove ${item.label || "item"}`}
                    className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-ink-900/70 text-white transition-colors hover:bg-ink-900"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <input
                  type="text"
                  value={item.label}
                  onChange={(e) => updateLabel(item.id, e.target.value)}
                  placeholder="Item name"
                  className="field-input mt-2 px-2.5 py-2 text-xs"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {items.length === 0 && (
        <p className="mt-6 text-center text-sm text-ink-400">
          No items added yet — add at least one photo to continue.
        </p>
      )}
    </div>
  );
}
