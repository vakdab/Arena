import type { SceneDefinition } from './scene-types'
import { sanitizeScene } from './scene-types'

/** Arena's historical map shape: { n, ext, b:[{x,y,z,sx,sy,sz}] }. */
export function arenaMapToScene(input: unknown, id = 'arena-import'): SceneDefinition {
  const raw = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>
  const ext = Array.isArray(raw.ext) ? raw.ext.map(Number) : [20, 5, 20]
  const blocks = Array.isArray(raw.b) ? raw.b.map((value, i) => {
    const b = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>
    const n = (key: string, fallback: number) => Number.isFinite(Number(b[key])) ? Number(b[key]) : fallback
    return { id: `arena-block-${i}`, position: [n('x', 0), n('y', 0), n('z', 0)] as [number, number, number], size: [Math.max(0.2, n('sx', 1)), Math.max(0.2, n('sy', 1)), Math.max(0.2, n('sz', 1))] as [number, number, number], material: 'concrete', collider: true }
  }) : []
  return sanitizeScene({ id, title: typeof raw.n === 'string' ? raw.n : 'Arena map import', bounds: { min: [-ext[0], 0, -ext[2]], max: [ext[0], ext[1] * 2, ext[2]] }, blocks }, DEFAULT_SCENE)
}

const DEFAULT_SCENE: SceneDefinition = {
  id: 'arena-fallback', title: 'Arena fallback', coordinateSystem: 'three-y-up', bounds: { min: [-20, 0, -20], max: [20, 10, 20] }, spawn: [0, 1.1, 5], blocks: [], targets: [], materials: [{ id: 'concrete', color: '#253141' }],
}
