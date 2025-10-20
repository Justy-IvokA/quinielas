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
 * Converts HSL color to HEX format
 * @param hsl - HSL string in format "h s% l%" (e.g., "217 100% 50%")
 * @returns HEX color string (e.g., "#0062FF")
 */
export function hslToHex(hsl: string): string {
  // Parse HSL values
  const match = hsl.match(/(\d+)\s+(\d+)%\s+(\d+)%/);
  if (!match) {
    return "#3b82f6"; // Default blue if parsing fails
  }

  const h = parseInt(match[1]) / 360;
  const s = parseInt(match[2]) / 100;
  const l = parseInt(match[3]) / 100;

  let r, g, b;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
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
