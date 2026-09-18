import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllPersonIds, getPerson, getRelatives } from "@/lib/data/genealogy";
import { getArchive } from "@/lib/presentation/get-archive";
import { PersonProfile } from "@/components/people/PersonProfile";

interface PageProps { params: Promise<{ id: string }> }
export function generateStaticParams() { return getAllPersonIds().map((id) => ({ id })); }
export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const person = getPerson(id);
  return { title: person ? `${person.displayName} · ${person.id}` : "Record Not Found", description: person ? `Recorded vital events and family relationships for ${person.displayName}.` : undefined };
}

export default async function PersonPage({ params }: PageProps) {
  const { id } = await params;
  const person = getArchive().people.find((record) => record.id === id);
  if (!person) notFound();
  return <PersonProfile person={person} relatives={getRelatives(id)} />;
}
