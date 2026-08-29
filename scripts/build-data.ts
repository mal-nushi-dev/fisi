/**
 * @file build-data.ts
 * @description Standalone CLI script that runs the data ingestion, privacy redaction,
 * and media optimization pipeline.
 *
 * Usage:
 * - `npm run build-data`: Generates `data/generated/genealogy.json`, `data/generated/search-index.json`,
 *   and optimizes photos into `public/photos/*.webp`.
 * - `npm run privacy:report`: Outputs a privacy calibration table showing resolved visibility
 *   for every individual in the family tree.
 *
 * Pipeline Flow:
 * 1. Read `Nushi-Genealogy.ged` (handling CR-only line endings).
 * 2. Parse into domain entities (`lib/gedcom/parser.ts`).
 * 3. Load privacy overrides from `data/visibility-overrides.json`.
 * 4. Apply privacy sanitization and omit redacted fields (`lib/privacy/visibility.ts`).
 * 5. Convert and output only authorized WebP photos (`lib/media/images.ts`).
 * 6. Write sanitized JSON datasets for static consumption by Next.js.
 */

import * as fs from "fs";
import * as path from "path";
import { parseGedcom } from "../lib/gedcom/parser";
import {
  sanitizeGenealogy,
  resolvePersonVisibility,
  extractYear,
} from "../lib/privacy/visibility";
import { processVisiblePhotos } from "../lib/media/images";
import { VisibilityOverrides, GenealogyData } from "../lib/gedcom/types";

// File and directory paths
const GEDCOM_PATH = path.join(
  process.cwd(),
  "Nushi-Genealogy",
  "Nushi-Genealogy.ged",
);
const MEDIA_DIR = path.join(
  process.cwd(),
  "Nushi-Genealogy",
  "Nushi-Genealogy Media",
);
const OVERRIDES_PATH = path.join(
  process.cwd(),
  "data",
  "visibility-overrides.json",
);
const GENERATED_DIR = path.join(process.cwd(), "data", "generated");
const GENEALOGY_JSON_PATH = path.join(GENERATED_DIR, "genealogy.json");
const SEARCH_INDEX_JSON_PATH = path.join(GENERATED_DIR, "search-index.json");
const PUBLIC_PHOTOS_DIR = path.join(process.cwd(), "public", "photos");

/**
 * Loads and parses `data/visibility-overrides.json`.
 * Returns a fallback configuration if the file does not exist or cannot be parsed.
 */
function loadOverrides(): VisibilityOverrides {
  if (fs.existsSync(OVERRIDES_PATH)) {
    try {
      const raw = fs.readFileSync(OVERRIDES_PATH, "utf8");
      return JSON.parse(raw);
    } catch (err) {
      console.warn(
        "⚠️ Warning: Failed to parse visibility-overrides.json, using default policy:",
        (err as Error).message,
      );
    }
  }
  return {
    version: 1,
    defaultPolicy: {
      sensitiveFields: [
        "birthDate",
        "birthPlace",
        "deathDate",
        "deathPlace",
        "photo",
        "mapCoordinates",
      ],
    },
    overrides: {},
  };
}

/**
 * Main execution function for the build-data pipeline.
 */
async function main() {
  const isReportMode = process.argv.includes("--report");

  if (!fs.existsSync(GEDCOM_PATH)) {
    console.error(`❌ Error: GEDCOM file not found at ${GEDCOM_PATH}`);
    process.exit(1);
  }

  console.log(`📖 Loading GEDCOM: ${GEDCOM_PATH}`);
  const gedcomContent = fs.readFileSync(GEDCOM_PATH, "utf8");
  const parsed = parseGedcom(gedcomContent);
  console.log(
    `✅ Parsed ${parsed.people.length} individuals, ${parsed.families.length} families, ${Object.keys(parsed.media).length} media objects.`,
  );

  const overridesConfig = loadOverrides();

  // Mode 1: Privacy Calibration Report
  if (isReportMode) {
    console.log(
      "\n============================= PRIVACY CALIBRATION REPORT =============================",
    );
    console.log("ID\t| Deceased | B.Year | Photo | Name\t\t\t\t| Status");
    console.log(
      "----------------------------------------------------------------------------------------",
    );

    // Sort people by birth year (oldest to newest, then unknown)
    const sortedPeople = [...parsed.people].sort((a, b) => {
      const yearA = extractYear(a.birth?.date) ?? 9999;
      const yearB = extractYear(b.birth?.date) ?? 9999;
      if (yearA !== yearB) return yearA - yearB;
      return a.id.localeCompare(b.id, undefined, { numeric: true });
    });

    let deceasedCount = 0;
    let livingCount = 0;
    let overriddenCount = 0;
    let excludedCount = 0;

    for (const p of sortedPeople) {
      const vis = resolvePersonVisibility(p, overridesConfig);
      const year = extractYear(p.birth?.date) ?? "????";
      const hasPhoto = p.photoFile ? "Yes" : "No";
      const name = `${p.givenName} ${p.surname}`.padEnd(30, " ");
      const hasOverride = Boolean(overridesConfig.overrides?.[p.id]);

      if (vis.isExcluded) {
        excludedCount++;
        console.log(
          `${p.id.padEnd(7)} | EXCLUDED | ${year}   | ${hasPhoto.padEnd(5)} | ${name} | Excluded from build`,
        );
        continue;
      }

      if (hasOverride) overriddenCount++;
      if (vis.isDeceased) deceasedCount++;
      else livingCount++;

      const statusTag = vis.isDeceased
        ? "Visible (Deceased)"
        : "Redacted (Living)";
      const overrideTag = hasOverride ? " [OVERRIDDEN]" : "";
      console.log(
        `${p.id.padEnd(7)} | ${vis.isDeceased ? "YES     " : "NO      "} | ${year}   | ${hasPhoto.padEnd(5)} | ${name} | ${statusTag}${overrideTag}`,
      );
    }

    console.log(
      "----------------------------------------------------------------------------------------",
    );
    console.log(
      `Total: ${parsed.people.length} | Deceased: ${deceasedCount} | Living (Redacted): ${livingCount} | Overridden: ${overriddenCount} | Excluded: ${excludedCount}\n`,
    );
    return;
  }

  // Mode 2: Standard Build Ingestion Pipeline
  const { people, families, searchIndex, visiblePhotoMap } = sanitizeGenealogy(
    parsed.people,
    parsed.families,
    overridesConfig,
  );

  // Ensure generated directory exists
  if (!fs.existsSync(GENERATED_DIR)) {
    fs.mkdirSync(GENERATED_DIR, { recursive: true });
  }

  const genealogyData: GenealogyData = {
    people,
    families,
    meta: {
      generatedAt: new Date().toISOString(),
      totalPeople: Object.keys(people).length,
      totalFamilies: Object.keys(families).length,
    },
  };

  // Write pre-sanitized domain JSON
  fs.writeFileSync(
    GENEALOGY_JSON_PATH,
    JSON.stringify(genealogyData, null, 2),
    "utf8",
  );
  console.log(
    `💾 Generated genealogy data: ${GENEALOGY_JSON_PATH} (${genealogyData.meta.totalPeople} people)`,
  );

  // Write client search index
  fs.writeFileSync(
    SEARCH_INDEX_JSON_PATH,
    JSON.stringify(searchIndex, null, 2),
    "utf8",
  );
  console.log(
    `🔍 Generated search index: ${SEARCH_INDEX_JSON_PATH} (${searchIndex.length} entries)`,
  );

  // Optimize and copy authorized photos
  console.log(
    `🖼️  Processing media (${Object.keys(visiblePhotoMap).length} visible photos)...`,
  );
  const photoResult = await processVisiblePhotos({
    sourceDir: MEDIA_DIR,
    outputDir: PUBLIC_PHOTOS_DIR,
    visiblePhotoMap,
  });

  console.log(
    `📸 Photos processed: ${photoResult.processed}, skipped: ${photoResult.skipped}`,
  );
  if (photoResult.errors.length > 0) {
    photoResult.errors.forEach((e) => console.warn(`  ⚠️ ${e}`));
  }

  console.log("✨ Build data pipeline complete!");
}

main().catch((err) => {
  console.error("❌ Pipeline failed:", err);
  process.exit(1);
});
