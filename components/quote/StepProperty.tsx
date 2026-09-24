"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import { milesFromBase, roundMiles } from "@/lib/distance";
import { LONG_DISTANCE_THRESHOLD_MILES } from "@/lib/pricing";
import { getDistanceFromBase, getJourneyDistance } from "@/lib/quoteApi";
import { DESTINATION_OPTIONS, type ContactDetails, type DestinationType, type PropertyDetails } from "@/lib/types";
import { AddressFields, type AddressResolved } from "./AddressFields";

type DistanceStatus = "idle" | "loading" | "done" | "error";

export function StepProperty({
  contact,
  property,
  onContactChange,
  onPropertyChange,
}: {
  contact: ContactDetails;
  property: PropertyDetails;
  onContactChange: (patch: Partial<ContactDetails>) => void;
  onPropertyChange: (patch: Partial<PropertyDetails>) => void;
}) {
  const [distanceStatus, setDistanceStatus] = useState<DistanceStatus>(
    property.distanceMiles != null ? "done" : "idle"
  );
  const [journeyStatus, setJourneyStatus] = useState<DistanceStatus>(
    property.journeyMiles != null ? "done" : "idle"
  );

  function patchContact(patch: Partial<ContactDetails>) {
    onContactChange(patch);
  }

  function patchProperty(patch: Partial<PropertyDetails>) {
    onPropertyChange(patch);
  }

  async function refreshJourney(pickup: string, destination: string) {
    if (!pickup.trim() || !destination.trim()) return;
    setJourneyStatus("loading");
    const result = await getJourneyDistance(pickup, destination);
    if (result.available && typeof result.journeyMiles === "number") {
      patchProperty({
        journeyMiles: result.journeyMiles,
        journeyApproximate: Boolean(result.journeyApproximate),
        ...(typeof result.miles === "number"
          ? { distanceMiles: result.miles, distanceApproximate: Boolean(result.approximate) }
          : {}),
      });
      if (typeof result.miles === "number") setDistanceStatus("done");
      setJourneyStatus("done");
    } else {
      patchProperty({ journeyMiles: null, journeyApproximate: false });
      setJourneyStatus("error");
    }
  }

  async function handleCollectionResolved(result: AddressResolved) {
    if (typeof result.latitude === "number" && typeof result.longitude === "number") {
      const miles = roundMiles(milesFromBase(result.latitude, result.longitude));
      patchProperty({
        distanceMiles: miles,
        distanceApproximate: false,
        ...(result.town && !property.city.trim() ? { city: result.town } : {}),
      });
      setDistanceStatus("done");
    } else if (result.postcode.trim()) {
      setDistanceStatus("loading");
      const distance = await getDistanceFromBase(result.postcode);
      if (distance.available && typeof distance.miles === "number") {
        patchProperty({
          distanceMiles: distance.miles,
          distanceApproximate: Boolean(distance.approximate),
        });
        setDistanceStatus("done");
      } else {
        patchProperty({ distanceMiles: null, distanceApproximate: false });
        setDistanceStatus("error");
      }
    }
    if (property.destinationPostcode.trim()) {
      refreshJourney(result.postcode, property.destinationPostcode);
    }
  }

  function handleDestinationResolved(result: AddressResolved) {
    if (result.town && !property.destinationCity.trim()) {
      patchProperty({ destinationCity: result.town });
    }
    if (property.postcode.trim() && result.postcode.trim()) {
      refreshJourney(property.postcode, result.postcode);
    }
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
      <p className="mt-1.5 text-sm text-ink-500">Where we&rsquo;ll pick the items up from.</p>
      <div className="mt-6">
        <AddressFields
          idPrefix="collection"
          value={{
            addressLine1: property.addressLine1,
            addressLine2: property.addressLine2,
            city: property.city,
            postcode: property.postcode,
          }}
          onChange={(patch) => {
            const next: Partial<PropertyDetails> = { ...patch };
            if (patch.postcode !== undefined) {
              next.distanceMiles = null;
              next.distanceApproximate = false;
              next.journeyMiles = null;
              next.journeyApproximate = false;
              setDistanceStatus("idle");
              setJourneyStatus("idle");
            }
            patchProperty(next);
          }}
          onResolved={handleCollectionResolved}
          helper={
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
              {distanceStatus === "idle" && "We're based in Milton Keynes (MK13 0BG) and cover the UK nationwide"}
            </p>
          }
        />
      </div>

      <h2 className="mt-9 text-lg font-semibold text-ink-900">About the property</h2>
      <div className="mt-6 space-y-5">
        <div>
          <p className="field-label">Property type</p>
          <div className="grid grid-cols-2 gap-3">
            {(["house", "flat"] as const).map((type) => (
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {DESTINATION_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => patchProperty({ destinationType: option.value as DestinationType })}
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

      <h2 className="mt-9 text-lg font-semibold text-ink-900">Destination address</h2>
      <p className="mt-1.5 text-sm text-ink-500">
        {property.destinationType === "abroad"
          ? "If you're moving abroad, enter the UK address we'll take the items to — for example a freight depot, port or packing warehouse. We'll discuss overseas shipping separately."
          : "Where the items are being delivered. We use this to calculate van fuel: collection to here, then back to our MK13 0BG depot."}
      </p>
      <div className="mt-6">
        <AddressFields
          idPrefix="destination"
          value={{
            addressLine1: property.destinationAddressLine1,
            addressLine2: property.destinationAddressLine2,
            city: property.destinationCity,
            postcode: property.destinationPostcode,
          }}
          onChange={(patch) => {
            const next: Partial<PropertyDetails> = {};
            if (patch.addressLine1 !== undefined) next.destinationAddressLine1 = patch.addressLine1;
            if (patch.addressLine2 !== undefined) next.destinationAddressLine2 = patch.addressLine2;
            if (patch.city !== undefined) next.destinationCity = patch.city;
            if (patch.postcode !== undefined) {
              next.destinationPostcode = patch.postcode;
              next.journeyMiles = null;
              next.journeyApproximate = false;
              setJourneyStatus("idle");
            }
            patchProperty(next);
          }}
          onResolved={handleDestinationResolved}
          helper={
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-ink-400">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              {journeyStatus === "loading" && "Calculating the journey for van fuel…"}
              {journeyStatus === "done" && property.journeyMiles != null && (
                `${property.journeyMiles.toFixed(1)} miles${property.journeyApproximate ? " (approx.)" : ""} for van fuel — collection to destination, then back to our MK13 0BG depot`
              )}
              {journeyStatus === "error" &&
                "We couldn't calculate the journey yet — you can still continue and we'll confirm fuel once both addresses are set"}
              {journeyStatus === "idle" && "Van fuel is based on this journey, not a flat rate"}
            </p>
          }
        />
      </div>
    </div>
  );
}
