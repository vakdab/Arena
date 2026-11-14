import * as THREE from 'three'
import type { Audio } from '../engine/audio'
import type { Input } from '../engine/input'
import { Physics } from '../engine/physics'
import type { Renderer } from '../engine/renderer'
import type { Quality } from '../engine/save'
import { FpsCamera } from './camera'
import { CONFIG } from './config'
import { Player } from './player'
import { createRun, formatAccuracy, recordShot, tick, type RunState } from './rules'
import { Targets } from './targets'
import { Weapon } from './weapon'
import { World } from './world'

export type Mode = 'attract' | 'playing' | 'paused' | 'ended'
export type Hint = 'move' | 'look' | 'fire'

export type GameHooks = {
  popup(text: string, screen: { x: number; y: number }, kind: 'score' | 'hurt'): void
  hurt(): void
  hint(hint: Hint | null): void
  tutorialDone(): void
  end(run: RunState): void
}

export class Game {
  mode: Mode = 'attract'
  run: RunState
  reducedMotion = false
  private readonly physics: Physics
  private readonly world: World
  private readonly player: Player
  private readonly cameraRig: FpsCamera
  private readonly targets: Targets
  private readonly weapon: Weapon
  private time = 0
  private tutorial: Hint | null = null
  private movedDistance = 0
  private lastPosition = new THREE.Vector3()

  constructor(private readonly renderer: Renderer, private readonly input: Input, private readonly audio: Audio, private readonly hooks: GameHooks) {
    this.physics = new Physics(CONFIG.player.gravity)
    this.world = new World(this.physics, renderer.shadowMapSize)
    this.player = new Player(this.physics, this.world.spawn)
    this.cameraRig = new FpsCamera()
    this.targets = new Targets(this.world.targetSpots.map((position, i) => ({ id: `target-${String(i + 1).padStart(2, '0')}`, position: [position.x, position.y, position.z], size: [0.9, 1.3], active: true })))
    this.weapon = new Weapon()
    this.world.scene.add(this.player.root, this.targets.group)
    this.cameraRig.camera.add(this.weapon.group)
    this.run = createRun(this.targets.total)
    this.cameraRig.reset(this.world.spawn)
  }

  get camera(): THREE.PerspectiveCamera {
    return this.cameraRig.camera
  }

  start(tutorial: boolean): void {
    this.targets.reset()
    this.player.teleport(this.world.spawn)
    this.cameraRig.reset(this.world.spawn)
    this.run = createRun(this.targets.total)
    this.mode = 'playing'
    this.tutorial = tutorial ? 'move' : null
    this.movedDistance = 0
    this.lastPosition.copy(this.world.spawn)
    this.input.endFrame()
    this.input.takeLook()
    this.hooks.hint(this.tutorial)
  }

  pause(): void {
    if (this.mode === 'playing') this.mode = 'paused'
  }

  resume(): void {
    if (this.mode !== 'paused') return
    this.mode = 'playing'
    this.input.endFrame()
    this.input.takeLook()
  }

  toTitle(): void {
    this.mode = 'attract'
    this.hooks.hint(null)
  }

  setQuality(quality: Quality): void {
    this.renderer.applyQuality(quality)
    const size = this.renderer.shadowMapSize
    this.world.sun.shadow.map?.dispose()
    this.world.sun.shadow.map = null
    this.world.sun.shadow.mapSize.set(size, size)
    this.world.scene.traverse(obj => {
      const material = (obj as THREE.Mesh).material
      for (const m of Array.isArray(material) ? material : material ? [material] : []) m.needsUpdate = true
    })
  }

  step(dt: number): void {
    const firePressed = this.input.consume('fire')
    const playing = this.mode === 'playing'
    this.player.step(dt, { moveX: this.input.move.x, moveY: this.input.move.y, sprint: this.input.held('sprint') }, this.cameraRig.yaw)
    this.physics.step(dt)
    if (!playing) return
    const pos = this.player.position
    this.movedDistance += pos.distanceTo(this.lastPosition)
    this.lastPosition.copy(pos)
    if (firePressed) this.fire()
    this.run = tick(this.run, dt)
    if (this.tutorial === 'move' && this.movedDistance > 0.7) this.advanceTutorial('look')
    if (this.run.phase !== 'playing') this.finish()
  }

  render(_alpha: number, frameSeconds: number): void {
    this.time += frameSeconds
    this.physics.sync(1)
    const target = this.player.position
    if (this.mode === 'attract') {
      this.camera.position.set(0, 2.8, 11.5)
      this.camera.lookAt(0, 2.4, -10)
    } else {
      const look = this.mode === 'playing' ? this.input.takeLook() : { x: 0, y: 0 }
      if (this.mode === 'playing' && this.tutorial === 'look' && Math.abs(look.x) + Math.abs(look.y) > 0.04) this.advanceTutorial('fire')
      this.cameraRig.update(target, look, frameSeconds, false, this.reducedMotion)
    }
    this.weapon.update(frameSeconds)
    this.world.update(frameSeconds, target)
    this.renderer.render(this.world.scene, this.camera)
  }

  private fire(): void {
    if (!this.weapon.tryFire()) return
    this.audio.play('shot')
    const origin = this.camera.position.clone()
    const direction = this.cameraRig.forward()
    const result = this.targets.fire(origin, direction)
    this.run = recordShot(this.run, result.hit)
    if (result.hit) {
      this.audio.play('hit')
      this.cameraRig.addShake(0.18)
      this.hooks.popup(`+${CONFIG.score.hit}`, this.project(result.at ?? origin.clone().addScaledVector(direction, 10)), 'score')
      if (this.tutorial === 'fire') {
        this.advanceTutorial(null)
        this.hooks.tutorialDone()
      }
    } else {
      this.audio.play('miss')
      this.hooks.popup('ПРОМАХ', this.project(origin.clone().addScaledVector(direction, 5)), 'hurt')
    }
  }

  private finish(): void {
    if (this.mode === 'ended') return
    this.mode = 'ended'
    this.hooks.hint(null)
    this.audio.play(this.run.phase === 'won' ? 'win' : 'lose')
    this.hooks.end(this.run)
  }

  private advanceTutorial(next: Hint | null): void {
    this.tutorial = next
    this.hooks.hint(next)
  }

  project(world: THREE.Vector3): { x: number; y: number } {
    const projected = world.clone().project(this.camera)
    return { x: ((projected.x + 1) / 2) * this.renderer.canvas.clientWidth, y: ((1 - projected.y) / 2) * this.renderer.canvas.clientHeight }
  }

  accuracyLabel(): string {
    return formatAccuracy(this.run.accuracy)
  }
}
