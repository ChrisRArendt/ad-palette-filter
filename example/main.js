import { init, registerPalettes, transform } from '../dist/index.js';

init({ logTiming: true });

// Define a simple “sunset” palette
registerPalettes({
  sunset: [
    0,   0,   0,   // black
    64,  16,  48,   // deep purple
    192,  64,  32,   // warm orange
    255, 255, 255    // white
  ]
});

// Grab the image and apply
const img = document.getElementById('demo');
if (img.complete) {
  transform(img);
} else {
  img.onload = () => transform(img);
}
