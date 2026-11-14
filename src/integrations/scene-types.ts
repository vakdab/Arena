import * as THREE from 'three'

export type NormalizedMaterial = {
  id: string
  color: string
  roughness?: number
  metalness?: number
  emissive?: string
}

export type SceneBlock = {
  id: string
  position: [number, number, number]
  size: [number, number, number]
  rotationY?: number
  material?: string
  collider?: boolean
}

export type SceneTarget = {
  id: string
  position: [number, number, number]
  size?: [number, number]
  active?: boolean
}

export type SceneDefinition = {
  id: string
  title: string
  coordinateSystem: 'three-y-up'
  bounds: { min: [number, number, number]; max: [number, number, number] }
  spawn: [number, number, number]
  blocks: SceneBlock[]
  targets: SceneTarget[]
  materials: NormalizedMaterial[]
}

export function vec3(value: [number, number, number]): THREE.Vector3 {
  return new THREE.Vector3(value[0], value[1], value[2])
}

export function sanitizeScene(input: Partial<SceneDefinition>, fallback: SceneDefinition): SceneDefinition {
  const blocks = Array.isArray(input.blocks) ? input.blocks : fallback.blocks
  const targets = Array.isArray(input.targets) ? input.targets : fallback.targets
  return {
    ...fallback,
    ...input,
    id: typeof input.id === 'string' ? input.id.slice(0, 64) : fallback.id,
    title: typeof input.title === 'string' ? input.title.slice(0, 120) : fallback.title,
    coordinateSystem: 'three-y-up',
    blocks: blocks.slice(0, 500).map((b, i) => ({
      id: String(b.id ?? `block-${i}`).slice(0, 64),
      position: b.position ?? [0, 0, 0],
      size: b.size ?? [1, 1, 1],
      rotationY: Number.isFinite(b.rotationY) ? b.rotationY : 0,
      material: b.material ?? 'concrete',
      collider: b.collider !== false,
    })),
    targets: targets.slice(0, 128).map((t, i) => ({
      id: String(t.id ?? `target-${i}`).slice(0, 64),
      position: t.position ?? [0, 1.5, -5],
      size: t.size ?? [0.9, 1.4],
      active: t.active !== false,
    })),
  }
}
