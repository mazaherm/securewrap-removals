"use client";

import { useState, type ReactNode } from "react";
import { Check, MapPin, Search } from "lucide-react";
import { lookupAddressesByPostcode, type AddressLookupResult } from "@/lib/quoteApi";

type AddressLookupState = "idle" | "loading" | "results" | "no_results" | "unavailable";

export interface AddressValue {
  addressLine1: string;
  addressLine2: string;
  city: string;
  postcode: string;
}

export interface AddressResolved {
  postcode: string;
  latitude?: number;
  longitude?: number;
  town?: string;
}

export function AddressFields({
  idPrefix,
  value,
  onChange,
  onResolved,
  helper,
  postcodePlaceholder = "MK13 0BG",
}: {
  idPrefix: string;
  value: AddressValue;
  onChange: (patch: Partial<AddressValue>) => void;
  onResolved?: (result: AddressResolved) => void;
  helper?: ReactNode;
  postcodePlaceholder?: string;
}) {
  const [addressLookup, setAddressLookup] = useState<AddressLookupState>("idle");
  const [addressResults, setAddressResults] = useState<AddressLookupResult[]>([]);

  async function handleFindAddress() {
    if (!value.postcode.trim()) return;
    setAddressLookup("loading");
    setAddressResults([]);
    const result = await lookupAddressesByPostcode(value.postcode);
    if (!result.available) {
      setAddressLookup("unavailable");
      onResolved?.({ postcode: value.postcode });
      return;
    }
    if (result.town && !value.city.trim()) {
      onChange({ city: result.town });
    }
    onResolved?.({
      postcode: value.postcode,
      latitude: result.latitude,
      longitude: result.longitude,
      town: result.town,
    });
    if (!result.addresses || result.addresses.length === 0) {
      setAddressLookup("no_results");
      return;
    }
    setAddressResults(result.addresses);
    setAddressLookup("results");
  }

  function selectAddress(address: AddressLookupResult) {
    onChange({
      addressLine1: address.line1,
      addressLine2: address.line2,
      city: address.town || value.city,
    });
    setAddressLookup("idle");
    setAddressResults([]);
  }

  return (
    <div>
      <div>
        <label className="field-label" htmlFor={`${idPrefix}-postcode`}>
          Postcode
        </label>
        <div className="flex gap-2">
          <input
            id={`${idPrefix}-postcode`}
            type="text"
            className="field-input"
            value={value.postcode}
            onChange={(e) => {
              onChange({ postcode: e.target.value.toUpperCase() });
              setAddressLookup("idle");
              setAddressResults([]);
            }}
            onBlur={(e) => {
              if (addressLookup === "idle" && e.target.value.trim()) {
                onResolved?.({ postcode: e.target.value });
              }
            }}
            placeholder={postcodePlaceholder}
            autoComplete="postal-code"
          />
          <button
            type="button"
            onClick={handleFindAddress}
            disabled={!value.postcode.trim() || addressLookup === "loading"}
            className="btn-outline shrink-0 px-4"
          >
            <Search className="h-4 w-4" />
            {addressLookup === "loading" ? "Searching…" : "Find address"}
          </button>
        </div>
        {helper}
      </div>

      {addressLookup === "results" && (
        <div className="mt-3 max-h-56 overflow-y-auto rounded-md border border-ink-200">
          {addressResults.map((address, index) => (
            <button
              key={`${address.line1}-${index}`}
              type="button"
              onClick={() => selectAddress(address)}
              className="flex w-full items-start gap-2 border-b border-ink-100 px-3.5 py-2.5 text-left text-sm text-ink-700 last:border-b-0 hover:bg-brand-50"
            >
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-400" />
              <span>
                {address.line1}
                {address.line2 ? `, ${address.line2}` : ""}
                {address.town ? `, ${address.town}` : ""}
              </span>
            </button>
          ))}
        </div>
      )}
      {addressLookup === "no_results" && (
        <p className="mt-2 text-xs text-ink-400">
            We&rsquo;ve recognised that postcode — add the rest of the address
          below. Town is filled in when we can.
        </p>
      )}
      {addressLookup === "unavailable" && (
        <p className="mt-2 text-xs text-ink-400">
          We couldn&rsquo;t look up that postcode — please fill in the fields
          below manually.
        </p>
      )}
      {addressLookup !== "results" && value.addressLine1 && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-brand-700">
          <Check className="h-3.5 w-3.5" />
          {value.addressLine1}
          {value.city ? `, ${value.city}` : ""}
        </p>
      )}

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="field-label" htmlFor={`${idPrefix}-addressLine1`}>
            Address line 1
          </label>
          <input
            id={`${idPrefix}-addressLine1`}
            type="text"
            className="field-input"
            value={value.addressLine1}
            onChange={(e) => onChange({ addressLine1: e.target.value })}
            placeholder="Flat 3, 10 Example Street"
            autoComplete="address-line1"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="field-label" htmlFor={`${idPrefix}-addressLine2`}>
            Address line 2 (optional)
          </label>
          <input
            id={`${idPrefix}-addressLine2`}
            type="text"
            className="field-input"
            value={value.addressLine2}
            onChange={(e) => onChange({ addressLine2: e.target.value })}
            autoComplete="address-line2"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="field-label" htmlFor={`${idPrefix}-city`}>
            Town / City
          </label>
          <input
            id={`${idPrefix}-city`}
            type="text"
            className="field-input"
            value={value.city}
            onChange={(e) => onChange({ city: e.target.value })}
            autoComplete="address-level2"
          />
        </div>
      </div>
    </div>
  );
}
