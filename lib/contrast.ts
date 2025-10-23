// lib/contrast.ts
// Pick black or white text for maximum contrast with a given background color.

type RGB = [number, number, number, number]; // r,g,b,alpha (0-255, 0-1)

function hexToRgba(hex: string): RGB | null {
  const s = hex.replace('#', '').trim();
  if (s.length === 3) {
    const r = parseInt(s[0] + s[0], 16);
    const g = parseInt(s[1] + s[1], 16);
    const b = parseInt(s[2] + s[2], 16);
    return [r, g, b, 1];
  }
  if (s.length === 6) {
    const r = parseInt(s.slice(0, 2), 16);
    const g = parseInt(s.slice(2, 4), 16);
    const b = parseInt(s.slice(4, 6), 16);
    return [r, g, b, 1];
  }
  if (s.length === 8) {
    const r = parseInt(s.slice(0, 2), 16);
    const g = parseInt(s.slice(2, 4), 16);
    const b = parseInt(s.slice(4, 6), 16);
    const a = parseInt(s.slice(6, 8), 16) / 255;
    return [r, g, b, a];
  }
  return null;
}

function rgbStringToRgba(str: string): RGB | null {
  const m = str.match(/rgba?\(([^)]+)\)/i);
  if (!m) return null;
  const parts = m[1].split(',').map(v => v.trim());
  if (parts.length < 3) return null;
  const r = Math.max(0, Math.min(255, parseFloat(parts[0])));
  const g = Math.max(0, Math.min(255, parseFloat(parts[1])));
  const b = Math.max(0, Math.min(255, parseFloat(parts[2])));
  const a = parts[3] !== undefined ? Math.max(0, Math.min(1, parseFloat(parts[3]))) : 1;
  return [r, g, b, a];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100; l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [Math.round(255 * f(0)), Math.round(255 * f(8)), Math.round(255 * f(4))];
}

function hslStringToRgba(str: string): RGB | null {
  const m = str.match(/hsla?\(([^)]+)\)/i);
  if (!m) return null;
  const parts = m[1].split(',').map(v => v.trim().replace('%', ''));
  if (parts.length < 3) return null;
  const h = parseFloat(parts[0]);
  const s = parseFloat(parts[1]);
  const l = parseFloat(parts[2]);
  const a = parts[3] !== undefined ? Math.max(0, Math.min(1, parseFloat(parts[3]))) : 1;
  const [r, g, b] = hslToRgb(h, s, l);
  return [r, g, b, a];
}

function parseColor(c: string): RGB | null {
  if (!c) return null;
  const s = c.trim().toLowerCase();
  if (s.startsWith('#')) return hexToRgba(s);
  if (s.startsWith('rgb')) return rgbStringToRgba(s);
  if (s.startsWith('hsl')) return hslStringToRgba(s);

  // Try to let the browser normalize CSS named colors to rgb(...)
  if (typeof document !== 'undefined') {
    const ctx = document.createElement('canvas').getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#000';
      ctx.fillStyle = s;
      const normalized = ctx.fillStyle; // becomes rgb(...) or #rrggbb
      if (normalized.startsWith('#')) return hexToRgba(normalized);
      if (normalized.startsWith('rgb')) return rgbStringToRgba(normalized);
    }
  }
  return null;
}

function relativeLuminance(r: number, g: number, b: number) {
  const srgb = [r, g, b].map(v => v / 255).map(c => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

/** Returns "#000" or "#fff" depending on which has the better contrast against `bg`. */
export function bestTextColor(bg: string): "#000" | "#fff" {
  const rgba = parseColor(bg) || [0, 0, 0, 1];
  let [r, g, b, a] = rgba;

  // If semi-transparent, blend over white (app background is light)
  if (a < 1) {
    r = Math.round(r * a + 255 * (1 - a));
    g = Math.round(g * a + 255 * (1 - a));
    b = Math.round(b * a + 255 * (1 - a));
  }

  const L = relativeLuminance(r, g, b);
  const contrastWhite = (1.0 + 0.05) / (L + 0.05);
  const contrastBlack = (L + 0.05) / (0.0 + 0.05);
  return contrastWhite >= contrastBlack ? "#fff" : "#000";
}
