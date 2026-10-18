import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import type { GLImageEntry } from '../lib/store'
import { glHover } from '../lib/glProgress'
import { pointer } from '../lib/scroll'

/** The Tujyane Land Cruiser: drives out of its project frame and follows the cursor. */
export function CarModel({ entry }: { entry: GLImageEntry }) {
  const { scene } = useGLTF(entry.model!, false, true)
  const { size, gl, scene: hudScene } = useThree()
  const group = useRef<THREE.Group>(null)
  const state = useRef({ reveal: 0, spin: 0 })

  const model = useMemo(() => {
    const m = scene.clone(true)
    const box = new THREE.Box3().setFromObject(m)
    const centre = box.getCenter(new THREE.Vector3())
    m.position.sub(centre)
    m.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (!mesh.isMesh) return
      mesh.renderOrder = 10
      const mat = mesh.material as THREE.MeshStandardMaterial
      if (mat && 'envMapIntensity' in mat) mat.envMapIntensity = 1.1
    })
    return { m, length: box.getSize(new THREE.Vector3()).z }
  }, [scene])

  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl)
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    hudScene.environment = env
    return () => {
      env.dispose()
      pmrem.dispose()
    }
  }, [gl, hudScene])

  useFrame((_, dt) => {
    const g = group.current
    if (!g) return
    const d = Math.min(dt, 1 / 20)
    const r = entry.el.getBoundingClientRect()
    const vh = size.height
    const visible = r.bottom > 0 && r.top < vh && r.width > 0
    g.visible = visible && state.current.reveal > 0.01
    const inView = r.top < vh * 0.8 && r.bottom > vh * 0.2 && Math.abs(r.left + r.width / 2 - size.width / 2) < size.width * 0.5
    const s = state.current
    s.reveal = THREE.MathUtils.damp(s.reveal, inView ? 1 : 0, 2.2, d)
    const hover = glHover[entry.id] || 0
    s.spin += d * (0.25 + hover * 0.9)
    const scale = (r.width * 0.62) / model.length
    const drive = (1 - s.reveal) * r.width * 0.9
    g.position.set(r.left + r.width * 0.36 - size.width / 2 - drive, size.height / 2 - (r.top + r.height * 0.6), 500)
    g.scale.setScalar(scale * (0.85 + 0.15 * s.reveal))
    g.rotation.set(0.32 - pointer.sy * 0.1, -0.9 + Math.sin(s.spin) * 0.5 + pointer.sx * 0.35, 0)
  })

  return (
    <group ref={group}>
      <primitive object={model.m} />
    </group>
  )
}
