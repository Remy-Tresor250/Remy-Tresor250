import { simplex3 } from './noise.glsl'

// One particle cloud tells the whole story. Six shapes, blended by uMorph:
// 0 portrait · 1 africa · 2 data field · 3 atom · 4 galaxy · 5 sphere

export const particleVertex = /* glsl */ `
uniform float uTime;
uniform float uMorph;
uniform float uScale;
uniform float uSize;
uniform float uResY;
uniform float uAssemble;
uniform float uEnergy;
uniform float uWarm;
uniform vec3 uMouse;
uniform float uMouseStrength;

attribute vec3 aPortrait;
attribute float aLum;
attribute vec3 aAfrica;
attribute float aFlag;
attribute vec4 aRand;

varying vec3 vColor;
varying float vAlpha;

${simplex3}

const float PI = 3.141592653589793;
const vec3 INK = vec3(0.05, 0.06, 0.12);
const vec3 INDIGO = vec3(0.18, 0.17, 0.52);
const vec3 VIOLET = vec3(0.55, 0.47, 1.0);
const vec3 ION = vec3(0.49, 0.98, 0.89);
const vec3 BONE = vec3(0.93, 0.91, 0.86);
const vec3 EMBER = vec3(1.0, 0.48, 0.27);
const vec3 GOLD = vec3(1.0, 0.78, 0.42);

float hash(float n) { return fract(sin(n) * 43758.5453123); }
mat3 rotX(float a) { float c = cos(a), s = sin(a); return mat3(1.0, 0.0, 0.0, 0.0, c, s, 0.0, -s, c); }
mat3 rotY(float a) { float c = cos(a), s = sin(a); return mat3(c, 0.0, -s, 0.0, 1.0, 0.0, s, 0.0, c); }
mat3 rotZ(float a) { float c = cos(a), s = sin(a); return mat3(c, s, 0.0, -s, c, 0.0, 0.0, 0.0, 1.0); }
vec3 onSphere(float u, float v) {
  float th = 2.0 * PI * u;
  float ph = acos(2.0 * v - 1.0);
  return vec3(sin(ph) * cos(th), sin(ph) * sin(th), cos(ph));
}
float gauss(float a, float b) { return sqrt(-2.0 * log(max(a, 1e-4))) * cos(2.0 * PI * b); }

// ── shapes ──────────────────────────────────────────────
vec3 shapeAtom(vec4 r, float t, out vec3 col, out float size) {
  float h1 = hash(r.x * 91.7 + r.y * 13.1);
  float h2 = hash(r.z * 51.3 + r.w * 7.7);
  if (r.w < 0.2) {
    float k = floor(h1 * 7.0);
    vec3 c = k < 0.5 ? vec3(0.0) : normalize(vec3(sin(k * 2.4), cos(k * 1.7), sin(k * 3.1))) * 0.13;
    vec3 p = c + onSphere(r.x, r.y) * 0.1 * pow(r.z, 0.33);
    p = rotY(t * 0.3) * p;
    col = mix(EMBER, GOLD, step(0.5, fract(k * 0.5)));
    size = 1.15;
    return p;
  }
  float id = floor(h2 * 3.0);
  float ang = 2.0 * PI * r.x + t * (0.35 + id * 0.08);
  bool electron = r.y < 0.07;
  if (electron) ang = t * (1.1 + id * 0.25) + id * 2.1 + (r.x - 0.5) * 0.16;
  float th = gauss(h1, r.z) * 0.012;
  vec3 p = vec3(cos(ang) * (1.0 + th), sin(ang) * (0.38 + th), th * 2.0);
  p = rotZ(id * 2.0944) * rotX(0.25) * p;
  col = electron ? BONE * 1.2 : mix(ION, VIOLET, id * 0.5);
  size = electron ? 1.6 : 0.85;
  return p;
}

vec3 shapeField(vec4 r, float t, out vec3 col, out float size) {
  float x = (r.x - 0.5) * 6.0;
  float z = (r.y - 0.5) * 3.4;
  // snap 70% of points onto grid lines for a cleaner, engineered field
  if (r.w < 0.35) x = (floor(x * 3.0) + 0.5) / 3.0;
  else if (r.w < 0.7) z = (floor(z * 3.0) + 0.5) / 3.0;
  float y = sin(x * 1.2 + t * 0.5) * 0.14 + sin(z * 2.0 - t * 0.35) * 0.1 + snoise(vec3(x * 0.5, z * 0.5, t * 0.1)) * 0.12;
  col = mix(VIOLET, ION, smoothstep(-0.2, 0.25, y)) * (0.55 + 0.45 * smoothstep(1.7, -1.0, z));
  size = 0.8;
  return vec3(x, y - 0.35, z);
}

vec3 shapeGalaxy(vec4 r, float t, out vec3 col, out float size) {
  if (r.w < 0.14) {
    vec3 p = onSphere(r.x, r.y) * 0.16 * pow(r.z, 0.5);
    p.y *= 0.6;
    col = mix(GOLD, BONE, r.z);
    size = 1.2;
    return rotX(-1.05) * p;
  }
  float rr = 0.12 + pow(r.x, 0.7) * 1.15;
  float arm = floor(r.y * 3.0);
  float spread = gauss(hash(r.z * 17.0 + 3.0), r.z) * 0.22 / (rr + 0.35);
  float a = arm * 2.0944 + rr * 3.1 - t * 0.06 + spread;
  float y = gauss(hash(r.w * 11.0), r.x) * 0.03 * (1.3 - rr);
  vec3 p = vec3(cos(a) * rr, y, sin(a) * rr);
  col = mix(mix(GOLD, VIOLET, smoothstep(0.1, 0.6, rr)), ION, smoothstep(0.6, 1.25, rr));
  size = 0.75 + 0.6 * step(0.985, hash(r.y * 33.0));
  return rotX(-1.05) * p;
}

vec3 shapeSphere(vec4 r, float t, out vec3 col, out float size) {
  if (r.w < 0.16) {
    float a = 2.0 * PI * r.x + t * 0.1;
    float rr = 1.45 + (r.y - 0.5) * 0.12;
    vec3 p = vec3(cos(a) * rr, (r.z - 0.5) * 0.01, sin(a) * rr);
    col = mix(VIOLET, ION, r.y);
    size = 0.7;
    return rotX(0.35) * rotZ(-0.3) * p;
  }
  vec3 d = onSphere(r.x, r.y);
  float n = snoise(d * 2.2 + vec3(t * 0.15));
  vec3 p = d * (1.0 + n * 0.06);
  p = rotY(t * 0.08) * p;
  col = mix(INDIGO * 1.6, BONE, smoothstep(-0.6, 0.9, p.z + n * 0.4));
  size = 0.9;
  return p;
}

vec3 shapePortrait(float t, out vec3 col, out float size) {
  vec3 p = aPortrait;
  float l = aLum;
  col = mix(INDIGO * 1.3, ION, smoothstep(0.08, 0.55, l));
  col = mix(col, BONE, smoothstep(0.5, 0.95, l));
  float scan = step(0.985, fract(p.y * 14.0 - t * 0.35));
  col += scan * ION * 0.5;
  size = 0.65 + l * 0.55;
  return p;
}

vec3 shapeAfrica(vec4 r, float t, out vec3 col, out float size) {
  vec3 p = aAfrica;
  if (aFlag > 1.5) {
    float f = fract(r.x + t * 0.22);
    p.y += f * 1.2;
    col = mix(ION, BONE, f) * (1.0 - f * 0.6);
    size = 1.0 + (1.0 - f) * 0.8;
  } else if (aFlag > 0.75) {
    float pulse = 0.5 + 0.5 * sin(t * 3.0 + r.x * 6.0);
    col = mix(EMBER, ION, pulse);
    size = 1.5;
  } else if (aFlag > 0.25) {
    col = BONE * 0.95;
    size = 0.8;
  } else {
    float n = snoise(vec3(p.xy * 3.0, t * 0.15));
    col = mix(INDIGO * 1.5, VIOLET * 0.7, 0.5 + 0.5 * n);
    size = 0.7;
  }
  return p;
}

void main() {
  float t = uTime;
  vec4 r = aRand;
  float tr = sin(PI * clamp(fract(uMorph), 0.0, 1.0));
  float m = uMorph + (r.w - 0.5) * 0.6 * tr;

  vec3 pos = vec3(0.0);
  vec3 col = vec3(0.0);
  float size = 0.0;
  vec3 c; float s; float w;

  w = clamp(1.0 - abs(m - 0.0), 0.0, 1.0);
  if (w > 0.0) { vec3 p = shapePortrait(t, c, s); pos += p * w; col += c * w; size += s * w; }
  w = clamp(1.0 - abs(m - 1.0), 0.0, 1.0);
  if (w > 0.0) { vec3 p = shapeAfrica(r, t, c, s); pos += p * w; col += c * w; size += s * w; }
  w = clamp(1.0 - abs(m - 2.0), 0.0, 1.0);
  if (w > 0.0) { vec3 p = shapeField(r, t, c, s); pos += p * w; col += c * w; size += s * w; }
  w = clamp(1.0 - abs(m - 3.0), 0.0, 1.0);
  if (w > 0.0) { vec3 p = shapeAtom(r, t, c, s); pos += p * w; col += c * w; size += s * w; }
  w = clamp(1.0 - abs(m - 4.0), 0.0, 1.0);
  if (w > 0.0) { vec3 p = shapeGalaxy(r, t, c, s); pos += p * w; col += c * w; size += s * w; }
  w = clamp(1.0 - abs(m - 5.0), 0.0, 1.0);
  if (w > 0.0) { vec3 p = shapeSphere(r, t, c, s); pos += p * w; col += c * w; size += s * w; }

  // living turbulence, strongest mid-transition and when the visitor scrolls fast
  float amp = 0.008 + tr * 0.32 + uEnergy * 0.035;
  vec3 q = pos * 1.3 + r.xyz * 0.5;
  pos += vec3(snoise(q + vec3(0.0, 0.0, t * 0.12)), snoise(q + vec3(31.4, 0.0, t * 0.12)), snoise(q + vec3(0.0, 47.2, t * 0.12))) * amp;

  // intro: particles fly in from far away and assemble
  vec3 far = onSphere(r.y, r.z) * (3.0 + r.x * 5.0);
  float k = smoothstep(r.w * 0.6, r.w * 0.6 + 0.4, uAssemble);
  pos = mix(pos, far, k);

  // pointer: a soft lens that pushes particles aside and towards the viewer
  vec2 d = pos.xy - uMouse.xy;
  float f = exp(-dot(d, d) * 16.0) * uMouseStrength;
  pos.xy += normalize(d + 1e-4) * f * 0.1;
  pos.z += f * 0.35;

  col = mix(col, col * vec3(1.25, 0.85, 0.65) + EMBER * 0.12, uWarm);

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;
  float twinkle = 0.75 + 0.25 * sin(t * (1.0 + r.z * 2.0) + r.x * 40.0);
  gl_PointSize = uSize * size * (0.6 + r.z * 0.8) * uScale * projectionMatrix[1][1] * uResY * 0.5 / -mv.z;
  vColor = col;
  vAlpha = twinkle * (1.0 - k * 0.6) * (0.78 + f * 0.5);
  // let the bottom of the portrait dissolve rather than end in a hard line
  vAlpha *= mix(1.0, smoothstep(-1.05, -0.55, aPortrait.y), clamp(1.0 - abs(m), 0.0, 1.0));
}
`

export const particleFragment = /* glsl */ `
uniform float uAlpha;
varying vec3 vColor;
varying float vAlpha;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  if (d > 0.5) discard;
  float a = smoothstep(0.5, 0.0, d);
  a = a * a;
  gl_FragColor = vec4(vColor, a * vAlpha * uAlpha);
}
`
