// src/utils.js

// ——————————————————————————————————————————————
// Minimal WebGL helper class
// ——————————————————————————————————————————————
class WebGLUtils {
  constructor(gl) {
    this.gl = gl;
  }

  // Compile & link shaders into a program
  getProgram(vertexSrc, fragmentSrc) {
    const gl = this.gl;
    const compile = (source, type) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, source);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        throw new Error(`Shader compile error: ${gl.getShaderInfoLog(s)}`);
      }
      return s;
    };

    const vs = compile(vertexSrc, gl.VERTEX_SHADER);
    const fs = compile(fragmentSrc, gl.FRAGMENT_SHADER);
    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      throw new Error(`Program link error: ${gl.getProgramInfoLog(prog)}`);
    }
    return prog;
  }

  // Create & fill a buffer
  createAndBindBuffer(type, usage, data) {
    const gl = this.gl;
    const buf = gl.createBuffer();
    gl.bindBuffer(type, buf);
    gl.bufferData(type, data, usage);
    return buf;
  }

  // Wire up a Float32Array buffer to an attribute
  linkGPUAndCPU(program, buffer, dims, name) {
    const gl = this.gl;
    const loc = gl.getAttribLocation(program, name);
    if (loc < 0) throw new Error(`Attrib "${name}" not found`);
    gl.enableVertexAttribArray(loc);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(loc, dims, gl.FLOAT, false, 0, 0);
  }

  // Create a texture from either an Image or raw Uint8Array palette
  createTextureFromPixels(source, width = null) {
    const gl = this.gl;
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);

    if (source instanceof Uint8Array) {
      // palette: width×1 RGBA
      gl.texImage2D(
        gl.TEXTURE_2D, 0, gl.RGBA,
        width, 1, 0,
        gl.RGBA, gl.UNSIGNED_BYTE,
        source
      );
    } else {
      // assume HTMLImageElement
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,
        gl.UNSIGNED_BYTE, source);
    }

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S,     gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T,     gl.CLAMP_TO_EDGE);
    return tex;
  }
}

// ——————————————————————————————————————————————
// Conveniences
// ——————————————————————————————————————————————

/**
 * Create a WebGL2 context + attach utils.
 */
function createGL(canvas) {
  const gl = canvas.getContext("webgl2");
  if (!gl) throw new Error("WebGL2 not supported");
  gl.utils = new WebGLUtils(gl);
  return gl;
}

/**
 * Map a bound buffer → attribute `name` (Float32, 2 components).
 */
function linkAttr(gl, program, buffer, name) {
  gl.utils.linkGPUAndCPU(program, buffer, 2, name);
}

/**
 * Helper to build a GL texture from either:
 *  - an HTMLImageElement (auto‑sized)
 *  - a Uint8Array palette + width (1D LUT)
 */
function createTextureFromPixels(gl, source, width = null) {
  return gl.utils.createTextureFromPixels(source, width);
}

const VERT_SRC = `#version 300 es
precision mediump float;
in vec2 position;
in vec2 texCoords;
out vec2 vUV;
uniform float flipY;
void main() {
  gl_Position = vec4(position.x, position.y * flipY, 0., 1.);
  vUV = position * .5 + .5;   // map [-1,1] → [0,1]
}`;

const FRAG_SRC = `#version 300 es
precision mediump float;
in vec2 vUV;
uniform sampler2D uImage;
uniform sampler2D uColorPalette;
out vec4 color;
void main(){
  vec4 src = texture(uImage, vUV);
  // Assume palette is 1px tall; use red‑channel as lookup coord
  color = texture(uColorPalette, vec2(src.r, 0.));
}`;

/* eslint-disable no-unused-vars */

class PaletteEngine {
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
    linkAttr(this.#gl, this.#program, buffer, 'texCoords'); //reuse positions for texCoords
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

// ad-palette-filter  – Public facade

const _engine = new PaletteEngine();

/**
 * Registers one or many palettes
 * @param {Record<string, number[]>} palettes  – {name: [r,g,b,r,g,b …]} RGB triplets 0‑255
 */
function registerPalettes(palettes) {
  Object.entries(palettes).forEach(([name, arr]) => _engine.addPalette(name, arr));
}

/**
 * Manually apply the palette to a single <img> element.
 * (Auto‑runs on DOMContentLoaded for all data‑palette imgs.)
 */
function transform(imgEl) {
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

export { registerPalettes, transform };
//# sourceMappingURL=index.js.map
