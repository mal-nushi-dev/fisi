/**
 * @file VitalsSection.tsx
 * @description Semantic vital records card displaying gender, living status, birth,
 * death, and coordinate details.
 *
 * Privacy Behavior:
 * - Redacted fields are physically absent from `person.birth` or `person.death` and do not render.
 * - Map links are generated only if GPS coordinates were authorized by the privacy engine.
 */

import React from "react";
import { SanitizedPerson } from "@/lib/gedcom/types";

interface VitalsSectionProps {
  person: SanitizedPerson;
}

/**
 * Formats latitude and longitude coordinates into a human-readable string.
 * e.g. "42.3803° N, 20.4308° E"
 */
function formatCoords(lat?: number, lng?: number): string | null {
  if (lat === undefined || lng === undefined) return null;
  const latStr = `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? "N" : "S"}`;
  const lngStr = `${Math.abs(lng).toFixed(4)}° ${lng >= 0 ? "E" : "W"}`;
  return `${latStr}, ${lngStr}`;
}

export function VitalsSection({ person }: VitalsSectionProps) {
  const sexLabel =
    person.sex === "M" ? "Male" : person.sex === "F" ? "Female" : "Unknown";

  const birthCoords = formatCoords(
    person.birth?.place?.latitude,
    person.birth?.place?.longitude,
  );

  const deathCoords = formatCoords(
    person.death?.place?.latitude,
    person.death?.place?.longitude,
  );

  const hasBirth = Boolean(person.birth?.date || person.birth?.place?.name);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <h2 className="text-base font-semibold text-slate-800 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
        <span>📋</span> Vital Information
      </h2>

      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
        {/* Sex */}
        <div>
          <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Gender
          </dt>
          <dd className="mt-1 font-medium text-slate-800">{sexLabel}</dd>
        </div>

        {/* Status */}
        <div>
          <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Status
          </dt>
          <dd className="mt-1">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                person.isDeceased
                  ? "bg-slate-100 text-slate-700"
                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
              }`}
            >
              {person.isDeceased ? "Deceased" : "Living"}
            </span>
          </dd>
        </div>

        {/* Birth */}
        {hasBirth && (
          <div className="sm:col-span-2 bg-slate-50 rounded-lg p-3 border border-slate-100">
            <dt className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              🎂 Birth
            </dt>
            <dd className="space-y-1 text-slate-800">
              {person.birth?.date && (
                <div>
                  <span className="text-slate-500 text-xs">Date: </span>
                  <span className="font-medium">{person.birth.date}</span>
                </div>
              )}
              {person.birth?.place?.name && (
                <div>
                  <span className="text-slate-500 text-xs">Place: </span>
                  <span>{person.birth.place.name}</span>
                </div>
              )}
              {birthCoords && (
                <div className="text-xs text-slate-500 flex items-center gap-1.5 pt-0.5">
                  <span>📍 {birthCoords}</span>
                  {person.birth?.place?.latitude &&
                    person.birth?.place?.longitude && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${person.birth.place.latitude},${person.birth.place.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:underline"
                      >
                        (View Map)
                      </a>
                    )}
                </div>
              )}
            </dd>
          </div>
        )}

        {/* Death */}
        {person.isDeceased && (
          <div className="sm:col-span-2 bg-slate-50 rounded-lg p-3 border border-slate-100">
            <dt className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              🕊️ Death
            </dt>
            <dd className="space-y-1 text-slate-800">
              {person.death?.date ? (
                <div>
                  <span className="text-slate-500 text-xs">Date: </span>
                  <span className="font-medium">{person.death.date}</span>
                </div>
              ) : (
                <div className="text-slate-500 text-xs italic">
                  Recorded as deceased (no date recorded)
                </div>
              )}
              {person.death?.place?.name && (
                <div>
                  <span className="text-slate-500 text-xs">Place: </span>
                  <span>{person.death.place.name}</span>
                </div>
              )}
              {deathCoords && (
                <div className="text-xs text-slate-500 flex items-center gap-1.5 pt-0.5">
                  <span>📍 {deathCoords}</span>
                  {person.death?.place?.latitude &&
                    person.death?.place?.longitude && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${person.death.place.latitude},${person.death.place.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:underline"
                      >
                        (View Map)
                      </a>
                    )}
                </div>
              )}
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
}
