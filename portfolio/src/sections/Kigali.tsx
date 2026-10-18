import { useEffect, useMemo, useRef } from 'react'
import { gsap } from '../lib/scroll'
import { useClock } from '../lib/hooks'
import { world } from '../lib/world'
import { profile } from '../data/profile'
import './kigali.css'

/** Rwanda, the land of a thousand hills — drawn as layered ridgelines. */
function hills(seed: number, amp: number, base: number, count = 9) {
  let s = seed
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647)
  const pts: [number, number][] = []
  for (let i = 0; i <= count; i++) pts.push([(i / count) * 1600, base - r() * amp])
  let d = `M0 ${base + 40} L${pts[0][0]} ${pts[0][1]}`
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1]
    const [x1, y1] = pts[i]
    const cx = (x0 + x1) / 2
    d += ` C${cx} ${y0} ${cx} ${y1} ${x1} ${y1}`
  }
  return d
}

export function Kigali() {
  const root = useRef<HTMLElement>(null)
  const time = useClock('Africa/Kigali')
  const ridges = useMemo(() => [hills(11, 120, 260, 7), hills(29, 150, 300, 9), hills(47, 110, 340, 12), hills(83, 90, 380, 15)], [])

  useEffect(() => {
    const el = root.current
    if (!el) return
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.kg-hills path',
        { strokeDashoffset: 1 },
        { strokeDashoffset: 0, ease: 'none', stagger: 0.12, scrollTrigger: { trigger: el, start: 'top 70%', end: 'center 40%', scrub: true } },
      )
      gsap.from('.kg-title .line', { yPercent: 110, duration: 1.4, ease: 'expo.out', stagger: 0.1, scrollTrigger: { trigger: '.kg-title', start: 'top 80%' } })
      gsap.from('.kg-meta > *', { y: 30, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: 0.08, scrollTrigger: { trigger: '.kg-meta', start: 'top 90%' } })
    }, el)
    return () => ctx.revert()
  }, [])

  return (
    <section
      className="kigali section"
      ref={root}
      data-chapter="3"
      data-world={world([
        { at: 0.3, morph: 1, x: 0.2, y: 0.04, scale: 1.12, alpha: 1, rotY: -0.18, rotX: 0.12 },
        { at: 0.8, morph: 1, x: 0.18, y: 0.08, scale: 1.0, alpha: 0.9, rotY: 0.25, rotX: 0.3 },
      ])}
    >
      <div className="kg-copy">
        <p className="eyebrow mono">Chapter 03 — Kigali</p>
        <h2 className="h2 kg-title">
          <span className="line-mask">
            <span className="line">Built in Kigali.</span>
          </span>
          <span className="line-mask">
            <span className="line serif-i ion">Shipped to the world.</span>
          </span>
        </h2>
        <div className="kg-meta">
          <p className="lead">
            Rwanda is where my products are born and battle-tested — on MoMo rails, on hill-country roads, in real classrooms — before they travel.
          </p>
          <dl className="kg-dl">
            <div>
              <dt className="mono">Local time</dt>
              <dd>{time}</dd>
            </div>
            <div>
              <dt className="mono">Coordinates</dt>
              <dd>{profile.coords}</dd>
            </div>
            <div>
              <dt className="mono">Elevation</dt>
              <dd>1,567 m</dd>
            </div>
          </dl>
        </div>
      </div>
      <svg className="kg-hills" viewBox="0 0 1600 420" preserveAspectRatio="none" aria-hidden="true">
        {ridges.map((d, i) => (
          <path key={i} d={d} pathLength={1} style={{ opacity: 0.25 + i * 0.18 }} />
        ))}
      </svg>
    </section>
  )
}
