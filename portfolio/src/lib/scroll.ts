import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/** Shared, non-reactive scroll state read every frame by WebGL and audio. */
export const scroll = {
  y: 0,
  progress: 0,
  velocity: 0,
  /** smoothed absolute velocity, 0..1 */
  energy: 0,
  direction: 1,
}

export const pointer = {
  x: 0,
  y: 0,
  /** normalised -1..1 */
  nx: 0,
  ny: 0,
  /** smoothed normalised position */
  sx: 0,
  sy: 0,
}

let lenis: Lenis | null = null

export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function initScroll() {
  if (lenis) return lenis
  lenis = new Lenis({
    duration: 1.35,
    easing: (t) => 1 - Math.pow(1 - t, 4),
    smoothWheel: !reducedMotion(),
    wheelMultiplier: 0.9,
    touchMultiplier: 1.4,
  })
  lenis.on('scroll', (l: Lenis) => {
    scroll.y = l.scroll
    scroll.progress = l.progress || 0
    scroll.velocity = l.velocity
    scroll.direction = l.direction || 1
    ScrollTrigger.update()
  })
  gsap.ticker.add((time) => {
    lenis?.raf(time * 1000)
    const target = Math.min(1, Math.abs(scroll.velocity) / 40)
    scroll.energy += (target - scroll.energy) * 0.06
    pointer.sx += (pointer.nx - pointer.sx) * 0.06
    pointer.sy += (pointer.ny - pointer.sy) * 0.06
  })
  gsap.ticker.lagSmoothing(0)

  window.addEventListener(
    'pointermove',
    (e) => {
      pointer.x = e.clientX
      pointer.y = e.clientY
      pointer.nx = (e.clientX / window.innerWidth) * 2 - 1
      pointer.ny = -((e.clientY / window.innerHeight) * 2 - 1)
    },
    { passive: true },
  )
  lenis.stop()
  return lenis
}

export const getLenis = () => lenis

export function scrollTo(target: string | number | HTMLElement, immediate = false) {
  lenis?.scrollTo(target, { duration: immediate ? 0 : 2.2, immediate, easing: (t) => 1 - Math.pow(1 - t, 5) })
}

export { gsap, ScrollTrigger }
