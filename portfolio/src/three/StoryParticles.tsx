import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { buildParticles, type ParticleData } from './shapes'
import { particleFragment, particleVertex } from './shaders/particles'
import { defaults, worldAt, type WorldState } from '../lib/world'
import { pointer, scroll } from '../lib/scroll'
import { useStore } from '../lib/store'

const damp = THREE.MathUtils.damp

export function StoryParticles({ count }: { count: number }) {
  const [data, setData] = useState<ParticleData | null>(null)
  const setLoaded = useStore((s) => s.setLoaded)

  useEffect(() => {
    let alive = true
    buildParticles(count, (p) => setLoaded(0.2 + p * 0.5)).then((d) => alive && setData(d))
    return () => {
      alive = false
    }
  }, [count, setLoaded])

  return data ? <Cloud data={data} /> : null
}

const target: WorldState = { ...defaults }
const current: WorldState = { ...defaults }

function Cloud({ data }: { data: ParticleData }) {
  const group = useRef<THREE.Group>(null)
  const { size, camera, viewport } = useThree()
  const entered = useStore((s) => s.entered)
  const setReady = useStore((s) => s.setReady)

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry()
    // position is required by three for bounds; the shader ignores it
    g.setAttribute('position', new THREE.BufferAttribute(data.portrait, 3))
    g.setAttribute('aPortrait', new THREE.BufferAttribute(data.portrait, 3))
    g.setAttribute('aLum', new THREE.BufferAttribute(data.lum, 1))
    g.setAttribute('aAfrica', new THREE.BufferAttribute(data.africa, 3))
    g.setAttribute('aFlag', new THREE.BufferAttribute(data.flag, 1))
    g.setAttribute('aRand', new THREE.BufferAttribute(data.rand, 4))
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 10)
    return g
  }, [data])

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: particleVertex,
        fragmentShader: particleFragment,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uMorph: { value: 0 },
          uScale: { value: 1 },
          uSize: { value: 0.011 },
          uResY: { value: 1 },
          uAssemble: { value: 1 },
          uEnergy: { value: 0 },
          uWarm: { value: 0 },
          uAlpha: { value: 1 },
          uMouse: { value: new THREE.Vector3(9, 9, 0) },
          uMouseStrength: { value: 0 },
        },
      }),
    [],
  )

  useEffect(() => {
    setReady()
  }, [setReady])

  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), [])
  const ray = useMemo(() => new THREE.Raycaster(), [])
  const hit = useMemo(() => new THREE.Vector3(), [])
  const inv = useMemo(() => new THREE.Matrix4(), [])
  const ndc = useMemo(() => new THREE.Vector2(), [])

  useFrame((state, dt) => {
    const g = group.current
    if (!g) return
    const u = material.uniforms
    const delta = Math.min(dt, 1 / 10)
    u.uTime.value += delta
    u.uResY.value = size.height * state.gl.getPixelRatio()
    u.uEnergy.value = scroll.energy
    u.uAssemble.value = damp(u.uAssemble.value, entered ? 0 : 1, entered ? 0.9 : 3, delta)

    worldAt(window.scrollY, target)
    for (const k of Object.keys(target) as (keyof WorldState)[]) {
      current[k] = damp(current[k], target[k], k === 'morph' ? 3.2 : 2.6, delta)
    }

    const vh = viewport.height
    const vw = viewport.width
    // on narrow screens the sculpture is sized by width and drifts towards the centre
    const narrow = vw / vh < 0.9
    const s = Math.min((current.scale * vh) / 2, current.scale * vw * 0.62)
    g.position.set(current.x * vw * (narrow ? 0.25 : 1), current.y * vh, 0)
    g.scale.setScalar(s)
    g.rotation.y = current.rotY + pointer.sx * 0.28
    g.rotation.x = current.rotX - pointer.sy * 0.14
    u.uScale.value = s
    u.uMorph.value = current.morph
    u.uWarm.value = current.warm
    u.uAlpha.value = current.alpha

    // pointer in the cloud's local space
    ndc.set(pointer.nx, pointer.ny)
    ray.setFromCamera(ndc, camera)
    plane.constant = -g.position.z
    if (ray.ray.intersectPlane(plane, hit)) {
      g.updateMatrixWorld()
      inv.copy(g.matrixWorld).invert()
      hit.applyMatrix4(inv)
      u.uMouse.value.lerp(hit, 0.2)
    }
    u.uMouseStrength.value = damp(u.uMouseStrength.value, pointer.x || pointer.y ? 1 : 0, 2, delta)
  })

  return (
    <group ref={group}>
      <points geometry={geometry} material={material} frustumCulled={false} />
    </group>
  )
}
