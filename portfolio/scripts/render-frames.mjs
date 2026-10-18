// Renders scripts/frames/index.html into project stills (webp) and seamless 8s loops (mp4).
// usage: node scripts/render-frames.mjs <assets-dir> [slug...] [--no-video]
import { chromium } from 'playwright-core'
import { cpSync, mkdirSync, rmSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import sharp from 'sharp'

const [assets, ...rest] = process.argv.slice(2)
const noVideo = rest.includes('--no-video')
const slugs = rest.filter((a) => !a.startsWith('--'))
const ALL = ['libblio', 'collis', 'claire', 'sorano', 'lala', 'quantaledger', 'accountabills', 'tujyane', 'uwera']
const list = slugs.length ? slugs : ALL

const work = resolve(assets, '..')
cpSync('scripts/frames/index.html', `${work}/index.html`)
mkdirSync(`${work}/fonts`, { recursive: true })
const fonts = {
  'inter-tight.woff2': '@fontsource-variable/inter-tight/files/inter-tight-latin-wght-normal.woff2',
  'instrument-serif.woff2': '@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff2',
  'instrument-serif-italic.woff2': '@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff2',
  'jetbrains-mono.woff2': '@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2',
}
for (const [k, v] of Object.entries(fonts)) cpSync(`node_modules/${v}`, `${work}/fonts/${k}`)

const out = 'public/media/frames'
mkdirSync(out, { recursive: true })
const browser = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } })

const seek = (t) =>
  page.evaluate((ms) => {
    for (const a of document.getAnimations()) { a.pause(); a.currentTime = ms }
  }, t)

for (const slug of list) {
  await page.goto('about:blank')
  await page.goto(`file://${work}/index.html#${slug}`)
  await page.waitForFunction(() => document.title === 'ready', null, { timeout: 30000 })
  await seek(2600)
  const png = await page.screenshot({ type: 'png' })
  await sharp(png).webp({ quality: 84, effort: 6 }).toFile(`${out}/${slug}.webp`)
  await sharp(png).resize(800).webp({ quality: 70 }).toFile(`${out}/${slug}-sm.webp`)
  console.log('still', slug)

  if (noVideo) continue
  const tmp = `${work}/seq-${slug}`
  rmSync(tmp, { recursive: true, force: true })
  mkdirSync(tmp)
  const fps = 24, seconds = 8
  // hide the static grain for the video: it is re-applied in WebGL and kills compression
  await page.addStyleTag({ content: '.grain::after{display:none}' })
  for (let i = 0; i < fps * seconds; i++) {
    await seek((i / fps) * 1000)
    await page.screenshot({ path: `${tmp}/${String(i).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 92 })
  }
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', `${tmp}/%04d.jpg`,
    '-vf', 'scale=1120:700:flags=lanczos', '-c:v', 'libx264', '-preset', 'slow', '-crf', '27', '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart', '-an', `${out}/${slug}.mp4`])
  rmSync(tmp, { recursive: true, force: true })
  console.log('video', slug)
}
await browser.close()
if (!existsSync(out)) process.exit(1)
