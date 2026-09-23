"use client";

import { useState } from "react";
import { Check, MapPin, Search } from "lucide-react";
import { milesFromBase } from "@/lib/distance";
import { LONG_DISTANCE_THRESHOLD_MILES } from "@/lib/pricing";
import { getDistanceFromBase, lookupAddressesByPostcode, type AddressLookupResult } from "@/lib/quoteApi";
import type { ContactDetails, DestinationType, PropertyDetails, PropertyType } from "@/lib/types";

type DistanceStatus = "idle" | "loading" | "done" | "error";
type AddressLookupState = "idle" | "loading" | "results" | "no_results" | "unavailable";

export function StepProperty({
  contact,
  property,
  onContactChange,
  onPropertyChange,
}: {
  contact: ContactDetails;
  property: PropertyDetails;
  onContactChange: (contact: ContactDetails) => void;
  onPropertyChange: (property: PropertyDetails) => void;
}) {
  const [distanceStatus, setDistanceStatus] = useState<DistanceStatus>("idle");
  const [addressLookup, setAddressLookup] = useState<AddressLookupState>("idle");
  const [addressResults, setAddressResults] = useState<AddressLookupResult[]>([]);

  function patchContact(patch: Partial<ContactDetails>) {
    onContactChange({ ...contact, ...patch });
  }

  function patchProperty(patch: Partial<PropertyDetails>) {
    onPropertyChange({ ...property, ...patch });
  }

  async function lookupDistance(postcode: string) {
    if (!postcode.trim()) return;
    setDistanceStatus("loading");
    const result = await getDistanceFromBase(postcode);
    if (result.available && typeof result.miles === "number") {
      patchProperty({ distanceMiles: result.miles, distanceApproximate: Boolean(result.approximate) });
      setDistanceStatus("done");
    } else {
      patchProperty({ distanceMiles: null, distanceApproximate: false });
      setDistanceStatus("error");
    }
  }

  async function handleFindAddress() {
    if (!property.postcode.trim()) return;
    setAddressLookup("loading");
    setAddressResults([]);
    const result = await lookupAddressesByPostcode(property.postcode);
    if (!result.available) {
      // No address-lookup provider configured (or the call failed) — fall
      // back to the distance-only postcode check so pricing still works.
      setAddressLookup("unavailable");
      lookupDistance(property.postcode);
      return;
    }
    if (!result.addresses || result.addresses.length === 0) {
      setAddressLookup("no_results");
      lookupDistance(property.postcode);
      return;
    }
    setAddressResults(result.addresses);
    setAddressLookup("results");
    if (typeof result.latitude === "number" && typeof result.longitude === "number") {
      const miles = Math.round(milesFromBase(result.latitude, result.longitude) * 10) / 10;
      patchProperty({ distanceMiles: miles, distanceApproximate: false });
      setDistanceStatus("done");
    }
  }

  function selectAddress(address: AddressLookupResult) {
    patchProperty({
      addressLine1: address.line1,
      addressLine2: address.line2,
      city: address.town,
    });
    setAddressLookup("idle");
    setAddressResults([]);
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-ink-900">Your details</h2>
      <p className="mt-1.5 text-sm text-ink-500">
        So we can confirm your booking and tailor the quote to your home.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="field-label" htmlFor="fullName">
            Full name
          </label>
          <input
            id="fullName"
            type="text"
            className="field-input"
            value={contact.fullName}
            onChange={(e) => patchContact({ fullName: e.target.value })}
            placeholder="Jordan Smith"
            autoComplete="name"
          />
        </div>
        <div>
          <label className="field-label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            className="field-input"
            value={contact.email}
            onChange={(e) => patchContact({ email: e.target.value })}
            placeholder="you@example.com"
            autoComplete="email"
          />
        </div>
        <div>
          <label className="field-label" htmlFor="phone">
            Phone
          </label>
          <input
            id="phone"
            type="tel"
            className="field-input"
            value={contact.phone}
            onChange={(e) => patchContact({ phone: e.target.value })}
            placeholder="07123 456789"
            autoComplete="tel"
          />
        </div>
      </div>

      <h2 className="mt-9 text-lg font-semibold text-ink-900">Collection address</h2>

      <div className="mt-6">
        <label className="field-label" htmlFor="postcode">
          Postcode
        </label>
        <div className="flex gap-2">
          <input
            id="postcode"
            type="text"
            className="field-input"
            value={property.postcode}
            onChange={(e) => {
              patchProperty({ postcode: e.target.value.toUpperCase(), distanceMiles: null, distanceApproximate: false });
              setDistanceStatus("idle");
              setAddressLookup("idle");
              setAddressResults([]);
            }}
            onBlur={(e) => {
              if (addressLookup === "idle") lookupDistance(e.target.value);
            }}
            placeholder="MK9 2AF"
            autoComplete="postal-code"
          />
          <button
            type="button"
            onClick={handleFindAddress}
            disabled={!property.postcode.trim() || addressLookup === "loading"}
            className="btn-outline shrink-0 px-4"
          >
            <Search className="h-4 w-4" />
            {addressLookup === "loading" ? "Searching…" : "Find address"}
          </button>
        </div>

        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-ink-400">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          {distanceStatus === "loading" && "Checking distance from our Milton Keynes base…"}
          {distanceStatus === "done" && property.distanceMiles != null && (
            property.distanceMiles <= LONG_DISTANCE_THRESHOLD_MILES
              ? `${property.distanceMiles.toFixed(1)} miles${property.distanceApproximate ? " (approx.)" : ""} from our Milton Keynes base`
              : `${property.distanceMiles.toFixed(1)} miles${property.distanceApproximate ? " (approx.)" : ""} from our Milton Keynes base — a higher service rate applies beyond ${LONG_DISTANCE_THRESHOLD_MILES} miles to cover crew travel time`
          )}
          {distanceStatus === "error" &&
            "We couldn't recognise that postcode — you can still continue and we'll confirm the exact price once we have your full address"}
          {distanceStatus === "idle" && "We're based in Milton Keynes and cover the UK nationwide"}
        </p>

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
            No addresses found for that postcode — please fill in the fields below manually.
          </p>
        )}
        {addressLookup === "unavailable" && (
          <p className="mt-2 text-xs text-ink-400">
            Address lookup isn&rsquo;t available right now — please fill in the fields below manually.
          </p>
        )}
        {addressLookup !== "results" && property.addressLine1 && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-brand-700">
            <Check className="h-3.5 w-3.5" />
            {property.addressLine1}
            {property.city ? `, ${property.city}` : ""}
          </p>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="field-label" htmlFor="addressLine1">
            Address line 1
          </label>
          <input
            id="addressLine1"
            type="text"
            className="field-input"
            value={property.addressLine1}
            onChange={(e) => patchProperty({ addressLine1: e.target.value })}
            placeholder="Flat 3, 10 Example Street"
            autoComplete="address-line1"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="field-label" htmlFor="addressLine2">
            Address line 2 (optional)
          </label>
          <input
            id="addressLine2"
            type="text"
            className="field-input"
            value={property.addressLine2}
            onChange={(e) => patchProperty({ addressLine2: e.target.value })}
            autoComplete="address-line2"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="field-label" htmlFor="city">
            Town / City
          </label>
          <input
            id="city"
            type="text"
            className="field-input"
            value={property.city}
            onChange={(e) => patchProperty({ city: e.target.value })}
            autoComplete="address-level2"
          />
        </div>
      </div>

      <h2 className="mt-9 text-lg font-semibold text-ink-900">About the property</h2>
      <div className="mt-6 space-y-5">
        <div>
          <p className="field-label">Property type</p>
          <div className="grid grid-cols-2 gap-3">
            {(["house", "flat"] as PropertyType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => patchProperty({ propertyType: type })}
                className={[
                  "rounded-md border px-4 py-3 text-sm font-medium capitalize transition-colors",
                  property.propertyType === type
                    ? "border-brand-600 bg-brand-50 text-brand-800"
                    : "border-ink-200 text-ink-600 hover:border-ink-300",
                ].join(" ")}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="floors">
              {property.propertyType === "flat" ? "Which floor is it on?" : "Number of floors"}
            </label>
            <input
              id="floors"
              type="number"
              min={0}
              max={20}
              className="field-input"
              value={property.floors}
              onChange={(e) => patchProperty({ floors: Math.max(0, Number(e.target.value) || 0) })}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="rooms">
              Number of rooms
            </label>
            <input
              id="rooms"
              type="number"
              min={1}
              max={20}
              className="field-input"
              value={property.rooms}
              onChange={(e) => patchProperty({ rooms: Math.max(1, Number(e.target.value) || 1) })}
            />
          </div>
        </div>

        {property.propertyType === "flat" && (
          <label className="flex items-center gap-2.5 text-sm text-ink-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-400"
              checked={property.hasLift}
              onChange={(e) => patchProperty({ hasLift: e.target.checked })}
            />
            There is a lift available
          </label>
        )}

        <div>
          <p className="field-label">Where are the items going?</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(
              [
                { value: "new_home", label: "New home" },
                { value: "storage_facility", label: "Storage facility" },
              ] as { value: DestinationType; label: string }[]
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => patchProperty({ destinationType: option.value })}
                className={[
                  "rounded-md border px-4 py-3 text-sm font-medium transition-colors",
                  property.destinationType === option.value
                    ? "border-brand-600 bg-brand-50 text-brand-800"
                    : "border-ink-200 text-ink-600 hover:border-ink-300",
                ].join(" ")}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
