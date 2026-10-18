// Shaders for photographs and project frames that live in WebGL but follow DOM layout.

export const imageVertex = /* glsl */ `
uniform vec2 uVel;
uniform float uHover;
uniform float uTime;
varying vec2 vUv;
const float PI = 3.141592653589793;
void main() {
  vUv = uv;
  vec3 p = position;
  // the plane bends like paper against the direction it travels
  p.x -= sin(uv.y * PI) * uVel.x * 0.9;
  p.y -= sin(uv.x * PI) * uVel.y * 0.9;
  p.z += sin(uv.x * PI) * sin(uv.y * PI) * uHover * 40.0;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
`

export const imageFragment = /* glsl */ `
uniform sampler2D uTex;
uniform sampler2D uTex2;
uniform vec2 uRes;
uniform vec2 uImg;
uniform vec2 uImg2;
uniform vec2 uVel;
uniform vec2 uMouse;
uniform float uReveal;
uniform float uHover;
uniform float uTime;
uniform float uProgress;
uniform float uVideo;
uniform int uKind;
uniform float uRadius;
varying vec2 vUv;

const vec3 ION = vec3(0.49, 0.98, 0.89);

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
vec2 cover(vec2 uv, vec2 res, vec2 img) {
  vec2 s = res / img;
  float sc = max(s.x, s.y);
  vec2 size = img * sc;
  vec2 off = (res - size) * 0.5;
  return (uv * res - off) / size;
}
float roundedMask(vec2 uv, vec2 res, float r) {
  vec2 p = (uv - 0.5) * res;
  vec2 q = abs(p) - res * 0.5 + r;
  float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  return 1.0 - smoothstep(-1.0, 1.0, d);
}

vec3 rgbSplit(sampler2D t, vec2 uv, float amt) {
  return vec3(texture2D(t, uv + vec2(amt, 0.0)).r, texture2D(t, uv).g, texture2D(t, uv - vec2(amt, 0.0)).b);
}

vec3 vhs(vec2 uv, float k) {
  float t = uTime;
  float line = floor(uv.y * 220.0);
  uv.x += (hash(vec2(line, floor(t * 24.0))) - 0.5) * 0.004 * k;
  float band = smoothstep(0.03, 0.0, abs(fract(uv.y * 0.6 - t * 0.08) - 0.5));
  uv.x += band * 0.012 * k;
  vec2 tuv = cover(uv, uRes, uImg);
  vec3 c = rgbSplit(uTex, tuv, 0.0045 * k);
  c = mix(c, c * vec3(1.06, 0.98, 0.9), k);
  c *= 1.0 - 0.12 * k * (0.5 + 0.5 * sin(uv.y * uRes.y * 1.6));
  c += (hash(uv * uRes + t) - 0.5) * 0.14 * k;
  c += band * 0.08 * k;
  return c;
}

void main() {
  vec2 uv = vUv;
  vec2 c = uv - 0.5;
  float zoom = 1.0 - 0.07 * uHover - 0.14 * (1.0 - uReveal);
  uv = 0.5 + c * zoom;
  float dm = distance(vUv, uMouse);
  uv += normalize(vUv - uMouse + 1e-4) * sin(dm * 28.0 - uTime * 3.5) * 0.004 * uHover * smoothstep(0.45, 0.0, dm);
  float speed = length(uVel);
  vec3 col;

  if (uKind == 1) {
    // rewind: a VHS memory dissolving into today
    vec3 past = vhs(uv, 1.0 - uProgress * 0.85);
    vec3 now = rgbSplit(uTex2, cover(uv, uRes, uImg2), 0.0015 * (1.0 - uProgress));
    float n = vnoise(vUv * vec2(3.0, 3.0)) * 0.55 + vnoise(vUv * vec2(1.0, 48.0) + floor(uTime * 8.0)) * 0.25 + (1.0 - vUv.y) * 0.2;
    float p = uProgress * 1.3 - 0.15;
    float m = smoothstep(p - 0.04, p + 0.04, n);
    col = mix(now, past, m);
    float edge = smoothstep(0.07, 0.0, abs(n - p)) * step(0.001, uProgress) * step(uProgress, 0.999);
    col += ION * edge * 1.4;
  } else {
    vec2 tuv = cover(uv, uRes, uImg);
    col = rgbSplit(uTex, tuv, speed * 0.004 + uHover * 0.0015);
    if (uKind == 2 && uVideo > 0.001) {
      vec3 v = rgbSplit(uTex2, cover(uv, uRes, uImg2), speed * 0.004);
      col = mix(col, v, uVideo);
    }
    col *= 0.92 + 0.08 * uHover;
  }

  // film grain to sit with the rest of the scene
  col += (hash(vUv * uRes + fract(uTime) * 100.0) - 0.5) * 0.045;

  // reveal: an organic wipe from the bottom
  float rn = vnoise(vUv * vec2(5.0, 2.0) + 3.0) * 0.18;
  float rp = mix(-0.2, 1.25, uReveal);
  float reveal = 1.0 - smoothstep(rp - 0.08, rp, vUv.y + rn);
  float alpha = reveal * roundedMask(vUv, uRes, uRadius);
  gl_FragColor = vec4(col, alpha);
}
`
