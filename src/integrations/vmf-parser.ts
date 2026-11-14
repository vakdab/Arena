import type { SceneBlock, SceneDefinition } from './scene-types'
import { sanitizeScene } from './scene-types'

/**
 * Deliberately conservative VMF adapter. It extracts entity origins and brush material hints,
 * but does not execute VMF, resolve arbitrary paths, or reproduce Valve map content at runtime.
 * A build pipeline can feed reviewed dimensions into this function later.
 */
export function vmfToSceneDefinition(vmf: string, id = 'vmf-import'): SceneDefinition {
  const blocks: SceneBlock[] = []
  const originPattern = /"origin"\s+"(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)"/g
  let match: RegExpExecArray | null
  let index = 0
  while ((match = originPattern.exec(vmf)) && blocks.length < 200) {
    const x = Number(match[1]) / 64
    const y = Number(match[3]) / 64
    const z = -Number(match[2]) / 64
    blocks.push({ id: `vmf-entity-${index++}`, position: [x, Math.max(0.5, y), z], size: [1.5, 1, 1.5], material: 'concrete', collider: false })
  }
  const materialNames = [...vmf.matchAll(/"material"\s+"([^"]+)"/g)].slice(0, 16).map(m => m[1].toLowerCase())
  if (blocks.length === 0) blocks.push({ id: 'vmf-safe-placeholder', position: [0, -0.25, -6], size: [12, 0.5, 12], material: materialNames[0] ? 'concrete' : 'concrete', collider: true })
  return sanitizeScene({ id, title: 'Reviewed VMF import', spawn: [0, 1.1, 5], blocks, targets: [] }, EMPTY_SCENE)
}

const EMPTY_SCENE: SceneDefinition = {
  id: 'empty', title: 'Empty', coordinateSystem: 'three-y-up', bounds: { min: [-20, 0, -20], max: [20, 10, 20] }, spawn: [0, 1.1, 5], blocks: [], targets: [], materials: [
    { id: 'concrete', color: '#253141', roughness: 0.86, metalness: 0.08 },
  ],
}
