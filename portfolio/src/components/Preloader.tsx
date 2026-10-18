import { useEffect, useRef, useState } from 'react'
import { gsap } from '../lib/scroll'
import { useStore } from '../lib/store'
import { ambient } from '../lib/audio'
import './preloader.css'

export function Preloader({ onEnter }: { onEnter: () => void }) {
  const loaded = useStore((s) => s.loaded)
  const ready = useStore((s) => s.ready)
  const enter = useStore((s) => s.enter)
  const root = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(0)
  const [gone, setGone] = useState(false)

  // the counter eases towards the real progress so it never jumps
  useEffect(() => {
    const o = { v: shown }
    const tw = gsap.to(o, { v: loaded * 100, duration: 1.2, ease: 'power2.out', onUpdate: () => setShown(Math.round(o.v)) })
    return () => {
      tw.kill()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded])

  useEffect(() => {
    const el = root.current
    if (!el) return
    const tl = gsap.timeline()
    tl.fromTo(el.querySelectorAll('.pl-mark path'), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 2.2, ease: 'power2.inOut', stagger: 0.18 })
    tl.from(el.querySelectorAll('.pl-line'), { yPercent: 110, duration: 1, ease: 'expo.out', stagger: 0.08 }, 0.3)
    return () => {
      tl.kill()
    }
  }, [])

  useEffect(() => {
    if (!ready || shown < 100 || !root.current) return
    gsap.fromTo(root.current.querySelectorAll('.pl-choice > *'), { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 1, stagger: 0.1, ease: 'expo.out' })
  }, [ready, shown])

  const go = (sound: boolean) => {
    if (sound) {
      ambient.start()
      ambient.setEnabled(true)
      ambient.chime()
    }
    enter(sound)
    onEnter()
    const el = root.current!
    const tl = gsap.timeline({ onComplete: () => setGone(true) })
    tl.to(el.querySelectorAll('.pl-inner > *'), { y: -40, opacity: 0, duration: 0.7, stagger: 0.04, ease: 'power3.in' })
    tl.to(el, { clipPath: 'inset(0 0 100% 0)', duration: 1.3, ease: 'expo.inOut' }, '-=0.25')
  }

  if (gone) return null
  const canEnter = ready && shown >= 100
  return (
    <div className="preloader" ref={root} style={{ clipPath: 'inset(0 0 0% 0)' }}>
      <div className="pl-inner">
        <div className="pl-top mono">
          <span className="line-mask">
            <span className="pl-line">Niyitegeka Remy Tresor</span>
          </span>
          <span className="line-mask">
            <span className="pl-line">Portfolio — Kigali, Rwanda</span>
          </span>
        </div>

        <svg className="pl-mark" viewBox="0 0 120 120" aria-hidden="true">
          <path pathLength={1} d="M60 6a54 54 0 1 1 0 108A54 54 0 0 1 60 6" />
          <path pathLength={1} d="M36 86V34h20a14 14 0 0 1 0 28H36m19 0 15 24" />
          <path pathLength={1} d="M70 34h22M81 34v52" />
        </svg>

        <div className="pl-bottom">
          <p className="pl-tag">
            <span className="line-mask">
              <span className="pl-line">An interactive story in</span>
            </span>
            <span className="line-mask">
              <span className="pl-line">
                <em className="serif-i">eight</em> chapters.
              </span>
            </span>
          </p>
          {canEnter ? (
            <div className="pl-choice">
              <button className="btn solid" onClick={() => go(true)} data-cursor="Enter">
                <SoundIcon /> Enter with sound
              </button>
              <button className="btn" onClick={() => go(false)}>
                Enter in silence
              </button>
            </div>
          ) : (
            <div className="pl-count" aria-live="polite">
              <span className="mono">Loading</span>
              <span className="pl-num">{String(shown).padStart(3, '0')}</span>
            </div>
          )}
        </div>
        <p className="pl-hint mono">Best with headphones · scroll slowly</p>
      </div>
    </div>
  )
}

function SoundIcon() {
  return (
    <svg width="16" height="14" viewBox="0 0 16 14" fill="none" aria-hidden="true">
      {[1, 4.5, 8, 11.5, 15].map((x, i) => (
        <line key={x} x1={x} x2={x} y1={7 - [2, 5, 6, 4, 2][i]} y2={7 + [2, 5, 6, 4, 2][i]} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      ))}
    </svg>
  )
}
