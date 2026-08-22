# Family Tree Web App — Architecture

## Context

This is a from-scratch build. The repo currently contains only raw input data — a GEDCOM 7.0.3 export from MacFamilyTree (`Nushi-Genealogy/Nushi-Genealogy.ged`: 127 individuals, 40 families, 5 linked photos) plus a redundant zip of the same. There is no `package.json`, no source code, no framework yet. No UI/UX mockups exist.

This document nails down the **architecture** before any design or code work happens, based on the following settled requirements:

- **Audience**: all family members; expected to be low-traffic (hobby project, not built to scale).
- **Editing model**: the user is the sole editor, working offline in MacFamilyTree, periodically re-exporting a fresh GEDCOM. The live site is **read-only** — no in-app editing, no accounts.
- **Access**: **fully public** — no login, no password.
- **Tree UX**: start with simple linked profile pages (wiki-style: each person links to parents/spouse/children); add an interactive pannable/zoomable diagram later. The data layer must support both without a rework.
- **Privacy**: per-individual, per-field visibility control (birthdate, birthplace, photo, etc.) that the user can toggle over time, independent of living/deceased status — must be data-driven, not hardcoded logic. Person **names are always shown** (needed for wiki-style navigation); use a whole-person "exclude" escape hatch for anyone who shouldn't appear at all.
- **Hosting**: Next.js on Vercel.

These constraints point toward a fully static, database-free architecture, since there are zero runtime writes, a single offline editor, and no concurrency to manage. A database + admin UI would just be a second source of truth to keep in sync with MacFamilyTree for no benefit.

## Architecture Overview

**GEDCOM file → build-time pipeline → normalized JSON → Next.js static generation → Vercel.**

Git is the audit trail for both the genealogy data and the privacy config — free history/diff/rollback on "who can see what," with no server, database, or auth layer to run or secure.

## GEDCOM Ingestion

Write a **small custom parser** (~100–150 lines of TypeScript) rather than adopting a third-party library. Both realistic candidates have real, verified problems for this file:
- `@treeviz/gedcom-parser` splits input on `\r?\n` and will fail to tokenize this file at all, since it uses **CR-only** line endings (confirmed via `file`). Workaroundable, but a real gotcha.
- `gedcom-ts` is explicitly browser-oriented (depends on `File`/`Blob`/`XMLHttpRequest`), has no discoverable public repo, and ships a non-standard license string — too much unverified surface for a long-term dependency.

The tag surface actually needed is small and fixed: `NAME`/`GIVN`/`SURN`, `SEX`, `BIRT`/`DEAT` with `PLAC` (+ `TRAN`, `MAP`/`LONG`/`LATI`), `FAMC`, `FAMS`, `HUSB`/`WIFE`/`CHIL`, `MARR`, `OBJE`/`FILE`. A custom parser: builds an indent-based line tree (handling CR-only line endings as the first step), walks `INDI`/`FAM`/`OBJE` records for just these tags, and silently ignores unrecognized tags (including all `_`-prefixed MacFamilyTree extensions like `_SCS`, `_LCS`, `_STF`) so future exports with new custom tags don't break the build.

**Where it runs**: `scripts/build-data.ts`, wired as `"prebuild"` in `package.json` — runnable/debuggable standalone (`npm run build-data`), independent of Next.js internals.

**Output shape** (normalized, diagram-ready — relationships as ID references, not nested objects, so a future diagram view is additive, not a rewrite):

```ts
type Person = {
  id: string;                 // GEDCOM xref, e.g. "I33"
  givenName: string; surname: string;
  sex: "M" | "F" | "U";
  birth?: { date?: string; place?: Place };
  death?: { date?: string; place?: Place };
  photoId?: string;           // resolved to a public asset path at build time
  parentFamilyId?: string;    // FAMC
  spouseFamilyIds: string[];  // FAMS
};
type Family = { id: string; husbandId?: string; wifeId?: string; childIds: string[]; marriage?: { date?: string; place?: Place } };
```

## Privacy / Visibility Layer

A hand-edited, git-committed file: `data/visibility-overrides.json`, keyed by GEDCOM xref ID with per-field overrides:

```json
{
  "version": 1,
  "defaultPolicy": { "sensitiveFields": ["birthDate", "birthPlace", "deathDate", "deathPlace", "residence", "mapCoordinates", "photo"] },
  "overrides": {
    "I33": { "fields": { "birthDate": "hidden", "photo": "hidden" }, "note": "living — hide per request, 2026-08" },
    "I50": { "exclude": true }
  }
}
```

- **Default rule**: a sensitive field is visible only if the person has a `DEAT` record; otherwise all sensitive fields default to hidden. `overrides[id].fields.<field>` always wins over the default, in either direction.
- **Names are always shown** — not governed by this policy. `exclude: true` is the escape hatch for someone who shouldn't appear at all; they simply get no page, though others may still reference the relationship structurally.
- Field values are enum strings (`"hidden"` / `"visible"`, not booleans) so options like `"yearOnly"` or `"cityOnly"` can be added later without changing the file's shape.
- **Merge happens inside `scripts/build-data.ts`, before anything is written to `public/` or embedded in a page.** This is the load-bearing rule: redaction must happen at data-generation time, not render time. The raw parsed GEDCOM (all fields, all photos) must never exist as a build output artifact — a client-side "hide this field" approach would still leak the raw value into the shipped HTML/JSON.

**Day-one calibration note**: only 13 of 127 people currently have a `DEAT` record, so the naive default will mark the other 114 fully redacted — mostly long-deceased ancestors who simply never had a death date entered, not living-privacy cases. Add a small `npm run privacy:report` script (part of `build-data.ts`) that prints all people sorted by birth year with their resolved default visibility, so a single pass lets you add `overrides` only for genuine exceptions.

## Application Structure (Next.js App Router)

```
app/
  page.tsx                    # home / entry point
  people/
    page.tsx                  # full index + client-side search
    [id]/page.tsx              # person detail: vitals (visibility-filtered), photo, links to parents/spouse(s)/children
lib/
  data/genealogy.ts            # typed Person/Family accessors over the generated JSON
  gedcom/parse.ts               # custom parser
  gedcom/visibility.ts           # default-policy + override merge logic
scripts/
  build-data.ts                 # prebuild: parse → merge visibility → resize/copy photos → write generated JSON
data/
  visibility-overrides.json       # hand-maintained
```

`generateStaticParams` on `app/people/[id]/page.tsx` enumerates only non-excluded IDs, so an excluded person has no page at all.

**Two explicit decoupling boundaries**, both worth naming so they don't erode as the app grows:

1. **Domain model independent of GEDCOM.** Only `lib/gedcom/parse.ts` knows GEDCOM syntax (tags, xrefs, line structure). Its sole job is to translate raw GEDCOM into the `Person`/`Family` shapes defined above — nothing downstream (`lib/gedcom/visibility.ts`, `scripts/build-data.ts`, `lib/data/genealogy.ts`, any `app/` page or component) ever touches a GEDCOM tag directly; they all operate purely on the normalized domain types. Practical payoff: if you ever move off MacFamilyTree or GEDCOM entirely, only `parse.ts` gets replaced — the privacy layer, pages, and search are untouched because they were never coupled to the source format.

2. **Data layer independent of the UI layer.** Pages and components never import the generated JSON or reach into raw data shapes directly — they always go through typed accessor functions in `lib/data/genealogy.ts` (e.g. `getPerson(id)`, `getAllPeople()`, `getSearchIndex()`). This keeps rendering changes (new page, new layout, Phase 2's diagram view) from rippling into data-shape changes, and is also the single seam where the underlying data source could change later (e.g., if a database were ever introduced) without touching any page code — only `genealogy.ts`'s implementation would change.

**Phase 2 (later, not built now)**: an `app/tree/page.tsx` interactive diagram, reusing the same generated JSON. Recommended library: **`relatives-tree`** (purpose-built layout algorithm matching the existing `{id, parents, children, spouses}` shape) paired with `react-zoom-pan-pinch` for pan/zoom — far less effort than hand-rolling tree layout in D3, and the data model built now requires no changes to support it.

## Media Handling

Photos (300KB–6MB PNGs) are never served as-is. The build script uses `sharp` to resize/compress into `public/photos/<id>.webp`. Critically, **this copy step only runs for individuals whose merged `photo` field resolves to visible** — a redacted person's source photo is never read into `public/`, so it's structurally absent from the deployed output (same build-time-redaction principle applied to binary assets, not a client-side gate).

**Fallback for people without a resolved photo** — whether because no `OBJE` was ever linked in MacFamilyTree for them, or because their photo is redacted: a shared `PersonPhoto` component renders a static placeholder graphic (e.g. `public/photo-placeholder.svg`, a simple silhouette) whenever `person.photoUrl` is absent. This is a plain UI default, not a privacy decision, so it's fine to handle at render time rather than build time — there's no real photo to leak, just an empty slot to fill. One placeholder is enough for v1; a gender-aware variant (M/F/U) is a cheap later enhancement, not necessary now.

## Search

Client-side only — 127 records doesn't justify a server search layer, which would also be the one thing pulling the architecture back toward needing a backend.

**Data**: `scripts/build-data.ts` emits a small flat array, e.g. `data/search-index.generated.json`, alongside the full `Person`/`Family` data — same redaction pass applied, so no raw data sneaks in through this second artifact:
```ts
type SearchEntry = { id: string; displayName: string; birthYear?: number };
```
`displayName` = `${givenName} ${surname}`. `birthYear` is present only if that person's `birthDate` field resolves to visible under the privacy rules; otherwise omitted entirely (not just hidden in the UI — absent from the data). Excluded (`exclude: true`) individuals are not in the array at all. Sorted alphabetically by surname, then given name, at generation time.

**UI**: `app/people/page.tsx` is a client component. It receives the generated index as static data (imported directly — it's a build artifact, not fetched) and renders:
- A single `<input>` at the top, controlled via `useState`, filtering on every keystroke — no debounce needed, since filtering 127 in-memory records is sub-millisecond.
- Default (empty query): the full sorted list.
- Filter logic (v1, plain substring, no dependency): `entries.filter(p => p.displayName.toLowerCase().includes(query.trim().toLowerCase()))`.
- Each result renders as a link to `/people/[id]`, showing `displayName` plus `(b. {birthYear})` when present, nothing extra when absent.
- No results: a plain "No matches found" message.
- No pagination — the full filtered list renders at once; 127 rows is nothing for the browser.

**Optional upgrade, not v1**: if plain substring matching proves annoying (e.g. misspelling a name), swap in `Fuse.js` (~3KB): `new Fuse(entries, { keys: ['displayName'], threshold: 0.3 })`, call `.search(query)` on change. Start without it — add only if you actually find yourself wanting typo tolerance in practice.

At no point does search involve a network request after the initial page load — the entire index ships as part of the static page bundle, and all filtering happens in the visitor's browser.

## Access & Exposure

Two considerations distinct from the in-app privacy layer (which only governs field-level visibility *within* pages the site actually serves):

- **The source repository must be private.** The git repo — containing the raw `.ged` file with full, unredacted data for all 127 people — is the build's input, not something that should itself be public. A public repo would make every redacted field trivially readable directly in `Nushi-Genealogy.ged`, defeating the visibility-overrides system entirely. Deploy from a **private** GitHub repo; Vercel's GitHub integration supports this natively, no workaround needed. Only the *built static output* (already redaction-filtered at build time) is public.
- **Block search-engine indexing.** Ship a `robots.txt` disallowing all crawlers, plus `<meta name="robots" content="noindex">` on every page (Next.js: a `metadata.robots` export). The site stays fully accessible to anyone with the link — this only keeps it out of Google/Bing results, so exposure stays limited to people you've actually shared the link with, rather than anyone who searches a family member's name.
- **Worth knowing, not something to build**: once a page has been served publicly, later hiding a field via `visibility-overrides.json` only affects future builds — it can't retroactively scrub a browser cache or a screenshot someone already took. Not a flaw to fix, just a real limit of "public now, redact later" worth keeping in mind when deciding what to leave visible by default.

## Deployment

**Next.js + Vercel, `output: 'export'`** (true static HTML export). Since the pipeline already pre-resizes/compresses every photo at build time, Vercel's on-the-fly Image Optimization adds little value here, and static export keeps hosting portable while still using Vercel's git-triggered deploy workflow.

**Update workflow**:
1. Edit tree in MacFamilyTree → export GEDCOM + media, overwriting files under `Nushi-Genealogy/`.
2. If a new person needs a privacy exception, hand-edit `data/visibility-overrides.json` (usually a no-op — the default policy handles most cases).
3. `git commit && git push`.
4. Vercel's git integration runs `npm run build` → `prebuild` (parse → merge visibility → resize/copy photos → write JSON) → `next build` statically generates every page.
5. Live in ~1-2 minutes, no manual server steps.

## Tech Stack Summary

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js (App Router) | Also the right call specifically because Phase 2's interactive diagram needs client-side React, which a leaner static-site tool would need an explicit "island" for anyway. |
| Language | TypeScript | The hand-edited `visibility-overrides.json` feeds directly into the data model — a typo in a field name should fail the build, not silently no-op in production. |
| Styling | Tailwind CSS | Fast to build mobile-friendly wiki-style pages without custom CSS overhead. |
| GEDCOM parsing | Custom minimal parser | See above — avoids the CR-only line-ending gap and license/transparency issues found in both candidate libraries. |
| Image processing | `sharp` | Build-time resize/compress; standard in the Next.js/Vercel ecosystem. |
| Search | Plain filter or `Fuse.js` | Sufficient at 127 records; no backend needed. |
| Diagram (Phase 2) | `relatives-tree` + `react-zoom-pan-pinch` | Purpose-built layout matching the existing normalized data shape. |
| Testing | Vitest, scoped to `lib/gedcom/parse.ts` and `lib/gedcom/visibility.ts` | These are the two modules where a bug costs something (mis-parsed relationships, or a privacy leak). |
| Hosting | Vercel, static export (`output: 'export'`) | No runtime data needs; portable, git-triggered deploys. |
| Database / Auth / API routes | None | No runtime writes, no accounts, no dynamic data. |

## Critical Files (once implementation starts)

- `scripts/build-data.ts` — the whole ingestion/privacy/media pipeline
- `lib/gedcom/parse.ts` — custom GEDCOM parser
- `lib/gedcom/visibility.ts` — default policy + override merge
- `data/visibility-overrides.json` — hand-maintained privacy config
- `app/people/[id]/page.tsx` — person detail page
- `next.config.js` — `output: 'export'` config

## Verification (once implementation starts)

- **GEDCOM xref ID stability (do this before building anything else)**: in MacFamilyTree, re-export the current tree to GEDCOM twice in a row with no changes in between, and diff the two files. Confirm every `@Ixx@`/`@Fxx@` xref stays identical across the two exports. This matters because both `data/visibility-overrides.json` and person page URLs (`/people/I33`) key off these IDs — if MacFamilyTree ever renumbers them on export, overrides could silently apply to the wrong person and shared/bookmarked URLs would break.
- `npm run build-data` in isolation: confirm all 127 individuals and 40 families parse without error, custom `_`-tags are ignored without crashing, CR-only line endings are handled.
- `npm run privacy:report`: confirm default visibility looks sane before adding overrides.
- `next dev`: spot-check several person pages (including one redacted-by-default and one deceased/fully-visible) render correctly and links between relatives resolve.
- `next build`: confirm all pages generate, confirm `public/photos/` contains only photos for visible individuals (verify a redacted person's photo file is absent from build output).
- Confirm the deployed repo is set to **private** in GitHub/Vercel settings, and confirm `robots.txt` + `noindex` are present on the deployed site.
