import { useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import { Bloom, ChromaticAberration, EffectComposer, Noise, Vignette } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import * as THREE from 'three'
import { StoryParticles } from './StoryParticles'
import { GLImages } from './GLImages'
import { pointer, scroll } from '../lib/scroll'
import { tier } from '../lib/device'

/** A deep field of slow dust that gives the camera parallax. */
function Dust({ count }: { count: number }) {
  const ref = useRef<THREE.Points>(null)
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const p = new Float32Array(count * 3)
    const s = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      p[i * 3] = (Math.random() - 0.5) * 22
      p[i * 3 + 1] = (Math.random() - 0.5) * 14
      p[i * 3 + 2] = -Math.random() * 14 + 2
      s[i] = Math.random()
    }
    g.setAttribute('position', new THREE.BufferAttribute(p, 3))
    g.setAttribute('aSeed', new THREE.BufferAttribute(s, 1))
    return g
  }, [count])
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uTime: { value: 0 }, uScroll: { value: 0 }, uPr: { value: 1 } },
        vertexShader: /* glsl */ `
          uniform float uTime; uniform float uScroll; uniform float uPr;
          attribute float aSeed; varying float vA;
          void main() {
            vec3 p = position;
            p.y = mod(p.y + uScroll * (0.4 + aSeed * 0.6) + uTime * 0.03 * aSeed + 7.0, 14.0) - 7.0;
            p.x += sin(uTime * 0.1 + aSeed * 20.0) * 0.2;
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_Position = projectionMatrix * mv;
            gl_PointSize = (1.0 + aSeed * 2.2) * uPr * (6.0 / -mv.z);
            vA = (0.25 + 0.5 * aSeed) * (0.6 + 0.4 * sin(uTime * (0.5 + aSeed) + aSeed * 30.0));
          }`,
        fragmentShader: /* glsl */ `
          varying float vA;
          void main() { float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard; gl_FragColor = vec4(vec3(0.75, 0.82, 0.95), vA * smoothstep(0.5, 0.0, d)); }`,
      }),
    [],
  )
  useFrame((state, dt) => {
    material.uniforms.uTime.value += Math.min(dt, 0.05)
    material.uniforms.uScroll.value = scroll.y / window.innerHeight
    material.uniforms.uPr.value = state.gl.getPixelRatio()
    if (ref.current) {
      ref.current.position.x = -pointer.sx * 0.35
      ref.current.position.y = -pointer.sy * 0.2
    }
  })
  return <points ref={ref} geometry={geometry} material={material} frustumCulled={false} />
}

function CameraRig() {
  useFrame((state) => {
    const c = state.camera
    c.position.x = THREE.MathUtils.lerp(c.position.x, pointer.sx * 0.18, 0.05)
    c.position.y = THREE.MathUtils.lerp(c.position.y, pointer.sy * 0.1, 0.05)
    c.lookAt(0, 0, 0)
  })
  return null
}

function Effects({ high }: { high: boolean }) {
  const ca = useRef<{ offset: THREE.Vector2 } | null>(null)
  const offset = useMemo(() => new THREE.Vector2(0.0004, 0.0004), [])
  useFrame(() => {
    const k = 0.0004 + scroll.energy * 0.0028
    offset.set(k, k * 0.6)
    if (ca.current) ca.current.offset = offset
  })
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <Bloom mipmapBlur intensity={high ? 1.05 : 0.8} luminanceThreshold={0.18} luminanceSmoothing={0.3} radius={0.72} />
      <ChromaticAberration ref={ca as never} offset={offset} radialModulation={false} modulationOffset={0} />
      <Noise premultiply blendFunction={BlendFunction.SCREEN} opacity={0.05} />
      <Vignette eskil={false} offset={0.22} darkness={0.78} />
    </EffectComposer>
  )
}

export default function Experience() {
  const t = useMemo(() => tier(), [])
  const count = t === 'high' ? 64000 : t === 'mid' ? 42000 : 26000
  const [dpr, setDpr] = useState<number>(Math.min(window.devicePixelRatio, t === 'high' ? 1.75 : 1.5))
  const [fx, setFx] = useState(t !== 'low')

  return (
    <Canvas
      className="webgl"
      dpr={dpr}
      gl={{ antialias: false, alpha: false, powerPreference: 'high-performance', stencil: false }}
      camera={{ fov: 35, position: [0, 0, 6], near: 0.1, far: 60 }}
      onCreated={({ gl }) => {
        gl.setClearColor('#05060a', 1)
        gl.toneMapping = THREE.NoToneMapping
      }}
      eventSource={document.getElementById('root')!}
      eventPrefix="client"
    >
      <PerformanceMonitor
        onDecline={() => {
          setDpr((d) => Math.max(1, d - 0.25))
          if (dpr <= 1.1) setFx(false)
        }}
        onIncline={() => setDpr((d) => Math.min(window.devicePixelRatio, t === 'high' ? 1.75 : 1.5, d + 0.25))}
      />
      <CameraRig />
      <Dust count={t === 'low' ? 600 : 1400} />
      <StoryParticles count={count} />
      {fx && <Effects high={t === 'high'} />}
      <GLImages renderPriority={fx ? 2 : 1} />
    </Canvas>
  )
}
