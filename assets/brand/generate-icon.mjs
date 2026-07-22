// Dot-matrix C icon for Curie — Nothing-style LED glyph
// Transparent canvas + macOS-style squircle plate so Dock looks native
// even when the system mask is not applied (common in tauri dev).

import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const SIZE = 1024
const BG = '#000000'
const FG = '#FFFFFF'
const ACCENT = '#D71921'

// Logical LED grid. 1 = white, 2 = red accent, 0 = empty
const GRID = [
  [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
  [1, 1, 1, 0, 0, 0, 0, 1, 1, 1],
  [1, 1, 0, 0, 0, 0, 0, 0, 1, 1],
  [1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
  [1, 1, 0, 0, 0, 0, 0, 0, 2, 0],
  [1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
  [1, 1, 0, 0, 0, 0, 0, 0, 1, 1],
  [1, 1, 1, 0, 0, 0, 0, 1, 1, 1],
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
  [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
]

const rows = GRID.length
const cols = GRID[0].length

// Glyph sits inside the plate with safe margin (Apple ~10%+ content inset)
const pad = SIZE * 0.2
const area = SIZE - pad * 2
const cell = area / Math.max(cols, rows)
const dotR = cell * 0.34
const gridW = cols * cell
const gridH = rows * cell
const ox = (SIZE - gridW) / 2 + cell / 2
const oy = (SIZE - gridH) / 2 + cell / 2

/** Superellipse (squircle) path — closer to macOS continuous corners than rx/ry. */
function squirclePath(size, n = 5, samples = 128) {
  const a = size / 2
  const b = size / 2
  const cx = size / 2
  const cy = size / 2
  const pts = []
  for (let i = 0; i <= samples; i++) {
    const t = (i / samples) * Math.PI * 2
    const c = Math.cos(t)
    const s = Math.sin(t)
    const x = cx + a * Math.sign(c) * Math.abs(c) ** (2 / n)
    const y = cy + b * Math.sign(s) * Math.abs(s) ** (2 / n)
    pts.push([x, y])
  }
  let d = `M ${pts[0][0].toFixed(2)} ${pts[0][1].toFixed(2)}`
  for (let i = 1; i < pts.length; i++) {
    d += ` L ${pts[i][0].toFixed(2)} ${pts[i][1].toFixed(2)}`
  }
  return `${d} Z`
}

const maskPath = squirclePath(SIZE, 5)

const circles = []
for (let y = 0; y < rows; y++) {
  for (let x = 0; x < cols; x++) {
    const v = GRID[y][x]
    if (!v) continue
    const cx = (ox + x * cell).toFixed(2)
    const cy = (oy + y * cell).toFixed(2)
    const fill = v === 2 ? ACCENT : FG
    circles.push(
      `    <circle cx="${cx}" cy="${cy}" r="${dotR.toFixed(2)}" fill="${fill}"/>`,
    )
  }
}

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}" fill="none">
  <defs>
    <clipPath id="plate">
      <path d="${maskPath}"/>
    </clipPath>
  </defs>
  <!-- Transparent outside the plate so Dock/macOS mask look native -->
  <g clip-path="url(#plate)">
    <rect width="${SIZE}" height="${SIZE}" fill="${BG}"/>
${circles.join('\n')}
  </g>
</svg>
`

const dir = dirname(fileURLToPath(import.meta.url))
const out = join(dir, 'curie-icon.svg')
writeFileSync(out, svg)
console.log(`wrote ${out}`)
console.log(`dots: ${circles.length}, cell=${cell.toFixed(1)}, r=${dotR.toFixed(1)}`)
