import * as THREE from 'three'
import { CONFIG } from './config'

export class FpsCamera {
  readonly camera = new THREE.PerspectiveCamera(CONFIG.camera.fov, 1, 0.05, 120)
  yaw = 0
  pitch = -0.08
  private shake = 0
  private readonly aim = new THREE.Vector3()

  addShake(amount: number): void {
    this.shake = Math.min(1, this.shake + amount)
  }

  reset(target: THREE.Vector3, yaw = 0): void {
    this.yaw = yaw
    this.pitch = -0.08
    this.shake = 0
    this.update(target, { x: 0, y: 0 }, 1, true, true)
  }

  update(target: THREE.Vector3, look: { x: number; y: number }, dt: number, snap = false, reducedMotion = false): void {
    this.yaw -= look.x
    this.pitch = THREE.MathUtils.clamp(this.pitch + look.y, CONFIG.camera.minPitch, CONFIG.camera.maxPitch)
    this.aim.set(target.x, target.y + CONFIG.player.eyeHeight, target.z)
    const direction = this.forward()
    this.camera.position.copy(this.aim)
    this.camera.lookAt(this.aim.clone().add(direction))
    if (this.shake > 0 && !reducedMotion) {
      const amount = this.shake * 0.055
      this.camera.position.x += (Math.random() - 0.5) * amount
      this.camera.position.y += (Math.random() - 0.5) * amount
      this.camera.position.z += (Math.random() - 0.5) * amount
    }
    this.shake = Math.max(0, this.shake - dt * 3.2)
    if (snap) this.camera.updateMatrixWorld(true)
  }

  forward(): THREE.Vector3 {
    return new THREE.Vector3(-Math.sin(this.yaw) * Math.cos(this.pitch), Math.sin(this.pitch), -Math.cos(this.yaw) * Math.cos(this.pitch)).normalize()
  }
}
