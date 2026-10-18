import { useEffect, useRef, useState } from 'react'
import { useStore } from '../lib/store'
import { gsap, getLenis } from '../lib/scroll'
import { sfx } from '../lib/hooks'
import { ambient } from '../lib/audio'
import { projects } from '../data/projects'
import './case.css'

export function CaseOverlay() {
  const active = useStore((s) => s.activeProject)
  const setActive = useStore((s) => s.setActiveProject)
  const [shown, setShown] = useState<number | null>(null)
  const root = useRef<HTMLDivElement>(null)
  const body = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (active === null) return
    setShown(active)
    getLenis()?.stop()
  }, [active])

  useEffect(() => {
    const el = root.current
    if (shown === null || !el) return
    body.current?.scrollTo({ top: 0 })
    const tl = gsap.timeline()
    tl.fromTo(el, { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: 1.1, ease: 'expo.inOut' })
    tl.from(el.querySelectorAll('.cs-in'), { y: 60, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: 0.05 }, 0.55)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowRight') step(1)
      if (e.key === 'ArrowLeft') step(-1)
    }
    window.addEventListener('keydown', onKey)
    el.querySelector<HTMLButtonElement>('.cs-close')?.focus({ preventScroll: true })
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown])

  const close = () => {
    const el = root.current
    if (!el) return
    gsap.to(el, {
      clipPath: 'inset(0 0 100% 0)',
      duration: 0.9,
      ease: 'expo.inOut',
      onComplete: () => {
        setShown(null)
        setActive(null)
        getLenis()?.start()
      },
    })
  }

  const step = (dir: number) => {
    if (shown === null) return
    ambient.tick()
    const next = (shown + dir + projects.length) % projects.length
    const el = body.current
    if (!el) return
    gsap.to(el, {
      opacity: 0,
      y: -30,
      duration: 0.35,
      ease: 'power2.in',
      onComplete: () => {
        setShown(next)
        setActive(next)
        gsap.fromTo(el, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7, ease: 'expo.out' })
      },
    })
  }

  if (shown === null) return null
  const p = projects[shown]
  const next = projects[(shown + 1) % projects.length]

  return (
    <div className="case" ref={root} role="dialog" aria-modal="true" aria-label={`${p.name} case study`} style={{ '--accent': p.colors[0] } as React.CSSProperties}>
      <div className="cs-bar">
        <span className="mono cs-in">
          Case {String(shown + 1).padStart(2, '0')} / {String(projects.length).padStart(2, '0')}
        </span>
        <div className="cs-nav cs-in">
          <button className="mono" onClick={() => step(-1)} {...sfx}>
            ← Prev
          </button>
          <button className="mono" onClick={() => step(1)} {...sfx}>
            Next →
          </button>
          <button className="cs-close" onClick={close} aria-label="Close case study" data-cursor="Close" {...sfx}>
            <span />
            <span />
          </button>
        </div>
      </div>
      <div className="cs-body" ref={body} data-lenis-prevent>
        <header className="cs-head">
          <p className="mono cs-in cs-kind">
            {p.kind} · {p.platform}
          </p>
          <h2 className="cs-name cs-in">{p.name}</h2>
          <p className="cs-tag cs-in serif-i">{p.tagline}</p>
        </header>

        <div className="cs-hero cs-in">
          <video src={`/media/frames/${p.slug}.mp4`} poster={`/media/frames/${p.slug}.webp`} autoPlay muted loop playsInline />
        </div>

        <div className="cs-grid">
          <div className="cs-col">
            <p className="mono mute">Overview</p>
            <p className="cs-desc">{p.description}</p>
            {p.award && <p className="cs-award mono">★ {p.award}</p>}
            {p.url && (
              <a className="btn solid" href={p.url} target="_blank" rel="noreferrer" {...sfx}>
                Visit live site ↗
              </a>
            )}
          </div>
          {p.features.length > 0 && (
            <div className="cs-col">
              <p className="mono mute">What it does</p>
              <ol className="cs-features">
                {p.features.map((f, i) => (
                  <li key={f}>
                    <span className="mono">{String(i + 1).padStart(2, '0')}</span>
                    {f}
                  </li>
                ))}
              </ol>
            </div>
          )}
          {p.stack.length > 0 && (
            <div className="cs-col">
              <p className="mono mute">Built with</p>
              <div className="cs-stack">
                {p.stack.map((s) => (
                  <span className="chip" key={s}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {p.gallery.length > 0 && (
          <div className={`cs-gallery n${p.gallery.length}`}>
            {p.gallery.map((src) => (
              <figure key={src}>
                <img src={src} alt={`${p.name} screen`} loading="lazy" />
              </figure>
            ))}
          </div>
        )}

        <button className="cs-next" onClick={() => step(1)} data-cursor="Next" {...sfx}>
          <span className="mono mute">Next case</span>
          <span className="cs-next-name">{next.name} →</span>
        </button>
      </div>
    </div>
  )
}
