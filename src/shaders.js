export const VERT_SRC = `#version 300 es
precision mediump float;
in vec2 position;
in vec2 texCoords;
out vec2 vUV;
uniform float flipY;
void main() {
  gl_Position = vec4(position.x, position.y * flipY, 0., 1.);
  vUV = position * .5 + .5;   // map [-1,1] → [0,1]
}`;

export const FRAG_SRC = `#version 300 es
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
