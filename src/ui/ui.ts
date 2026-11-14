import type { Audio } from '../engine/audio'
import type { I18n } from '../engine/i18n'
import type { Input } from '../engine/input'
import { insertScore, type Quality, type SaveData, type SaveStore } from '../engine/save'
import type { Hint } from '../game/game'
import { formatAccuracy, formatClock, type RunState } from '../game/rules'

export type Screen = 'boot' | 'title' | 'hud' | 'pause' | 'settings' | 'leaderboard' | 'results'
export type UiActions = { play(): void; resume(): void; restart(): void; quit(): void; settings(patch: Partial<SaveData>): void }

export class Ui {
  screen: Screen = 'boot'
  private readonly root: HTMLElement
  private readonly stack: Screen[] = []
  private lastRun?: RunState
  private savedRank = -1
  private hintKey: Hint | null = null

  constructor(private readonly i18n: I18n, private readonly save: SaveStore, private readonly audio: Audio, private readonly input: Input, private readonly actions: UiActions) {
    this.root = document.getElementById('ui')!
    this.root.innerHTML = this.template()
    this.root.addEventListener('click', e => this.onClick(e))
    this.root.addEventListener('input', e => this.onInput(e))
    window.addEventListener('keydown', e => this.onKey(e))
    i18n.onChange(() => this.translate())
    this.translate()
    this.refreshSettings()
  }

  show(screen: Screen): void { this.stack.length = 0; this.setScreen(screen) }
  push(screen: Screen): void { this.stack.push(this.screen); this.setScreen(screen) }
  back(): void { const previous = this.stack.pop(); if (previous) this.setScreen(previous); else if (this.screen === 'pause') this.actions.resume() }
  setBootProgress(progress: number): void { this.q<HTMLElement>('.boot-bar i').style.transform = `scaleX(${Math.max(0.04, Math.min(1, progress))})` }

  updateHud(run: RunState): void {
    this.set('timer', formatClock(run.timeLeft))
    this.set('targets', `${run.remaining}<em>/${run.totalTargets}</em>`)
    this.set('hits', String(run.hits))
    this.set('misses', String(run.misses))
    this.set('accuracy', formatAccuracy(run.accuracy))
    this.set('score', run.score.toLocaleString(this.i18n.locale))
    this.q('.hud-timer')?.classList.toggle('is-low', run.timeLeft <= 15)
  }

  popup(text: string, at: { x: number; y: number }, kind: 'score' | 'hurt'): void {
    const el = document.createElement('div')
    el.className = `popup popup-${kind}`
    el.textContent = text
    el.style.left = `${at.x}px`
    el.style.top = `${at.y}px`
    this.q('.popups').append(el)
    el.addEventListener('animationend', () => el.remove())
  }

  hurt(): void {
    const el = this.q('.hurt-vignette')
    el.classList.remove('flash')
    void el.offsetWidth
    el.classList.add('flash')
  }

  hint(hint: Hint | null): void { this.hintKey = hint; this.renderHint() }

  showResults(run: RunState): void {
    this.lastRun = run
    this.savedRank = -1
    this.q('.results-title').setAttribute('data-i18n', run.phase === 'won' ? 'results.won' : 'results.lost.time')
    this.q('.r-targets').textContent = `${run.hits} / ${run.totalTargets}`
    this.q('.r-hits').textContent = String(run.hits)
    this.q('.r-misses').textContent = String(run.misses)
    this.q('.r-accuracy').textContent = formatAccuracy(run.accuracy)
    this.q('.r-time').textContent = formatClock(run.elapsed)
    this.q('.r-total').textContent = run.score.toLocaleString(this.i18n.locale)
    this.q<HTMLInputElement>('.results-name').value = this.save.data.playerName
    this.q('.results-rank').textContent = ''
    this.translate()
    this.show('results')
  }

  refreshSettings(): void {
    const d = this.save.data
    this.q<HTMLInputElement>('[name="musicVolume"]').value = String(d.musicVolume)
    this.q<HTMLInputElement>('[name="sfxVolume"]').value = String(d.sfxVolume)
    this.q<HTMLInputElement>('[name="sensitivity"]').value = String(d.sensitivity)
    for (const toggle of this.qa<HTMLButtonElement>('.toggle')) {
      const on = d[toggle.dataset.setting as 'muted' | 'invertY' | 'reducedMotion'] === true
      toggle.setAttribute('aria-pressed', String(on))
      toggle.querySelector('b')!.textContent = on ? this.i18n.t('settings.on') : this.i18n.t('settings.off')
    }
    for (const button of this.qa<HTMLButtonElement>('.seg button')) button.setAttribute('aria-pressed', String(button.dataset.value === d.quality))
  }

  frame(): void {
    if (this.input.method !== 'gamepad') { this.input.consume('confirm'); this.input.consume('back') }
  }

  private saveScore(): void {
    if (!this.lastRun || this.savedRank >= 0) return
    const name = this.q<HTMLInputElement>('.results-name').value.trim().slice(0, 16) || this.save.data.playerName
    const entry = { name, score: this.lastRun.score, seconds: Math.round(this.lastRun.elapsed), at: Date.now() }
    const result = insertScore(this.save.data.leaderboard, entry)
    this.save.update({ leaderboard: result.board, playerName: name })
    this.savedRank = result.rank
    this.q('.results-rank').textContent = result.rank >= 0 ? this.i18n.t('results.rank', { rank: result.rank + 1 }) : ''
    this.audio.play('ui')
  }

  private renderLeaderboard(): void {
    const board = this.save.data.leaderboard
    const list = this.q('.board')
    list.innerHTML = board.length
      ? board.map((entry, i) => `<li><b>${i + 1}</b><span class="board-name"></span><span>${formatClock(entry.seconds)}</span><em>${entry.score.toLocaleString(this.i18n.locale)}</em></li>`).join('')
      : `<li class="board-empty">${this.i18n.t('leaderboard.empty')}</li>`
    list.querySelectorAll('.board-name').forEach((el, i) => { el.textContent = board[i].name })
  }

  private renderHint(): void {
    const el = this.q('.hint')
    if (!this.hintKey) { el.classList.remove('is-active'); return }
    const method = this.input.method === 'gamepad' ? 'gamepad' : this.input.method === 'touch' ? 'touch' : 'keyboard'
    el.textContent = this.i18n.t(`hint.${this.hintKey}.${method}`)
    el.classList.add('is-active')
  }

  private onClick(e: MouseEvent): void {
    const target = (e.target as HTMLElement).closest<HTMLElement>('[data-action], .toggle, .seg button')
    if (!target) return
    this.audio.unlock()
    if (target.matches('.toggle')) {
      const key = target.dataset.setting as 'muted' | 'invertY' | 'reducedMotion'
      this.actions.settings({ [key]: !this.save.data[key] })
      this.refreshSettings()
      return
    }
    if (target.matches('.seg button')) {
      this.actions.settings({ quality: target.dataset.value as Quality })
      this.refreshSettings()
      return
    }
    switch (target.dataset.action) {
      case 'play': this.actions.play(); break
      case 'resume': this.actions.resume(); break
      case 'restart': this.actions.restart(); break
      case 'quit': this.actions.quit(); break
      case 'settings': this.push('settings'); break
      case 'leaderboard': this.push('leaderboard'); break
      case 'back': this.back(); break
      case 'save-score': this.saveScore(); break
      case 'pause': window.dispatchEvent(new CustomEvent('game:pause')); break
    }
  }

  private onInput(e: Event): void {
    const el = e.target as HTMLInputElement
    if (el.type === 'range') this.actions.settings({ [el.name]: Number(el.value) } as Partial<SaveData>)
  }

  private onKey(e: KeyboardEvent): void {
    if (this.screen === 'hud' || this.screen === 'boot') return
    if (e.code === 'Escape' && this.screen !== 'title') { e.preventDefault(); this.back() }
  }

  private translate(): void {
    for (const el of this.root.querySelectorAll<HTMLElement>('[data-i18n]')) el.textContent = this.i18n.t(el.dataset.i18n!)
    for (const el of this.root.querySelectorAll<HTMLInputElement>('[data-i18n-placeholder]')) el.placeholder = this.i18n.t(el.dataset.i18nPlaceholder!)
    this.renderHint()
    if (this.screen === 'leaderboard') this.renderLeaderboard()
    document.title = this.i18n.t('game.title')
  }

  private setScreen(screen: Screen): void {
    this.screen = screen
    for (const el of this.root.querySelectorAll<HTMLElement>('[data-screen]')) {
      const active = el.dataset.screen === screen || (el.dataset.screen === 'hud' && (screen === 'pause' || screen === 'results'))
      el.classList.toggle('is-active', active)
      el.setAttribute('aria-hidden', String(!active))
    }
    this.root.dataset.activeScreen = screen
    if (screen === 'leaderboard') this.renderLeaderboard()
  }

  private set(slot: string, value: string): void { this.q(`[data-slot="${slot}"]`).innerHTML = value }
  private q<T extends HTMLElement = HTMLElement>(selector: string): T { return this.root.querySelector<T>(selector)! }
  private qa<T extends HTMLElement = HTMLElement>(selector: string): T[] { return [...this.root.querySelectorAll<T>(selector)] }

  private template(): string {
    const range = (name: string, label: string, min: number, max: number, step: number) => `<label class="row"><span data-i18n="${label}"></span><input data-nav type="range" name="${name}" min="${min}" max="${max}" step="${step}"></label>`
    return `
<section class="screen screen-boot is-active" data-screen="boot"><div class="boot-logo" data-i18n="game.title"></div><div class="boot-bar"><i></i></div><div class="boot-label" data-i18n="boot.loading"></div></section>
<section class="screen screen-title" data-screen="title"><div class="title-block"><div class="logo"><span class="logo-mark">◈</span><h1 class="logo-text" data-i18n="game.title"></h1></div><p class="tagline" data-i18n="game.tagline"></p><nav class="menu"><button data-nav class="btn btn-primary" data-action="play" data-i18n="menu.play"></button><button data-nav class="btn" data-action="leaderboard" data-i18n="menu.leaderboard"></button><button data-nav class="btn" data-action="settings" data-i18n="menu.settings"></button></nav></div><footer class="bottom-bar">WASD · МИША · ЛКМ / SPACE</footer></section>
<section class="screen screen-hud" data-screen="hud"><div class="hurt-vignette"></div><div class="popups"></div><div class="hud-top"><div class="hud-brand">ARENA LAB / CALIBRATION BAY</div><button class="hud-pause" data-action="pause">Ⅱ</button></div><div class="hud-stats"><div class="hud-timer"><small data-i18n="hud.timer"></small><b data-slot="timer">1:30</b></div><div><small data-i18n="hud.targets"></small><b data-slot="targets">12<em>/12</em></b></div><div><small data-i18n="hud.hits"></small><b data-slot="hits">0</b></div><div><small data-i18n="hud.misses"></small><b data-slot="misses">0</b></div><div><small data-i18n="hud.accuracy"></small><b data-slot="accuracy">0%</b></div><div><small data-i18n="hud.score"></small><b data-slot="score">0</b></div></div><div class="crosshair"><i></i></div><div class="hint"></div><div class="touch"><div class="touch-stick"><i></i></div><button class="touch-btn touch-fire" data-touch="fire" data-i18n="touch.fire"></button></div></section>
<section class="screen screen-pause screen-modal" data-screen="pause"><div class="modal"><h2 data-i18n="pause.title"></h2><nav class="menu"><button data-nav class="btn btn-primary" data-action="resume" data-i18n="menu.continue"></button><button data-nav class="btn" data-action="restart" data-i18n="menu.restart"></button><button data-nav class="btn" data-action="settings" data-i18n="menu.settings"></button><button data-nav class="btn" data-action="quit" data-i18n="menu.quit"></button></nav></div></section>
<section class="screen screen-settings screen-modal" data-screen="settings"><div class="modal modal-wide"><h2 data-i18n="settings.title"></h2><div class="settings-grid"><fieldset><legend data-i18n="settings.audio"></legend>${range('musicVolume', 'settings.music', 0, 1, 0.05)}${range('sfxVolume', 'settings.sfx', 0, 1, 0.05)}<button data-nav class="toggle" data-setting="muted"><span data-i18n="settings.mute"></span><i></i><b></b></button></fieldset><fieldset><legend data-i18n="settings.controls"></legend>${range('sensitivity', 'settings.sensitivity', 0.2, 3, 0.1)}<button data-nav class="toggle" data-setting="invertY"><span data-i18n="settings.invertY"></span><i></i><b></b></button></fieldset><fieldset><legend data-i18n="settings.display"></legend><div class="row"><span data-i18n="settings.quality"></span><div class="seg" data-setting="quality"><button data-nav data-value="low" data-i18n="settings.quality.low"></button><button data-nav data-value="medium" data-i18n="settings.quality.medium"></button><button data-nav data-value="high" data-i18n="settings.quality.high"></button></div></div><button data-nav class="toggle" data-setting="reducedMotion"><span data-i18n="settings.reducedMotion"></span><i></i><b></b></button></fieldset></div><button data-nav class="btn" data-action="back" data-i18n="menu.back"></button></div></section>
<section class="screen screen-leaderboard screen-modal" data-screen="leaderboard"><div class="modal"><h2 data-i18n="leaderboard.title"></h2><p class="online-state" data-i18n="leaderboard.offline"></p><ol class="board"></ol><button data-nav class="btn" data-action="back" data-i18n="menu.back"></button></div></section>
<section class="screen screen-results screen-modal" data-screen="results"><div class="modal"><div class="results-kicker">CALIBRATION REPORT / 01</div><h2 class="results-title" data-i18n="results.won"></h2><div class="results-table"><div><span data-i18n="results.targets"></span><b class="r-targets"></b></div><div><span data-i18n="results.hits"></span><b class="r-hits"></b></div><div><span data-i18n="results.misses"></span><b class="r-misses"></b></div><div><span data-i18n="results.accuracy"></span><b class="r-accuracy"></b></div><div><span data-i18n="results.time"></span><b class="r-time"></b></div><div class="total"><span data-i18n="results.total"></span><b class="r-total"></b></div></div><div class="results-save"><input data-nav class="results-name" type="text" maxlength="16" data-i18n-placeholder="results.name"><button data-nav class="btn btn-small" data-action="save-score" data-i18n="results.save"></button><span class="results-rank"></span></div><nav class="menu menu-row"><button data-nav class="btn btn-primary" data-action="restart" data-i18n="results.retry"></button><button data-nav class="btn" data-action="quit" data-i18n="results.title"></button></nav></div></section>`
  }
}
