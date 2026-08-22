/**
 * @file page.tsx
 * @description Static person profile page generated for each individual in the family tree.
 *
 * Static Pre-rendering:
 * - Uses `generateStaticParams` to statically pre-build pages for all non-excluded individuals.
 * - Queries data solely through DAL functions (`getPerson`, `getRelatives`).
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getAllPersonIds, getPerson, getRelatives } from "@/lib/data/genealogy";
import { PersonPhoto } from "@/components/PersonPhoto";
import { VitalsSection } from "@/components/VitalsSection";
import { RelativesSection } from "@/components/RelativesSection";

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Enumerates all person IDs for static pre-rendering at build time.
 */
export async function generateStaticParams() {
  const ids = getAllPersonIds();
  return ids.map((id) => ({ id }));
}

/**
 * Dynamic metadata generator for person detail pages.
 */
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const person = getPerson(id);

  if (!person) {
    return {
      title: "Person Not Found — Nushi Genealogy",
    };
  }

  return {
    title: `${person.displayName} — Nushi Genealogy`,
    description: `Genealogy records and family relations for ${person.displayName}.`,
  };
}

export default async function PersonDetailPage({ params }: PageProps) {
  const { id } = await params;
  const person = getPerson(id);

  if (!person) {
    notFound();
  }

  const relatives = getRelatives(id);

  const yearsSubtitle = person.birth?.date
    ? person.death?.date
      ? `${person.birth.date} – ${person.death.date}`
      : `Born: ${person.birth.date}`
    : person.death?.date
      ? `Died: ${person.death.date}`
      : null;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Top Breadcrumb / Back Link */}
      <div className="flex items-center justify-between">
        <Link
          href="/people"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-500 hover:text-indigo-600 transition"
        >
          <span>&larr;</span> Back to Directory
        </Link>
        <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
          ID: {person.id}
        </span>
      </div>

      {/* Person Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <PersonPhoto
          photoUrl={person.photoUrl}
          name={person.displayName}
          size="lg"
        />

        <div className="flex-1 text-center sm:text-left space-y-2">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {person.displayName}
            </h1>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                person.isDeceased
                  ? "bg-slate-100 text-slate-700"
                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
              }`}
            >
              {person.isDeceased ? "Deceased" : "Living"}
            </span>
          </div>

          {yearsSubtitle && (
            <p className="text-sm font-medium text-slate-600">
              {yearsSubtitle}
            </p>
          )}

          <p className="text-xs text-slate-400">
            MacFamilyTree Record &bull;{" "}
            {person.sex === "M"
              ? "Male"
              : person.sex === "F"
                ? "Female"
                : "Unknown"}
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <VitalsSection person={person} />
        <RelativesSection relatives={relatives} />
      </div>
    </div>
  );
}
