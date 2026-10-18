import { useEffect, useRef, useState } from 'react'
import { gsap, scrollTo } from '../lib/scroll'
import { SplitText } from 'gsap/SplitText'
import { sfx, useClock } from '../lib/hooks'
import { world } from '../lib/world'
import { ambient } from '../lib/audio'
import { profile } from '../data/profile'
import './contact.css'

function Magnetic({ children, strength = 0.35 }: { children: React.ReactNode; strength?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || matchMedia('(hover: none)').matches) return
    const xTo = gsap.quickTo(el, 'x', { duration: 0.8, ease: 'elastic.out(1, 0.4)' })
    const yTo = gsap.quickTo(el, 'y', { duration: 0.8, ease: 'elastic.out(1, 0.4)' })
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      xTo((e.clientX - (r.left + r.width / 2)) * strength)
      yTo((e.clientY - (r.top + r.height / 2)) * strength)
    }
    const leave = () => {
      xTo(0)
      yTo(0)
    }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerleave', leave)
    return () => {
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerleave', leave)
    }
  }, [strength])
  return (
    <span className="magnetic" ref={ref}>
      {children}
    </span>
  )
}

export function Contact() {
  const root = useRef<HTMLElement>(null)
  const time = useClock('Africa/Kigali')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const el = root.current
    if (!el) return
    const split = new SplitText(el.querySelectorAll('.ct-big .line'), { type: 'chars', charsClass: 'char' })
    const ctx = gsap.context(() => {
      gsap.from(split.chars, { yPercent: 110, rotate: 8, duration: 1.4, ease: 'expo.out', stagger: 0.025, scrollTrigger: { trigger: '.ct-big', start: 'top 80%' } })
      gsap.from('.ct-in', { y: 40, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: 0.08, scrollTrigger: { trigger: '.ct-big', start: 'top 60%' } })
    }, el)
    return () => {
      ctx.revert()
      split.revert()
    }
  }, [])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(profile.email)
      setCopied(true)
      ambient.chime()
      setTimeout(() => setCopied(false), 2200)
    } catch {
      window.location.href = `mailto:${profile.email}`
    }
  }

  return (
    <section
      className="contact section"
      ref={root}
      data-chapter="7"
      data-world={world([
        { at: 0.1, morph: 4.5, x: 0, y: 0.05, scale: 0.9, alpha: 0.6, warm: 0.2, rotX: 0.2, rotY: 0 },
        { at: 0.5, morph: 5, x: 0.26, y: 0.16, scale: 0.78, alpha: 1, warm: 0, rotX: 0.1, rotY: 0 },
        { at: 1, morph: 5, x: 0.27, y: 0.2, scale: 0.72, alpha: 0.85, warm: 0, rotX: 0.2, rotY: 0.6 },
      ])}
    >
      <p className="eyebrow mono">Chapter 07 — Contact</p>
      <h2 className="ct-big display">
        <span className="line-mask">
          <span className="line">Let’s build</span>
        </span>
        <span className="line-mask">
          <span className="line serif-i ion">what’s next.</span>
        </span>
      </h2>

      <div className="ct-row">
        <div className="ct-mail ct-in">
          <p className="mono mute">Write to me</p>
          <Magnetic>
            <a href={`mailto:${profile.email}`} className="ct-email" data-cursor="Write" {...sfx}>
              {profile.email}
            </a>
          </Magnetic>
          <button className="mono ct-copy" onClick={copy} {...sfx}>
            {copied ? 'Copied ✓' : 'Copy address'}
          </button>
        </div>
        <ul className="ct-links ct-in">
          {profile.links.map((l) => (
            <li key={l.href}>
              <a href={l.href} target="_blank" rel="noreferrer" {...sfx}>
                <span>{l.label}</span>
                <span aria-hidden="true">↗</span>
              </a>
            </li>
          ))}
        </ul>
      </div>

      <footer className="ct-foot mono">
        <span>© {new Date().getFullYear()} {profile.name}</span>
        <span>Kigali {time}</span>
        <span>Designed &amp; engineered by Remy — WebGL, GLSL, Web Audio</span>
        <button onClick={() => scrollTo(0)} className="ct-top" {...sfx}>
          Back to the beginning ↑
        </button>
      </footer>
    </section>
  )
}
