// ad-palette-filter  – Public facade
import { PaletteEngine } from './core.js';

const _engine = new PaletteEngine();

/**
 * Registers one or many palettes
 * @param {Record<string, number[]>} palettes  – {name: [r,g,b,r,g,b …]} RGB triplets 0‑255
 */
export function registerPalettes(palettes) {
  Object.entries(palettes).forEach(([name, arr]) => _engine.addPalette(name, arr));
}

/**
 * Manually apply the palette to a single <img> element.
 * (Auto‑runs on DOMContentLoaded for all data‑palette imgs.)
 */
export function transform(imgEl) {
  _engine.transform(imgEl);
}

// --- Auto bootstrap ---
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    document
      .querySelectorAll('img[data-palette]')
      .forEach(el => transform(el));
  });
}
