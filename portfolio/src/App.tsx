import { lazy, Suspense, useEffect, useState } from 'react'
import { gsap, initScroll, scroll, ScrollTrigger } from './lib/scroll'
import { measureAnchors } from './lib/world'
import { hasWebGL } from './lib/device'
import { useStore } from './lib/store'
import { ambient } from './lib/audio'
import { Preloader } from './components/Preloader'
import { Cursor, Nav, ProgressRail, CHAPTERS } from './components/Chrome'
import { CaseOverlay } from './components/CaseOverlay'
import { Hero } from './sections/Hero'
import { Rewind } from './sections/Rewind'
import { Manifesto } from './sections/Manifesto'
import { Kigali } from './sections/Kigali'
import { Work } from './sections/Work'
import { Elements } from './sections/Elements'
import { Recognition } from './sections/Recognition'
import { Contact } from './sections/Contact'

const Experience = lazy(() => import('./three/Experience'))

export default function App() {
  const [gl] = useState(() => hasWebGL())
  const setLoaded = useStore((s) => s.setLoaded)
  const setReady = useStore((s) => s.setReady)
  const setChapter = useStore((s) => s.setChapter)

  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)
    document.documentElement.classList.toggle('gl-on', gl)
    document.documentElement.classList.toggle('no-webgl', !gl)
    useStore.getState().setWebgl(gl)
    initScroll()

    document.fonts.ready.then(() => {
      setLoaded(0.15)
      ScrollTrigger.refresh()
    })
    if (!gl) setTimeout(setReady, 600)

    ScrollTrigger.addEventListener('refresh', measureAnchors)
    const onLoad = () => ScrollTrigger.refresh()
    window.addEventListener('load', onLoad)

    const triggers = Array.from(document.querySelectorAll<HTMLElement>('[data-chapter]')).map((el) => {
      const i = Number(el.dataset.chapter)
      return ScrollTrigger.create({
        trigger: el,
        start: 'top 55%',
        end: 'bottom 55%',
        onToggle: (self) => {
          if (!self.isActive) return
          setChapter(i, CHAPTERS[i])
          ambient.setChapter(i)
        },
      })
    })

    const energy = () => ambient.setEnergy(scroll.energy)
    gsap.ticker.add(energy)

    return () => {
      triggers.forEach((t) => t.kill())
      gsap.ticker.remove(energy)
      ScrollTrigger.removeEventListener('refresh', measureAnchors)
      window.removeEventListener('load', onLoad)
    }
  }, [gl, setLoaded, setReady, setChapter])

  const onEnter = () => {
    const lenis = initScroll()
    lenis.scrollTo(0, { immediate: true })
    lenis.start()
    ScrollTrigger.refresh()
  }

  return (
    <>
      {gl && (
        <Suspense fallback={null}>
          <Experience />
        </Suspense>
      )}
      <Preloader onEnter={onEnter} />
      <Nav />
      <ProgressRail />
      <Cursor />
      <main>
        <Hero />
        <Rewind />
        <Manifesto />
        <Kigali />
        <Work />
        <Elements />
        <Recognition />
        <Contact />
      </main>
      <CaseOverlay />
    </>
  )
}
