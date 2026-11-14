import { CONFIG, DEFAULT_CONFIG } from './config'

type Mode = 'LIVE' | 'NEXT_ACTION' | 'NEXT_RUN'
type Boundary = 'fire' | 'run'
type Control = { id: string; type: 'number'; category: string; label: string; description: string; unit: string; default: number; min: number; max: number; step: number; applyMode: Mode; integrity: 'COSMETIC' | 'GAMEPLAY' }
type Binding = { control: Control; boundary?: Boundary; read(): number; write(value: number): void }
const bindings: Binding[] = []
function number<S extends keyof typeof CONFIG>(section: S, key: keyof typeof CONFIG[S] & string, label: string, min: number, max: number, step: number, unit: string, boundary?: Boundary): void {
  const values = CONFIG[section] as Record<string, number>
  const defaults = DEFAULT_CONFIG[section] as Record<string, number>
  bindings.push({ control: Object.freeze({ id: `${section}.${key}`, type: 'number', category: section === 'player' ? 'Movement' : section === 'camera' ? 'Camera' : section === 'weapon' ? 'Weapon' : 'Run', label, description: boundary === 'run' ? 'Applies when a new run starts.' : boundary === 'fire' ? 'Applies on the next shot.' : 'Updates this preview immediately.', unit, default: defaults[key], min, max, step, applyMode: boundary === 'run' ? 'NEXT_RUN' : boundary ? 'NEXT_ACTION' : 'LIVE', integrity: section === 'camera' ? 'COSMETIC' : 'GAMEPLAY' }), boundary, read: () => values[key], write: value => { values[key] = value } })
}
number('player', 'walkSpeed', 'Walking speed', 1, 14, 0.5, 'm/s')
number('player', 'sprintSpeed', 'Sprint speed', 1, 20, 0.5, 'm/s')
number('player', 'acceleration', 'Acceleration', 12, 120, 1, '')
number('camera', 'fov', 'Field of view', 40, 100, 1, '°')
number('camera', 'minPitch', 'Minimum pitch', -1.5, -0.2, 0.05, 'rad')
number('camera', 'maxPitch', 'Maximum pitch', 0.2, 1.5, 0.05, 'rad')
number('run', 'seconds', 'Time limit', 30, 300, 10, 's', 'run')
number('run', 'totalTargets', 'Target count', 1, 24, 1, '', 'run')
number('weapon', 'cooldown', 'Fire cooldown', 0.04, 1, 0.01, 's', 'fire')
const byId = new Map(bindings.map(binding => [binding.control.id, binding]))
let requested = Object.fromEntries(bindings.map(({ control }) => [control.id, control.default]))
const valid = (values: Record<string, number>) => values['player.walkSpeed'] <= values['player.sprintSpeed']
let unranked = false
const gameplayModified = () => bindings.some(binding => binding.control.integrity === 'GAMEPLAY' && binding.read() !== binding.control.default)
export const tuning = {
  get unranked(): boolean { return unranked },
  controls: Object.freeze(bindings.map(binding => binding.control)),
  read() { return { requested: { ...requested }, active: Object.fromEntries(bindings.map(binding => [binding.control.id, binding.read()])) } },
  apply(patch: unknown): void {
    if (!patch || typeof patch !== 'object' || Array.isArray(patch)) throw new Error('Invalid patch')
    const entries = Object.entries(patch)
    for (const [id, value] of entries) { const control = byId.get(id)?.control; if (!control || typeof value !== 'number' || !Number.isFinite(value) || value < control.min || value > control.max) throw new Error('Invalid value') }
    const candidate = { ...requested, ...patch } as Record<string, number>
    if (!valid(candidate)) throw new Error('Walking speed must not exceed sprint speed')
    requested = candidate
    for (const [id, value] of entries) if (byId.get(id)!.control.applyMode === 'LIVE') byId.get(id)!.write(value)
    unranked ||= gameplayModified()
  },
  activate(boundary: Boundary): void { for (const binding of bindings) if (binding.boundary === boundary) binding.write(requested[binding.control.id]); unranked = boundary === 'run' ? gameplayModified() : unranked || gameplayModified() },
}
