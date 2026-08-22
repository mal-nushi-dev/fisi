/**
 * @file page.tsx
 * @description Home overview page displaying family tree statistics, timeline span,
 * and quick search navigation.
 */

import Link from "next/link";
import { getTreeStats } from "@/lib/data/genealogy";

export default function HomePage() {
  const stats = getTreeStats();

  const yearRangeText =
    stats.earliestBirthYear && stats.latestBirthYear
      ? `${stats.earliestBirthYear} – ${stats.latestBirthYear}`
      : "Spanning multiple generations";

  return (
    <div className="space-y-10 py-4">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-8 sm:p-10 shadow-md">
        <span className="inline-block px-3 py-1 bg-indigo-500/30 text-indigo-200 text-xs font-semibold rounded-full uppercase tracking-wider mb-3">
          Family Archive
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          Nushi Family Genealogy
        </h1>
        <p className="mt-3 text-slate-300 max-w-2xl text-sm sm:text-base leading-relaxed">
          Welcome to the family tree archive. Explore generations of family
          history, vital records, photographs, and ancestral connections.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <Link
            href="/people"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition shadow"
          >
            <span>🔍 Browse All People</span>
          </Link>
          <a
            href="#stats"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-slate-200 text-sm font-medium rounded-xl transition"
          >
            <span>📊 Tree Statistics</span>
          </a>
        </div>
      </div>

      {/* Statistics Cards */}
      <section id="stats" className="space-y-4">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <span>📊</span> Overview &amp; Statistics
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Individuals
            </dt>
            <dd className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900">
              {stats.totalPeople}
            </dd>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Families
            </dt>
            <dd className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900">
              {stats.totalFamilies}
            </dd>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Archived Photos
            </dt>
            <dd className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900">
              {stats.photosCount}
            </dd>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Timeline Span
            </dt>
            <dd className="mt-2 text-lg sm:text-xl font-bold text-slate-900 truncate">
              {yearRangeText}
            </dd>
          </div>
        </div>
      </section>

      {/* Quick Navigation Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-800 text-base">
            Search Family Directory
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Quickly find individuals by first name, surname, or birth year.
          </p>
        </div>
        <Link
          href="/people"
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold rounded-lg transition shrink-0"
        >
          Open Directory &rarr;
        </Link>
      </div>
    </div>
  );
}
