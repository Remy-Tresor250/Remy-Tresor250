import { useEffect, useRef, useState } from 'react'
import { useStore } from '../lib/store'
import { ambient } from '../lib/audio'
import { gsap, scroll, scrollTo } from '../lib/scroll'
import { isTouch } from '../lib/device'
import { sfx, useClock } from '../lib/hooks'
import { profile } from '../data/profile'
import './chrome.css'

export const CHAPTERS = ['Intro', 'Rewind', 'Manifesto', 'Kigali', 'Work', 'Elements', 'Recognition', 'Contact']

export function Nav() {
  const chapter = useStore((s) => s.chapter)
  const entered = useStore((s) => s.entered)
  const time = useClock('Africa/Kigali')
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!entered || !ref.current) return
    gsap.fromTo(ref.current.children, { y: -30, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2, stagger: 0.08, ease: 'expo.out', delay: 1.2 })
  }, [entered])

  return (
    <header className="nav" ref={ref}>
      <a href="#top" className="nav-brand" onClick={(e) => (e.preventDefault(), scrollTo(0))} {...sfx} aria-label="Back to top">
        <svg viewBox="0 0 120 120" aria-hidden="true">
          <path d="M60 6a54 54 0 1 1 0 108A54 54 0 0 1 60 6" className="ring" />
          <path d="M36 86V34h20a14 14 0 0 1 0 28H36m19 0 15 24" />
          <path d="M70 34h22M81 34v52" className="t" />
        </svg>
        <span className="mono">Remy Tresor</span>
      </a>
      <div className="nav-chapter mono" aria-live="polite">
        <span className="nav-idx">
          <span key={chapter} className="nav-roll">
            {String(chapter).padStart(2, '0')}
          </span>
        </span>
        <span className="nav-bar" />
        <span className="nav-label">
          <span key={chapter} className="nav-roll">
            {CHAPTERS[chapter]}
          </span>
        </span>
      </div>
      <div className="nav-right">
        <span className="mono nav-time">KGL {time}</span>
        <SoundToggle />
        <a className="btn nav-cta" href={`mailto:${profile.email}`} {...sfx} data-cursor="Write">
          Let’s talk
        </a>
      </div>
    </header>
  )
}

export function SoundToggle() {
  const sound = useStore((s) => s.sound)
  const setSound = useStore((s) => s.setSound)
  const toggle = () => {
    const next = !sound
    setSound(next)
    ambient.setEnabled(next)
    if (next) ambient.chime()
  }
  return (
    <button className={`sound ${sound ? 'on' : ''}`} onClick={toggle} aria-pressed={sound} aria-label={sound ? 'Mute ambient music' : 'Play ambient music'} data-cursor={sound ? 'Mute' : 'Sound'}>
      <span className="sound-bars" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => (
          <i key={i} style={{ animationDelay: `${-i * 0.23}s` }} />
        ))}
      </span>
      <span className="mono">{sound ? 'Sound on' : 'Sound off'}</span>
    </button>
  )
}

export function Cursor() {
  const dot = useRef<HTMLDivElement>(null)
  const ring = useRef<HTMLDivElement>(null)
  const [label, setLabel] = useState('')
  const [active, setActive] = useState(false)

  useEffect(() => {
    if (isTouch()) return
    const pos = { x: innerWidth / 2, y: innerHeight / 2 }
    const r = { x: pos.x, y: pos.y }
    const move = (e: PointerEvent) => {
      pos.x = e.clientX
      pos.y = e.clientY
      const t = (e.target as HTMLElement).closest<HTMLElement>('a, button, [data-cursor]')
      setActive(!!t)
      setLabel(t?.dataset.cursor || '')
    }
    const tick = () => {
      r.x += (pos.x - r.x) * 0.16
      r.y += (pos.y - r.y) * 0.16
      if (dot.current) dot.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`
      if (ring.current) ring.current.style.transform = `translate3d(${r.x}px, ${r.y}px, 0)`
    }
    window.addEventListener('pointermove', move, { passive: true })
    gsap.ticker.add(tick)
    document.documentElement.classList.add('has-cursor')
    return () => {
      window.removeEventListener('pointermove', move)
      gsap.ticker.remove(tick)
    }
  }, [])

  return (
    <>
      <div className="cursor-dot" ref={dot} aria-hidden="true" />
      <div className={`cursor-ring ${active ? 'active' : ''} ${label ? 'labelled' : ''}`} ref={ring} aria-hidden="true">
        <span className="mono">{label}</span>
      </div>
    </>
  )
}

export function ProgressRail() {
  const fill = useRef<HTMLSpanElement>(null)
  const chapter = useStore((s) => s.chapter)
  useEffect(() => {
    const tick = () => {
      if (fill.current) fill.current.style.transform = `scaleY(${scroll.progress})`
    }
    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  }, [])
  return (
    <nav className="rail" aria-label="Chapters">
      <span className="rail-track">
        <span className="rail-fill" ref={fill} />
      </span>
      <ol>
        {CHAPTERS.map((c, i) => (
          <li key={c} className={i === chapter ? 'on' : ''}>
            <button onClick={() => scrollTo(`[data-chapter="${i}"]`)} aria-label={`Go to ${c}`} {...sfx}>
              <span className="mono">{c}</span>
              <i />
            </button>
          </li>
        ))}
      </ol>
    </nav>
  )
}
