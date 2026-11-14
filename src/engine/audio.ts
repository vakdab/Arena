export type Sfx = 'shot' | 'hit' | 'miss' | 'ui' | 'win' | 'lose'

export class Audio {
  readonly ctx: AudioContext
  private readonly master: GainNode
  private readonly music: GainNode
  private readonly sfx: GainNode
  private musicTimer = 0
  private musicOn = false
  private readonly buffers = new Map<string, AudioBuffer>()

  constructor() {
    this.ctx = new AudioContext()
    this.master = this.ctx.createGain(); this.music = this.ctx.createGain(); this.sfx = this.ctx.createGain()
    this.music.connect(this.master); this.sfx.connect(this.master); this.master.connect(this.ctx.destination)
  }

  unlock(): void { if (this.ctx.state === 'suspended') void this.ctx.resume() }
  setVolumes(music: number, sfx: number, muted = false): void {
    const t = this.ctx.currentTime
    this.music.gain.setTargetAtTime(muted ? 0 : music * 0.45, t, 0.05)
    this.sfx.gain.setTargetAtTime(muted ? 0 : sfx * 0.82, t, 0.05)
  }
  async load(url: string): Promise<AudioBuffer> {
    const cached = this.buffers.get(url); if (cached) return cached
    const buffer = await this.ctx.decodeAudioData(await (await fetch(url)).arrayBuffer()); this.buffers.set(url, buffer); return buffer
  }
  playBuffer(buffer: AudioBuffer, bus: 'music' | 'sfx' = 'sfx', loop = false): AudioBufferSourceNode {
    const src = this.ctx.createBufferSource(); src.buffer = buffer; src.loop = loop; src.connect(bus === 'music' ? this.music : this.sfx); src.start(); return src
  }
  play(name: Sfx): void {
    if (this.ctx.state !== 'running') return
    const t = this.ctx.currentTime
    const tone = (freq: number, end: number, dur: number, type: OscillatorType, vol: number, delay = 0) => {
      const oscillator = this.ctx.createOscillator(); const gain = this.ctx.createGain()
      oscillator.type = type; oscillator.frequency.setValueAtTime(freq, t + delay); oscillator.frequency.exponentialRampToValueAtTime(Math.max(end, 20), t + delay + dur)
      gain.gain.setValueAtTime(0.0001, t + delay); gain.gain.exponentialRampToValueAtTime(vol, t + delay + 0.008); gain.gain.exponentialRampToValueAtTime(0.0001, t + delay + dur)
      oscillator.connect(gain).connect(this.sfx); oscillator.start(t + delay); oscillator.stop(t + delay + dur + 0.04)
    }
    switch (name) {
      case 'shot': tone(180, 55, 0.11, 'square', 0.38); tone(760, 260, 0.08, 'triangle', 0.16, 0.01); break
      case 'hit': tone(640, 1040, 0.16, 'triangle', 0.26); tone(1080, 1480, 0.12, 'sine', 0.18, 0.06); break
      case 'miss': tone(240, 110, 0.18, 'sawtooth', 0.18); break
      case 'ui': tone(660, 700, 0.06, 'triangle', 0.18); break
      case 'win': [523, 659, 784, 1047].forEach((f, i) => tone(f, f * 1.01, 0.3, 'triangle', 0.25, i * 0.11)); break
      case 'lose': [392, 330, 262].forEach((f, i) => tone(f, f * 0.98, 0.38, 'sine', 0.25, i * 0.16)); break
    }
  }

  startMusic(): void {
    if (this.musicOn) return
    this.musicOn = true
    const chords = [[110, 138.6, 164.8], [98, 123.5, 146.8], [87.3, 110, 130.8], [98, 130.8, 164.8]]
    let bar = 0
    const schedule = () => {
      if (!this.musicOn) return
      const t = this.ctx.currentTime + 0.05; const chord = chords[bar % chords.length]
      for (const frequency of chord) {
        const oscillator = this.ctx.createOscillator(); const gain = this.ctx.createGain(); oscillator.type = 'sine'; oscillator.frequency.value = frequency
        gain.gain.setValueAtTime(0.0001, t); gain.gain.linearRampToValueAtTime(0.04, t + 1); gain.gain.linearRampToValueAtTime(0.0001, t + 4.1); oscillator.connect(gain).connect(this.music); oscillator.start(t); oscillator.stop(t + 4.3)
      }
      bar += 1; this.musicTimer = window.setTimeout(schedule, 3600)
    }
    schedule()
  }
  stopMusic(): void { this.musicOn = false; clearTimeout(this.musicTimer) }
}
