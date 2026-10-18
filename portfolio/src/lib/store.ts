import { create } from 'zustand'

export type GLImageKind = 'photo' | 'rewind' | 'project'

export type GLImageEntry = {
  id: string
  el: HTMLElement
  src: string
  src2?: string
  kind: GLImageKind
  /** a glTF model that floats in front of this element */
  model?: string
}

type State = {
  loaded: number
  ready: boolean
  entered: boolean
  sound: boolean
  chapter: number
  chapterLabel: string
  activeProject: number | null
  hoverProject: number | null
  images: GLImageEntry[]
  webgl: boolean
  setLoaded: (v: number) => void
  setReady: () => void
  enter: (sound: boolean) => void
  setSound: (v: boolean) => void
  setChapter: (i: number, label: string) => void
  setActiveProject: (i: number | null) => void
  setHoverProject: (i: number | null) => void
  addImage: (e: GLImageEntry) => void
  removeImage: (id: string) => void
  setWebgl: (v: boolean) => void
}

export const useStore = create<State>((set) => ({
  loaded: 0,
  ready: false,
  entered: false,
  sound: false,
  chapter: 0,
  chapterLabel: 'Intro',
  activeProject: null,
  hoverProject: null,
  images: [],
  webgl: true,
  setLoaded: (v) => set((s) => ({ loaded: Math.max(s.loaded, v) })),
  setReady: () => set({ ready: true, loaded: 1 }),
  enter: (sound) => set({ entered: true, sound }),
  setSound: (sound) => set({ sound }),
  setChapter: (chapter, chapterLabel) => set({ chapter, chapterLabel }),
  setActiveProject: (activeProject) => set({ activeProject }),
  setHoverProject: (hoverProject) => set({ hoverProject }),
  addImage: (e) => set((s) => ({ images: [...s.images.filter((i) => i.id !== e.id), e] })),
  removeImage: (id) => set((s) => ({ images: s.images.filter((i) => i.id !== id) })),
  setWebgl: (webgl) => set({ webgl }),
}))
