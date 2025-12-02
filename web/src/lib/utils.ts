const STORAGE_URL = process.env.NEXT_PUBLIC_STORAGE_URL || 'http://localhost:8000/storage';

/**
 * Converts a relative image path to a full URL
 * @param imagePath - The relative path from the API (e.g., "categories/image.jpg")
 * @returns Full URL or null if no image
 */
export function getImageUrl(imagePath: string | null | undefined): string | null {
  if (!imagePath) return null;

  // If it's already a full URL, return as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // Prepend storage URL
  return `${STORAGE_URL}/${imagePath}`;
}
