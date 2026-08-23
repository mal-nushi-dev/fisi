import React from "react";
import { GlobalHeader } from "../organisms/GlobalHeader";
import { GlobalFooter } from "../organisms/GlobalFooter";

interface BaseLayoutProps {
  children: React.ReactNode;
  totalPeople?: number;
  totalFamilies?: number;
}

export function BaseLayout({
  children,
  totalPeople,
  totalFamilies,
}: BaseLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--surface-canvas)] text-[var(--text-primary)]">
      <GlobalHeader
        totalPeople={totalPeople}
        totalFamilies={totalFamilies}
      />
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>
      <GlobalFooter />
    </div>
  );
}
