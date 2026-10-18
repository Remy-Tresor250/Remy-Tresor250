import { useEffect, useRef } from 'react'
import { gsap } from '../lib/scroll'
import { world } from '../lib/world'
import { profile } from '../data/profile'
import './elements.css'

const SYMBOLS: Record<string, string> = { Interfaces: 'If', Systems: 'Sy', Intelligence: 'Ai', Foundations: 'Fd' }

export function Elements() {
  const root = useRef<HTMLElement>(null)
  useEffect(() => {
    const el = root.current
    if (!el) return
    const ctx = gsap.context(() => {
      gsap.from('.el-title .line', { yPercent: 110, duration: 1.4, ease: 'expo.out', stagger: 0.1, scrollTrigger: { trigger: '.el-title', start: 'top 80%' } })
      gsap.utils.toArray<HTMLElement>('.el-group').forEach((g) => {
        gsap.from(g.querySelectorAll('.el-sym, h3, li'), { y: 30, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.04, scrollTrigger: { trigger: g, start: 'top 85%' } })
      })
      gsap.fromTo('.el-orbit circle', { strokeDashoffset: 1 }, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: el, start: 'top 60%', end: 'center center', scrub: true } })
    }, el)
    return () => ctx.revert()
  }, [])

  return (
    <section
      className="elements section"
      ref={root}
      data-chapter="5"
      data-world={world([
        { at: 0.1, morph: 2.5, x: 0, y: 0, scale: 0.85, alpha: 0.6, rotY: 0, rotX: 0.2 },
        { at: 0.45, morph: 3, x: 0, y: 0, scale: 0.78, alpha: 1, rotY: 0.2, rotX: 0.35 },
        { at: 0.85, morph: 3, x: 0, y: 0.02, scale: 0.7, alpha: 0.9, rotY: 0.9, rotX: 0.55 },
      ])}
    >
      <header className="el-head">
        <p className="eyebrow mono">Chapter 05 — Elements</p>
        <h2 className="h2 el-title">
          <span className="line-mask">
            <span className="line">The elements</span>
          </span>
          <span className="line-mask">
            <span className="line">
              I build <span className="serif-i ion">with</span>
            </span>
          </span>
        </h2>
      </header>

      <div className="el-atom">
        <svg className="el-orbit" viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" r="49.5" pathLength={1} />
        </svg>
        {Object.entries(profile.stack).map(([group, items], i) => (
          <div className={`el-group g${i}`} key={group}>
            <span className="el-sym">
              <small className="mono">{String(i + 1).padStart(2, '0')}</small>
              {SYMBOLS[group]}
            </span>
            <h3 className="mono">{group}</h3>
            <ul>
              {items.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
