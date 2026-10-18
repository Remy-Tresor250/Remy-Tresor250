// QA helper: enters with sound, opens a case study, steps through it.
import { chromium } from 'playwright-core'
const out = process.argv[2] || 'qa'
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'],
})
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const logs = []
page.on('console', (m) => m.type() !== 'log' && logs.push(`[${m.type()}] ${m.text()}`))
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`))
await page.goto('http://localhost:4173/')
await page.getByText('Enter with sound').click({ timeout: 90000 })
await page.waitForTimeout(3000)
await page.addStyleTag({ content: '.cursor-ring,.cursor-dot{display:none!important}' })
const sound = await page.locator('.sound .mono').textContent()
await page.evaluate(() => document.querySelector('[data-chapter="4"]').scrollIntoView())
await page.waitForTimeout(2500)
const y = await page.evaluate(() => { const r = document.querySelector('.work-pin').getBoundingClientRect(); return r.top + scrollY })
await page.evaluate((y) => window.scrollTo(0, y + 600), y)
await page.waitForTimeout(3000)
await page.locator('.card-link').nth(1).click({ force: true })
await page.waitForTimeout(2500)
await page.screenshot({ path: `${out}/case-1.png` })
await page.locator('.cs-body').evaluate((el) => el.scrollTo(0, 1100))
await page.waitForTimeout(1200)
await page.screenshot({ path: `${out}/case-2.png` })
await page.keyboard.press('ArrowRight')
await page.waitForTimeout(1800)
const name = await page.locator('.cs-name').textContent()
await page.keyboard.press('Escape')
await page.waitForTimeout(1500)
const closed = await page.locator('.case').count()
console.log({ sound, nextCase: name, overlayAfterEsc: closed })
console.log(logs.filter((l) => !l.includes('preload') && !l.includes('THREE.Clock')).join('\n') || 'no warnings/errors')
await browser.close()
