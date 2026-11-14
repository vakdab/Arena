import * as THREE from 'three'
import type { Physics } from '../engine/physics'
import { vec3, type SceneBlock, type SceneDefinition } from '../integrations/scene-types'
import rangeData from '../data/maps/calibration-range.json'

export const RANGE_SCENE = rangeData as SceneDefinition

const materialCache = new Map<string, THREE.MeshStandardMaterial>()
function material(id: string, scene: SceneDefinition): THREE.MeshStandardMaterial {
  const key = `${scene.id}:${id}`
  const cached = materialCache.get(key)
  if (cached) return cached
  const def = scene.materials.find(m => m.id === id) ?? scene.materials[0]
  const color = new THREE.Color(def?.color ?? '#536579')
  const out = new THREE.MeshStandardMaterial({ color, roughness: def?.roughness ?? 0.8, metalness: def?.metalness ?? 0.1, emissive: def?.emissive ?? '#000000', emissiveIntensity: def?.emissive ? 0.35 : 0 })
  materialCache.set(key, out)
  return out
}

export class World {
  readonly scene = new THREE.Scene()
  readonly sun: THREE.DirectionalLight
  readonly spawn: THREE.Vector3
  readonly targetSpots: THREE.Vector3[]
  private readonly sceneDefinition: SceneDefinition

  constructor(private readonly physics: Physics, shadowMapSize: number, sceneDefinition = RANGE_SCENE) {
    this.sceneDefinition = sceneDefinition
    this.spawn = vec3(sceneDefinition.spawn)
    this.targetSpots = sceneDefinition.targets.filter(t => t.active !== false).map(t => vec3(t.position))
    this.scene.background = new THREE.Color('#0b121c')
    this.scene.fog = new THREE.Fog('#0b121c', 24, 58)
    this.scene.add(new THREE.HemisphereLight('#d8f4ff', '#0b111b', 1.1))
    this.sun = new THREE.DirectionalLight('#f4fbff', 2.2)
    this.sun.castShadow = true
    this.sun.shadow.mapSize.set(shadowMapSize, shadowMapSize)
    this.sun.shadow.camera.left = -22
    this.sun.shadow.camera.right = 22
    this.sun.shadow.camera.top = 18
    this.sun.shadow.camera.bottom = -10
    this.sun.shadow.camera.near = 1
    this.sun.shadow.camera.far = 80
    this.sun.shadow.bias = -0.0003
    this.scene.add(this.sun, this.sun.target)
    this.buildBlocks(sceneDefinition.blocks)
    this.buildLighting()
    this.buildRangeMarkers()
  }

  update(_dt: number, focus: THREE.Vector3): void {
    this.sun.position.set(focus.x + 10, 18, focus.z + 8)
    this.sun.target.position.set(focus.x, 0, focus.z - 5)
  }

  private buildBlocks(blocks: SceneBlock[]): void {
    for (const block of blocks) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(...block.size), material(block.material ?? 'concrete', this.sceneDefinition))
      mesh.position.set(...block.position)
      mesh.rotation.y = block.rotationY ?? 0
      mesh.castShadow = block.size[1] > 0.2
      mesh.receiveShadow = true
      mesh.userData.sceneBlockId = block.id
      this.scene.add(mesh)
      if (block.collider !== false) this.physics.addStaticBox(mesh.position, new THREE.Vector3(...block.size), mesh.quaternion)
    }
  }

  private buildLighting(): void {
    const strips = [-10, -5, 0, 5, 10]
    for (const x of strips) {
      const light = new THREE.PointLight('#5adbd1', 12, 12, 2)
      light.position.set(x, 5.8, -7)
      this.scene.add(light)
      const panel = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.08, 0.25), new THREE.MeshStandardMaterial({ color: '#b9fff4', emissive: '#37d8c9', emissiveIntensity: 4, roughness: 0.3 }))
      panel.position.set(x, 6.85, -7)
      this.scene.add(panel)
    }
  }

  private buildRangeMarkers(): void {
    const mat = new THREE.MeshStandardMaterial({ color: '#e8a43a', emissive: '#2b1600', emissiveIntensity: 0.6, roughness: 0.55 })
    for (let i = 0; i < 7; i += 1) {
      const marker = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.03, 0.62), mat)
      marker.position.set(-9 + i * 3, 0.03, 7.6)
      this.scene.add(marker)
    }
    const sign = new THREE.Mesh(new THREE.BoxGeometry(7.5, 0.06, 0.35), new THREE.MeshStandardMaterial({ color: '#39d7c9', emissive: '#0b4a47', emissiveIntensity: 2 }))
    sign.position.set(0, 6.2, -17.85)
    this.scene.add(sign)
  }
}
