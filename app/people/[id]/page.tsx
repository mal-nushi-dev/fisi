/**
 * @file page.tsx
 * @description Static person profile page rendering the Asymmetric 2-Column Swiss Grid (PersonProfileTemplate).
 */

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllPersonIds, getPerson, getRelatives } from "@/lib/data/genealogy";
import { PersonProfileTemplate } from "@/components/templates/PersonProfileTemplate";

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
      title: "Record Not Found — Fisi Genealogy",
    };
  }

  return {
    title: `${person.displayName} [${person.id}] — Fisi Genealogy`,
    description: `Genealogical archive records and kinship relations for ${person.displayName}.`,
  };
}

export default async function PersonDetailPage({ params }: PageProps) {
  const { id } = await params;
  const person = getPerson(id);

  if (!person) {
    notFound();
  }

  const relatives = getRelatives(id);

  return <PersonProfileTemplate person={person} relatives={relatives} />;
}
