// One-off: turns the raw portrait sources into web-ready assets in public/img.
import sharp from 'sharp'
const src = process.argv[2]
const out = 'public/img'
const jobs = [
  ['1.jpg', 'rewind-1985', 1086, 82],
  ['modern_crop.jpg', 'rewind-today', 1086, 82],
  ['2_cut_isnet-general-use.png', 'portrait-cut', 1100, 88, true],
  ['2.jpg', 'portrait-studio', 1400, 80],
  ['3.jpg', 'award', 1400, 80],
  ['IMG_0621.png', 'desk', 1800, 78],
  ['IMG_0153.png', 'outro', 1600, 78],
  ['IMG_0152_cut_isnet-general-use.png', 'outro-cut', 1200, 85, true],
]
for (const [file, name, w, q, alpha] of jobs) {
  const img = sharp(`${src}/${file}`).resize({ width: w, withoutEnlargement: true })
  await img.clone().webp({ quality: q, alphaQuality: 90, effort: 6 }).toFile(`${out}/${name}.webp`)


  const m = await sharp(`${out}/${name}.webp`).metadata()
  console.log(name, m.width + 'x' + m.height)
}
