# Nushi Family Genealogy

A read-only Next.js 15 App Router application. MacFamilyTree remains the editing source; the website is a static export with no database, runtime API, accounts, or in-browser genealogy edits.

## Data pipeline

`Nushi-Genealogy/` → GEDCOM parser → visibility rules → authorized WebP photos and normalized JSON → static pages.

`npm run build-data` runs `scripts/build-data.ts`. The existing `prebuild` hook runs it before every production build. Parsing handles GEDCOM line endings, individuals, families, places, and media references. `lib/privacy/visibility.ts` applies per-person overrides and removes excluded records before generating public artifacts. `lib/media/images.ts` processes only authorized photos and removes stale public copies.

Preserve raw inputs, `data/visibility-overrides.json`, generated schemas, and the typed accessors in `lib/data/genealogy.ts`. Raw GEDCOM and original media must never be imported by frontend components or copied to public output. Names and relationships are available only for non-excluded individuals; absent dates and photos may be unavailable or redacted. No death record is not proof that a person is living. The UI does not expose family marriage details.

## Presentation boundary

Server pages call `lib/presentation/get-archive.ts`, which composes the existing sanitized accessors. Pure adapters derive available years, relationship IDs, branches, and generation labels without changing backend types or generated data. Client components receive plain presentation records and do not import the raw source or generated JSON.

The primary root is the ancestor with the most unique descendants, then greatest depth, then lowest natural record ID. Partners share display generations; parent edges determine generation depth. Branches contain an ancestor, descendants, and their partners. Traversal tolerates missing references and cycles. These are navigation groupings, not historical era or birth-date assertions.

## Pages and components

- `/`: editorial home, local search suggestions/results, session-only recent searches, and actual archive statistics.
- `/people`: surname-ordered directory with query, branch, generation, status, initial, and pagination in the URL.
- `/people/[id]`: statically generated person profiles, recorded vitals, relatives, and a linked pedigree summary.
- `/tree`: the full family graph with pan/zoom, branch filtering, selected-person inspection, and profile links. `person` and `branch` query parameters support direct links and browser history.

Components are organized by feature under `components/layout`, `search`, `people`, `tree`, and reusable `ui` primitives. Server pages preserve metadata and static rendering; URL-dependent client features sit inside Suspense boundaries.

Tree layout uses Dagre for ordering and actual generation columns for horizontal placement. Each family unit has a card containing individually selectable partners; individuals may appear in more than one family card without changing their identity. Connector paths are computed from card positions. `react-zoom-pan-pinch` handles the viewport. No coordinates or person counts are fixed to the reference dataset.

## Design

`html.html` supplies the page compositions and home search states. `design.md` is authoritative for semantic colors, Cormorant Garamond headlines, Plus Jakarta Sans body text, square geometry, and warm diffuse shadows. Fonts are self-hosted by `next/font`; Tailwind is compiled locally. Unsupported placeholder destinations, translation, exports, and alternate tree modes are omitted.

## Build and verification

- `npm install`
- `npm run dev`
- `npm test`
- `npx tsc --noEmit`
- `npm run build` (includes GEDCOM generation and produces `out/`)

The output can be served by a static host with extensionless page resolution. Retain `output: "export"`, unoptimized Next images (already processed at build time), public robots restrictions, and global noindex metadata. Source records stay in the private repository; only static output is deployed.

Tests cover the original parser, privacy layer, and accessors, plus presentation traversal, search/filter combinations, pagination, generation calculation, family grouping, missing references, cycles, and full-archive node coverage. Browser verification covers desktop/mobile layouts, keyboard search, directory filters/history, tree selection/branch/reset, and profile navigation.
