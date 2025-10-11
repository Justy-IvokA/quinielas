/**
 * Converts HEX color to HSL format for Tailwind CSS variables
 * @param hex - Hex color string (e.g., "#0062FF" or "0062FF")
 * @returns HSL string in format "h s% l%" (e.g., "217 100% 50%")
 */
export function hexToHsl(hex: string): string {
  // Remove # if present
  const cleanHex = hex.replace(/^#/, "");
  
  // Parse RGB values
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  // Convert to degrees and percentages
  const hDeg = Math.round(h * 360);
  const sPercent = Math.round(s * 100);
  const lPercent = Math.round(l * 100);

  return `${hDeg} ${sPercent}% ${lPercent}%`;
}

/**
 * Converts a color value to HSL format if it's in HEX format
 * If already in HSL format, returns as-is
 * @param color - Color string (HEX or HSL)
 * @returns HSL string in format "h s% l%"
 */
export function normalizeColorToHsl(color: string): string {
  // Check if it's already in HSL format (contains % or spaces with numbers)
  if (color.includes("%") || /^\d+\s+\d+%\s+\d+%$/.test(color)) {
    return color;
  }
  
  // If it starts with # or is 6 hex characters, convert from HEX
  if (color.startsWith("#") || /^[0-9A-Fa-f]{6}$/.test(color)) {
    return hexToHsl(color);
  }
  
  // Return as-is if format is unknown
  return color;
}
