/**
 * Convert Google Drive share links to direct download URLs
 * 
 * @param url - Google Drive share URL
 * @returns Direct download URL or original URL if not a Google Drive link
 * 
 * @example
 * Input:  https://drive.google.com/file/d/1r7AQ0ecsMq2vhprrTaabx9ocCuA4gXdz/view?usp=drive_link
 * Output: https://drive.google.com/uc?export=download&id=1r7AQ0ecsMq2vhprrTaabx9ocCuA4gXdz
 */
export function convertGoogleDriveUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  // Check if it's a Google Drive URL
  if (!url.includes('drive.google.com')) {
    return url;
  }

  // Extract file ID from various Google Drive URL formats
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,           // /file/d/FILE_ID/view
    /id=([a-zA-Z0-9_-]+)/,                   // ?id=FILE_ID
    /\/open\?id=([a-zA-Z0-9_-]+)/,           // /open?id=FILE_ID
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      const fileId = match[1];
      // Return direct download URL
      return `https://drive.google.com/uc?export=download&id=${fileId}`;
    }
  }

  // If no pattern matched, return original URL
  return url;
}

/**
 * Check if a URL is a valid direct media URL
 * (not a Google Drive view link or other preview page)
 */
export function isDirectMediaUrl(url: string | null | undefined): boolean {
  if (!url) return false;

  // Google Drive view links are not direct
  if (url.includes('drive.google.com/file/d/') && url.includes('/view')) {
    return false;
  }

  // Dropbox preview links are not direct
  if (url.includes('dropbox.com') && !url.includes('dl=1')) {
    return false;
  }

  // Check for common direct media extensions
  const directExtensions = [
    '.mp4', '.webm', '.ogg', '.mov', '.avi',  // Video
    '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', // Images
  ];

  return directExtensions.some(ext => url.toLowerCase().includes(ext));
}

/**
 * Get optimized media URL with fallback conversion
 */
export function getOptimizedMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  // Try to convert Google Drive URLs
  const converted = convertGoogleDriveUrl(url);
  
  // Log warning if URL might not work
  if (converted && !isDirectMediaUrl(converted)) {
    console.warn(
      '[media-url] URL may not be a direct media link:',
      converted,
      '\nConsider using a CDN like Cloudinary, Bunny CDN, or Vercel Blob for better performance.'
    );
  }

  return converted;
}
