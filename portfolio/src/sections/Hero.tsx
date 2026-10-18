import { useEffect, useRef } from 'react'
import { gsap, ScrollTrigger } from '../lib/scroll'
import { SplitText } from 'gsap/SplitText'
import { useStore } from '../lib/store'
import { world } from '../lib/world'
import { profile } from '../data/profile'
import './hero.css'

gsap.registerPlugin(SplitText)

export function Hero() {
  const root = useRef<HTMLElement>(null)
  const entered = useStore((s) => s.entered)

  useEffect(() => {
    const el = root.current
    if (!el || !entered) return
    const split = new SplitText(el.querySelectorAll('.hero-name .line'), { type: 'chars', charsClass: 'char' })
    const tl = gsap.timeline({ delay: 0.55 })
    tl.from(split.chars, { yPercent: 115, rotate: 6, duration: 1.6, ease: 'expo.out', stagger: 0.035 })
    tl.from(el.querySelectorAll('.hero-reveal'), { y: 24, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: 0.08 }, 0.5)
    tl.from(el.querySelector('.hero-scroll path'), { strokeDashoffset: 1, duration: 1.8, ease: 'power2.inOut' }, 0.9)

    // the name drifts apart as the story begins
    const st = gsap.to(el.querySelectorAll('.hero-name .line'), {
      xPercent: (i) => (i ? 12 : -8),
      opacity: 0.0,
      ease: 'none',
      scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: true },
    })
    return () => {
      tl.kill()
      st.scrollTrigger?.kill()
      st.kill()
      split.revert()
    }
  }, [entered])

  useEffect(() => ScrollTrigger.refresh(), [])

  return (
    <section
      className="hero section"
      ref={root}
      id="top"
      data-chapter="0"
      data-world={world([
        { at: 0.35, morph: 0, x: 0.2, y: -0.02, scale: 0.98, alpha: 1, warm: 0 },
        { at: 0.95, morph: 0, x: 0.26, y: 0.05, scale: 0.9, alpha: 0.35, rotY: -0.3 },
      ])}
    >
      <div className="hero-top">
        <p className="mono hero-reveal">
          <span className="ion">●</span> Interactive portfolio — Vol. 2026
        </p>
        <p className="mono hero-reveal hero-coords">{profile.coords}</p>
      </div>

      <h1 className="hero-name display" aria-label={profile.name}>
        <span className="line-mask">
          <span className="line">Remy</span>
        </span>
        <span className="line-mask">
          <span className="line serif-i">Tresor</span>
        </span>
      </h1>

      <div className="hero-foot">
        <p className="lead hero-reveal">
          Software engineer &amp; founder building <em className="serif-i ion">calm, intelligent</em> products — fintech rails, AI tutors, mobility super-apps — from Kigali to the world.
        </p>
        <div className="hero-meta hero-reveal">
          {profile.disciplines.map((d) => (
            <span className="chip" key={d}>
              {d}
            </span>
          ))}
        </div>
        <div className="hero-scroll hero-reveal" aria-hidden="true">
          <span className="mono">Scroll to begin</span>
          <svg viewBox="0 0 24 90">
            <path pathLength={1} d="M12 0v86m-8-10 8 10 8-10" />
          </svg>
        </div>
      </div>
    </section>
  )
}
