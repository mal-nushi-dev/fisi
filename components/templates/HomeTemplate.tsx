import React from "react";
import { SearchEntry } from "@/lib/gedcom/types";
import { HeroSearchHub } from "../organisms/HeroSearchHub";
import { MetricsLedger } from "../organisms/MetricsLedger";
import { SurnameDirectory } from "../organisms/SurnameDirectory";

interface HomeTemplateProps {
  stats: {
    totalPeople: number;
    totalFamilies: number;
    photosCount: number;
    earliestBirthYear?: number;
    latestBirthYear?: number;
  };
  searchIndex: SearchEntry[];
  surnames: Array<{ surname: string; count: number }>;
}

export function HomeTemplate({
  stats,
  searchIndex,
  surnames,
}: HomeTemplateProps) {
  return (
    <div className="space-y-8">
      {/* 00 & 01 // Archive Command & Search Hub */}
      <HeroSearchHub searchIndex={searchIndex} />

      {/* 02 // Swiss Archive Metrics Ledger */}
      <MetricsLedger stats={stats} />

      {/* 03 // Surname Index */}
      <SurnameDirectory surnames={surnames} />
    </div>
  );
}
