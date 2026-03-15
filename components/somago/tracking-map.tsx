// @ts-nocheck
"use client";

interface TrackingEvent {
  status: string;
  location?: string;
  timestamp: number;
}

interface TrackingMapProps {
  currentStep: number; // 0-4
  carrier?: string;
  estimatedDelivery?: number;
  events?: TrackingEvent[];
}

const TRACKING_STEPS = [
  { label: "Warehouse", icon: "warehouse", description: "Package received at warehouse" },
  { label: "Sorting Center", icon: "sorting", description: "Being sorted for delivery route" },
  { label: "Local Hub", icon: "hub", description: "Arrived at local distribution hub" },
  { label: "Out for Delivery", icon: "truck", description: "On its way to you" },
  { label: "Delivered", icon: "delivered", description: "Package delivered successfully" },
];

const CARRIER_LABELS: Record<string, string> = {
  jt_express: "J&T Express",
  lbc: "LBC Express",
  grab_express: "Grab Express",
  manual: "Seller Delivery",
};

function StepIcon({ type, completed, active }: { type: string; completed: boolean; active: boolean }) {
  const color = completed ? "text-white" : active ? "text-primary-600" : "text-neutral-400";

  const icons: Record<string, JSX.Element> = {
    warehouse: (
      <svg className={`h-4 w-4 ${color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    sorting: (
      <svg className={`h-4 w-4 ${color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      </svg>
    ),
    hub: (
      <svg className={`h-4 w-4 ${color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    truck: (
      <svg className={`h-4 w-4 ${color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10m10 0H3m10 0a2 2 0 104 0m-4 0a2 2 0 114 0m6-6v6m0 0h-2m2 0a2 2 0 104 0 2 2 0 10-4 0" />
      </svg>
    ),
    delivered: (
      <svg className={`h-4 w-4 ${color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
  };

  return icons[type] || icons.warehouse;
}

export function TrackingMap({ currentStep, carrier, estimatedDelivery, events }: TrackingMapProps) {
  // Map events to steps based on timestamp
  const getEventForStep = (stepIndex: number): TrackingEvent | undefined => {
    if (!events || events.length === 0) return undefined;
    // Return the event closest to this step (simple mapping)
    return events[stepIndex];
  };

  return (
    <div className="rounded-lg border border-border bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-neutral-900">Delivery Tracking</h2>
        {carrier && (
          <span className="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700">
            {CARRIER_LABELS[carrier] || carrier}
          </span>
        )}
      </div>

      {estimatedDelivery && currentStep < 4 && (
        <div className="mb-4 rounded-md bg-primary-50 px-3 py-2">
          <p className="text-xs text-primary-700">
            Estimated delivery:{" "}
            <span className="font-medium">
              {new Date(estimatedDelivery).toLocaleDateString("en-PH", {
                weekday: "short",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </p>
        </div>
      )}

      {/* Vertical Timeline */}
      <div className="space-y-0">
        {TRACKING_STEPS.map((step, i) => {
          const isCompleted = i < currentStep;
          const isActive = i === currentStep;
          const isFuture = i > currentStep;
          const event = getEventForStep(i);

          return (
            <div key={step.label} className="relative flex gap-3">
              {/* Timeline Line & Dot */}
              <div className="flex flex-col items-center">
                <div
                  className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${
                    isCompleted
                      ? "border-green-500 bg-green-500"
                      : isActive
                        ? "border-primary-500 bg-white"
                        : "border-neutral-200 bg-white"
                  } ${isActive ? "ring-4 ring-primary-100" : ""}`}
                >
                  {isCompleted ? (
                    <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <StepIcon type={step.icon} completed={false} active={isActive} />
                  )}
                  {/* Pulse animation for active step */}
                  {isActive && (
                    <span className="absolute inset-0 animate-ping rounded-full border-2 border-primary-400 opacity-30" />
                  )}
                </div>
                {/* Connector line */}
                {i < TRACKING_STEPS.length - 1 && (
                  <div
                    className={`w-0.5 flex-1 min-h-[24px] ${
                      isCompleted ? "bg-green-500" : "bg-neutral-200"
                    }`}
                  />
                )}
              </div>

              {/* Content */}
              <div className={`pb-4 ${i === TRACKING_STEPS.length - 1 ? "pb-0" : ""}`}>
                <p
                  className={`text-sm font-medium ${
                    isCompleted
                      ? "text-green-700"
                      : isActive
                        ? "text-primary-700"
                        : "text-neutral-400"
                  }`}
                >
                  {step.label}
                </p>
                <p
                  className={`text-xs ${
                    isFuture ? "text-neutral-300" : "text-neutral-500"
                  }`}
                >
                  {step.description}
                </p>
                {event && !isFuture && (
                  <div className="mt-1">
                    {event.location && (
                      <p className="text-xs text-neutral-500">{event.location}</p>
                    )}
                    <p className="text-[10px] text-neutral-400">
                      {new Date(event.timestamp).toLocaleDateString("en-PH", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
