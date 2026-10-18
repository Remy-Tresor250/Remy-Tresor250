import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useStore, type GLImageKind } from './store'
import { glHover } from './glProgress'
import { ambient } from './audio'

export const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

/** Hands a DOM element over to the WebGL image layer. */
export function useGLImage<T extends HTMLElement>(
  id: string,
  opts: { src: string; src2?: string; kind?: GLImageKind; model?: string; hover?: boolean },
) {
  const ref = useRef<T>(null)
  const addImage = useStore((s) => s.addImage)
  const removeImage = useStore((s) => s.removeImage)
  const { src, src2, kind = 'photo', model, hover = true } = opts
  useEffect(() => {
    const el = ref.current
    if (!el) return
    addImage({ id, el, src, src2, kind, model })
    if (!hover) return () => removeImage(id)
    const enter = () => {
      glHover[id] = 1
    }
    const leave = () => {
      glHover[id] = 0
    }
    el.addEventListener('pointerenter', enter)
    el.addEventListener('pointerleave', leave)
    return () => {
      el.removeEventListener('pointerenter', enter)
      el.removeEventListener('pointerleave', leave)
      removeImage(id)
    }
  }, [id, src, src2, kind, model, hover, addImage, removeImage])
  return ref
}

/** Live clock for a timezone, e.g. Africa/Kigali */
export function useClock(timeZone: string) {
  const fmt = () =>
    new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(new Date())
  const [time, setTime] = useState(fmt)
  useEffect(() => {
    const id = window.setInterval(() => setTime(fmt()), 1000)
    return () => window.clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeZone])
  return time
}

/** Little sonic feedback for interactive elements. */
export const sfx = {
  onPointerEnter: () => ambient.tick(),
}
