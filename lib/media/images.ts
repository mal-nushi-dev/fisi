/**
 * @file images.ts
 * @description Image optimization pipeline using Sharp.
 *
 * Media Security & Privacy Policy:
 * - Only photos associated with individuals whose photo field resolved to "visible"
 *   are ever read, converted, and written to `public/photos/`.
 * - Photos for living/redacted individuals are completely ignored and never copied to public output.
 * - Stale photos from previous runs that are no longer authorized are automatically purged.
 */

import * as fs from "fs";
import * as path from "path";
import sharp from "sharp";
import { RawPerson } from "../gedcom/types";

/**
 * Options for photo processing.
 */
export interface ProcessPhotoOptions {
  /** Directory containing source high-resolution PNGs (e.g. Nushi-Genealogy Media) */
  sourceDir: string;
  /** Destination directory for public web assets (e.g. public/photos) */
  outputDir: string;
  /** Map of Person ID -> source photo details authorized for export */
  visiblePhotoMap: Record<
    string,
    { photoFile: string; crop?: RawPerson["photoCrop"] }
  >;
}

/**
 * Optimizes and outputs photos for all authorized visible individuals.
 * Converts source PNGs to WebP format, applies MacFamilyTree crop coordinates if present,
 * and purges unauthorized or stale assets.
 *
 * @param options - Configuration and mapping of authorized photos
 * @returns Summary of processed count, skipped count, and any encountered errors
 */
export async function processVisiblePhotos(
  options: ProcessPhotoOptions,
): Promise<{ processed: number; skipped: number; errors: string[] }> {
  const { sourceDir, outputDir, visiblePhotoMap } = options;

  // Ensure public destination directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Purge any stale webp files in public/photos that are no longer in the authorized visible set
  const existingFiles = fs.readdirSync(outputDir);
  const targetFilenames = new Set(
    Object.keys(visiblePhotoMap).map((id) => `${id}.webp`),
  );

  for (const file of existingFiles) {
    if (file.endsWith(".webp") && !targetFilenames.has(file)) {
      fs.unlinkSync(path.join(outputDir, file));
    }
  }

  let processed = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const [id, item] of Object.entries(visiblePhotoMap)) {
    const sourceFilePath = path.join(sourceDir, item.photoFile);
    const destFilePath = path.join(outputDir, `${id}.webp`);

    if (!fs.existsSync(sourceFilePath)) {
      errors.push(`Missing source photo for ${id}: ${sourceFilePath}`);
      skipped++;
      continue;
    }

    try {
      let pipeline = sharp(sourceFilePath);

      // If MacFamilyTree crop coordinates are specified, crop to avatar bounding box
      if (item.crop && item.crop.width > 0 && item.crop.height > 0) {
        const metadata = await sharp(sourceFilePath).metadata();
        const imgWidth = metadata.width || 0;
        const imgHeight = metadata.height || 0;

        const left = Math.max(0, Math.min(item.crop.left, imgWidth - 1));
        const top = Math.max(0, Math.min(item.crop.top, imgHeight - 1));
        const width = Math.min(item.crop.width, imgWidth - left);
        const height = Math.min(item.crop.height, imgHeight - top);

        if (width > 0 && height > 0) {
          pipeline = pipeline.extract({ left, top, width, height });
        }
      }

      // Resize to max 800px width and compress to WebP (80% quality)
      await pipeline
        .resize({ width: 800, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(destFilePath);

      processed++;
    } catch (err) {
      errors.push(
        `Failed to process photo for ${id}: ${(err as Error).message}`,
      );
    }
  }

  return { processed, skipped, errors };
}
