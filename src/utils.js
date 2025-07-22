// src/utils.js

// ——————————————————————————————————————————————
// Minimal WebGL helper class
// ——————————————————————————————————————————————
export class WebGLUtils {
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
export function createGL(canvas) {
  const gl = canvas.getContext("webgl2");
  if (!gl) throw new Error("WebGL2 not supported");
  gl.utils = new WebGLUtils(gl);
  return gl;
}

/**
 * Map a bound buffer → attribute `name` (Float32, 2 components).
 */
export function linkAttr(gl, program, buffer, name) {
  gl.utils.linkGPUAndCPU(program, buffer, 2, name);
}

/**
 * Helper to build a GL texture from either:
 *  - an HTMLImageElement (auto‑sized)
 *  - a Uint8Array palette + width (1D LUT)
 */
export function createTextureFromPixels(gl, source, width = null) {
  return gl.utils.createTextureFromPixels(source, width);
}
