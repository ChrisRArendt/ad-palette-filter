# 🎨 ad-palette-filter

> Apply custom color palette filters to any image using WebGL2.  
> Just add `data-palette="myPalette"` to your `<img>` – the rest is magic.

---

**`ad-palette-filter`** is a lightweight, zero-dependency JavaScript utility that transforms images with user-defined color palettes using GPU-accelerated WebGL2 shaders.

You can use it declaratively in HTML, or programmatically in JavaScript.

---

## ✅ Features

- ✨ **Custom palettes** — define your own LUTs in plain RGB arrays
- ⚡ **WebGL2‑powered** — blazing fast, zero CPU cost
- 🖼️ **Declarative or programmatic** — works with `<img data-palette="sunset">`
- 🧠 **Smart batching** — minimal memory, shared canvas + GL context
- 🛠️ **Framework‑agnostic** — drop it into any HTML page or SPA

---

## 🚀 Quickstart

### 1. Install

```bash
npm install ad-palette-filter
````

Or load directly via CDN:

```html
<script type="module">
  import { registerPalettes } from 'https://unpkg.com/ad-palette-filter/dist/index.js';
</script>
```

---

### 2. Register your palette

```js
import { registerPalettes } from 'ad-palette-filter';

registerPalettes({
  firewatch: [
    0, 0, 0,
    64, 16, 48,
    128, 32, 64,
    255, 255, 255
  ]
});
```

The array is a flat list of RGB values (`0–255`). Each triplet defines one color stop on the gradient from black → white.

---

### 3. Add an image

```html
<img src="my-photo.jpg" data-palette="firewatch">
```

All images with a `data-palette` attribute will be auto-processed on `DOMContentLoaded`.

---

## 🧪 Example: Gradient Remap

Here's a full working HTML example:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <title>Palette Filter Demo</title>
  <script type="module">
    import { registerPalettes } from 'https://unpkg.com/ad-palette-filter/dist/index.js';

    registerPalettes({
      noir: [
        0, 0, 0,
        64, 64, 64,
        192, 192, 192,
        255, 255, 255
      ]
    });
  </script>
</head>
<body style="background:#111;color:white;">
  <h1>Palette Filter</h1>
  <img src="example.jpg" data-palette="noir" width="600">
</body>
</html>
```

---

## ✍️ API

### `registerPalettes(paletteDict)`

Registers one or more named palettes.

**Parameters:**

* `paletteDict` — an object where:

    * the **key** is the palette name (string)
    * the **value** is a flat array of RGB triplets (0–255)

```js
registerPalettes({
  greyscale: [0,0,0, 255,255,255],
  peachy: [255, 200, 180, 250, 220, 190, 255, 255, 255]
});
```

---

### `transform(imgElement)`

Manually applies a registered palette to a specific image. You typically don’t need this unless rendering dynamically.

```js
const img = document.querySelector("img[data-palette='peachy']");
transform(img);
```

---

## 🧠 How It Works

* WebGL2 fragment shader samples the red channel of each pixel.
* That value is used as a lookup into a 1D color palette texture.
* Output is a full-color image with your LUT applied — in GPU time.

Think of it like Photoshop’s gradient map… but on steroids.

---

## 📦 Bundle Size

* ≈5.4KB gzipped
* No dependencies
* No DOM pollution (uses offscreen `<canvas>`)

---

## 📁 Advanced Usage

### Dynamic palette switching

```js
registerPalettes({
  warm: [0,0,0, 255,128,0, 255,255,255]
});

const img = document.querySelector("img");
img.dataset.palette = "warm";
transform(img);
```

---

## 🛠️ Local Dev

Clone and build:

```bash
git clone https://github.com/your-user/ad-palette-filter.git
cd ad-palette-filter
npm install
npm run dev    # Watch & rebuild
npm run build  # Generate ESM bundle
```

---

## 📜 License

MIT © 2025 Arendt Digital LLC

---

## ❤️ Acknowledgements

Inspired by real-time LUT workflows and hand-tuned WebGL tools.
Palette mapping is magic. Now it’s yours.