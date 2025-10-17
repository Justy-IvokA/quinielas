/**
 * Slug generation and validation utilities
 */

/**
 * Convert a string to a URL-friendly slug
 */
export function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD") // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, "") // Remove leading/trailing hyphens
    .substring(0, 100); // Limit length
}

/**
 * Validate if a string is a valid slug
 */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9-]+$/.test(slug) && slug.length >= 3 && slug.length <= 100;
}

/**
 * Generate a unique slug by appending a number if needed
 */
export function makeUniqueSlug(
  baseSlug: string,
  existingSlugs: string[]
): string {
  let slug = baseSlug;
  let counter = 1;

  while (existingSlugs.includes(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

/**
 * Generate a slug from a title with auto-prefill suggestions
 */
export function generatePoolSlug(params: {
  competitionName?: string;
  seasonYear?: number;
  stageLabel?: string;
  roundLabel?: string;
}): string {
  const parts: string[] = [];

  if (params.competitionName) {
    parts.push(params.competitionName);
  }

  if (params.seasonYear) {
    parts.push(params.seasonYear.toString());
  }

  if (params.roundLabel) {
    parts.push(params.roundLabel);
  } else if (params.stageLabel) {
    parts.push(params.stageLabel);
  }

  return toSlug(parts.join(" "));
}

/**
 * Generate a pool title from wizard selections
 */
export function generatePoolTitle(params: {
  competitionName?: string;
  seasonYear?: number;
  stageLabel?: string;
  roundLabel?: string;
}): string {
  const parts: string[] = [];

  if (params.competitionName) {
    parts.push(params.competitionName);
  }

  if (params.roundLabel) {
    parts.push(`— ${params.roundLabel}`);
  } else if (params.stageLabel) {
    parts.push(`— ${params.stageLabel}`);
  }

  if (params.seasonYear) {
    parts.push(params.seasonYear.toString());
  }

  return parts.join(" ");
}
