import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Hud, OrthographicCamera } from '@react-three/drei'
import * as THREE from 'three'
import { useStore, type GLImageEntry } from '../lib/store'
import { imageFragment, imageVertex } from './shaders/image'
import { glHover, glProgress } from '../lib/glProgress'
import { pointer } from '../lib/scroll'
import { CarModel } from './CarModel'

const loader = new THREE.TextureLoader()
const cache = new Map<string, THREE.Texture>()
function texture(src: string, gl: THREE.WebGLRenderer, onLoad: (t: THREE.Texture) => void) {
  const hit = cache.get(src)
  if (hit) {
    if (hit.image) onLoad(hit)
    else hit.userData.waiters.push(onLoad)
    return
  }
  const t = loader.load(src, (tex) => {
    tex.userData.waiters.forEach((w: (t: THREE.Texture) => void) => w(tex))
    tex.userData.waiters = []
  })
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy())
  t.userData.waiters = [onLoad]
  cache.set(src, t)
}

const blank = new THREE.DataTexture(new Uint8Array([5, 6, 10, 255]), 1, 1)
blank.needsUpdate = true

function GLImage({ entry }: { entry: GLImageEntry }) {
  const mesh = useRef<THREE.Mesh>(null)
  const { size, gl } = useThree()
  const prev = useRef({ x: 0, y: 0, init: false })
  const video = useRef<HTMLVideoElement | null>(null)

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: imageVertex,
        fragmentShader: imageFragment,
        transparent: true,
        depthWrite: false,
        uniforms: {
          uTex: { value: blank },
          uTex2: { value: blank },
          uRes: { value: new THREE.Vector2(1, 1) },
          uImg: { value: new THREE.Vector2(1, 1) },
          uImg2: { value: new THREE.Vector2(1, 1) },
          uVel: { value: new THREE.Vector2() },
          uMouse: { value: new THREE.Vector2(0.5, 0.5) },
          uReveal: { value: 0 },
          uHover: { value: 0 },
          uTime: { value: 0 },
          uProgress: { value: 0 },
          uVideo: { value: 0 },
          uKind: { value: entry.kind === 'rewind' ? 1 : entry.kind === 'project' ? 2 : 0 },
          uRadius: { value: entry.kind === 'project' ? 18 : 6 },
        },
      }),
    [entry.kind],
  )

  useEffect(() => {
    texture(entry.src, gl, (t) => {
      material.uniforms.uTex.value = t
      const img = t.image as HTMLImageElement
      material.uniforms.uImg.value.set(img.width, img.height)
    })
    if (entry.src2 && entry.kind === 'rewind') {
      texture(entry.src2, gl, (t) => {
        material.uniforms.uTex2.value = t
        const img = t.image as HTMLImageElement
        material.uniforms.uImg2.value.set(img.width, img.height)
      })
    }
    return () => {
      video.current?.pause()
      video.current?.removeAttribute('src')
    }
  }, [entry, gl, material])

  const ensureVideo = () => {
    if (video.current || !entry.src2 || entry.kind !== 'project') return
    const v = document.createElement('video')
    v.src = entry.src2
    v.muted = true
    v.loop = true
    v.playsInline = true
    v.preload = 'auto'
    v.crossOrigin = 'anonymous'
    v.addEventListener('loadeddata', () => {
      const t = new THREE.VideoTexture(v)
      t.colorSpace = THREE.SRGBColorSpace
      material.uniforms.uTex2.value = t
      material.uniforms.uImg2.value.set(v.videoWidth, v.videoHeight)
    })
    video.current = v
  }

  useFrame((_, dt) => {
    const m = mesh.current
    if (!m) return
    const r = entry.el.getBoundingClientRect()
    const vh = size.height
    const visible = r.bottom > -vh * 0.2 && r.top < vh * 1.2 && r.width > 0
    m.visible = visible
    if (!visible) {
      prev.current.init = false
      if (video.current && !video.current.paused) video.current.pause()
      return
    }
    const u = material.uniforms
    const d = Math.min(dt, 1 / 20)
    u.uTime.value += d
    m.position.set(r.left + r.width / 2 - size.width / 2, size.height / 2 - (r.top + r.height / 2), 0)
    m.scale.set(r.width, r.height, 1)
    u.uRes.value.set(r.width, r.height)

    const p = prev.current
    const vx = p.init ? (r.left - p.x) / Math.max(1, r.width) : 0
    const vy = p.init ? (r.top - p.y) / Math.max(1, r.height) : 0
    p.x = r.left
    p.y = r.top
    p.init = true
    u.uVel.value.x = THREE.MathUtils.damp(u.uVel.value.x, THREE.MathUtils.clamp(vx * 2.2, -0.25, 0.25), 6, d)
    u.uVel.value.y = THREE.MathUtils.damp(u.uVel.value.y, THREE.MathUtils.clamp(vy * 2.2, -0.25, 0.25), 6, d)

    const inView = r.top < vh * 0.88 && r.bottom > vh * 0.08
    u.uReveal.value = THREE.MathUtils.damp(u.uReveal.value, inView ? 1 : u.uReveal.value > 0.98 ? 1 : 0, 1.6, d)
    const hover = glHover[entry.id] || 0
    u.uHover.value = THREE.MathUtils.damp(u.uHover.value, hover, 5, d)
    u.uMouse.value.set((pointer.x - r.left) / r.width, 1 - (pointer.y - r.top) / r.height)
    if (entry.kind === 'rewind') u.uProgress.value = THREE.MathUtils.damp(u.uProgress.value, glProgress[entry.id] || 0, 6, d)

    if (entry.kind === 'project' && entry.src2) {
      const centre = Math.abs(r.left + r.width / 2 - size.width / 2) < size.width * 0.45
      const wants = hover > 0 || (centre && inView)
      if (wants) {
        ensureVideo()
        if (video.current?.paused) video.current.play().catch(() => {})
      } else if (video.current && !video.current.paused) video.current.pause()
      const ready = video.current && video.current.readyState >= 2 && !video.current.paused
      u.uVideo.value = THREE.MathUtils.damp(u.uVideo.value, ready ? 1 : 0, 3, d)
    }
  })

  return (
    <mesh ref={mesh} material={material} frustumCulled={false}>
      <planeGeometry args={[1, 1, 24, 24]} />
    </mesh>
  )
}

/** Mounts (and downloads) a model only once its card comes within reach. */
function LazyModel({ entry }: { entry: GLImageEntry }) {
  const [near, setNear] = useState(false)
  const { size } = useThree()
  useFrame(() => {
    if (near) return
    const r = entry.el.getBoundingClientRect()
    if (r.width > 0 && r.left < size.width * 2.5 && r.top < size.height * 2) setNear(true)
  })
  return near ? (
    <Suspense fallback={null}>
      <CarModel entry={entry} />
    </Suspense>
  ) : null
}

export function GLImages({ renderPriority = 2 }: { renderPriority?: number }) {
  const images = useStore((s) => s.images)
  const models = images.filter((i) => i.model)
  return (
    <Hud renderPriority={renderPriority}>
      <OrthographicCamera makeDefault position={[0, 0, 1000]} near={0.1} far={4000} />
      {images.map((e) => (
        <GLImage key={e.id} entry={e} />
      ))}
      {models.length > 0 && (
        <>
          <ambientLight intensity={0.6} />
          <directionalLight position={[300, 600, 800]} intensity={2.4} />
          <directionalLight position={[-600, 200, -400]} intensity={1.6} color="#7df9e4" />
          {models.map((e) => (
            <LazyModel key={e.id + '-model'} entry={e} />
          ))}
        </>
      )}
    </Hud>
  )
}
