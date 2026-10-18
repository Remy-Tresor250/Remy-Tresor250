// Builds the per-particle attributes for the two data-driven shapes (the portrait and
// Africa). The other shapes of the story are procedural and live in the vertex shader.

export type ParticleData = {
  count: number
  portrait: Float32Array
  lum: Float32Array
  africa: Float32Array
  flag: Float32Array
  rand: Float32Array
}

/** Flags carried by africa points */
export const FLAG = { fill: 0, outline: 0.5, rwanda: 1, beam: 2 }

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.decoding = 'async'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

async function samplePortrait(src: string, count: number, out: Float32Array, lum: Float32Array) {
  const img = await loadImage(src)
  const H = 420
  const W = Math.round((img.width / img.height) * H)
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(img, 0, 0, W, H)
  const { data } = ctx.getImageData(0, 0, W, H)
  const fg: number[] = []
  const edge: number[] = []
  const a = (x: number, y: number) => data[(y * W + x) * 4 + 3]
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const al = a(x, y)
      if (al < 150) continue
      const i = y * W + x
      fg.push(i)
      if (a(x - 1, y) < 120 || a(x + 1, y) < 120 || a(x, y - 1) < 120 || a(x, y + 1) < 120) edge.push(i)
    }
  }
  // normalise luminance to the subject's own range so dark skin and cloth keep their detail
  const lumOf = (i: number) => 0.2126 * data[i * 4] / 255 + 0.7152 * data[i * 4 + 1] / 255 + 0.0722 * data[i * 4 + 2] / 255
  const sorted = fg.filter((_, k) => k % 7 === 0).map(lumOf).sort((x, y) => x - y)
  const lo = sorted[Math.floor(sorted.length * 0.03)] ?? 0
  const hi = sorted[Math.floor(sorted.length * 0.97)] ?? 1
  // luminance-weighted acceptance keeps detail in the face while dark cloth stays present
  const aspect = W / H
  let n = 0
  let guard = 0
  while (n < count && guard++ < count * 20) {
    const fromEdge = Math.random() < 0.14 && edge.length > 0
    const list = fromEdge ? edge : fg
    const i = list[(Math.random() * list.length) | 0]
    const px = i % W
    const py = (i / W) | 0
    let l = Math.min(1, Math.max(0, (lumOf(i) - lo) / Math.max(0.05, hi - lo)))
    l = Math.pow(l, 0.9)
    if (!fromEdge && Math.random() > 0.45 + l * 0.9) continue
    out[n * 3] = ((px + Math.random()) / W - 0.5) * aspect * 2
    out[n * 3 + 1] = (0.5 - (py + Math.random()) / H) * 2
    out[n * 3 + 2] = (l - 0.4) * 0.22 + (Math.random() - 0.5) * 0.02
    lum[n] = fromEdge ? Math.max(l, 0.55) : l
    n++
  }
  // in the unlikely case we ran short, duplicate
  for (; n < count; n++) {
    const k = (Math.random() * (n || 1)) | 0
    out.copyWithin(n * 3, k * 3, k * 3 + 3)
    lum[n] = lum[k]
  }
}

type Ring = { pts: number[][]; minX: number; minY: number; maxX: number; maxY: number }

function toRings(polys: number[][][]): Ring[] {
  return polys.map((pts) => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const [x, y] of pts) {
      minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y)
    }
    return { pts, minX, minY, maxX, maxY }
  })
}

function inRing(r: Ring, x: number, y: number) {
  if (x < r.minX || x > r.maxX || y < r.minY || y > r.maxY) return false
  let inside = false
  const p = r.pts
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    const [xi, yi] = p[i]
    const [xj, yj] = p[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

function pointOnRings(rings: Ring[], lengths: number[], total: number) {
  let t = Math.random() * total
  let k = 0
  while (k < lengths.length - 1 && t > lengths[k]) t -= lengths[k++]
  const p = rings[k].pts
  let acc = 0
  for (let i = 1; i < p.length; i++) {
    const dx = p[i][0] - p[i - 1][0]
    const dy = p[i][1] - p[i - 1][1]
    const l = Math.hypot(dx, dy)
    if (acc + l >= t) {
      const f = (t - acc) / (l || 1)
      return [p[i - 1][0] + dx * f, p[i - 1][1] + dy * f]
    }
    acc += l
  }
  return p[0]
}

async function sampleAfrica(src: string, count: number, out: Float32Array, flag: Float32Array) {
  const json = (await (await fetch(src)).json()) as { africa: number[][][]; rwanda: number[][][] }
  const rings = toRings(json.africa)
  const rwanda = toRings(json.rwanda)
  const lengths = rings.map((r) => r.pts.slice(1).reduce((s, p, i) => s + Math.hypot(p[0] - r.pts[i][0], p[1] - r.pts[i][1]), 0))
  const total = lengths.reduce((a, b) => a + b, 0)
  const rw = rwanda[0]
  const rwc = [(rw.minX + rw.maxX) / 2, (rw.minY + rw.maxY) / 2]
  const scale = 0.92
  for (let n = 0; n < count; n++) {
    const u = Math.random()
    let x = 0, y = 0, z = (Math.random() - 0.5) * 0.04, f = FLAG.fill
    if (u < 0.035) {
      // Rwanda, densely filled
      do {
        x = rw.minX + Math.random() * (rw.maxX - rw.minX)
        y = rw.minY + Math.random() * (rw.maxY - rw.minY)
      } while (!rwanda.some((r) => inRing(r, x, y)))
      f = FLAG.rwanda
      z += 0.03
    } else if (u < 0.06) {
      // a beam of light rising from Kigali
      const a = Math.random() * Math.PI * 2
      const rr = Math.pow(Math.random(), 2) * 0.012
      x = rwc[0] + Math.cos(a) * rr
      y = rwc[1]
      z = Math.sin(a) * rr
      f = FLAG.beam
    } else if (u < 0.28) {
      ;[x, y] = pointOnRings(rings, lengths, total)
      x += (Math.random() - 0.5) * 0.006
      y += (Math.random() - 0.5) * 0.006
      f = FLAG.outline
    } else {
      let guard = 0
      do {
        x = Math.random() * 2 - 1
        y = Math.random() * 2 - 1
      } while (!rings.some((r) => inRing(r, x, y)) && guard++ < 200)
    }
    out[n * 3] = x * scale
    out[n * 3 + 1] = y * scale
    out[n * 3 + 2] = z
    flag[n] = f
  }
}

export async function buildParticles(count: number, onProgress?: (p: number) => void): Promise<ParticleData> {
  const portrait = new Float32Array(count * 3)
  const lum = new Float32Array(count)
  const africa = new Float32Array(count * 3)
  const flag = new Float32Array(count)
  const rand = new Float32Array(count * 4)
  for (let i = 0; i < rand.length; i++) rand[i] = Math.random()
  onProgress?.(0.1)
  await samplePortrait('/img/portrait-cut.webp', count, portrait, lum)
  onProgress?.(0.6)
  await sampleAfrica('/data/africa.json', count, africa, flag)
  onProgress?.(1)
  return { count, portrait, lum, africa, flag, rand }
}
