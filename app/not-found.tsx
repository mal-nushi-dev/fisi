import Link from "next/link";
export default function NotFound() {
  return (
    <main id="main-content" className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <p className="mb-4 text-xs uppercase tracking-[0.2em] text-secondary">Record not found</p>
      <h1 className="font-headline text-5xl">This page is not in the archive.</h1>
      <p className="mt-5 text-sm leading-relaxed text-secondary">Browse the people index to find an available family record.</p>
      <Link className="mt-8 bg-primary px-6 py-3 text-sm text-on-primary" href="/people">Browse the index</Link>
    </main>
  );
}
