import * as THREE from 'three'
import { CONFIG } from './config'

export class Weapon {
  readonly group = new THREE.Group()
  private cooldown = 0
  private recoil = 0
  private readonly base = new THREE.Vector3(0.42, -0.34, -0.62)

  constructor() {
    const dark = new THREE.MeshStandardMaterial({ color: '#121a23', roughness: 0.32, metalness: 0.7 })
    const accent = new THREE.MeshStandardMaterial({ color: '#39d7c9', emissive: '#0b4a47', emissiveIntensity: 1.6, roughness: 0.28, metalness: 0.45 })
    const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.13, 0.58), dark)
    barrel.position.set(0, 0.04, -0.32)
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.34, 0.18), dark)
    grip.position.set(0, -0.18, -0.02)
    grip.rotation.x = -0.2
    const sight = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.04, 0.17), accent)
    sight.position.set(0, 0.13, -0.32)
    this.group.add(barrel, grip, sight)
    this.group.position.copy(this.base)
    this.group.renderOrder = 20
    this.group.traverse(o => { o.frustumCulled = false })
  }

  tryFire(): boolean {
    if (this.cooldown > 0) return false
    this.cooldown = CONFIG.weapon.cooldown
    this.recoil = CONFIG.weapon.recoil
    return true
  }

  update(dt: number): void {
    this.cooldown = Math.max(0, this.cooldown - dt)
    this.recoil = THREE.MathUtils.damp(this.recoil, 0, 20, dt)
    this.group.position.copy(this.base)
    this.group.position.z += this.recoil
    this.group.rotation.x = -this.recoil * 0.7
  }
}
