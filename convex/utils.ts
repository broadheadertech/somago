// Shared validation utilities for Convex functions

export function validateUrl(url: string | undefined): boolean {
  if (!url) return true; // optional URLs are fine
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function requireValidUrl(url: string | undefined, fieldName: string): void {
  if (url && !validateUrl(url)) {
    throw new Error(`Invalid ${fieldName}: must be a valid http/https URL`);
  }
}
