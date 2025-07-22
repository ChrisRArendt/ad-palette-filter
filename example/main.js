import { init, registerPalettes, transform } from '../dist/index.js';

init({ logTiming: true });

registerPalettes({
  sunset: [
    0,   0,   0,
    64,  16,  48,
    192,  64,  32,
    255, 255, 255
  ],
  noir: [
    0,   0,   0,
    85,  85,  85,
    170, 170, 170,
    255, 255, 255
  ],
  firewatch: [
    0,   0,   0,
    40,  20,  10,
    200,  80,  40,
    255, 200, 150
  ]
});

const select   = document.getElementById('palette-select');
const demoImg  = document.getElementById('demo');
const origSrc  = demoImg.src;        // remember the pristine pixels

function reapply() {
  const palette = select.value;

  // 1) Reset to the untouched source
  demoImg.src = origSrc;

  // 2) Once the image reloads, apply the palette
  if (demoImg.complete) {
    demoImg.dataset.palette = palette;
    transform(demoImg);
  } else {
    demoImg.onload = () => {
      demoImg.dataset.palette = palette;
      transform(demoImg);
    };
  }
}

// Initial render
window.addEventListener('DOMContentLoaded', reapply);

// Change handler
select.addEventListener('change', reapply);
