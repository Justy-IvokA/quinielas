/**
 * Contrast checker utility for WCAG AA compliance
 */

/**
 * Parse HSL color string to components
 */
function parseHsl(hsl: string): { h: number; s: number; l: number } | null {
  const match = hsl.match(/^(\d+)\s+(\d+)%\s+(\d+)%$/);
  if (!match) return null;
  
  return {
    h: parseInt(match[1], 10),
    s: parseInt(match[2], 10),
    l: parseInt(match[3], 10)
  };
}

/**
 * Convert HSL to RGB
 */
function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  const sNorm = s / 100;
  const lNorm = l / 100;
  
  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lNorm - c / 2;
  
  let r = 0, g = 0, b = 0;
  
  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else if (h >= 300 && h < 360) {
    r = c; g = 0; b = x;
  }
  
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255)
  };
}

/**
 * Calculate relative luminance
 */
function getLuminance(r: number, g: number, b: number): number {
  const rsRGB = r / 255;
  const gsRGB = g / 255;
  const bsRGB = b / 255;
  
  const rLin = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
  const gLin = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
  const bLin = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);
  
  return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
}

/**
 * Calculate contrast ratio between two colors
 */
export function getContrastRatio(color1: string, color2: string): number | null {
  const hsl1 = parseHsl(color1);
  const hsl2 = parseHsl(color2);
  
  if (!hsl1 || !hsl2) return null;
  
  const rgb1 = hslToRgb(hsl1.h, hsl1.s, hsl1.l);
  const rgb2 = hslToRgb(hsl2.h, hsl2.s, hsl2.l);
  
  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast ratio meets WCAG AA standard
 * @param ratio - Contrast ratio
 * @param level - 'AA' or 'AAA'
 * @param isLargeText - Whether text is large (18pt+ or 14pt+ bold)
 */
export function meetsWCAG(ratio: number, level: 'AA' | 'AAA' = 'AA', isLargeText = false): boolean {
  if (level === 'AAA') {
    return isLargeText ? ratio >= 4.5 : ratio >= 7;
  }
  // AA standard
  return isLargeText ? ratio >= 3 : ratio >= 4.5;
}

/**
 * Check contrast and return advisory message
 */
export function checkContrast(
  foreground: string,
  background: string
): {
  ratio: number | null;
  meetsAA: boolean;
  meetsAAA: boolean;
  warning?: string;
} {
  const ratio = getContrastRatio(foreground, background);
  
  if (ratio === null) {
    return {
      ratio: null,
      meetsAA: false,
      meetsAAA: false,
      warning: "Unable to calculate contrast ratio"
    };
  }
  
  const meetsAA = meetsWCAG(ratio, 'AA');
  const meetsAAA = meetsWCAG(ratio, 'AAA');
  
  let warning: string | undefined;
  if (!meetsAA) {
    warning = `Low contrast (${ratio.toFixed(2)}:1). WCAG AA requires at least 4.5:1 for normal text.`;
  } else if (!meetsAAA) {
    warning = `Contrast is ${ratio.toFixed(2)}:1. Meets AA but not AAA standard.`;
  }
  
  return {
    ratio,
    meetsAA,
    meetsAAA,
    warning
  };
}

/**
 * Generate dark theme colors automatically from light theme
 * Simple inversion strategy for lightness
 */
export function generateDarkTheme(lightColors: Record<string, string>): Record<string, string> {
  const darkColors: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(lightColors)) {
    const hsl = parseHsl(value);
    if (!hsl) {
      darkColors[key] = value;
      continue;
    }
    
    // Invert lightness for background/foreground
    if (key.includes('background') || key.includes('card') || key === 'popover') {
      darkColors[key] = `${hsl.h} ${hsl.s}% ${Math.max(5, 100 - hsl.l)}%`;
    } else if (key.includes('foreground')) {
      darkColors[key] = `${hsl.h} ${Math.min(40, hsl.s)}% ${Math.min(98, 100 - hsl.l + 90)}%`;
    } else if (key === 'primary' || key === 'accent') {
      // Lighten primary/accent colors for dark mode
      darkColors[key] = `${hsl.h} ${hsl.s}% ${Math.min(75, hsl.l + 15)}%`;
    } else if (key.includes('muted') || key === 'border' || key === 'input') {
      darkColors[key] = `${hsl.h} ${Math.max(20, hsl.s - 10)}% ${Math.max(15, 25)}%`;
    } else {
      darkColors[key] = value;
    }
  }
  
  return darkColors;
}
