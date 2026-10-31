// The illustrated room, sky, lighting and particle effects.

import { drawCreature } from './creature.js'

const W = 480
const H = 300
const GLASS = { x: 54, y: 38, w: 116, h: 120 }

const SKY_STOPS = [
  [0,    '#0e1834', '#263257'],
  [4.2,  '#182446', '#4f4a70'],
  [5.6,  '#7b5e83', '#e79a84'],
  [6.8,  '#eaa07d', '#ffe3b6'],
  [8.5,  '#8fcfdf', '#e9f7ee'],
  [12,   '#7fc6e0', '#e9f8f4'],
  [16,   '#9dd6df', '#fcf1cf'],
  [18,   '#f0a071', '#ffd49e'],
  [19.4, '#8c6178', '#e09284'],
  [20.6, '#28345b', '#5b4e76'],
  [22,   '#121d3d', '#2e3960'],
  [24,   '#0e1834', '#263257']
]

const SHADOW = 'rgba(71,49,36,.18)'
const OUTLINE = '#6d5544'

export class Scene {
  constructor(canvas) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.sprite = document.createElement('canvas')
    this.sprite.width = 80
    this.sprite.height = 80
    this.sctx = this.sprite.getContext('2d')
    this.state = {
      stage: 'egg', branch: 'verdant', mood: 'idle', eggProgress: 0,
      minutes: 8 * 60, name: 'Mossling'
    }
    this.reaction = null
    this.reactionUntil = 0
    this.particles = []
    this.ripples = []
    this.last = performance.now()
    this.t = 0
    this.dust = []
    this.flash = 0
    this.shake = 0
    this.bg = buildBackground()
    this.fg = buildWindowLayer()
    for (let i = 0; i < 12; i++) {
      this.dust.push({
        x: 40 + Math.random() * 400,
        y: 30 + Math.random() * 210,
        r: 0.6 + Math.random() * 1.3,
        phase: Math.random() * Math.PI * 2,
        speed: 0.05 + Math.random() * 0.15
      })
    }
    this.running = true
    this.frame = this.frame.bind(this)
    requestAnimationFrame(this.frame)
    document.addEventListener('visibilitychange', () => {
      this.last = performance.now()
    })
  }

  setState(patch) {
    Object.assign(this.state, patch)
  }

  setTime(minutes) {
    this.state.minutes = ((minutes % 1440) + 1440) % 1440
  }

  react(mood, ms = 2200) {
    this.reaction = mood
    this.reactionUntil = performance.now() + ms
  }

  burst(type = 'heart', count = 7, spot = null) {
    const origin = spot || { x: 240, y: 220 }
    for (let i = 0; i < count; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.4
      const speed = 28 + Math.random() * 60
      this.particles.push({
        type,
        x: origin.x + (Math.random() - 0.5) * 44,
        y: origin.y + (Math.random() - 0.5) * 24,
        vx: Math.cos(angle) * speed * 0.55,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 0.35 + Math.random() * 0.4,
        size: 0.65 + Math.random() * 0.8,
        rot: (Math.random() - 0.5) * 0.4,
        vr: (Math.random() - 0.5) * 1.2,
        hue: type === 'heart' ? (Math.random() < 0.5 ? '#f28fa4' : '#f7b0bd') : undefined
      })
    }
  }

  rippleAt(x, y) {
    this.ripples.push({ x, y, r: 6, life: 1 })
  }

  flashScreen(amount = 1) {
    this.flash = amount
  }

  hitTest(x, y) {
    const s = this.state.stage
    const half = s === 'egg' ? 46 : s === 'adult' ? 62 : 54
    return Math.abs(x - 240) < half && y > 158 && y < 280
  }

  frame(now) {
    if (!this.running) return
    const dt = Math.min(0.05, (now - this.last) / 1000)
    this.last = now
    this.t += dt
    if (!document.hidden) this.render(dt)
    requestAnimationFrame(this.frame)
  }

  render(dt) {
    const ctx = this.ctx
    const st = this.state
    const t = this.t
    const minutes = st.minutes
    const pal = skyPalette(minutes / 60)
    const nightAmount = 1 - pal.light

    // Effective mood (reactions are temporary)
    let mood = st.mood
    if (this.reaction && performance.now() < this.reactionUntil) mood = this.reaction
    else if (this.reaction && performance.now() >= this.reactionUntil) this.reaction = null

    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, W * 2, H * 2)

    let shakeX = 0, shakeY = 0
    if (this.shake > 0.2) {
      shakeX = (Math.random() - 0.5) * this.shake
      shakeY = (Math.random() - 0.5) * this.shake
      this.shake *= 0.86
    }
    ctx.setTransform(2, 0, 0, 2, shakeX * 2, shakeY * 2)

    // sky visible through the window hole
    this.drawSky(ctx, pal, t)

    // static room (with a transparent window opening)
    ctx.setTransform(1, 0, 0, 1, shakeX * 2, shakeY * 2)
    ctx.drawImage(this.bg, 0, 0)
    ctx.drawImage(this.fg, 0, 0)

    ctx.setTransform(2, 0, 0, 2, shakeX * 2, shakeY * 2)

    // dynamic wall clock hands
    drawClockHands(ctx, minutes, nightAmount)

    // light pool / golden hour beams
    drawLight(ctx, pal, t, nightAmount)

    // subtle colour grade for the room
    if (nightAmount > 0.01) {
      ctx.fillStyle = `rgba(26,36,74,${0.19 * nightAmount})`
      ctx.fillRect(0, 0, W, H)
      const glow = ctx.createRadialGradient(252, 214, 8, 252, 214, 120)
      glow.addColorStop(0, `rgba(255,205,132,${0.2 * nightAmount})`)
      glow.addColorStop(1, 'rgba(255,205,132,0)')
      ctx.fillStyle = glow
      ctx.fillRect(0, 100, W, 200)
    }

    // ambient motes
    this.drawDust(ctx, t, nightAmount)

    // creature shadow
    const shadowW = st.stage === 'adult' ? 50 : st.stage === 'egg' ? 38 : st.stage === 'child' ? 44 : 38
    const sh = ctx.createRadialGradient(240, 268, 4, 240, 268, shadowW)
    sh.addColorStop(0, 'rgba(76,55,38,.28)')
    sh.addColorStop(0.65, 'rgba(76,55,38,.13)')
    sh.addColorStop(1, 'rgba(76,55,38,0)')
    ctx.save()
    ctx.translate(240, 269)
    ctx.scale(1, 0.32)
    ctx.fillStyle = sh
    ctx.beginPath(); ctx.arc(0, 0, shadowW, 0, Math.PI * 2); ctx.fill()
    ctx.restore()

    // egg nest
    if (st.stage === 'egg') drawNest(ctx, t)

    // creature
    const isAsleep = mood === 'sleep'
    let bounce = Math.sin(t * 2.15) * 1.6
    if (isAsleep) bounce = Math.sin(t * 1.2) * 0.8
    if (mood === 'happy' || mood === 'love') bounce -= Math.abs(Math.sin(t * 4.4)) * 3
    if (mood === 'clean' || mood === 'eat') bounce -= Math.abs(Math.sin(t * 3.2)) * 2
    const scale = st.stage === 'egg' ? 1.02 : st.stage === 'adult' ? 1.16 : st.stage === 'child' ? 1.08 : 0.98
    const spriteW = 80 * 1.7 * scale
    drawCreature(this.sctx, {
      stage: st.stage,
      branch: st.branch,
      mood,
      t,
      eggProgress: st.eggProgress,
      seed: 1.7
    })
    ctx.save()
    ctx.imageSmoothingEnabled = false
    const drawX = 240 - spriteW / 2
    const drawY = 271 - spriteW + bounce
    ctx.drawImage(this.sprite, drawX, drawY, spriteW, spriteW)
    ctx.restore()

    // egg warmth glow
    if (st.stage === 'egg') {
      const warm = 0.16 + st.eggProgress * 0.24 + Math.sin(t * 2) * 0.04
      const g = ctx.createRadialGradient(240, 232, 10, 240, 232, 92)
      g.addColorStop(0, `rgba(255,225,150,${warm})`)
      g.addColorStop(1, 'rgba(255,225,150,0)')
      ctx.fillStyle = g
      ctx.fillRect(140, 130, 200, 180)
    }

    // particles
    this.updateParticles(dt)
    this.drawParticles(ctx)

    // taps / rings
    for (const r of this.ripples) {
      r.r += dt * 66
      r.life -= dt * 1.6
      ctx.strokeStyle = `rgba(255,255,255,${Math.max(0, r.life) * 0.55})`
      ctx.lineWidth = 1.6
      ctx.beginPath(); ctx.ellipse(r.x, r.y, r.r, r.r * 0.36, 0, 0, Math.PI * 2); ctx.stroke()
    }
    this.ripples = this.ripples.filter(r => r.life > 0)

    // zzz while sleeping
    if (isAsleep) drawZzz(ctx, t)

    // top screen gloss and vignette
    const vig = ctx.createRadialGradient(240, 150, 90, 240, 155, 320)
    vig.addColorStop(0, 'rgba(40,26,18,0)')
    vig.addColorStop(1, 'rgba(40,26,18,.22)')
    ctx.fillStyle = vig
    ctx.fillRect(0, 0, W, H)

    const gloss = ctx.createLinearGradient(0, 0, 220, 170)
    gloss.addColorStop(0, 'rgba(255,255,255,.12)')
    gloss.addColorStop(0.4, 'rgba(255,255,255,.02)')
    gloss.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = gloss
    ctx.fillRect(0, 0, W, H)

    if (this.flash > 0.01) {
      ctx.fillStyle = `rgba(255,250,230,${this.flash * 0.7})`
      ctx.fillRect(0, 0, W, H)
      this.flash *= 0.9
    }
  }

  drawSky(ctx, pal, t) {
    const { x, y, w, h } = GLASS
    ctx.save()
    ctx.beginPath()
    ctx.rect(x, y, w, h)
    ctx.clip()

    const grad = ctx.createLinearGradient(0, y, 0, y + h)
    grad.addColorStop(0, pal.top)
    grad.addColorStop(1, pal.bottom)
    ctx.fillStyle = grad
    ctx.fillRect(x, y, w, h)

    // stars
    if (pal.light < 0.55) {
      const alpha = Math.max(0, 0.75 - pal.light) * 1.3
      ctx.fillStyle = '#fff6d8'
      const stars = [[64, 52], [78, 68], [98, 48], [120, 62], [140, 50], [156, 74], [86, 86], [116, 92], [148, 100], [70, 106]]
      stars.forEach(([sx, sy], i) => {
        const twinkle = 0.55 + 0.45 * Math.sin(t * 1.3 + i * 2.2)
        ctx.globalAlpha = alpha * twinkle
        ctx.fillRect(sx, sy, 1.4, 1.4)
        if (i % 3 === 0) {
          ctx.fillRect(sx - 1.2, sy + 0.3, 0.7, 0.7)
          ctx.fillRect(sx + 1.7, sy + 0.3, 0.7, 0.7)
        }
      })
      ctx.globalAlpha = 1
    }

    // sun or moon
    const dayFrac = (this.state.minutes / 60 - 5.8) / 13.2
    if (dayFrac > -0.02 && dayFrac < 1.02) {
      const sx = x - 14 + clamp(dayFrac, 0, 1) * (w + 26)
      const sy = y + h - 8 - Math.sin(clamp(dayFrac, 0, 1) * Math.PI) * (h - 18)
      const g = ctx.createRadialGradient(sx, sy, 2, sx, sy, 26)
      g.addColorStop(0, 'rgba(255,240,182,.95)')
      g.addColorStop(0.35, 'rgba(255,224,144,.55)')
      g.addColorStop(1, 'rgba(255,216,130,0)')
      ctx.fillStyle = g
      ctx.fillRect(x, y, w, h)
      ctx.fillStyle = '#fff3c4'
      ctx.beginPath(); ctx.arc(sx, sy, 10, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#fffbe8'
      ctx.beginPath(); ctx.arc(sx - 2.6, sy - 2.6, 4.4, 0, Math.PI * 2); ctx.fill()
    } else {
      const nf = ((this.state.minutes / 60 + 6) % 24) / 12
      const mx = x + 20 + ((nf % 1) * (w - 40))
      const my = y + 34 + Math.sin(nf * Math.PI) * 18
      const g = ctx.createRadialGradient(mx, my, 4, mx, my, 24)
      g.addColorStop(0, 'rgba(240,235,206,.35)')
      g.addColorStop(1, 'rgba(240,235,206,0)')
      ctx.fillStyle = g
      ctx.fillRect(x, y, w, h)
      ctx.fillStyle = '#f3ecd0'
      ctx.beginPath(); ctx.arc(mx, my, 8.5, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = pal.top
      ctx.beginPath(); ctx.arc(mx + 4.2, my - 2.8, 7.2, 0, Math.PI * 2); ctx.fill()
    }

    // distant hills and trees
    ctx.fillStyle = mix(pal.bottom, '#6f9b7c', 0.45)
    ctx.globalAlpha = 0.7
    ctx.beginPath()
    ctx.moveTo(x, y + h)
    ctx.lineTo(x, y + h - 22)
    ctx.quadraticCurveTo(x + 26, y + h - 44, x + 52, y + h - 22)
    ctx.quadraticCurveTo(x + 76, y + h - 34, x + 104, y + h - 18)
    ctx.quadraticCurveTo(x + 124, y + h - 30, x + w, y + h - 16)
    ctx.lineTo(x + w, y + h)
    ctx.closePath(); ctx.fill()
    ctx.fillStyle = mix(pal.bottom, '#3f6b52', 0.55)
    ctx.globalAlpha = 0.75
    ctx.beginPath()
    ctx.moveTo(x, y + h)
    ctx.lineTo(x, y + h - 10)
    ctx.quadraticCurveTo(x + 40, y + h - 28, x + 74, y + h - 9)
    ctx.quadraticCurveTo(x + 108, y + h - 24, x + w, y + h - 8)
    ctx.lineTo(x + w, y + h)
    ctx.closePath(); ctx.fill()
    ctx.globalAlpha = 1

    // clouds
    const cloudAlpha = 0.55 + pal.light * 0.22
    const clouds = [
      { x: x - 20, y: y + 30, s: 0.8, speed: 2.2 },
      { x: x + 56, y: y + 56, s: 0.55, speed: 1.4 },
      { x: x + 18, y: y + 82, s: 0.42, speed: 3.1 }
    ]
    ctx.fillStyle = pal.light > 0.35 ? '#fffdf4' : '#c8cfe2'
    ctx.globalAlpha = cloudAlpha
    clouds.forEach((c, i) => {
      const cx = x + ((c.x - x + t * c.speed) % (w + 50)) - 10
      cloud(ctx, cx, c.y + Math.sin(t * 0.3 + i) * 1.2, c.s)
    })
    ctx.globalAlpha = 1

    // birds during the day
    if (pal.light > 0.55) {
      ctx.strokeStyle = 'rgba(70,86,76,.55)'
      ctx.lineWidth = 0.9
      const bx = x + ((t * 7 + 12) % (w + 40)) - 20
      const by = y + 48 + Math.sin(t * 0.5) * 5
      ctx.beginPath(); ctx.moveTo(bx - 5, by); ctx.quadraticCurveTo(bx - 2, by - 3, bx, by); ctx.quadraticCurveTo(bx + 2, by - 3, bx + 5, by); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(bx + 15, by + 11); ctx.quadraticCurveTo(bx + 17, by + 9, bx + 19, by + 11); ctx.quadraticCurveTo(bx + 21, by + 9, bx + 23, by + 11); ctx.stroke()
    }

    // glass shine
    ctx.fillStyle = 'rgba(255,255,255,.10)'
    ctx.beginPath()
    ctx.moveTo(x + 10, y)
    ctx.lineTo(x + 38, y)
    ctx.lineTo(x + 16, y + h)
    ctx.lineTo(x, y + h)
    ctx.closePath(); ctx.fill()

    ctx.restore()
  }

  drawDust(ctx, t, nightAmount) {
    for (const d of this.dust) {
      const y = d.y + Math.sin(t * d.speed * 3 + d.phase) * 9
      const x = d.x + Math.cos(t * d.speed * 2 + d.phase) * 12
      ctx.globalAlpha = (nightAmount > 0.5 ? 0.34 : 0.45) * (0.65 + Math.sin(t + d.phase) * 0.35)
      ctx.fillStyle = nightAmount > 0.5 ? '#ffe6a8' : '#fff9e2'
      ctx.beginPath(); ctx.arc(x, y, d.r, 0, Math.PI * 2); ctx.fill()
    }
    if (nightAmount > 0.6) {
      const fireflies = [[120, 210], [340, 190], [300, 240], [80, 250], [410, 230]]
      fireflies.forEach(([fx, fy], i) => {
        const x = fx + Math.sin(t * 0.7 + i * 1.8) * 16
        const y = fy + Math.cos(t * 0.9 + i * 1.3) * 10
        const a = (0.35 + 0.35 * Math.sin(t * 2 + i)) * (nightAmount - 0.4)
        const g = ctx.createRadialGradient(x, y, 0, x, y, 7)
        g.addColorStop(0, `rgba(255,238,150,${a})`)
        g.addColorStop(1, 'rgba(255,238,150,0)')
        ctx.fillStyle = g
        ctx.fillRect(x - 8, y - 8, 16, 16)
      })
    }
    ctx.globalAlpha = 1
  }

  updateParticles(dt) {
    for (const p of this.particles) {
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.vy += (p.type === 'crumb' || p.type === 'confetti') ? 58 * dt : -7 * dt
      p.vx *= 0.985
      p.rot += p.vr * dt
      p.life -= p.decay * dt
    }
    this.particles = this.particles.filter(p => p.life > 0)
  }

  drawParticles(ctx) {
    for (const p of this.particles) {
      const a = Math.max(0, Math.min(1, p.life))
      ctx.save()
      ctx.globalAlpha = a
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rot)
      ctx.scale(p.size, p.size)
      switch (p.type) {
        case 'heart':
          ctx.fillStyle = p.hue || '#f28fa4'
          heartPath(ctx, 7)
          ctx.fill()
          break
        case 'spark':
        case 'confetti':
          ctx.fillStyle = p.hue || (p.type === 'spark' ? '#ffe28a' : '#f6b8c3')
          starPath(ctx, 0, 0, 4.2, 1.6, 4)
          ctx.fill()
          break
        case 'note':
          ctx.fillStyle = '#a88ad2'
          ctx.font = 'bold 13px Georgia, serif'
          ctx.textAlign = 'center'
          ctx.fillText('♪', 0, 4)
          break
        case 'bubble':
          ctx.strokeStyle = 'rgba(255,255,255,.9)'
          ctx.fillStyle = 'rgba(167,221,233,.35)'
          ctx.lineWidth = 1.4
          ctx.beginPath(); ctx.arc(0, 0, 4.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
          ctx.fillStyle = 'rgba(255,255,255,.9)'
          ctx.beginPath(); ctx.arc(-1.4, -1.5, 1.1, 0, Math.PI * 2); ctx.fill()
          break
        case 'crumb':
          ctx.fillStyle = '#c58b58'
          ctx.fillRect(-2, -2, 4, 4)
          break
        case 'zzz':
          ctx.fillStyle = 'rgba(120,140,190,.9)'
          ctx.font = 'bold 12px "Nunito", sans-serif'
          ctx.fillText('z', 0, 0)
          break
      }
      ctx.restore()
    }
  }
}

function buildBackground() {
  const c = document.createElement('canvas')
  c.width = W * 2
  c.height = H * 2
  const ctx = c.getContext('2d')
  ctx.scale(2, 2)
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'

  // wall
  const wall = ctx.createLinearGradient(0, 0, 0, 202)
  wall.addColorStop(0, '#fbeedd')
  wall.addColorStop(0.75, '#f6e2cc')
  wall.addColorStop(1, '#f0d7bd')
  ctx.fillStyle = wall
  ctx.fillRect(0, 0, W, 204)

  // wallpaper pattern
  ctx.fillStyle = 'rgba(181,142,108,.13)'
  for (let y = 18; y < 190; y += 26) {
    for (let x = 14 + ((y / 26) % 2) * 13; x < W; x += 26) {
      ctx.beginPath(); ctx.arc(x, y, 1.3, 0, Math.PI * 2); ctx.fill()
    }
  }
  ctx.strokeStyle = 'rgba(214,175,139,.22)'
  ctx.lineWidth = 1
  for (let x = 0; x < W; x += 26) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 196); ctx.stroke()
  }

  // baseboard and floor
  ctx.fillStyle = '#f6e7d2'
  ctx.fillRect(0, 192, W, 12)
  ctx.strokeStyle = '#dcc1a2'
  ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.moveTo(0, 192); ctx.lineTo(W, 192); ctx.stroke()

  const floor = ctx.createLinearGradient(0, 204, 0, H)
  floor.addColorStop(0, '#d6b58c')
  floor.addColorStop(0.55, '#cfa87c')
  floor.addColorStop(1, '#c59a6d')
  ctx.fillStyle = floor
  ctx.fillRect(0, 204, W, H - 204)

  // floorboards
  ctx.strokeStyle = 'rgba(129,92,58,.20)'
  ctx.lineWidth = 1.2
  ;[218, 238, 262, 288].forEach((y, i) => {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y + (i === 3 ? -2 : 0)); ctx.stroke()
  })
  ctx.strokeStyle = 'rgba(255,245,225,.16)'
  for (let i = 0; i < 9; i++) {
    const x = 20 + i * 57 + (i % 2) * 18
    ctx.beginPath(); ctx.moveTo(x, 208); ctx.lineTo(x - 6, H); ctx.stroke()
  }

  // rug shadow
  ctx.fillStyle = 'rgba(98,64,42,.10)'
  ctx.beginPath(); ctx.ellipse(240, 258, 116, 36, 0, 0, Math.PI * 2); ctx.fill()

  // rug
  ctx.beginPath(); ctx.ellipse(240, 252, 108, 32, 0, 0, Math.PI * 2)
  ctx.fillStyle = '#d69a83'; ctx.fill()
  ctx.beginPath(); ctx.ellipse(240, 251, 100, 28, 0, 0, Math.PI * 2)
  ctx.fillStyle = '#f4e3c7'; ctx.fill()
  ctx.beginPath(); ctx.ellipse(240, 250, 88, 23, 0, 0, Math.PI * 2)
  ctx.fillStyle = '#efcbae'; ctx.fill()
  ctx.beginPath(); ctx.ellipse(240, 249, 74, 18, 0, 0, Math.PI * 2)
  ctx.fillStyle = '#f9ecd8'; ctx.fill()
  ctx.strokeStyle = 'rgba(178,111,88,.55)'
  ctx.lineWidth = 1.6
  ctx.setLineDash([5, 6])
  ctx.beginPath(); ctx.ellipse(240, 249, 66, 15, 0, 0, Math.PI * 2); ctx.stroke()
  ctx.setLineDash([])

  // rug fringe
  ctx.strokeStyle = '#dfb08f'
  ctx.lineWidth = 1.4
  for (let i = 0; i < 14; i++) {
    const a = 0.12 + (i / 13) * 0.76
    const lx = 240 - Math.cos(a * Math.PI + Math.PI) * 108
    const ly = 252 + Math.sin(a * Math.PI + Math.PI) * 31
    ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx - 5, ly + 2); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(480 - lx, ly); ctx.lineTo(485 - lx, ly + 2); ctx.stroke()
  }

  // left plant
  drawPottedPlant(ctx, 30, 176)

  // window frame shadow / sill is drawn on the fg layer

  // shelf
  ctx.fillStyle = '#8f6a4b'
  ctx.fillRect(348, 124, 118, 7)
  ctx.fillStyle = '#a77d59'
  ctx.fillRect(348, 124, 118, 3)
  ctx.fillStyle = 'rgba(99,69,45,.35)'
  ctx.fillRect(348, 131, 118, 2)
  // brackets
  ctx.fillStyle = '#8f6a4b'
  ctx.beginPath(); ctx.moveTo(356, 131); ctx.lineTo(356, 144); ctx.lineTo(368, 131); ctx.closePath(); ctx.fill()
  ctx.beginPath(); ctx.moveTo(458, 131); ctx.lineTo(458, 144); ctx.lineTo(446, 131); ctx.closePath(); ctx.fill()

  // jars and books on shelf
  drawJar(ctx, 362, 86, 26, 38)
  drawPot(ctx, 398, 98, 23, 26)
  drawBookStack(ctx, 428, 124)

  // picture frame
  ctx.fillStyle = '#8f6a4b'
  ctx.fillRect(366, 30, 76, 58)
  ctx.fillStyle = '#fdf5e4'
  ctx.fillRect(371, 35, 66, 48)
  ctx.fillStyle = '#dcebc8'
  ctx.fillRect(374, 38, 60, 42)
  // little leaf print
  ctx.save()
  ctx.translate(404, 64)
  ctx.rotate(-0.35)
  ctx.fillStyle = '#78a969'
  ctx.beginPath(); ctx.ellipse(0, 0, 6, 13, 0, 0, Math.PI * 2); ctx.fill()
  ctx.strokeStyle = '#547d4c'; ctx.lineWidth = 1.4
  ctx.beginPath(); ctx.moveTo(0, 12); ctx.lineTo(0, -11); ctx.stroke()
  ctx.restore()
  ctx.fillStyle = '#9b7c61'
  ctx.font = '6px "Nunito", sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('grow', 404, 46)

  // clock face
  ctx.fillStyle = 'rgba(104,73,52,.16)'
  ctx.beginPath(); ctx.arc(258, 54, 20, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#fffaf0'
  ctx.beginPath(); ctx.arc(258, 52, 18, 0, Math.PI * 2); ctx.fill()
  ctx.strokeStyle = '#8b6a4f'
  ctx.lineWidth = 2.4
  ctx.stroke()
  ctx.fillStyle = '#7d6049'
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2
    const r1 = i % 3 === 0 ? 12.5 : 14
    ctx.beginPath()
    ctx.arc(258 + Math.cos(a) * r1, 52 + Math.sin(a) * r1, i % 3 === 0 ? 1.2 : 0.8, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.fillStyle = '#8b6a4f'
  ctx.beginPath(); ctx.arc(258, 52, 2.2, 0, Math.PI * 2); ctx.fill()

  // food bowl
  ctx.fillStyle = 'rgba(88,59,38,.14)'
  ctx.beginPath(); ctx.ellipse(142, 262, 28, 7, 0, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#e6b98f'
  ctx.beginPath(); ctx.ellipse(142, 254, 25, 7.5, 0, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#f0cda6'
  ctx.beginPath(); ctx.ellipse(142, 253, 21, 5.4, 0, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#d98c79'
  ctx.beginPath(); ctx.arc(136, 252, 2.6, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(143, 251, 2.1, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#e6a965'
  ctx.beginPath(); ctx.arc(148, 253, 2.3, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#e6b98f'
  ctx.beginPath(); ctx.ellipse(142, 258, 25, 6.2, 0, 0, Math.PI); ctx.fill()

  // ball
  ctx.fillStyle = 'rgba(88,59,38,.14)'
  ctx.beginPath(); ctx.ellipse(345, 266, 16, 4, 0, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#e8897b'
  ctx.beginPath(); ctx.arc(345, 252, 14, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#f9e9d0'
  ctx.beginPath(); ctx.arc(345, 252, 14, -0.3, 0.5); ctx.lineTo(345, 252); ctx.closePath(); ctx.fill()
  ctx.strokeStyle = '#c96f63'
  ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.arc(345, 252, 14, 0, Math.PI * 2); ctx.stroke()
  ctx.fillStyle = 'rgba(255,255,255,.55)'
  ctx.beginPath(); ctx.ellipse(340, 246, 3.4, 2.2, -0.5, 0, Math.PI * 2); ctx.fill()

  // small books left
  ctx.fillStyle = '#bf8a6a'
  ctx.fillRect(196, 184, 34, 8)
  ctx.fillStyle = '#8caf8b'
  ctx.fillRect(199, 176, 28, 8)
  ctx.fillStyle = '#e4c38d'
  ctx.fillRect(202, 170, 22, 7)
  ctx.strokeStyle = 'rgba(90,60,40,.25)'
  ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(206, 172); ctx.lineTo(206, 177); ctx.stroke()

  // cut out the glass so the sky shows through
  ctx.globalCompositeOperation = 'destination-out'
  ctx.fillStyle = '#000'
  ctx.fillRect(GLASS.x, GLASS.y, GLASS.w, GLASS.h)
  ctx.globalCompositeOperation = 'source-over'

  return c
}

function buildWindowLayer() {
  const c = document.createElement('canvas')
  c.width = W * 2
  c.height = H * 2
  const ctx = c.getContext('2d')
  ctx.scale(2, 2)
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'

  // curtains
  ctx.fillStyle = 'rgba(95,63,48,.12)'
  ctx.fillRect(26, 22, 142, 4)
  drawCurtain(ctx, 30, 26, 84, 1)
  drawCurtain(ctx, 180, 26, 84, -1)

  // outer frame
  ctx.fillStyle = '#fff7e8'
  ctx.strokeStyle = OUTLINE
  ctx.lineWidth = 2
  roundRect(ctx, 42, 26, 140, 144, 8)
  ctx.fill(); ctx.stroke()
  ctx.strokeStyle = 'rgba(150,113,80,.35)'
  ctx.lineWidth = 1
  roundRect(ctx, 47, 31, 130, 134, 6)
  ctx.stroke()

  // open the glass area so the painted sky remains visible
  ctx.globalCompositeOperation = 'destination-out'
  ctx.fillStyle = '#000'
  ctx.fillRect(GLASS.x, GLASS.y, GLASS.w, GLASS.h)
  ctx.globalCompositeOperation = 'source-over'

  // glass tint
  ctx.fillStyle = 'rgba(255,255,255,.06)'
  ctx.fillRect(GLASS.x, GLASS.y, GLASS.w, GLASS.h)

  // mullions
  ctx.fillStyle = '#fff7e8'
  ctx.strokeStyle = OUTLINE
  ctx.lineWidth = 1.2
  const midX = GLASS.x + GLASS.w / 2
  const midY = GLASS.y + GLASS.h / 2
  ctx.fillRect(midX - 2.5, GLASS.y, 5, GLASS.h)
  ctx.fillRect(GLASS.x, midY - 2.5, GLASS.w, 5)
  ctx.strokeRect(midX - 2.5, GLASS.y, 5, GLASS.h)
  ctx.strokeRect(GLASS.x, midY - 2.5, GLASS.w, 5)

  // sill
  ctx.fillStyle = '#f7ead5'
  ctx.strokeStyle = OUTLINE
  ctx.lineWidth = 1.5
  roundRect(ctx, 34, 166, 156, 11, 4)
  ctx.fill(); ctx.stroke()
  ctx.fillStyle = 'rgba(128,91,60,.18)'
  ctx.fillRect(38, 174, 148, 3)

  // tiny plant on the sill
  ctx.fillStyle = '#d99c7c'
  ctx.beginPath(); ctx.moveTo(160, 166); ctx.lineTo(164, 155); ctx.lineTo(176, 155); ctx.lineTo(180, 166); ctx.closePath(); ctx.fill()
  ctx.strokeStyle = '#a87358'; ctx.lineWidth = 1; ctx.stroke()
  ctx.strokeStyle = '#5f9a5e'; ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.moveTo(170, 155); ctx.quadraticCurveTo(168, 146, 171, 142); ctx.stroke()
  ctx.fillStyle = '#7fb878'
  ctx.beginPath(); ctx.ellipse(166, 146, 4, 2.2, -0.6, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.ellipse(175, 143, 4, 2.2, 0.6, 0, Math.PI * 2); ctx.fill()

  return c
}

function drawCurtain(ctx, x, y, height, dir) {
  ctx.save()
  const g = ctx.createLinearGradient(x, 0, x + 34 * dir, 0)
  g.addColorStop(0, '#eaa48e')
  g.addColorStop(0.55, '#f3bda5')
  g.addColorStop(1, '#e49a84')
  ctx.fillStyle = g
  ctx.strokeStyle = 'rgba(150,89,73,.45)'
  ctx.lineWidth = 1
  ctx.beginPath()
  if (dir > 0) {
    ctx.moveTo(x, y)
    ctx.lineTo(x + 28, y)
    ctx.quadraticCurveTo(x + 22, y + height * 0.4, x + 30, y + height * 0.5)
    ctx.quadraticCurveTo(x + 22, y + height * 0.62, x + 26, y + height)
    ctx.lineTo(x, y + height)
  } else {
    ctx.moveTo(x, y)
    ctx.lineTo(x - 28, y)
    ctx.quadraticCurveTo(x - 22, y + height * 0.4, x - 30, y + height * 0.5)
    ctx.quadraticCurveTo(x - 22, y + height * 0.62, x - 26, y + height)
    ctx.lineTo(x, y + height)
  }
  ctx.closePath(); ctx.fill(); ctx.stroke()
  // folds
  ctx.strokeStyle = 'rgba(159,92,76,.28)'
  for (let i = 1; i <= 2; i++) {
    ctx.beginPath()
    ctx.moveTo(x + dir * (5 + i * 5), y + 6)
    ctx.quadraticCurveTo(x + dir * (7 + i * 5), y + height * 0.45, x + dir * (4 + i * 5), y + height - 4)
    ctx.stroke()
  }
  // tie
  ctx.fillStyle = '#f3d18a'
  ctx.strokeStyle = '#c69c51'
  ctx.lineWidth = 1
  const tx = x + dir * 13
  ctx.beginPath(); ctx.ellipse(tx, y + height * 0.5, 10, 3.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
  ctx.restore()
}

function drawPottedPlant(ctx, x, y) {
  ctx.save()
  ctx.fillStyle = 'rgba(86,58,38,.14)'
  ctx.beginPath(); ctx.ellipse(x + 12, y + 31, 22, 5, 0, 0, Math.PI * 2); ctx.fill()
  // pot
  ctx.fillStyle = '#cc8b72'
  ctx.beginPath(); ctx.moveTo(x - 2, y + 4); ctx.lineTo(x + 26, y + 4); ctx.lineTo(x + 22, y + 30); ctx.lineTo(x + 2, y + 30); ctx.closePath(); ctx.fill()
  ctx.strokeStyle = '#9e6752'; ctx.lineWidth = 1.2; ctx.stroke()
  ctx.fillStyle = '#dda189'
  ctx.beginPath(); ctx.ellipse(x + 12, y + 4, 15, 4, 0, 0, Math.PI * 2); ctx.fill()
  // stems and leaves
  ctx.strokeStyle = '#5c8c5b'; ctx.lineWidth = 1.6
  const leaves = [
    [-10, -8, -0.9], [8, -14, -0.2], [20, -6, 0.8], [-2, -28, -0.1], [14, -30, 0.5]
  ]
  leaves.forEach(([lx, ly, a], i) => {
    const bx = x + 12 + lx * 0.3
    const by = y + 2
    const ex = x + 12 + lx
    const ey = y + 2 + ly
    ctx.beginPath(); ctx.moveTo(bx, by); ctx.quadraticCurveTo((bx + ex) / 2 + lx * 0.2, (by + ey) / 2, ex, ey); ctx.stroke()
    ctx.fillStyle = i % 2 ? '#86b478' : '#74a568'
    ctx.strokeStyle = '#557e4e'
    ctx.clearRect(0, 0, 0, 0)
    ctx.beginPath(); ctx.ellipse(ex, ey, 7, 3.7, a, 0, Math.PI * 2); ctx.fill(); ctx.lineWidth = 1; ctx.stroke()
  })
  ctx.restore()
}

function drawJar(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(155,194,183,.55)'
  ctx.strokeStyle = 'rgba(102,136,128,.65)'
  ctx.lineWidth = 1.2
  roundRect(ctx, x, y, w, h, 6)
  ctx.fill(); ctx.stroke()
  // lid
  ctx.fillStyle = '#d7b26f'
  ctx.fillRect(x + 2, y - 4, w - 4, 6)
  ctx.strokeRect(x + 2, y - 4, w - 4, 6)
  // berries
  const berries = [[7, 18], [15, 15], [12, 25], [20, 23], [6, 29], [17, 31]]
  berries.forEach(([bx, by], i) => {
    ctx.fillStyle = i % 3 === 0 ? '#d27d88' : i % 3 === 1 ? '#8dbb7d' : '#e0a25e'
    ctx.beginPath(); ctx.arc(x + bx, y + by, 3, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = 'rgba(255,255,255,.35)'
    ctx.beginPath(); ctx.arc(x + bx - 1, y + by - 1, 1, 0, Math.PI * 2); ctx.fill()
  })
  ctx.fillStyle = 'rgba(255,255,255,.35)'
  ctx.fillRect(x + 4, y + 4, 3, h - 10)
}

function drawPot(ctx, x, y, w, h) {
  ctx.fillStyle = '#e0aa5f'
  ctx.strokeStyle = '#b48342'
  ctx.lineWidth = 1.2
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x + w, y)
  ctx.quadraticCurveTo(x + w - 2, y + h, x + w - 5, y + h)
  ctx.lineTo(x + 5, y + h)
  ctx.quadraticCurveTo(x + 2, y + h, x, y)
  ctx.closePath(); ctx.fill(); ctx.stroke()
  ctx.fillStyle = '#f0cb89'
  ctx.beginPath(); ctx.ellipse(x + w / 2, y, w / 2, 3.2, 0, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#d99c4f'
  ctx.fillRect(x + 3, y + 8, w - 6, 4)
  // honey dipper
  ctx.strokeStyle = '#a9763d'; ctx.lineWidth = 1.6
  ctx.beginPath(); ctx.moveTo(x + 18, y - 8); ctx.lineTo(x + 12, y + 4); ctx.stroke()
  ctx.fillStyle = '#e7b95d'
  ctx.beginPath(); ctx.arc(x + 11, y + 6, 3, 0, Math.PI * 2); ctx.fill()
}

function drawBookStack(ctx, x, y) {
  const books = [
    { w: 32, h: 7, c: '#b7c9a5', dy: 0 },
    { w: 28, h: 6, c: '#d9a287', dy: -7 },
    { w: 34, h: 6, c: '#a7bfd0', dy: -13 }
  ]
  books.forEach(b => {
    ctx.fillStyle = b.c
    ctx.fillRect(x, y - 7 + b.dy, b.w, b.h)
    ctx.strokeStyle = 'rgba(80,60,45,.35)'
    ctx.lineWidth = 0.9
    ctx.strokeRect(x, y - 7 + b.dy, b.w, b.h)
    ctx.fillStyle = 'rgba(255,255,255,.4)'
    ctx.fillRect(x + 3, y - 6 + b.dy, b.w - 6, 1)
  })
}

function drawClockHands(ctx, minutes, nightAmount) {
  const cx = 258, cy = 52
  const hourA = ((minutes / 60) % 12) / 12 * Math.PI * 2 - Math.PI / 2
  const minA = (minutes % 60) / 60 * Math.PI * 2 - Math.PI / 2
  ctx.strokeStyle = nightAmount > 0.5 ? '#6a594a' : '#6b523f'
  ctx.lineCap = 'round'
  ctx.lineWidth = 3
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(hourA) * 7.5, cy + Math.sin(hourA) * 7.5); ctx.stroke()
  ctx.lineWidth = 1.8
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(minA) * 11.5, cy + Math.sin(minA) * 11.5); ctx.stroke()
  ctx.fillStyle = '#8b6a4f'
  ctx.beginPath(); ctx.arc(cx, cy, 1.8, 0, Math.PI * 2); ctx.fill()
}

function drawLight(ctx, pal, t, nightAmount) {
  const glow = Math.max(0, pal.light)
  ctx.save()
  ctx.globalCompositeOperation = 'screen'
  const beam = ctx.createLinearGradient(110, 160, 250, 280)
  const tint = nightAmount > 0.55 ? '190,206,255' : '255,235,182'
  const alpha = nightAmount > 0.55 ? 0.1 * nightAmount : 0.16 * glow
  beam.addColorStop(0, `rgba(${tint},${alpha})`)
  beam.addColorStop(0.6, `rgba(${tint},${alpha * 0.55})`)
  beam.addColorStop(1, `rgba(${tint},0)`)
  ctx.fillStyle = beam
  ctx.beginPath()
  ctx.moveTo(GLASS.x + 4, GLASS.y + GLASS.h - 8)
  ctx.lineTo(GLASS.x + GLASS.w - 4, GLASS.y + GLASS.h - 8)
  ctx.lineTo(314, 288)
  ctx.lineTo(116, 288)
  ctx.closePath()
  ctx.fill()

  // sun patch
  if (glow > 0.25) {
    const g = ctx.createRadialGradient(196, 254, 6, 196, 254, 96)
    g.addColorStop(0, `rgba(255,229,160,${0.18 * glow})`)
    g.addColorStop(1, 'rgba(255,229,160,0)')
    ctx.fillStyle = g
    ctx.beginPath(); ctx.ellipse(196, 254, 96, 36, 0, 0, Math.PI * 2); ctx.fill()
  }
  ctx.restore()
}

function drawNest(ctx, t) {
  ctx.save()
  ctx.fillStyle = 'rgba(90,62,39,.12)'
  ctx.beginPath(); ctx.ellipse(240, 269, 52, 12, 0, 0, Math.PI * 2); ctx.fill()
  ctx.strokeStyle = '#b78a55'
  ctx.lineWidth = 2
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2
    const rx = 52 + Math.sin(i * 2.7) * 4
    const ry = 14 + Math.cos(i * 1.8) * 3
    ctx.beginPath()
    ctx.moveTo(240 + Math.cos(a) * (rx - 5), 266 + Math.sin(a) * (ry - 2))
    ctx.quadraticCurveTo(240 + Math.cos(a) * rx, 264 + Math.sin(a) * ry, 240 + Math.cos(a + 0.2) * (rx - 2), 268 + Math.sin(a) * (ry + 1))
    ctx.stroke()
  }
  ctx.strokeStyle = '#d4ad76'
  ctx.lineWidth = 1.4
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + 0.3
    ctx.beginPath()
    ctx.moveTo(240 + Math.cos(a) * 45, 264 + Math.sin(a) * 11)
    ctx.lineTo(240 + Math.cos(a + 0.15) * 54, 264 + Math.sin(a + 0.15) * 15)
    ctx.stroke()
  }
  ctx.restore()
}

function drawZzz(ctx, t) {
  ctx.save()
  ctx.fillStyle = 'rgba(92,110,160,.75)'
  ctx.font = 'bold 13px "Nunito", sans-serif'
  for (let i = 0; i < 3; i++) {
    const p = ((t * 0.22 + i * 0.33) % 1)
    const x = 294 + p * 26 + Math.sin(t + i) * 4
    const y = 178 - p * 52
    ctx.globalAlpha = (1 - p) * 0.8
    ctx.font = `bold ${10 + i * 3}px "Nunito", sans-serif`
    ctx.fillText('z', x, y)
  }
  ctx.restore()
}

function skyPalette(minutes) {
  let a = SKY_STOPS[0]
  let b = SKY_STOPS[SKY_STOPS.length - 1]
  for (let i = 0; i < SKY_STOPS.length - 1; i++) {
    if (minutes >= SKY_STOPS[i][0] && minutes <= SKY_STOPS[i + 1][0]) {
      a = SKY_STOPS[i]; b = SKY_STOPS[i + 1]
      break
    }
  }
  const span = b[0] - a[0] || 1
  const f = clamp((minutes - a[0]) / span, 0, 1)
  // Light curve: brightest around midday, dark before dawn and after dusk.
  const light = clamp(1 - Math.abs(minutes - 12.5) / 8.5, 0, 1)
  return {
    top: mix(a[1], b[1], f),
    bottom: mix(a[2], b[2], f),
    light
  }
}

function mix(c1, c2, t) {
  const a = hex(c1), b = hex(c2)
  return `rgb(${Math.round(a[0] + (b[0] - a[0]) * t)},${Math.round(a[1] + (b[1] - a[1]) * t)},${Math.round(a[2] + (b[2] - a[2]) * t)})`
}

function hex(c) {
  const v = c.replace('#', '')
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)]
}

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)) }

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function cloud(ctx, x, y, s) {
  ctx.beginPath()
  ctx.ellipse(x, y, 15 * s, 6 * s, 0, 0, Math.PI * 2)
  ctx.ellipse(x + 10 * s, y - 4 * s, 10 * s, 7 * s, 0, 0, Math.PI * 2)
  ctx.ellipse(x - 11 * s, y + 1 * s, 8 * s, 5 * s, 0, 0, Math.PI * 2)
  ctx.fill()
}

function heartPath(ctx, size) {
  ctx.beginPath()
  ctx.moveTo(0, size * 0.55)
  ctx.bezierCurveTo(-size * 1.1, -size * 0.45, -size * 0.62, -size * 1.16, 0, -size * 0.55)
  ctx.bezierCurveTo(size * 0.62, -size * 1.16, size * 1.1, -size * 0.45, 0, size * 0.55)
  ctx.closePath()
}

function starPath(ctx, x, y, outer, inner, points) {
  ctx.beginPath()
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner
    const a = -Math.PI / 2 + (i / (points * 2)) * Math.PI * 2
    const px = x + Math.cos(a) * r
    const py = y + Math.sin(a) * r
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
  }
  ctx.closePath()
}
