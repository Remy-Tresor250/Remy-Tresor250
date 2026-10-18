import { useEffect, useRef } from 'react'
import { gsap } from '../lib/scroll'
import { sfx, useGLImage } from '../lib/hooks'
import { world } from '../lib/world'
import { useStore } from '../lib/store'
import { projects } from '../data/projects'
import './recognition.css'

export function Recognition() {
  const root = useRef<HTMLElement>(null)
  const award = useGLImage<HTMLDivElement>('award', { src: '/img/award.webp' })
  const portrait = useGLImage<HTMLDivElement>('studio', { src: '/img/portrait-studio.webp' })
  const setActive = useStore((s) => s.setActiveProject)

  useEffect(() => {
    const el = root.current
    if (!el) return
    const ctx = gsap.context(() => {
      gsap.from('.rc-title .line', { yPercent: 110, duration: 1.4, ease: 'expo.out', stagger: 0.1, scrollTrigger: { trigger: '.rc-title', start: 'top 80%' } })
      gsap.from('.rc-card', { y: 80, opacity: 0, duration: 1.4, ease: 'expo.out', stagger: 0.12, scrollTrigger: { trigger: '.rc-cards', start: 'top 85%' } })
      gsap.fromTo('.rc-laurel path', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 2.4, ease: 'power2.inOut', stagger: 0.05, scrollTrigger: { trigger: '.rc-laurel', start: 'top 85%' } })
      gsap.fromTo('.rc-photo-b', { y: 120 }, { y: -120, ease: 'none', scrollTrigger: { trigger: '.rc-photos', start: 'top bottom', end: 'bottom top', scrub: true } })
    }, el)
    return () => ctx.revert()
  }, [])

  const libblio = projects.findIndex((p) => p.slug === 'libblio')

  return (
    <section
      className="recognition section"
      ref={root}
      data-chapter="6"
      data-world={world([
        { at: 0.1, morph: 3.5, x: 0, y: 0, scale: 0.9, alpha: 0.5, warm: 0.4, rotX: 0.2, rotY: 0 },
        { at: 0.45, morph: 4, x: 0.02, y: -0.12, scale: 1.55, alpha: 0.5, warm: 0.6, rotX: 0.35, rotY: 0.2 },
        { at: 0.9, morph: 4, x: 0, y: -0.05, scale: 1.4, alpha: 0.45, warm: 0.5, rotX: 0.45, rotY: 0.6 },
      ])}
    >
      <div className="rc-grid">
        <div className="rc-copy">
          <p className="eyebrow mono">Chapter 06 — Recognition</p>
          <h2 className="h2 rc-title">
            <span className="line-mask">
              <span className="line">Startup of</span>
            </span>
            <span className="line-mask">
              <span className="line">
                the <span className="serif-i" style={{ color: 'var(--gold)' }}>year.</span>
              </span>
            </span>
          </h2>
          <p className="lead">
            Libblio — the school-library platform I build — was named <strong>Startup of the Year 2025</strong> at TICON Africa. Ten-plus schools, one calmer way to run a library.
          </p>
          <svg className="rc-laurel" viewBox="0 0 220 120" aria-hidden="true">
            {Array.from({ length: 7 }).map((_, i) => {
              const a = (i / 6) * 1.2 + 0.3
              const x = 110 - Math.cos(a) * 90
              const y = 110 - Math.sin(a) * 90
              const x2 = 110 + Math.cos(a) * 90
              return (
                <g key={i}>
                  <path pathLength={1} d={`M${x} ${y} q -14 -10 -6 -26 q 12 8 6 26`} />
                  <path pathLength={1} d={`M${x2} ${y} q 14 -10 6 -26 q -12 8 -6 26`} />
                </g>
              )
            })}
            <path pathLength={1} d="M20 110 A 90 90 0 0 1 200 110" />
          </svg>
          <button className="btn" onClick={() => setActive(libblio)} data-cursor="Open" {...sfx}>
            Open the Libblio case ↗
          </button>
        </div>

        <div className="rc-photos">
          <div className="rc-photo rc-photo-a" ref={award} data-gl data-cursor="2025">
            <img src="/img/award.webp" alt="Remy holding the TICON Africa Startup of the Year 2025 trophy for Libblio" width={1400} height={1750} loading="lazy" />
          </div>
          <div className="rc-photo rc-photo-b" ref={portrait} data-gl>
            <img src="/img/portrait-studio.webp" alt="Studio portrait of Remy, arms crossed, wearing an ATOMIQ sweatshirt" width={1400} height={1750} loading="lazy" />
          </div>
        </div>
      </div>

      <div className="rc-cards">
        <a className="rc-card" href="https://github.com/bee-ai-labs/bee" target="_blank" rel="noreferrer" {...sfx} data-cursor="Visit">
          <span className="mono rc-k">Open source · Founder &amp; maintainer</span>
          <span className="rc-h">Bee 🐝</span>
          <span className="rc-p">The open-source AI knowledge hive — runnable examples, clear theory and guided paths across LLMs, RAG, agents &amp; MCP. Think MDN for AI engineering.</span>
          <span className="mono rc-go">github.com/bee-ai-labs/bee ↗</span>
        </a>
        <div className="rc-card">
          <span className="mono rc-k">Studio</span>
          <span className="rc-h">ATOMIQ</span>
          <span className="rc-p">Libblio and Collis ship under the ATOMIQ banner — small team, production-grade systems, Kigali-made.</span>
          <span className="mono rc-go">atomiq.rw</span>
        </div>
        <div className="rc-card">
          <span className="mono rc-k">Community</span>
          <span className="rc-h">Mentor</span>
          <span className="rc-p">Reviewing pull requests, writing learning paths and helping first-time contributors land their first merge.</span>
          <span className="mono rc-go">good first issues welcome</span>
        </div>
      </div>
    </section>
  )
}
