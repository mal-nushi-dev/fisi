import React from "react";
import { MetricTile } from "../molecules/MetricTile";

interface MetricsLedgerProps {
  stats: {
    totalPeople: number;
    totalFamilies: number;
    photosCount: number;
    earliestBirthYear?: number;
    latestBirthYear?: number;
  };
  className?: string;
}

export function MetricsLedger({ stats, className = "" }: MetricsLedgerProps) {
  const yearRangeText =
    stats.earliestBirthYear && stats.latestBirthYear
      ? `${stats.earliestBirthYear} – ${stats.latestBirthYear}`
      : "Multi-Generation";

  const spanYears =
    stats.earliestBirthYear && stats.latestBirthYear
      ? `${stats.latestBirthYear - stats.earliestBirthYear} Years Recorded`
      : "Archive Timeline";

  return (
    <section className={`space-y-3 ${className}`}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricTile
          index="01"
          value={stats.totalPeople}
          label="Total Individuals"
          subtext="Non-excluded records"
        />

        <MetricTile
          index="02"
          value={stats.totalFamilies}
          label="Family Units"
          subtext="Kinship connections"
        />

        <MetricTile
          index="03"
          value={stats.photosCount}
          label="Archived Photos"
          subtext="Curated portraits"
        />

        <MetricTile
          index="04"
          value={yearRangeText}
          label="Timeline Span"
          subtext={spanYears}
        />
      </div>
    </section>
  );
}
