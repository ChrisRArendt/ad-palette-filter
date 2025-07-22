/* eslint-disable no-unused-vars */
import { createGL, linkAttr, createTextureFromPixels } from './utils.js';
import { VERT_SRC, FRAG_SRC } from './shaders.js';

export class PaletteEngine {
  #gl;
  #program;
  #uImage;
  #uPalette;
  #flipY;
  #palettes = new Map();          // name → Uint8Array texture
  #canvas;
  constructor() {
    this.#canvas = document.createElement('canvas');
    this.#gl = createGL(this.#canvas);
    this.#program = this.#gl.utils.getProgram(this.#gl, VERT_SRC, FRAG_SRC);

    // static uniforms
    this.#gl.useProgram(this.#program);
    this.#uImage   = this.#gl.getUniformLocation(this.#program, 'uImage');
    this.#uPalette = this.#gl.getUniformLocation(this.#program, 'uColorPalette');
    this.#flipY    = this.#gl.getUniformLocation(this.#program, 'flipY');
    this.#gl.uniform1i(this.#uImage,   0);
    this.#gl.uniform1i(this.#uPalette, 1);
    this.#gl.uniform1f(this.#flipY, -1);

    // full‑screen quad once
    const quad = new Float32Array([-1,-1, 1,1, -1,1,  -1,-1, 1,1, 1,-1]);
    const buffer = this.#gl.utils.createAndBindBuffer(this.#gl.ARRAY_BUFFER, this.#gl.STATIC_DRAW, quad);
    linkAttr(this.#gl, this.#program, buffer, 'position');
    linkAttr(this.#gl, this.#program, buffer, 'texCoords', 0, 2, 0, 0); //reuse positions for texCoords
  }

  addPalette(name, rgbTriplets) {
    const gl = this.#gl;
    const tex = createTextureFromPixels(gl, new Uint8Array(rgbTriplets), rgbTriplets.length / 3);
    this.#palettes.set(name, tex);
  }

  transform(imgEl) {
    const paletteName = imgEl.dataset.palette;
    if (!this.#palettes.has(paletteName)) {
      console.warn(`[ad-palette-filter] palette "${paletteName}" not registered`);
      return;
    }

    const gl = this.#gl;
    // resize canvas to img
    this.#canvas.width  = imgEl.naturalWidth;
    this.#canvas.height = imgEl.naturalHeight;
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // upload source img
    const srcTex = createTextureFromPixels(gl, imgEl);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, srcTex);

    // bind palette texture
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.#palettes.get(paletteName));

    // draw
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // replace <img> with <canvas> (non‑destructive clone)
    this.#canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      imgEl.src = url;          // swap pixels
    }, 'image/png');
  }
}
