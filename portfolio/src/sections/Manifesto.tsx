import { useEffect, useRef } from 'react'
import { gsap } from '../lib/scroll'
import { SplitText } from 'gsap/SplitText'
import { useGLImage } from '../lib/hooks'
import { world } from '../lib/world'
import './manifesto.css'

const TEXT =
  'I’m Remy — a full-stack engineer and founder. I turn messy, real-world problems into calm software: payment rails for travellers, AI tutors for classrooms, a super-app for getting around Kigali. Design-minded, systems-deep, and obsessed with the last one percent of polish.'

const STATS = [
  { n: '09', l: 'Featured products shipped across web, mobile & desktop' },
  { n: '10+', l: 'Schools running their library on Libblio' },
  { n: '2025', l: 'TICON Africa · Startup of the Year' },
  { n: 'OSS', l: 'Founder & maintainer of Bee, the open-source AI knowledge hive' },
]

export function Manifesto() {
  const root = useRef<HTMLElement>(null)
  const desk = useGLImage<HTMLDivElement>('desk', { src: '/img/desk.webp' })
  const outro = useGLImage<HTMLDivElement>('outro', { src: '/img/outro.webp' })

  useEffect(() => {
    const el = root.current
    if (!el) return
    const split = new SplitText(el.querySelector('.mf-text'), { type: 'words', wordsClass: 'word' })
    const ctx = gsap.context(() => {
      gsap.fromTo(
        split.words,
        { opacity: 0.12 },
        { opacity: 1, stagger: 0.05, ease: 'none', scrollTrigger: { trigger: '.mf-text', start: 'top 80%', end: 'bottom 45%', scrub: true } },
      )
      gsap.utils.toArray<HTMLElement>('[data-speed]').forEach((n) => {
        gsap.fromTo(n, { y: () => innerHeight * 0.18 * Number(n.dataset.speed) }, {
          y: () => -innerHeight * 0.18 * Number(n.dataset.speed),
          ease: 'none',
          scrollTrigger: { trigger: n, start: 'top bottom', end: 'bottom top', scrub: true },
        })
      })
      gsap.from('.mf-stat', { y: 50, opacity: 0, duration: 1.2, stagger: 0.1, ease: 'expo.out', scrollTrigger: { trigger: '.mf-stats', start: 'top 85%' } })
      gsap.from('.mf-stat .mf-line', { scaleX: 0, duration: 1.6, stagger: 0.1, ease: 'expo.out', scrollTrigger: { trigger: '.mf-stats', start: 'top 85%' } })
    }, el)
    return () => {
      ctx.revert()
      split.revert()
    }
  }, [])

  return (
    <section
      className="manifesto section"
      ref={root}
      data-chapter="2"
      data-world={world([
        { at: 0.2, morph: 0.6, x: 0.3, y: 0.05, scale: 0.9, alpha: 0.22, rotY: 0, rotX: 0 },
        { at: 0.9, morph: 1, x: 0.16, y: 0, scale: 1.05, alpha: 0.75, rotY: 0, rotX: 0 },
      ])}
    >
      <p className="eyebrow mono">Chapter 02 — Manifesto</p>
      <p className="mf-text">{TEXT}</p>

      <div className="mf-photos">
        <figure className="mf-photo mf-a" data-speed="0.6">
          <div className="mf-frame" ref={desk} data-gl data-cursor="Kigali">
            <img src="/img/desk.webp" alt="Remy at work, headphones on, at a desk in a Kigali office" width={1800} height={2400} loading="lazy" />
          </div>
          <figcaption className="mono">
            <span>Fig. 01</span> Heads-down — the studio, Kigali
          </figcaption>
        </figure>
        <figure className="mf-photo mf-b" data-speed="-0.4">
          <div className="mf-frame" ref={outro} data-gl data-cursor="Kigali">
            <img src="/img/outro.webp" alt="Remy in a dark suit under a lamp post and a clear Kigali sky" width={1600} height={2133} loading="lazy" />
          </div>
          <figcaption className="mono">
            <span>Fig. 02</span> Heads-up — between two launches
          </figcaption>
        </figure>
      </div>

      <div className="mf-stats">
        {STATS.map((s) => (
          <div className="mf-stat" key={s.l}>
            <span className="mf-line" />
            <span className="mf-n">{s.n}</span>
            <span className="mf-l">{s.l}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
