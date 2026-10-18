// QA helper: walks the story in headless Chromium and screenshots each stop.
// usage: node scripts/qa-shots.mjs <outDir> [width] [height]
import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'
const [out = 'qa', w = '1440', h = '900'] = process.argv.slice(2)
mkdirSync(out, { recursive: true })
const browser = await chromium.launch({
  executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'],
})
const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 })
const logs = []
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`))
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`))
await page.goto(process.env.URL || 'http://localhost:4173/', { waitUntil: 'load' })
await page.waitForTimeout(1500)
await page.screenshot({ path: `${out}/00-preloader.png` })
await page.getByText('Enter in silence').click({ timeout: 90000 })
await page.addStyleTag({ content: '.cursor-ring,.cursor-dot{display:none!important}' })
await page.mouse.move(+w * 0.7, +h * 0.45)
await page.waitForTimeout(+(process.env.HERO_WAIT || 4500))
await page.screenshot({ path: `${out}/01-hero.png` })
const total = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight)
const stops = (process.env.STOPS || '0.04,0.08,0.12,0.17,0.22,0.27,0.32,0.38,0.44,0.5,0.56,0.62,0.68,0.74,0.8,0.86,0.92,1').split(',').map(Number)
let i = 2
for (const s of stops) {
  await page.evaluate((y) => window.scrollTo(0, y), Math.round(total * s))
  await page.waitForTimeout(+(process.env.WAIT || 2600))
  await page.screenshot({ path: `${out}/${String(i++).padStart(2, '0')}-at-${s}.png` })
}
console.log('scrollHeight', total)
console.log(logs.slice(0, 40).join('\n'))
await browser.close()
