// ============================================================
// src/components/BodyCanvas3D.tsx
//
// React Three Fiber implementation.
// PREREQUISITES:
//   npm install three @react-three/fiber @react-three/drei
//
// GLB MESH NAMING CONVENTION (critical):
//   Your .glb file must contain named meshes that match the
//   `id` values in BODY_PARTS exactly, e.g.:
//     "neck", "chest", "waist", "bicepsL", "bicepsR", etc.
//
//   Tools to rename meshes:
//   - Blender: select mesh → Object Properties → rename
//   - glTF Transform: `npx gltf-transform rename`
//   - Three.js Editor: online at threejs.org/editor
//
//   Free anatomy .glb models:
//   - Sketchfab (search "human body anatomy low poly")
//   - ReadyPlayerMe exports (though stylized)
//   - Custom Mixamo rig
// ============================================================

import { Suspense, useRef, useState, useCallback } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import {
  useGLTF,
  OrbitControls,
  Environment,
  Html,
  BakeShadows,
  useProgress,
} from '@react-three/drei';
import * as THREE from 'three';
import type { FitnessEntry, BodyPartDescriptor } from '@/types/fitness';
import { BODY_PARTS } from '@/lib/bodyParts';

// ── HELPER: resolve nested field value ────────────────────
function getFieldValue(entry: FitnessEntry, fieldPath: string): string | null {
  const parts = fieldPath.split('.');
  let val: any = entry;
  for (const p of parts) val = val?.[p];
  return val ? String(val) : null;
}

// ── LOADING SCREEN ────────────────────────────────────────
function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div style={{
        fontFamily: 'DM Mono, monospace',
        fontSize: 12,
        color: '#00D4FF',
        letterSpacing: '0.1em',
      }}>
        LOADING MODEL {Math.round(progress)}%
      </div>
    </Html>
  );
}

// ── TOOLTIP ───────────────────────────────────────────────
interface TooltipProps {
  part: BodyPartDescriptor;
  value: string | null;
  date: string | undefined;
}

function Tooltip3D({ part, value, date }: TooltipProps) {
  return (
    <Html
      distanceFactor={10}
      style={{
        background: '#1A2330',
        border: '1px solid rgba(255,255,255,0.22)',
        borderRadius: 10,
        padding: '10px 14px',
        pointerEvents: 'none',
        minWidth: 140,
        transform: 'translate(-50%, -110%)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        fontFamily: 'DM Mono, monospace',
        whiteSpace: 'nowrap',
      }}
    >
      <div style={{ fontSize: 12, fontFamily: 'Syne, sans-serif', fontWeight: 600, color: '#00D4FF', marginBottom: 4 }}>
        {part.label}
      </div>
      <div style={{ fontSize: 18, fontWeight: 500, color: '#F0F4F8' }}>
        {value ?? '–'} <span style={{ fontSize: 11, color: '#8A9BB0' }}>{part.unit}</span>
      </div>
      <div style={{ fontSize: 10, color: '#4A5A6A', marginTop: 2 }}>{date ?? 'No data'}</div>
    </Html>
  );
}

// ── ANATOMY MODEL (loaded from GLB) ──────────────────────
interface AnatomyModelProps {
  url: string;
  entries: FitnessEntry[];
  onHover: (part: BodyPartDescriptor | null, value: string | null) => void;
  onSelect: (part: BodyPartDescriptor) => void;
}

function AnatomyModel({ url, entries, onHover, onSelect }: AnatomyModelProps) {
  // useGLTF caches the model after first load
  const { scene } = useGLTF(url);
  const groupRef = useRef<THREE.Group>(null!);
  const [hoveredMeshId, setHoveredMeshId] = useState<string | null>(null);

  const latest = entries[0];

  // Gentle breathing / idle rotation
  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.15) * 0.08;
    }
  });

  // Build a lookup: meshName → bodyPart descriptor
  const partMap = Object.fromEntries(BODY_PARTS.map(p => [p.id, p]));

  // ── Traverse scene and attach event handlers ───────────
  scene.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const part = partMap[child.name];
    if (!part) return;

    const value = latest ? getFieldValue(latest, part.field) : null;
    const isHovered = hoveredMeshId === child.name;
    const hasData = !!value;

    // Material: highlight on hover
    if (child.material instanceof THREE.MeshStandardMaterial) {
      child.material = child.material.clone();
      if (isHovered) {
        child.material.emissive = new THREE.Color(
          part.side === 'R' ? '#A8FF3E' : '#00D4FF'
        );
        child.material.emissiveIntensity = 0.4;
      } else if (hasData) {
        child.material.emissive = new THREE.Color('#002040');
        child.material.emissiveIntensity = 0.1;
      } else {
        child.material.emissiveIntensity = 0;
      }
    }
  });

  const handlePointerOver = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const meshName = (e.object as THREE.Mesh).name;
    const part = partMap[meshName];
    if (!part) return;
    setHoveredMeshId(meshName);
    document.body.style.cursor = 'pointer';
    const value = latest ? getFieldValue(latest, part.field) : null;
    onHover(part, value);
  }, [latest, onHover, partMap]);

  const handlePointerOut = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHoveredMeshId(null);
    document.body.style.cursor = 'auto';
    onHover(null, null);
  }, [onHover]);

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const meshName = (e.object as THREE.Mesh).name;
    const part = partMap[meshName];
    if (part) onSelect(part);
  }, [onSelect, partMap]);

  // Find hovered part position for tooltip
  let tooltipPosition: THREE.Vector3 | null = null;
  let tooltipPart: BodyPartDescriptor | null = null;
  let tooltipValue: string | null = null;

  if (hoveredMeshId) {
    scene.traverse((child) => {
      if (child.name === hoveredMeshId && child instanceof THREE.Mesh) {
        // Get world position of mesh center
        const box = new THREE.Box3().setFromObject(child);
        tooltipPosition = box.getCenter(new THREE.Vector3());
        tooltipPosition.y = box.max.y + 0.1; // float above mesh
      }
    });
    tooltipPart = partMap[hoveredMeshId] ?? null;
    if (tooltipPart && latest) {
      tooltipValue = getFieldValue(latest, tooltipPart.field);
    }
  }

  return (
    <group ref={groupRef}>
      <primitive
        object={scene}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      />
      {tooltipPosition && tooltipPart && (
        <mesh position={tooltipPosition}>
          <Tooltip3D
            part={tooltipPart}
            value={tooltipValue}
            date={latest?.date}
          />
        </mesh>
      )}
    </group>
  );
}

// ── MAIN CANVAS COMPONENT ─────────────────────────────────
interface BodyCanvas3DProps {
  /** Path to your .glb file, e.g. "/models/human_body.glb" */
  modelUrl: string;
  entries: FitnessEntry[];
  onPartSelect?: (part: BodyPartDescriptor) => void;
}

export function BodyCanvas3D({ modelUrl, entries, onPartSelect }: BodyCanvas3DProps) {
  const [_hoveredPart, setHoveredPart] = useState<BodyPartDescriptor | null>(null);
  const [_hoveredValue, setHoveredValue] = useState<string | null>(null);

  const handleHover = useCallback((part: BodyPartDescriptor | null, value: string | null) => {
    setHoveredPart(part);
    setHoveredValue(value);
  }, []);

  const handleSelect = useCallback((part: BodyPartDescriptor) => {
    onPartSelect?.(part);
  }, [onPartSelect]);

  return (
    <Canvas
      camera={{ position: [0, 1.2, 3.5], fov: 45 }}
      shadows
      gl={{ antialias: true, alpha: true }}
      style={{ background: 'transparent' }}
    >
      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <directionalLight
        position={[5, 10, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <pointLight position={[-5, 5, -5]} intensity={0.4} color="#00D4FF" />
      <pointLight position={[5, -2, 5]} intensity={0.2} color="#A8FF3E" />

      {/* Environment for PBR materials */}
      <Environment preset="city" />

      {/* Model */}
      <Suspense fallback={<Loader />}>
        <AnatomyModel
          url={modelUrl}
          entries={entries}
          onHover={handleHover}
          onSelect={handleSelect}
        />
        <BakeShadows />
      </Suspense>

      {/* Controls */}
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={1.5}
        maxDistance={6}
        minPolarAngle={Math.PI * 0.1}
        maxPolarAngle={Math.PI * 0.9}
        autoRotate={false}
        dampingFactor={0.05}
        enableDamping
      />
    </Canvas>
  );
}

// Preload hint — call this at module level for instant load
export const preloadModel = (url: string) => useGLTF.preload(url);

// ============================================================
// HOW TO STRUCTURE YOUR .glb FILE
// ============================================================
//
// Step 1 — Get a base model
//   Recommended free sources:
//   • Sketchfab: "human body anatomy" (filter: downloadable)
//   • Free3D.com: "male body" in .fbx → convert to .glb
//   • MakeHuman (free software) → export .mhx2 → Blender → .glb
//
// Step 2 — Open in Blender
//   File > Import > FBX/OBJ/glTF
//
// Step 3 — Segment into meshes
//   Each body region MUST be a separate mesh object.
//   Select vertices of a region → P (separate by selection).
//   Regions to create:
//     neck, shoulders, chest, belly, waist, glutes,
//     bicepsL, bicepsR, forearmsL, forearmsR,
//     wristsL, wristsR, thighsMaxL, thighsMaxR,
//     thighsMinL, thighsMinR, calvesL, calvesR,
//     anklesL, anklesR
//
// Step 4 — Name each mesh
//   Select mesh → Properties panel (N) → Item > Name
//   Name MUST match the `id` in BODY_PARTS exactly.
//   Convention: camelCase, LEFT = L suffix, RIGHT = R suffix
//     ✓ "bicepsL"    ✓ "thighsMaxR"   ✓ "waist"
//     ✗ "left_bicep" ✗ "Right Thigh"  ✗ "Waist"
//
// Step 5 — Apply materials
//   Create a single "body" material: dark navy (#0F2030)
//   with roughness 0.8, metalness 0.0.
//   The code will override emissive on hover.
//
// Step 6 — Export
//   File > Export > glTF 2.0 (.glb)
//   Settings: Format=GLB, Include=Selected Objects,
//             Mesh=Apply Modifiers, Normals=ON
//   Save to: /public/models/human_body.glb
//
// Step 7 — Use in app
//   <BodyCanvas3D modelUrl="/models/human_body.glb" entries={entries} />
// ============================================================
