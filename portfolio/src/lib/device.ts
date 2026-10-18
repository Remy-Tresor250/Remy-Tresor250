export const isTouch = () => window.matchMedia('(hover: none), (pointer: coarse)').matches

export function hasWebGL() {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

/** Rough device tier used to size the particle budget. */
export function tier(): 'low' | 'mid' | 'high' {
  const cores = navigator.hardwareConcurrency || 4
  const mem = (navigator as unknown as { deviceMemory?: number }).deviceMemory || 4
  const small = Math.min(window.innerWidth, window.innerHeight) < 600
  if (small || cores <= 4 || mem <= 2) return small && cores <= 4 ? 'low' : 'mid'
  return 'high'
}
