import * as THREE from 'three'
import { RAPIER, type Physics } from '../engine/physics'
import { CONFIG } from './config'

export type PlayerIntent = { moveX: number; moveY: number; sprint: boolean }
const P = CONFIG.player
const UP = new THREE.Vector3(0, 1, 0)

export class Player {
  readonly root = new THREE.Group()
  readonly body: RAPIER.RigidBody
  readonly collider: RAPIER.Collider
  readonly velocity = new THREE.Vector3()
  grounded = false
  private readonly controller: RAPIER.KinematicCharacterController

  constructor(private readonly physics: Physics, spawn: THREE.Vector3) {
    this.body = physics.world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(spawn.x, spawn.y, spawn.z))
    this.collider = physics.world.createCollider(RAPIER.ColliderDesc.capsule(P.halfHeight, P.radius).setFriction(0), this.body)
    this.controller = physics.world.createCharacterController(0.02)
    this.controller.enableAutostep(0.35, 0.2, false)
    this.controller.enableSnapToGround(0.25)
    this.controller.setMaxSlopeClimbAngle(THREE.MathUtils.degToRad(48))
    this.controller.setMinSlopeSlideAngle(THREE.MathUtils.degToRad(36))
    this.root.visible = false
    this.root.position.copy(spawn)
    physics.bind(this.body, this.root)
  }

  get position(): THREE.Vector3 {
    const p = this.body.translation()
    return new THREE.Vector3(p.x, p.y, p.z)
  }

  teleport(to: THREE.Vector3): void {
    this.body.setTranslation(to, true)
    this.body.setNextKinematicTranslation(to)
    this.velocity.set(0, 0, 0)
    this.root.position.copy(to)
    this.physics.snap(this.body)
  }

  step(dt: number, intent: PlayerIntent, yaw: number): void {
    const forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw))
    const right = new THREE.Vector3().crossVectors(forward, UP)
    const wish = new THREE.Vector3().addScaledVector(right, intent.moveX).addScaledVector(forward, intent.moveY)
    const magnitude = Math.min(1, wish.length())
    if (magnitude > 0.01) wish.normalize()
    const speed = (intent.sprint ? P.sprintSpeed : P.walkSpeed) * magnitude
    const target = wish.multiplyScalar(speed)
    this.velocity.x += (target.x - this.velocity.x) * (1 - Math.exp(-P.acceleration * dt))
    this.velocity.z += (target.z - this.velocity.z) * (1 - Math.exp(-P.acceleration * dt))
    if (this.grounded && this.velocity.y < 0) this.velocity.y = -1
    this.velocity.y = Math.max(P.maxFall, this.velocity.y + P.gravity * dt)
    this.controller.computeColliderMovement(this.collider, this.velocity.clone().multiplyScalar(dt))
    const movement = this.controller.computedMovement()
    this.grounded = this.controller.computedGrounded()
    if (this.grounded && this.velocity.y < 0) this.velocity.y = -1
    const current = this.body.translation()
    this.body.setNextKinematicTranslation({ x: current.x + movement.x, y: current.y + movement.y, z: current.z + movement.z })
  }
}
