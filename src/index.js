import { PaletteEngine } from './core.js';

const engine = new PaletteEngine();
let _logTiming = false;

/**
 * Call once at startup to configure the package.
 * @param {{ logTiming?: boolean }} options
 */
export function init({ logTiming = false } = {}) {
  _logTiming = logTiming;
}

/**
 * Register one or more palettes.
 */
export function registerPalettes(palettes) {
  Object.entries(palettes).forEach(([name, arr]) => engine.addPalette(name, arr));
}

/**
 * Transform a single <img> element.
 */
export function transform(imgEl) {
  const name = imgEl.dataset.palette;
  const label = `[ad-palette-filter] ${name} (${imgEl.src})`;

  if (_logTiming) console.time(label);
  engine.transform(imgEl);
  if (_logTiming) console.timeEnd(label);
}

// auto‑run on DOMContentLoaded
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    document
      .querySelectorAll('img[data-palette]')
      .forEach(transform);
  });
}
