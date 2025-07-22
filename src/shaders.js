// src/shaders.js

// Vertex shader: takes a vec2 position in clip‑space,
// passes normalized UV coords to the fragment shader.
export const VERT_SRC = `#version 300 es
precision highp float;

in vec2 position;
out vec2 vUV;
uniform float flipY;

void main() {
  // flipY lets us invert the Y axis when rendering to texture vs. screen
  gl_Position = vec4(position.x, position.y * flipY, 0.0, 1.0);
  // map from [-1,1]→[0,1] for UV lookup
  vUV = position * 0.5 + 0.5;
}
`;

// Fragment shader: sample the source texture (unit 0),
// then remap its red channel through the palette texture (unit 1).
export const FRAG_SRC = `#version 300 es
precision highp float;

in vec2 vUV;
out vec4 fragColor;

uniform sampler2D uImage;
uniform sampler2D uColorPalette;

void main() {
  // read source pixel
  vec4 src = texture(uImage, vUV);
  // look up final color from palette using the red channel as index
  fragColor = texture(uColorPalette, vec2(src.r, 0.0));
}
`;