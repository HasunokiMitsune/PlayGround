// Hand-built pixel-flavoured creature sprites, drawn on an 80x80 offscreen canvas.
// Keeping the source small and upscaling nearest-neighbour gives a chunky,
// DS-era sprite feel without shipping any image assets.

import { BRANCHES } from './data.js'

const INK = '#3f4b3a'
const INK_SOFT = '#5b6a52'

const SKIN = {
  baby: { body: '#c6e9ab', bodyDark: '#9dcd87', belly: '#eaf7d9', line: '#43513c' },
  child: { body: '#b0dc93', bodyDark: '#84bd78', belly: '#dff1c8', line: '#3f4f38' }
}

export function drawCreature(ctx, opts) {
  const { stage = 'baby', branch = 'verdant', mood = 'idle', t = 0, eggProgress = 0, seed = 0 } = opts
  ctx.clearRect(0, 0, 80, 80)
  ctx.save()
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'

  if (stage === 'egg') {
    drawEgg(ctx, t, eggProgress)
    ctx.restore()
    return
  }

  const adult = stage === 'adult'
  const data = adult ? BRANCHES[branch] || BRANCHES.verdant : SKIN[stage] || SKIN.baby
  const body = adult ? data.body : data.body
  const bodyDark = adult ? data.bodyDark : data.bodyDark
  const belly = adult ? data.belly : data.belly
  const line = adult ? INK : data.line || INK
  const leaf = adult ? data.leaf : '#64ae68'
  const leafDark = adult ? data.leafDark : '#438850'
  const accent = adult ? data.accent : '#f2c85b'
  const accentDark = adult ? data.accentDark : '#d69c3e'
  const cheek = adult && branch === 'lumen' ? 'rgba(228,168,196,.55)' : 'rgba(240,146,160,.62)'

  const sleeping = mood === 'sleep'
  const sick = mood === 'sick'
  const sad = mood === 'sad'
  const happy = mood === 'happy' || mood === 'love' || mood === 'clean' || mood === 'eat'

  const breathe = sleeping ? Math.sin(t * 1.15) * 0.012 : Math.sin(t * 2.1) * 0.012
  const sway = Math.sin(t * 1.6 + seed) * (sleeping ? 0.03 : 0.09)
  const twitch = sick ? Math.sin(t * 17) * 0.35 : 0

  // Anchor squash-and-stretch at the feet.
  ctx.translate(40 + twitch, 69)
  ctx.scale(1 - breathe * 0.6, 1 + breathe)
  ctx.translate(-40, -69)

  const dims = adult
    ? { cx: 40, cy: 45.5, rx: 20.5, ry: 20.5, eyeY: 43.5, eyeDx: 8.4, eyeR: 4.7 }
    : stage === 'child'
      ? { cx: 40, cy: 46.5, rx: 18.6, ry: 18.2, eyeY: 44, eyeDx: 7.8, eyeR: 4.5 }
      : { cx: 40, cy: 49, rx: 16.8, ry: 15.8, eyeY: 47, eyeDx: 7.2, eyeR: 4.3 }

  // ---- behind-the-body pieces -------------------------------------------
  ctx.save()
  ctx.translate(40, 66)
  ctx.rotate(sway)
  ctx.translate(-40, -66)

  if (adult) {
    drawAdultBack(ctx, branch, t, leaf, leafDark, accent, accentDark, line)
  } else if (stage === 'child') {
    // A little vine tail.
    ctx.strokeStyle = leafDark
    ctx.lineWidth = 2.2
    ctx.beginPath()
    ctx.moveTo(57, 52)
    ctx.bezierCurveTo(65, 51 + Math.sin(t * 2) * 1.4, 66, 57, 62, 59)
    ctx.stroke()
    leafShape(ctx, 61.5, 58.5, 6.5, 3.4, 1.9 + Math.sin(t * 2) * 0.1, leaf, leafDark, line, 1.4)
  }

  // Back leaves
  if (stage === 'baby') {
    leafShape(ctx, 38.5, 33.5, 11, 4.7, sway + 0.22, leaf, leafDark, line, 1.8)
  } else {
    leafShape(ctx, 37, 30.5, 13.5, 5.2, sway * 1.2 - 0.34, leaf, leafDark, line, 1.9)
    leafShape(ctx, 43, 31, 11.5, 4.5, sway * 1.2 + 0.46, leaf, leafDark, line, 1.8)
  }

  // ---- body --------------------------------------------------------------
  ctx.beginPath()
  ctx.ellipse(dims.cx, dims.cy, dims.rx, dims.ry, 0, 0, Math.PI * 2)
  ctx.fillStyle = body
  ctx.fill()

  // Soft lower shading, clipped inside the body.
  ctx.save()
  ctx.clip()
  ctx.globalAlpha = 0.55
  ctx.fillStyle = bodyDark
  ctx.beginPath()
  ctx.ellipse(dims.cx + 1, dims.cy + dims.ry * 0.72, dims.rx * 1.15, dims.ry * 0.72, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 0.45
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.ellipse(dims.cx - dims.rx * 0.38, dims.cy - dims.ry * 0.6, dims.rx * 0.4, dims.ry * 0.24, -0.5, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 0.16
  ctx.fillStyle = bodyDark
  const spots = adult ? 4 : stage === 'child' ? 3 : 2
  for (let i = 0; i < spots; i++) {
    const a = -0.9 + i * 0.62
    ctx.beginPath()
    ctx.ellipse(dims.cx + Math.cos(a) * dims.rx * 0.62, dims.cy - dims.ry * 0.38 + Math.sin(a) * 4, 2.1, 1.5, a, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()

  // Belly patch
  ctx.globalAlpha = 0.92
  ctx.fillStyle = belly
  ctx.beginPath()
  ctx.ellipse(dims.cx, dims.cy + dims.ry * 0.34, dims.rx * 0.58, dims.ry * 0.5, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1

  // Body outline
  ctx.strokeStyle = line
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.ellipse(dims.cx, dims.cy, dims.rx, dims.ry, 0, 0, Math.PI * 2)
  ctx.stroke()

  // Feet
  const footY = 66.5
  const footSpread = adult ? 10 : stage === 'child' ? 9 : 8
  drawFoot(ctx, 40 - footSpread, footY, body, line, adult ? 3.7 : 3.2)
  drawFoot(ctx, 40 + footSpread, footY, body, line, adult ? 3.7 : 3.2)

  // Arms
  const armY = adult ? 49 : stage === 'child' ? 50 : 52
  const armSpread = adult ? 21 : stage === 'child' ? 19 : 17
  ctx.strokeStyle = line
  ctx.lineWidth = adult ? 2.2 : 2
  ctx.fillStyle = body
  ctx.beginPath()
  ctx.ellipse(40 - armSpread, armY + Math.sin(t * 2.1) * 1, adult ? 4.9 : 3.9, adult ? 3.5 : 3, -0.5, 0, Math.PI * 2)
  ctx.fill(); ctx.stroke()
  ctx.beginPath()
  ctx.ellipse(40 + armSpread, armY - Math.sin(t * 2.1) * 1, adult ? 4.9 : 3.9, adult ? 3.5 : 3, 0.5, 0, Math.PI * 2)
  ctx.fill(); ctx.stroke()

  // Cheeks
  if (!sleeping) {
    ctx.fillStyle = cheek
    ctx.beginPath(); ctx.ellipse(dims.cx - dims.eyeDx - 2.2, dims.eyeY + 7.4, 3.1, 2.1, 0, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.ellipse(dims.cx + dims.eyeDx + 2.2, dims.eyeY + 7.4, 3.1, 2.1, 0, 0, Math.PI * 2); ctx.fill()
  }

  // Face
  const blinkCycle = (t + seed * 0.7) % 4.7
  const blink = blinkCycle < 0.12 || (blinkCycle > 4.35 && blinkCycle < 4.45)
  drawEyes(ctx, dims.cx, dims.eyeY, dims.eyeDx, dims.eyeR, { mood, blink, line, accent })
  drawMouth(ctx, dims.cx, dims.eyeY + 8.2, mood, line, accent)

  // ---- crest -------------------------------------------------------------
  ctx.save()
  ctx.translate(40, 34)
  ctx.rotate(sway * 0.55)
  ctx.translate(-40, -34)
  if (adult) {
    drawAdultCrown(ctx, branch, t, leaf, leafDark, accent, accentDark, line)
  } else if (stage === 'child') {
    // central sprout stem
    ctx.strokeStyle = leafDark
    ctx.lineWidth = 2.2
    ctx.beginPath(); ctx.moveTo(40, 34); ctx.quadraticCurveTo(40, 28, 41, 25); ctx.stroke()
    leafShape(ctx, 41, 25.5, 8.5, 4.4, sway - 0.15, leaf, leafDark, line, 1.7)
  } else {
    ctx.strokeStyle = leafDark
    ctx.lineWidth = 2
    ctx.beginPath(); ctx.moveTo(39, 37); ctx.quadraticCurveTo(38, 32, 38.5, 28); ctx.stroke()
    leafShape(ctx, 38.5, 28, 8.8, 4.4, sway + 0.2, leaf, leafDark, line, 1.7)
  }
  ctx.restore()

  // Small sick sweat drop
  if (sick) {
    ctx.fillStyle = '#b8dcec'
    ctx.strokeStyle = '#7faec4'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.ellipse(59, 34 + Math.sin(t * 3) * 1.5, 2.2, 3.2, 0.2, 0, Math.PI * 2)
    ctx.fill(); ctx.stroke()
  }

  // Sparkle of health when happy
  if (happy && !sleeping) {
    const s = 0.5 + Math.sin(t * 4) * 0.5
    ctx.globalAlpha = 0.55 + s * 0.35
    ctx.fillStyle = '#fff7cf'
    star(ctx, 58, 28.5, 2.1, 0.9, 4)
    ctx.globalAlpha = 1
  }

  ctx.restore()
}

function drawEgg(ctx, t, progress) {
  const wobble = Math.sin(t * 3.4) * 0.018 * (0.4 + progress)
  ctx.save()
  ctx.translate(40, 70)
  ctx.rotate(wobble)
  ctx.translate(-40, -70)

  // shadow under the egg
  ctx.fillStyle = 'rgba(74,58,43,.16)'
  ctx.beginPath(); ctx.ellipse(40, 71.5, 18, 3.4, 0, 0, Math.PI * 2); ctx.fill()

  ctx.beginPath()
  ctx.ellipse(40, 44, 20, 26, 0, 0, Math.PI * 2)
  const g = ctx.createLinearGradient(24, 20, 54, 68)
  g.addColorStop(0, '#fffaf0')
  g.addColorStop(0.55, '#f6e8ce')
  g.addColorStop(1, '#e9d2b1')
  ctx.fillStyle = g
  ctx.fill()
  ctx.strokeStyle = '#8c6d4d'
  ctx.lineWidth = 2.4
  ctx.stroke()

  // spot clusters
  const spots = [
    [32, 35, 4.2, 3.1, -0.3], [47, 41, 3.1, 2.4, 0.35], [36, 55, 3.6, 2.6, 0.2],
    [51, 54, 2.4, 1.8, -0.2], [29, 47, 2.2, 1.6, 0.5]
  ]
  spots.forEach(([x, y, rx, ry, a], i) => {
    ctx.fillStyle = i % 2 ? '#a8cd8b' : '#b9d99d'
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, a, 0, Math.PI * 2); ctx.fill()
  })

  // highlight
  ctx.globalAlpha = 0.65
  ctx.fillStyle = '#fffdf7'
  ctx.beginPath(); ctx.ellipse(32, 30, 5.2, 8.2, -0.45, 0, Math.PI * 2); ctx.fill()
  ctx.globalAlpha = 1

  // cracks appear as the egg warms
  if (progress > 0.15) {
    ctx.strokeStyle = '#8c6d4d'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(47, 22); ctx.lineTo(44, 28); ctx.lineTo(48, 32); ctx.lineTo(45, 36)
    ctx.stroke()
  }
  if (progress > 0.55) {
    ctx.beginPath()
    ctx.moveTo(33, 58); ctx.lineTo(37, 53); ctx.lineTo(34, 48); ctx.lineTo(38, 44)
    ctx.stroke()
  }
  if (progress > 0.85) {
    ctx.beginPath()
    ctx.moveTo(39, 38); ctx.lineTo(42, 41); ctx.lineTo(39, 45); ctx.lineTo(43, 48)
    ctx.stroke()
  }

  // a tiny leaf pressed into the shell
  ctx.save()
  ctx.translate(36, 26)
  ctx.rotate(-0.3)
  ctx.fillStyle = '#7dbb78'
  ctx.strokeStyle = '#5a9259'
  ctx.lineWidth = 1.2
  ctx.beginPath(); ctx.ellipse(0, 0, 4.4, 2.2, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
  ctx.restore()
  ctx.restore()
}

function drawAdultBack(ctx, branch, t, leaf, leafDark, accent, accentDark, line) {
  const sway = Math.sin(t * 1.6) * 0.08
  if (branch === 'zephyr') {
    // long leaf ears
    leafShape(ctx, 26, 31, 17, 5.2, -0.95 + sway, leaf, leafDark, line, 1.9)
    leafShape(ctx, 54, 31, 17, 5.2, 0.95 - sway, leaf, leafDark, line, 1.9)
    // star-tipped tail
    ctx.strokeStyle = leafDark; ctx.lineWidth = 2.2
    ctx.beginPath(); ctx.moveTo(58, 53); ctx.bezierCurveTo(68, 50, 69, 58, 64, 61); ctx.stroke()
    ctx.fillStyle = accent; ctx.strokeStyle = line; ctx.lineWidth = 1.4
    star(ctx, 64.5, 61.5, 4.2, 1.8, 4, true)
  } else if (branch === 'bloom') {
    // petal skirt / tail
    ctx.strokeStyle = accentDark; ctx.lineWidth = 2
    ctx.beginPath(); ctx.moveTo(56, 55); ctx.bezierCurveTo(64, 55, 65, 61, 60, 63); ctx.stroke()
    ctx.fillStyle = accent; ctx.strokeStyle = line; ctx.lineWidth = 1.4
    ctx.beginPath(); ctx.ellipse(60.5, 63, 5.2, 3.2, 0.35, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
    ctx.fillStyle = 'rgba(255,255,255,.5)'
    ctx.beginPath(); ctx.ellipse(59, 62, 1.8, 1, 0.35, 0, Math.PI * 2); ctx.fill()
  } else if (branch === 'lumen') {
    // glowing orbs
    ctx.globalAlpha = 0.7 + Math.sin(t * 2) * 0.18
    ctx.fillStyle = accent
    ctx.beginPath(); ctx.arc(23, 40 + Math.sin(t * 1.4) * 2, 2.4, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.arc(58, 36 + Math.cos(t * 1.2) * 2, 1.8, 0, Math.PI * 2); ctx.fill()
    ctx.globalAlpha = 1
    // tail curl
    ctx.strokeStyle = leafDark; ctx.lineWidth = 2
    ctx.beginPath(); ctx.moveTo(57, 56); ctx.bezierCurveTo(64, 53, 65, 60, 60, 62); ctx.stroke()
  } else {
    // vine tail with leaves
    ctx.strokeStyle = leafDark; ctx.lineWidth = 2.2
    ctx.beginPath(); ctx.moveTo(57, 54); ctx.bezierCurveTo(66, 52, 67, 59, 61, 62); ctx.stroke()
    leafShape(ctx, 61, 61.5, 8, 3.8, 0.75, leaf, leafDark, line, 1.5)
  }
}

function drawAdultCrown(ctx, branch, t, leaf, leafDark, accent, accentDark, line) {
  const bob = Math.sin(t * 1.4) * 1.2
  if (branch === 'bloom') {
    const petals = 5
    for (let i = 0; i < petals; i++) {
      const a = -Math.PI / 2 + (i / petals) * Math.PI * 2
      const x = 40 + Math.cos(a) * 7.4
      const y = 20 + bob + Math.sin(a) * 7.4
      ctx.fillStyle = accent
      ctx.strokeStyle = line
      ctx.lineWidth = 1.5
      ctx.beginPath(); ctx.ellipse(x, y, 4.4, 3.5, a, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
      ctx.fillStyle = 'rgba(255,255,255,.35)'
      ctx.beginPath(); ctx.ellipse(x - 1, y - 1, 1.6, 1.1, a, 0, Math.PI * 2); ctx.fill()
    }
    ctx.fillStyle = accentDark; ctx.strokeStyle = line; ctx.lineWidth = 1.4
    ctx.beginPath(); ctx.arc(40, 20 + bob, 4.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
    ctx.fillStyle = '#ffe9a1'
    ctx.beginPath(); ctx.arc(38.8, 18.8 + bob, 1.3, 0, Math.PI * 2); ctx.fill()
    // little leaves at the sides
    leafShape(ctx, 31, 26, 7, 3.2, -0.9, leaf, leafDark, line, 1.4)
    leafShape(ctx, 49, 26, 7, 3.2, 0.9, leaf, leafDark, line, 1.4)
  } else if (branch === 'zephyr') {
    // forehead star + tuft
    ctx.strokeStyle = leafDark; ctx.lineWidth = 2
    ctx.beginPath(); ctx.moveTo(40, 28); ctx.quadraticCurveTo(41, 24, 40, 21); ctx.stroke()
    ctx.fillStyle = accent; ctx.strokeStyle = line; ctx.lineWidth = 1.4
    star(ctx, 40, 19 + bob * 0.4, 4.6, 2.1, 4, true)
  } else if (branch === 'lumen') {
    // crescent halo, plus soft glow
    ctx.save()
    ctx.translate(40, 15 + bob)
    ctx.globalAlpha = 0.28
    ctx.fillStyle = accent
    ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI * 2); ctx.fill()
    ctx.globalAlpha = 1
    ctx.strokeStyle = accent; ctx.lineWidth = 3.1
    ctx.beginPath(); ctx.arc(0, 0, 6.3, 0.5, Math.PI * 1.8); ctx.stroke()
    ctx.strokeStyle = 'rgba(255,255,255,.65)'; ctx.lineWidth = 1
    ctx.beginPath(); ctx.arc(0, 0, 6.3, 0.6, Math.PI * 1.6); ctx.stroke()
    ctx.restore()
    leafShape(ctx, 31, 27, 7.4, 3.4, -0.8, leaf, leafDark, line, 1.4)
    leafShape(ctx, 49, 27, 7.4, 3.4, 0.8, leaf, leafDark, line, 1.4)
  } else {
    // a small crown of three leaves
    ctx.strokeStyle = leafDark; ctx.lineWidth = 2
    ctx.beginPath(); ctx.moveTo(36, 29); ctx.quadraticCurveTo(34, 23, 32, 19); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(40, 29); ctx.quadraticCurveTo(40, 21, 40, 17); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(44, 29); ctx.quadraticCurveTo(46, 23, 48, 19); ctx.stroke()
    leafShape(ctx, 32, 19.5, 9, 4.1, -0.45 + Math.sin(t * 1.5) * 0.05, leaf, leafDark, line, 1.6)
    leafShape(ctx, 40, 17.5, 10, 4.4, Math.sin(t * 1.5) * 0.06, leaf, leafDark, line, 1.6)
    leafShape(ctx, 48, 19.5, 9, 4.1, 0.45, leaf, leafDark, line, 1.6)
    // tiny berries
    ctx.fillStyle = accent; ctx.strokeStyle = line; ctx.lineWidth = 1.1
    ctx.beginPath(); ctx.arc(35, 25, 1.7, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
    ctx.beginPath(); ctx.arc(45.5, 25.5, 1.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
  }
}

function drawFoot(ctx, x, y, body, line, rx) {
  ctx.beginPath()
  ctx.ellipse(x, y, rx, 3, 0, 0, Math.PI * 2)
  ctx.fillStyle = body
  ctx.fill()
  ctx.strokeStyle = line
  ctx.lineWidth = 1.7
  ctx.stroke()
}

function drawEyes(ctx, cx, y, dx, r, { mood, blink, line, accent }) {
  const closedHappy = mood === 'happy' || mood === 'love' || mood === 'clean'
  const sleeping = mood === 'sleep'
  const sick = mood === 'sick'
  const sad = mood === 'sad'

  for (const side of [-1, 1]) {
    const x = cx + side * dx
    if (sleeping || blink || closedHappy) {
      ctx.strokeStyle = line
      ctx.lineWidth = 2.1
      ctx.beginPath()
      if (closedHappy && !blink && !sleeping) {
        ctx.arc(x, y + 1.5, r * 0.72, Math.PI * 1.12, Math.PI * 1.88)
      } else {
        ctx.arc(x, y - 1, r * 0.74, Math.PI * 0.12, Math.PI * 0.88)
      }
      ctx.stroke()
      if (sick) {
        ctx.beginPath()
        ctx.moveTo(x - r * 0.8, y - r * 0.8); ctx.lineTo(x + r * 0.8, y - r * 0.55)
        ctx.stroke()
      }
      continue
    }

    // eye white
    ctx.fillStyle = '#fffdf2'
    ctx.strokeStyle = line
    ctx.lineWidth = 1.6
    ctx.beginPath()
    ctx.ellipse(x, y, r, r * 1.12, 0, 0, Math.PI * 2)
    ctx.fill(); ctx.stroke()

    // pupil
    ctx.fillStyle = '#394437'
    ctx.beginPath()
    ctx.ellipse(x + side * 0.15, y + 0.35, r * 0.53, r * 0.68, 0, 0, Math.PI * 2)
    ctx.fill()

    // shine
    ctx.fillStyle = '#ffffff'
    ctx.beginPath(); ctx.arc(x - r * 0.28, y - r * 0.4, r * 0.24, 0, Math.PI * 2); ctx.fill()
    ctx.globalAlpha = 0.65
    ctx.beginPath(); ctx.arc(x + r * 0.34, y + r * 0.3, r * 0.12, 0, Math.PI * 2); ctx.fill()
    ctx.globalAlpha = 1

    if (sad) {
      ctx.strokeStyle = line
      ctx.lineWidth = 1.6
      ctx.beginPath()
      ctx.moveTo(x - r * 0.9, y - r * 1.35)
      ctx.lineTo(x + r * 0.8, y - r * 1.0)
      ctx.stroke()
    }
    if (mood === 'love') {
      ctx.fillStyle = accent
      // tiny heart glint in each eye
      heart(ctx, x + side * 1, y + 0.4, 1.8)
    }
  }
}

function drawMouth(ctx, x, y, mood, line, accent) {
  ctx.strokeStyle = line
  ctx.lineWidth = 1.8
  if (mood === 'eat') {
    ctx.fillStyle = '#8d4a50'
    ctx.beginPath(); ctx.ellipse(x, y + 0.6, 3.5, 3.1, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
    ctx.fillStyle = '#ef9b9e'
    ctx.beginPath(); ctx.ellipse(x, y + 1.9, 2, 1.1, 0, 0, Math.PI * 2); ctx.fill()
    return
  }
  if (mood === 'happy' || mood === 'love' || mood === 'clean') {
    ctx.fillStyle = '#8d4a50'
    ctx.beginPath()
    ctx.moveTo(x - 3.4, y - 0.8)
    ctx.quadraticCurveTo(x, y + 4.2, x + 3.4, y - 0.8)
    ctx.quadraticCurveTo(x, y + 0.4, x - 3.4, y - 0.8)
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(x - 3.3, y - 0.7)
    ctx.quadraticCurveTo(x, y + 4.1, x + 3.3, y - 0.7)
    ctx.stroke()
    return
  }
  if (mood === 'sad') {
    ctx.beginPath(); ctx.arc(x, y + 3.6, 3, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke()
    return
  }
  if (mood === 'sleep') {
    ctx.lineWidth = 1.6
    ctx.beginPath(); ctx.arc(x, y + 1, 1.5, 0, Math.PI * 2); ctx.stroke()
    return
  }
  if (mood === 'sick') {
    ctx.beginPath()
    ctx.moveTo(x - 2.6, y)
    ctx.quadraticCurveTo(x - 1.2, y - 1.4, x, y)
    ctx.quadraticCurveTo(x + 1.2, y + 1.4, x + 2.6, y)
    ctx.stroke()
    return
  }
  // content little w
  ctx.beginPath()
  ctx.moveTo(x - 2.5, y - 0.6)
  ctx.quadraticCurveTo(x - 1.2, y + 1.5, x, y - 0.2)
  ctx.quadraticCurveTo(x + 1.2, y + 1.5, x + 2.5, y - 0.6)
  ctx.stroke()
}

function leafShape(ctx, x, y, len, wid, angle, fill, dark, line, lw = 1.6) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(angle)
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.bezierCurveTo(wid, -len * 0.28, wid * 0.85, -len * 0.78, 0, -len)
  ctx.bezierCurveTo(-wid * 0.85, -len * 0.78, -wid, -len * 0.28, 0, 0)
  ctx.closePath()
  ctx.fillStyle = fill
  ctx.fill()
  ctx.strokeStyle = line
  ctx.lineWidth = lw
  ctx.stroke()
  ctx.strokeStyle = dark
  ctx.lineWidth = Math.max(0.9, lw * 0.6)
  ctx.beginPath(); ctx.moveTo(0, -1); ctx.quadraticCurveTo(wid * 0.15, -len * 0.5, 0, -len * 0.86); ctx.stroke()
  ctx.restore()
}

function star(ctx, x, y, outer, inner, points, fill = false) {
  ctx.beginPath()
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner
    const a = -Math.PI / 2 + (i / (points * 2)) * Math.PI * 2
    const px = x + Math.cos(a) * r
    const py = y + Math.sin(a) * r
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
  }
  ctx.closePath()
  if (fill) { ctx.fill(); ctx.stroke() } else { ctx.fill() }
}

function heart(ctx, x, y, size) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(size / 10, size / 10)
  ctx.beginPath()
  ctx.moveTo(0, 3.5)
  ctx.bezierCurveTo(-7, -3, -4.2, -8, 0, -4.2)
  ctx.bezierCurveTo(4.2, -8, 7, -3, 0, 3.5)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}
