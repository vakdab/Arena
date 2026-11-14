import * as THREE from 'three'
import type { SceneTarget } from '../integrations/scene-types'

export class Targets {
  readonly group = new THREE.Group()
  readonly total: number
  private readonly entries: Array<{ spec: SceneTarget; root: THREE.Group; board: THREE.Mesh; active: boolean }> = []
  private readonly raycaster = new THREE.Raycaster()

  constructor(specs: SceneTarget[]) {
    this.total = specs.length
    for (const spec of specs) {
      const root = new THREE.Group()
      root.position.set(...spec.position)
      const [w, h] = spec.size ?? [0.9, 1.4]
      const board = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.08), new THREE.MeshStandardMaterial({ color: '#d6e2e7', roughness: 0.62, metalness: 0.12 }))
      board.castShadow = true
      board.userData.targetId = spec.id
      root.add(board)
      const ring = new THREE.Mesh(new THREE.TorusGeometry(Math.min(w, h) * 0.25, 0.06, 8, 24), new THREE.MeshStandardMaterial({ color: '#1b2530', roughness: 0.7, metalness: 0.2 }))
      ring.position.z = -0.045
      root.add(ring)
      const centre = new THREE.Mesh(new THREE.CircleGeometry(Math.min(w, h) * 0.12, 20), new THREE.MeshStandardMaterial({ color: '#e8a43a', emissive: '#5b2d00', emissiveIntensity: 1.8 }))
      centre.position.z = -0.09
      root.add(centre)
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.2, 8), new THREE.MeshStandardMaterial({ color: '#637381', metalness: 0.65, roughness: 0.36 }))
      post.position.y = -h * 0.5 - 0.6
      root.add(post)
      this.group.add(root)
      this.entries.push({ spec, root, board, active: true })
    }
  }

  reset(): void {
    for (const entry of this.entries) {
      entry.active = true
      entry.root.visible = true
      entry.board.material = new THREE.MeshStandardMaterial({ color: '#d6e2e7', roughness: 0.62, metalness: 0.12 })
    }
  }

  remaining(): number {
    return this.entries.filter(e => e.active).length
  }

  fire(origin: THREE.Vector3, direction: THREE.Vector3): { hit: boolean; at?: THREE.Vector3; id?: string } {
    this.raycaster.set(origin, direction)
    this.raycaster.far = 80
    const objects = this.entries.filter(e => e.active).map(e => e.board)
    const hit = this.raycaster.intersectObjects(objects, false)[0]
    if (!hit) return { hit: false }
    const entry = this.entries.find(e => e.board === hit.object)
    if (!entry) return { hit: false }
    entry.active = false
    entry.root.visible = false
    return { hit: true, at: hit.point.clone(), id: entry.spec.id }
  }
}
