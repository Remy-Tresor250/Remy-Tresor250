// Builds a compact Africa outline (with Rwanda isolated) used by the particle morph.
import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { feature } from 'topojson-client'

const require = createRequire(import.meta.url)
const topo = require('world-atlas/countries-110m.json')

const AFRICA = new Set([
  'Algeria','Angola','Benin','Botswana','Burkina Faso','Burundi','Cameroon','Central African Rep.','Chad',
  'Comoros','Congo','Dem. Rep. Congo',"Côte d'Ivoire",'Djibouti','Egypt','Eq. Guinea','Eritrea','eSwatini','Ethiopia',
  'Gabon','Gambia','Ghana','Guinea','Guinea-Bissau','Kenya','Lesotho','Liberia','Libya','Madagascar','Malawi','Mali',
  'Mauritania','Mauritius','Morocco','Mozambique','Namibia','Niger','Nigeria','Rwanda','São Tomé and Principe','Senegal',
  'Seychelles','Sierra Leone','Somalia','Somaliland','South Africa','S. Sudan','Sudan','Tanzania','Togo','Tunisia','Uganda',
  'W. Sahara','Zambia','Zimbabwe',
])

const fc = feature(topo, topo.objects.countries)
const project = ([lon, lat]) => [lon, lat * 1.08]
const africa = []
let rwanda = []
const seen = new Set()
for (const f of fc.features) {
  const name = f.properties.name
  if (!AFRICA.has(name)) continue
  seen.add(name)
  const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates
  for (const poly of polys) {
    const ring = poly[0].map(project)
    if (ring.length < 4) continue
    africa.push(ring)
    if (name === 'Rwanda') rwanda.push(ring)
  }
}
const missing = [...AFRICA].filter((n) => !seen.has(n))
if (missing.length) console.warn('not found:', missing.join(', '))

// normalise to [-1, 1] on the longest axis, centred
let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
for (const r of africa) for (const [x, y] of r) {
  minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y)
}
const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2, s = 2 / Math.max(maxX - minX, maxY - minY)
const norm = (r) => r.map(([x, y]) => [+((x - cx) * s).toFixed(3), +((y - cy) * s).toFixed(3)])
const out = { africa: africa.map(norm), rwanda: rwanda.map(norm) }
writeFileSync('public/data/africa.json', JSON.stringify(out))
console.log('rings', out.africa.length, 'bytes', JSON.stringify(out).length)
