// src/components/BodyCanvas3D.tsx
// React Three Fiber 3D canvas with raycasting hover detection.
// Replace the inline HumanModel in App.tsx with this when scaling up.
//
// GLB mesh naming rules (must match BODY_PARTS ids exactly):
//   neck, shoulders, chest, belly, waist, glutes,
//   bicepsL, bicepsR, forearmsL, forearmsR,
//   wristsL, wristsR, thighsMaxL, thighsMaxR,
//   thighsMinL, thighsMinR, calvesL, calvesR,
//   anklesL, anklesR, body (base silhouette)

import { Suspense, useRef, useEffect, useCallback, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, OrbitControls, Html } from '@react-three/drei'
import * as THREE from 'three'
import { PART_MAP } from '../lib/bodyParts'
import type { FitnessEntry, BodyPartDescriptor } from '../types/fitness'

// Single shared grey material — no highlights, no colour per region
const MAT_GREY = new THREE.MeshStandardMaterial({
  color: '#B0B8C1',
  roughness: 0.7,
  metalness: 0.05,
})

function getVal(obj: any, path: string): string {
  return path.split('.').reduce((o, k) => o?.[k], obj) ?? ''
}

// ── HOVER POPUP ───────────────────────────────────────────
interface HoverPopupProps {
  part:    BodyPartDescriptor | null
  entry:   FitnessEntry | null
  mouseX:  number
  mouseY:  number
}

export function HoverPopup({ part, entry, mouseX, mouseY }: HoverPopupProps) {
  if (!part) return null
  const key     = part.field.split('.')[1]
  const section = part.field.split('.')[0]
  const val     = (entry as any)?.[section]?.[key]

  return (
    <div style={{
      position: 'fixed', left: mouseX + 18, top: mouseY - 10,
      background: '#0D1117',
      border: '1px solid rgba(255,255,255,0.15)',
      borderTop: '2px solid #00D4FF',
      borderRadius: 10, padding: '12px 16px',
      pointerEvents: 'none', zIndex: 999, minWidth: 180,
      boxShadow: '0 12px 40px rgba(0,0,0,0.7)',
    }}>
      <div style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: '#F0F4F8', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        {part.label}
      </div>
      {[
        { label: 'Measurement', value: val ? `${val} ${part.unit}` : '— not recorded' },
        { label: 'Date',        value: entry?.date ?? '—' },
        { label: 'Weight',      value: entry?.overall?.weight ? `${entry.overall.weight} kg` : '—' },
        { label: 'Body Fat',    value: entry?.overall?.bodyFatPct ? `${entry.overall.bodyFatPct}%` : '—' },
      ].map(r => (
        <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 20, marginBottom: 5 }}>
          <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#4A5A6A', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{r.label}</span>
          <span style={{ fontFamily: 'monospace', fontSize: 12, color: r.value.startsWith('—') ? '#2A3A4A' : '#F0F4F8', fontWeight: 500 }}>{r.value}</span>
        </div>
      ))}
    </div>
  )
}

// ── 3D MODEL INNER ────────────────────────────────────────
interface HumanModelProps {
  modelUrl:     string
  setHovered:   (id: string | null) => void
  setMousePos:  (pos: { x: number; y: number }) => void
}

function HumanModelInner({ modelUrl, setHovered, setMousePos }: HumanModelProps) {
  const { scene } = useGLTF(modelUrl)
  const groupRef  = useRef<THREE.Group>(null!)

  // Apply uniform grey to every mesh on load
  useEffect(() => {
    scene.traverse(child => {
      if (child instanceof THREE.Mesh) child.material = MAT_GREY
    })
  }, [scene])

  const handlePointerMove = useCallback((e: any) => {
    setMousePos({ x: e.clientX, y: e.clientY })
  }, [setMousePos])

  const handlePointerOver = useCallback((e: any) => {
    e.stopPropagation()
    const name = e.object.name
    if (PART_MAP[name]) {
      setHovered(name)
      document.body.style.cursor = 'crosshair'
    }
  }, [setHovered])

  const handlePointerOut = useCallback((e: any) => {
    e.stopPropagation()
    setHovered(null)
    document.body.style.cursor = 'auto'
  }, [setHovered])

  return (
    <group ref={groupRef}>
      <primitive
        object={scene}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onPointerMove={handlePointerMove}
      />
    </group>
  )
}

// ── MAIN EXPORTED CANVAS ──────────────────────────────────
interface BodyCanvas3DProps {
  modelUrl:  string
  entry:     FitnessEntry | null
}

export function BodyCanvas3D({ modelUrl, entry }: BodyCanvas3DProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [mousePos,  setMousePos]  = useState({ x: 0, y: 0 })

  const hoveredPart = hoveredId ? PART_MAP[hoveredId] : null

  return (
    <div style={{ flex: 1, position: 'relative' }}>
      <Canvas
        camera={{ position: [0, 1, 3], fov: 45 }}
        style={{ background: 'radial-gradient(ellipse at 50% 30%, #0A1825 0%, #080C10 70%)' }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 10, 5]}  intensity={1.0} />
        <directionalLight position={[-5, 5, -3]} intensity={0.3} />

        <Suspense fallback={
          <Html center>
            <div style={{ color: '#00D4FF', fontFamily: 'monospace', fontSize: 13, letterSpacing: '0.1em' }}>
              LOADING MODEL...
            </div>
          </Html>
        }>
          <HumanModelInner
            modelUrl={modelUrl}
            setHovered={setHoveredId}
            setMousePos={setMousePos}
          />
        </Suspense>

        <OrbitControls
          enablePan={false}
          minDistance={1.5}
          maxDistance={6}
          minPolarAngle={0}
          maxPolarAngle={Math.PI}
          enableDamping
          dampingFactor={0.05}
        />
      </Canvas>

      <HoverPopup
        part={hoveredPart}
        entry={entry}
        mouseX={mousePos.x}
        mouseY={mousePos.y}
      />

      <div style={{ position: 'absolute', bottom: 16, left: 16, fontFamily: 'monospace', fontSize: 10, color: '#2A3A4A', pointerEvents: 'none' }}>
        drag to rotate · scroll to zoom · hover body parts for measurements
      </div>
    </div>
  )
}

// Preload the model URL at module level for instant load
export const preloadModel = (url: string) => useGLTF.preload(url)
