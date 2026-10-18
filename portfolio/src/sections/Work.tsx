import { useEffect, useRef } from 'react'
import { gsap, ScrollTrigger } from '../lib/scroll'
import { sfx, useGLImage } from '../lib/hooks'
import { useStore } from '../lib/store'
import { world } from '../lib/world'
import { ambient } from '../lib/audio'
import { projects, type Project } from '../data/projects'
import './work.css'

function Card({ p, i }: { p: Project; i: number }) {
  const setActive = useStore((s) => s.setActiveProject)
  const media = useGLImage<HTMLButtonElement>(`project-${p.slug}`, {
    src: `/media/frames/${p.slug}.webp`,
    src2: `/media/frames/${p.slug}.mp4`,
    kind: 'project',
    model: p.model,
  })
  const open = () => {
    ambient.chime()
    setActive(i)
  }
  return (
    <article className="card" style={{ '--accent': p.colors[0] } as React.CSSProperties}>
      <div className="card-head mono">
        <span>{String(i + 1).padStart(2, '0')}</span>
        <span className="card-kind">{p.kind}</span>
        <span className="card-plat">{p.platform}</span>
      </div>
      <button className="card-media" ref={media} data-gl onClick={open} data-cursor="Open" aria-label={`Open the ${p.name} case study`} {...sfx}>
        <img src={`/media/frames/${p.slug}.webp`} alt={`${p.name} — ${p.tagline}`} width={1600} height={1000} loading="lazy" />
        {p.award && <span className="card-award mono">★ {p.award}</span>}
      </button>
      <div className="card-foot">
        <h3 className="card-name">{p.name}</h3>
        <p className="card-tag">{p.tagline}</p>
        <button className="card-link mono" onClick={open} {...sfx}>
          Case study <span aria-hidden="true">↗</span>
        </button>
      </div>
    </article>
  )
}

export function Work() {
  const root = useRef<HTMLElement>(null)
  const track = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = root.current
    const tr = track.current
    if (!el || !tr) return
    const ctx = gsap.context(() => {
      gsap.from('.work-title .line', { yPercent: 110, duration: 1.4, ease: 'expo.out', stagger: 0.1, scrollTrigger: { trigger: '.work-head', start: 'top 75%' } })
      const distance = () => tr.scrollWidth - innerWidth
      const tween = gsap.to(tr, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: '.work-pin',
          start: 'top top',
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 0.6,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const bar = el.querySelector<HTMLElement>('.work-progress span')
            if (bar) bar.style.transform = `scaleX(${self.progress})`
            const idx = Math.min(projects.length - 1, Math.round(self.progress * (projects.length - 1)))
            const counter = el.querySelector<HTMLElement>('.work-count b')
            if (counter) counter.textContent = String(idx + 1).padStart(2, '0')
          },
        },
      })
      gsap.utils.toArray<HTMLElement>('.card').forEach((card) => {
        gsap.fromTo(
          card.querySelectorAll('.card-name, .card-tag, .card-link, .card-head'),
          { y: 40, opacity: 0 },
          { y: 0, opacity: 1, stagger: 0.06, ease: 'power2.out', scrollTrigger: { trigger: card, containerAnimation: tween, start: 'left 85%', end: 'left 40%', scrub: true } },
        )
      })
    }, el)
    ScrollTrigger.refresh()
    return () => ctx.revert()
  }, [])

  return (
    <section
      className="work"
      ref={root}
      data-chapter="4"
      data-world={world([
        { at: 0.04, morph: 1.5, x: 0, y: 0, scale: 1, alpha: 0.6, rotY: 0, rotX: 0.2 },
        { at: 0.2, morph: 2, x: 0, y: -0.15, scale: 0.85, alpha: 0.55, rotY: 0, rotX: 0.35 },
        { at: 0.95, morph: 2, x: 0, y: -0.15, scale: 0.85, alpha: 0.45, rotY: 0.6, rotX: 0.35 },
      ])}
    >
      <header className="work-head section">
        <p className="eyebrow mono">Chapter 04 — Selected work</p>
        <h2 className="h2 work-title">
          <span className="line-mask">
            <span className="line">Products I’ve</span>
          </span>
          <span className="line-mask">
            <span className="line">
              <span className="serif-i ion">engineered</span> &amp; shipped
            </span>
          </span>
        </h2>
        <p className="lead">Fintech, AI, mobility, commerce and supply chain — nine products, from first commit to production.</p>
      </header>

      <div className="work-pin">
        <div className="work-track" ref={track}>
          <div className="work-intro">
            <span className="mono mute">Keep scrolling — the work slides by</span>
            <span className="work-arrow" aria-hidden="true">
              →
            </span>
          </div>
          {projects.map((p, i) => (
            <Card key={p.slug} p={p} i={i} />
          ))}
          <div className="work-outro">
            <p className="serif-i">…and many more experiments on GitHub.</p>
            <a className="btn" href="https://github.com/Remy-Tresor250" target="_blank" rel="noreferrer" {...sfx}>
              Explore repositories ↗
            </a>
          </div>
        </div>
        <div className="work-ui section">
          <span className="work-count mono">
            <b>01</b> / {String(projects.length).padStart(2, '0')}
          </span>
          <span className="work-progress">
            <span />
          </span>
        </div>
      </div>
    </section>
  )
}
