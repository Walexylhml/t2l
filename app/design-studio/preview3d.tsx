"use client"

import { useMemo } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import * as THREE from "three"

// A stylized 3D garment: the 2D shirt silhouette extruded into a solid, so it
// can spin, zoom, and recolor. The customer's artwork (composited from the 2D
// editor) floats on the front and back faces. Not a photoreal drape — a real
// GLB garment model can be dropped in later without changing the studio.

function buildShirtShape(): THREE.Shape {
  // Points transcribed from the 2D silhouette (SVG viewBox 400x480), mapped to
  // three.js space: x=(x-200)/200, y=-(y-240)/200 (y flipped, centered).
  const s = new THREE.Shape()
  s.moveTo(-0.3, 1.0)
  s.lineTo(-0.5, 0.85)
  s.lineTo(-0.8, 0.6)
  s.lineTo(-0.65, 0.3)
  s.lineTo(-0.45, 0.4)
  s.lineTo(-0.45, -0.95)
  s.quadraticCurveTo(-0.45, -1.05, -0.35, -1.05)
  s.lineTo(0.35, -1.05)
  s.quadraticCurveTo(0.45, -1.05, 0.45, -0.95)
  s.lineTo(0.45, 0.4)
  s.lineTo(0.65, 0.3)
  s.lineTo(0.8, 0.6)
  s.lineTo(0.5, 0.85)
  s.lineTo(0.3, 1.0)
  s.quadraticCurveTo(0.15, 0.84, 0, 0.84)
  s.quadraticCurveTo(-0.15, 0.84, -0.3, 1.0)
  return s
}

function ArtPlane({ dataUrl, z, back }: { dataUrl: string | null; z: number; back: boolean }) {
  const texture = useMemo(() => {
    if (!dataUrl) return null
    const t = new THREE.TextureLoader().load(dataUrl)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 4
    return t
  }, [dataUrl])

  if (!texture) return null
  return (
    <mesh position={[0, -0.05, z]} rotation={[0, back ? Math.PI : 0, 0]}>
      <planeGeometry args={[1.04, 1.3]} />
      <meshStandardMaterial map={texture} transparent alphaTest={0.02} />
    </mesh>
  )
}

function Shirt({ colorHex, front, back }: { colorHex: string; front: string | null; back: string | null }) {
  const geometry = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(buildShirtShape(), {
      depth: 0.22,
      bevelEnabled: true,
      bevelThickness: 0.04,
      bevelSize: 0.04,
      bevelSegments: 2,
      steps: 1,
    })
    g.center()
    return g
  }, [])

  return (
    <group>
      <mesh geometry={geometry}>
        <meshStandardMaterial color={colorHex} roughness={0.85} metalness={0.05} />
      </mesh>
      <ArtPlane dataUrl={front} z={0.17} back={false} />
      <ArtPlane dataUrl={back} z={-0.17} back />
    </group>
  )
}

export function Preview3D({
  colorHex,
  front,
  back,
}: {
  colorHex: string
  front: string | null
  back: string | null
}) {
  return (
    <Canvas camera={{ position: [0, 0, 3.1], fov: 35 }} dpr={[1, 2]}>
      <ambientLight intensity={0.75} />
      <directionalLight position={[3, 4, 5]} intensity={1.1} />
      <directionalLight position={[-3, 2, -4]} intensity={0.4} />
      <Shirt colorHex={colorHex} front={front} back={back} />
      <OrbitControls enablePan={false} minDistance={1.8} maxDistance={6} autoRotate autoRotateSpeed={1.2} />
    </Canvas>
  )
}
