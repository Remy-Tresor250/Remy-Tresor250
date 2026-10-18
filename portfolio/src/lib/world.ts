// Scroll-keyed state for the 3D story. Sections declare where the particle sculpture
// should be (data-world) and this module interpolates between those anchors.

export type WorldState = {
  /** particle shape: 0 portrait · 1 africa · 2 field · 3 atom · 4 galaxy · 5 sphere */
  morph: number
  /** position as a fraction of the visible viewport (-0.5..0.5) */
  x: number
  y: number
  /** height of the sculpture as a fraction of viewport height */
  scale: number
  rotX: number
  rotY: number
  alpha: number
  /** overall colour temperature: 0 cool ion · 1 warm ember */
  warm: number
}

export const defaults: WorldState = { morph: 0, x: 0.2, y: 0, scale: 0.9, rotX: 0, rotY: 0, alpha: 1, warm: 0 }

type Anchor = { y: number; state: WorldState }

let anchors: Anchor[] = []

export function measureAnchors() {
  const vh = window.innerHeight
  const sy = window.scrollY
  const raw: { y: number; partial: Partial<WorldState> }[] = []
  document.querySelectorAll<HTMLElement>('[data-world]').forEach((el) => {
    const r = el.getBoundingClientRect()
    let list: (Partial<WorldState> & { at?: number })[]
    try {
      const parsed = JSON.parse(el.dataset.world || '{}')
      list = Array.isArray(parsed) ? parsed : [parsed]
    } catch {
      return
    }
    for (const a of list) {
      const { at = 0.5, ...partial } = a
      raw.push({ y: r.top + sy + r.height * at - vh * 0.5, partial })
    }
  })
  raw.sort((a, b) => a.y - b.y)
  let carry = { ...defaults }
  anchors = raw.map((r) => {
    carry = { ...carry, ...r.partial }
    return { y: r.y, state: carry }
  })
}

const smooth = (t: number) => t * t * (3 - 2 * t)

export function worldAt(y: number, out: WorldState) {
  if (!anchors.length) return Object.assign(out, defaults)
  if (y <= anchors[0].y) return Object.assign(out, anchors[0].state)
  const last = anchors[anchors.length - 1]
  if (y >= last.y) return Object.assign(out, last.state)
  let i = 0
  while (i < anchors.length - 1 && anchors[i + 1].y < y) i++
  const a = anchors[i]
  const b = anchors[i + 1]
  const t = smooth((y - a.y) / Math.max(1, b.y - a.y))
  for (const k of Object.keys(defaults) as (keyof WorldState)[]) out[k] = a.state[k] + (b.state[k] - a.state[k]) * t
  return out
}

export const world = (state: Partial<WorldState> & { at?: number } | (Partial<WorldState> & { at?: number })[]) =>
  JSON.stringify(state)
