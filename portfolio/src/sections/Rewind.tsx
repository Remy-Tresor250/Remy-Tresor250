import { useEffect, useRef, useState } from 'react'
import { gsap } from '../lib/scroll'
import { useGLImage } from '../lib/hooks'
import { glProgress } from '../lib/glProgress'
import { world } from '../lib/world'
import { ambient } from '../lib/audio'
import './rewind.css'

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
const now = new Date()
const START = 1985
const END = now.getFullYear()

export function Rewind() {
  const root = useRef<HTMLElement>(null)
  const frame = useGLImage<HTMLDivElement>('rewind', { src: '/img/rewind-1985.webp', src2: '/img/rewind-today.webp', kind: 'rewind', hover: false })
  const [p, setP] = useState(0)

  useEffect(() => {
    const el = root.current
    if (!el) return
    let crossed = false
    const st = gsap.timeline({
      scrollTrigger: {
        trigger: el,
        start: 'top top',
        end: '+=230%',
        pin: el.querySelector('.rewind-pin') as HTMLElement,
        scrub: true,
        onUpdate: (self) => {
          const v = gsap.utils.clamp(0, 1, (self.progress - 0.18) / 0.62)
          glProgress.rewind = v
          setP(v)
          if (v > 0.5 !== crossed) {
            crossed = v > 0.5
            ambient.chime()
          }
        },
      },
    })
    st.from(el.querySelectorAll('.rw-in'), { y: 60, opacity: 0, stagger: 0.04, ease: 'power2.out', duration: 0.18 }, 0)
    st.to(el.querySelector('.rewind-frame'), { rotate: 0, scale: 1, ease: 'none', duration: 1 }, 0)
    st.to(el.querySelectorAll('.rw-past'), { opacity: 0, y: -20, duration: 0.1 }, 0.48)
    st.fromTo(el.querySelectorAll('.rw-now'), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.1 }, 0.52)
    return () => {
      st.scrollTrigger?.kill()
      st.kill()
    }
  }, [])

  const year = Math.round(START + (END - START) * p)
  const today = p > 0.5
  const stamp = year >= END ? `${MONTHS[now.getMonth()]} ${String(now.getDate()).padStart(2, '0')} ${year}` : `OCT 24 ${year}`

  return (
    <section
      className="rewind"
      ref={root}
      data-chapter="1"
      data-world={world([
        { at: 0.12, morph: 0, x: -0.3, y: 0, scale: 1.3, alpha: 0.16, rotY: 0.5 },
        { at: 0.85, morph: 0.35, x: -0.32, y: 0, scale: 1.1, alpha: 0.2, rotY: 0.2 },
      ])}
    >
      <div className="rewind-pin section">
        <div className="rewind-copy">
          <p className="eyebrow mono rw-in">Chapter 01 — Rewind</p>
          <h2 className="h2 rw-in">
            Every builder starts as a <span className="serif-i ion">frame</span> from the past.
          </h2>
          <div className="rw-swap rw-in">
            <p className="lead rw-past">
              In another timeline it is 1985. Same face, same curiosity — and no internet yet to build.
            </p>
            <p className="lead rw-now">Fast-forward. Today I ship the products people in Rwanda tap, ride and learn with every day.</p>
          </div>
        </div>

        <div className="rewind-stage">
          <div className="rewind-frame" ref={frame} data-gl>
            <img src="/img/rewind-1985.webp" alt="Remy Tresor, re-imagined as a 1985 studio portrait" width={1086} height={1448} />
            <span className={`rw-stamp ${today ? 'now' : ''}`}>{stamp}</span>
            <span className="rw-rec mono">
              <i /> {today ? 'LIVE' : 'PLAY ◀◀'}
            </span>
          </div>
        </div>

        <div className="rewind-year" aria-hidden="true">
          <span className="mono">Year</span>
          <span className="rw-num">{year}</span>
          <span className="rw-track">
            <span style={{ transform: `scaleX(${p})` }} />
          </span>
        </div>
      </div>
    </section>
  )
}
