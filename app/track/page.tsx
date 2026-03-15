// @ts-nocheck
"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const CARRIER_LABELS: Record<string, string> = {
  jt_express: "J&T Express",
  lbc: "LBC Express",
  grab_express: "Grab Express",
  manual: "Manual Shipping",
};

const STATUS_COLORS: Record<string, string> = {
  created: "bg-blue-100 text-blue-800",
  picked_up: "bg-yellow-100 text-yellow-800",
  in_transit: "bg-purple-100 text-purple-800",
  out_for_delivery: "bg-orange-100 text-orange-800",
  delivered: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
};

const STATUS_LABELS: Record<string, string> = {
  created: "Created",
  picked_up: "Picked Up",
  in_transit: "In Transit",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  failed: "Failed",
};

export default function TrackPage() {
  const [inputValue, setInputValue] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");

  const shipment = useQuery(
    api.shipments.trackByNumber,
    trackingNumber ? { trackingNumber } : "skip"
  );

  const handleTrack = () => {
    const trimmed = inputValue.trim();
    if (trimmed) {
      setTrackingNumber(trimmed);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold text-neutral-900">Track Your Package</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Enter your tracking number to see the latest shipping updates.
      </p>

      {/* Search */}
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Enter tracking number (e.g., JT1A2B3C4D)"
          className="flex-1"
          onKeyDown={(e) => e.key === "Enter" && handleTrack()}
        />
        <Button
          onClick={handleTrack}
          className="bg-primary-600 hover:bg-primary-700"
          disabled={!inputValue.trim()}
        >
          Track
        </Button>
      </div>

      {/* Results */}
      {trackingNumber && shipment === undefined && (
        <div className="mt-8 flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
        </div>
      )}

      {trackingNumber && shipment === null && (
        <div className="mt-8 rounded-lg border border-border bg-white p-6 text-center">
          <svg className="mx-auto h-12 w-12 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="mt-3 font-medium text-neutral-900">No shipment found</p>
          <p className="mt-1 text-sm text-neutral-500">
            Please check the tracking number and try again.
          </p>
        </div>
      )}

      {shipment && (
        <div className="mt-8 space-y-4">
          {/* Shipment Summary */}
          <div className="rounded-lg border border-border bg-white p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase text-neutral-500">Tracking Number</p>
                <p className="font-mono text-lg font-bold text-neutral-900">
                  {shipment.trackingNumber}
                </p>
              </div>
              <Badge className={STATUS_COLORS[shipment.status] ?? "bg-gray-100 text-gray-800"}>
                {STATUS_LABELS[shipment.status] ?? shipment.status}
              </Badge>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium uppercase text-neutral-500">Carrier</p>
                <p className="text-sm font-medium text-neutral-900">
                  {CARRIER_LABELS[shipment.carrier] ?? shipment.carrier}
                </p>
              </div>
              {shipment.estimatedDelivery && (
                <div>
                  <p className="text-xs font-medium uppercase text-neutral-500">
                    Estimated Delivery
                  </p>
                  <p className="text-sm font-medium text-neutral-900">
                    {new Date(shipment.estimatedDelivery).toLocaleDateString("en-PH", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="rounded-lg border border-border bg-white p-4">
            <h2 className="mb-4 text-sm font-semibold text-neutral-900">Shipment Timeline</h2>
            <div className="space-y-0">
              {[...shipment.events].reverse().map((event, i) => {
                const isLatest = i === 0;
                return (
                  <div key={i} className="flex gap-3">
                    {/* Timeline connector */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`h-3 w-3 rounded-full ${
                          isLatest ? "bg-primary-500 ring-4 ring-primary-100" : "bg-neutral-300"
                        }`}
                      />
                      {i < shipment.events.length - 1 && (
                        <div className="w-0.5 flex-1 bg-neutral-200" style={{ minHeight: "2rem" }} />
                      )}
                    </div>
                    {/* Event details */}
                    <div className="pb-4">
                      <p
                        className={`text-sm ${
                          isLatest ? "font-semibold text-neutral-900" : "text-neutral-700"
                        }`}
                      >
                        {event.status}
                      </p>
                      {event.location && (
                        <p className="text-xs text-neutral-500">{event.location}</p>
                      )}
                      <p className="text-xs text-neutral-400">
                        {new Date(event.timestamp).toLocaleDateString("en-PH", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
