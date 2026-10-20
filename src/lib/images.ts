import type { ImageMetadata } from 'astro';

// Resolves the "src/assets/..." paths stored in the data files to imported image metadata for <Picture>.
const modules = import.meta.glob<ImageMetadata>('/src/assets/photos/**/*.{jpg,jpeg,png,webp}', {
  eager: true,
  import: 'default'
});

/** Image metadata for a data-file path like "src/assets/photos/services/carpet-cleaning.jpg", or undefined. */
export function resolveImage(src: string | undefined): ImageMetadata | undefined {
  if (!src) return undefined;
  return modules[`/${src.replace(/^\/+/, '')}`];
}

/** The entry's real photo, or undefined while it is a placeholder (PLAN 8: placeholders never ship; the gold-50 panel is used). */
export function realImage(entry: { src: string; placeholder: boolean } | undefined): ImageMetadata | undefined {
  if (!entry || entry.placeholder) return undefined;
  return resolveImage(entry.src);
}
