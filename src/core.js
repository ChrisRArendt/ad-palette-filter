// src/core.js
import { createGL, linkAttr, createTextureFromPixels } from './utils.js';
import { VERT_SRC, FRAG_SRC } from './shaders.js';

export class PaletteEngine {
  #gl;
  #program;
  #uImage;
  #uPalette;
  #flipY;
  #palettes = new Map();
  #canvas;

  constructor() {
    // SSR‑guard: only run in browser
    if (typeof document === 'undefined') return;

    this.#canvas = document.createElement('canvas');
    this.#gl     = createGL(this.#canvas);

    // Pass only the two shader strings
    this.#program = this.#gl.utils.getProgram(VERT_SRC, FRAG_SRC);

    // bind uniforms once
    this.#gl.useProgram(this.#program);
    this.#uImage   = this.#gl.getUniformLocation(this.#program, 'uImage');
    this.#uPalette = this.#gl.getUniformLocation(this.#program, 'uColorPalette');
    this.#flipY    = this.#gl.getUniformLocation(this.#program, 'flipY');

    this.#gl.uniform1i(this.#uImage,   0);
    this.#gl.uniform1i(this.#uPalette, 1);
    this.#gl.uniform1f(this.#flipY,   -1);

    // Full‑screen quad: [x,y] pairs, reuse for both pos & uv
    const quadVerts = new Float32Array([
      -1, -1,   // bottom‑left
      1,  1,   // top‑right
      -1,  1,   // top‑left

      -1, -1,   // bottom‑left
      1, -1,   // bottom‑right
      1,  1    // top‑right
    ]);

    const buf = this.#gl.utils.createAndBindBuffer(
      this.#gl.ARRAY_BUFFER,
      this.#gl.STATIC_DRAW,
      quadVerts
    );

    // link the sole attribute "position" (vec2)
    linkAttr(this.#gl, this.#program, buf, 'position');
  }

  /**
   * Registers a palette under `name`.
   * @param {string} name
   * @param {number[]} rgbTriplets — flat [r,g,b, …] 0–255
   */
  addPalette(name, rgbTriplets) {
    if (!this.#gl) return;
    const gl = this.#gl;
    // make Uint8Array (RGBA) by padding alpha=255
    const rgba = new Uint8Array((rgbTriplets.length / 3) * 4);
    for (let i = 0, j = 0; i < rgbTriplets.length; i += 3, j += 4) {
      rgba[j + 0] = rgbTriplets[i + 0];
      rgba[j + 1] = rgbTriplets[i + 1];
      rgba[j + 2] = rgbTriplets[i + 2];
      rgba[j + 3] = 255;
    }
    const tex = createTextureFromPixels(gl, rgba, rgba.length / 4 /*width*/);
    this.#palettes.set(name, tex);
  }

  /**
   * Applies the named palette to <img data-palette="...">,
   * swaps its `src` to the new PNG blob.
   */
  transform(imgEl) {
    if (!this.#gl) return;

    const name = imgEl.dataset.palette;
    if (!this.#palettes.has(name)) {
      console.warn(`[ad-palette-filter] missing palette "${name}"`);
      return;
    }

    const gl = this.#gl;
    // resize offscreen canvas
    this.#canvas.width  = imgEl.naturalWidth;
    this.#canvas.height = imgEl.naturalHeight;
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // clear
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // upload source image as texture0
    const srcTex = createTextureFromPixels(gl, imgEl);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, srcTex);

    // bind palette texture (texture1)
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.#palettes.get(name));

    // draw quad
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // push result back into img
    this.#canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      imgEl.src = url;
    }, 'image/png');
  }
}
