import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright'
const port = 4300 + Math.floor(Math.random() * 400)
const url = `http://127.0.0.1:${port}/`
const out = process.env.SHOTS_DIR ?? 'shots'
mkdirSync(out, { recursive: true })
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--port', String(port), '--strictPort', '--host', '127.0.0.1'], { stdio: 'ignore' })
let browser
const errors = []
const cleanup = () => { try { server.kill('SIGTERM') } catch {} }
async function waitForServer() { for (let i = 0; i < 60; i++) { try { if ((await fetch(url)).ok) return } catch {} await new Promise(r => setTimeout(r, 250)) } throw new Error('preview server did not start') }
async function state(page) { return page.evaluate(() => { const { game } = window.__game; const p = game.player.root.position; return { mode: game.mode, run: game.run, pos: { x: p.x, y: p.y, z: p.z } } }) }
try {
  await waitForServer()
  browser = await chromium.launch({ args: ['--ignore-gpu-blocklist'] }).catch(() => chromium.launch({ args: ['--ignore-gpu-blocklist'], channel: 'chrome' }))
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, locale: 'uk-UA' })
  const page = await context.newPage()
  page.on('console', m => m.type() === 'error' && errors.push(m.text()))
  page.on('pageerror', e => errors.push(String(e)))
  page.on('response', r => r.status() >= 400 && errors.push(`HTTP ${r.status()} ${r.url()}`))
  await page.goto(url)
  await page.waitForSelector('[data-screen="title"].is-active', { timeout: 30000 })
  await page.screenshot({ path: `${out}/01-title.png` })
  await page.click('[data-action="play"]')
  await page.waitForSelector('[data-screen="hud"].is-active')
  const before = await state(page)
  await page.keyboard.down('KeyW')
  await page.waitForTimeout(1200)
  await page.keyboard.press('Space')
  await page.waitForTimeout(500)
  await page.keyboard.up('KeyW')
  const after = await state(page)
  if (after.mode !== 'playing') throw new Error(`expected playing, got ${after.mode}`)
  if (!(after.run.timeLeft < before.run.timeLeft)) throw new Error('clock did not run')
  if (Math.hypot(after.pos.x - before.pos.x, after.pos.z - before.pos.z) < 0.2) throw new Error('player did not move')
  if (after.run.shots < 1) throw new Error('fire input did not register')
  await page.screenshot({ path: `${out}/02-gameplay.png` })
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('game:pause')))
  await page.waitForSelector('[data-screen="pause"].is-active')
  await page.click('[data-screen="pause"] [data-action="settings"]')
  await page.waitForSelector('[data-screen="settings"].is-active')
  await page.click('[data-screen="settings"] [data-action="back"]')
  await page.waitForSelector('[data-screen="pause"].is-active')
  await page.click('[data-screen="pause"] [data-action="quit"]')
  await page.waitForSelector('[data-screen="title"].is-active')
  await page.screenshot({ path: `${out}/03-title-after-quit.png` })
  if (errors.length) throw new Error(`console errors:\n  ${errors.join('\n  ')}`)
  await browser.close(); cleanup(); console.log(`smoke: OK — screenshots in ${out}/`)
} catch (err) { console.error(`smoke: FAIL — ${err?.message ?? err}`); await browser?.close().catch(() => {}); cleanup(); process.exit(1) }
