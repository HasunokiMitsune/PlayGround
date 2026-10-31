// Touch-first mini-games: Berry Catch, Pulse Training, and Bubble Bath.

import { drawCreature } from './creature.js'

/* ------------------------------------------------------------------ */
/* Berry Catch                                                         */
/* ------------------------------------------------------------------ */

export class BerryCatch {
  constructor(canvas, { sound, onEnd } = {}) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.sound = sound
    this.onEnd = onEnd
    this.width = canvas.width
    this.height = canvas.height
    this.playerX = this.width / 2
    this.targetX = this.width / 2
    this.items = []
    this.pops = []
    this.score = 0
    this.caught = 0
    this.misses = 0
    this.golden = 0
    this.timeLeft = 24
    this.total = 24
    this.spawnIn = 0.45
    this.running = true
    this.finished = false
    this.last = performance.now()
    this.t = 0
    this.keys = new Set()
    this.abort = new AbortController()
    this.bind()
    this.loop = this.loop.bind(this)
    requestAnimationFrame(this.loop)
  }

  bind() {
    const { signal } = this.abort
    const move = e => {
      const rect = this.canvas.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * this.width
      this.targetX = Math.max(56, Math.min(this.width - 56, x))
    }
    this.canvas.addEventListener('pointermove', move, { signal })
    this.canvas.addEventListener('pointerdown', move, { signal })
    window.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'a' || e.key === 'd') {
        e.preventDefault()
        this.keys.add(e.key)
      }
    }, { signal })
    window.addEventListener('keyup', e => this.keys.delete(e.key), { signal })
  }

  loop(now) {
    if (!this.running) return
    const elapsed = (now - this.last) / 1000
    const dt = Math.min(0.033, elapsed)
    this.last = now
    this.t += dt
    this.update(dt, Math.min(0.5, elapsed))
    this.draw()
    if (this.running) requestAnimationFrame(this.loop)
  }

  update(dt, clockDt = dt) {
    if (this.finished) return
    this.timeLeft -= clockDt
    if (this.timeLeft <= 0) {
      this.timeLeft = 0
      this.finish()
      return
    }

    // Smoothly follow the pointer, with a little springiness.
    const keySpeed = 460 * dt
    if (this.keys.has('ArrowLeft') || this.keys.has('a')) this.targetX -= keySpeed
    if (this.keys.has('ArrowRight') || this.keys.has('d')) this.targetX += keySpeed
    this.targetX = Math.max(56, Math.min(this.width - 56, this.targetX))
    this.playerX += (this.targetX - this.playerX) * Math.min(1, dt * 14)

    this.spawnIn -= dt
    if (this.spawnIn <= 0) {
      const difficulty = 1 + (1 - this.timeLeft / this.total) * 0.75
      this.spawnIn = (0.62 + Math.random() * 0.42) / difficulty
      const roll = Math.random()
      let type = 'berry'
      if (roll > 0.88) type = 'gold'
      else if (roll > 0.78) type = 'rock'
      else if (roll > 0.73) type = 'heart'
      const x = 44 + Math.random() * (this.width - 88)
      this.items.push({
        x,
        y: -20,
        vy: (105 + Math.random() * 70) * difficulty,
        type,
        spin: Math.random() * Math.PI * 2,
        wobble: Math.random() * Math.PI * 2
      })
    }

    const basketY = this.height - 72
    for (const item of this.items) {
      item.y += item.vy * dt
      item.x += Math.sin(this.t * 2.4 + item.wobble) * 9 * dt
      item.spin += dt * 1.2
      if (item.y >= basketY && item.y < basketY + 34) {
        if (Math.abs(item.x - this.playerX) < 52) {
          this.collect(item)
          item.dead = true
        } else if (item.y > this.height - 20 && item.type !== 'rock') {
          this.misses++
          this.addPop(item.x, this.height - 24, 'miss', '-1')
          this.sound?.play('miss')
          item.dead = true
        }
      }
      if (item.y > this.height + 30) {
        if (item.type !== 'rock') this.misses++
        item.dead = true
      }
    }
    this.items = this.items.filter(i => !i.dead)

    for (const p of this.pops) {
      p.life -= dt * 1.8
      p.y -= dt * 26
    }
    this.pops = this.pops.filter(p => p.life > 0)
  }

  collect(item) {
    if (item.type === 'gold') {
      this.score += 3
      this.caught += 1
      this.golden++
      this.sound?.play('catch')
      this.addPop(item.x, item.y, 'gold', '+3')
      this.burst(item.x, item.y, '#ffd76e', 7)
    } else if (item.type === 'heart') {
      this.score += 2
      this.caught += 1
      this.sound?.play('happy')
      this.addPop(item.x, item.y, 'heart', '+2')
      this.burst(item.x, item.y, '#f28fa4', 6)
    } else if (item.type === 'rock') {
      this.score = Math.max(0, this.score - 1)
      this.sound?.play('miss')
      this.addPop(item.x, item.y, 'miss', '-1')
      this.burst(item.x, item.y, '#a7a49b', 4)
    } else {
      this.score += 1
      this.caught += 1
      this.sound?.play('catch')
      this.addPop(item.x, item.y, 'catch', '+1')
      this.burst(item.x, item.y, '#e47f7c', 5)
    }
  }

  addPop(x, y, kind, text) {
    this.pops.push({ x, y, kind, text, life: 1 })
  }

  burst(x, y, color, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2
      const s = 40 + Math.random() * 90
      this.pops.push({
        x, y, kind: 'spark', text: '', life: 1,
        vx: Math.cos(a) * s, vy: Math.sin(a) * s, color
      })
    }
  }

  finish() {
    if (this.finished) return
    this.finished = true
    this.running = false
    this.abort.abort()
    this.onEnd?.({
      score: this.score,
      caught: this.caught,
      golden: this.golden,
      misses: this.misses
    })
  }

  stop() {
    this.running = false
    this.abort.abort()
  }

  draw() {
    const ctx = this.ctx
    const W = this.width, H = this.height
    // sunset garden
    const sky = ctx.createLinearGradient(0, 0, 0, H)
    sky.addColorStop(0, '#ffe2b4')
    sky.addColorStop(0.5, '#f9bd91')
    sky.addColorStop(1, '#e8a37c')
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, W, H)

    // sun
    const sun = ctx.createRadialGradient(W * 0.72, 92, 6, W * 0.72, 92, 82)
    sun.addColorStop(0, 'rgba(255,243,193,.95)')
    sun.addColorStop(0.35, 'rgba(255,221,150,.45)')
    sun.addColorStop(1, 'rgba(255,221,150,0)')
    ctx.fillStyle = sun
    ctx.fillRect(W * 0.72 - 90, 0, 180, 190)
    ctx.fillStyle = '#fff0b8'
    ctx.beginPath(); ctx.arc(W * 0.72, 92, 30, 0, Math.PI * 2); ctx.fill()

    // hills
    ctx.fillStyle = '#c6b07a'
    ctx.beginPath()
    ctx.moveTo(0, H * 0.55)
    ctx.quadraticCurveTo(W * 0.18, H * 0.42, W * 0.4, H * 0.54)
    ctx.quadraticCurveTo(W * 0.63, H * 0.65, W, H * 0.48)
    ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill()
    ctx.fillStyle = '#9bb072'
    ctx.beginPath()
    ctx.moveTo(0, H * 0.68)
    ctx.quadraticCurveTo(W * 0.3, H * 0.57, W * 0.55, H * 0.68)
    ctx.quadraticCurveTo(W * 0.8, H * 0.78, W, H * 0.64)
    ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill()
    ctx.fillStyle = '#7f9e5f'
    ctx.fillRect(0, H * 0.8, W, H * 0.2)

    // bushes
    const bushes = [[70, H * 0.73, 0.9], [W - 80, H * 0.71, 1.1], [W * 0.48, H * 0.78, 0.75]]
    bushes.forEach(([bx, by, s], i) => {
      ctx.fillStyle = i % 2 ? '#688a55' : '#75975c'
      ctx.beginPath()
      ctx.ellipse(bx, by, 58 * s, 26 * s, 0, 0, Math.PI * 2)
      ctx.ellipse(bx - 32 * s, by + 6 * s, 32 * s, 18 * s, 0, 0, Math.PI * 2)
      ctx.ellipse(bx + 34 * s, by + 5 * s, 35 * s, 17 * s, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#d9747e'
      for (let b = 0; b < 4; b++) {
        ctx.beginPath()
        ctx.arc(bx - 30 * s + b * 19 * s, by - 4 * s + (b % 2) * 8 * s, 3.2 * s, 0, Math.PI * 2)
        ctx.fill()
      }
    })

    // fence
    ctx.strokeStyle = 'rgba(255,241,215,.5)'
    ctx.lineWidth = 5
    for (let x = 20; x < W; x += 58) {
      ctx.beginPath(); ctx.moveTo(x, H * 0.66); ctx.lineTo(x, H * 0.74); ctx.stroke()
    }
    ctx.lineWidth = 3.5
    ctx.beginPath(); ctx.moveTo(0, H * 0.685); ctx.lineTo(W, H * 0.685); ctx.stroke()

    // ground details
    ctx.strokeStyle = 'rgba(64,94,55,.35)'
    ctx.lineWidth = 1.4
    for (let i = 0; i < 40; i++) {
      const gx = (i * 67) % W
      const gy = H * 0.84 + ((i * 31) % 40)
      ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx + 3, gy - 6); ctx.moveTo(gx + 6, gy); ctx.lineTo(gx + 6, gy - 7); ctx.stroke()
    }

    // items
    for (const item of this.items) {
      ctx.save()
      ctx.translate(item.x, item.y)
      ctx.rotate(Math.sin(item.spin) * 0.15)
      if (item.type === 'berry') {
        ctx.fillStyle = '#cf5f69'
        ctx.strokeStyle = '#8f3d4a'
        ctx.lineWidth = 2
        ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
        ctx.fillStyle = 'rgba(255,255,255,.45)'
        ctx.beginPath(); ctx.ellipse(-4, -4, 3.4, 2.4, -0.5, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = '#639759'
        ctx.beginPath(); ctx.ellipse(5, -12, 6, 3, 0.4, 0, Math.PI * 2); ctx.fill()
      } else if (item.type === 'gold') {
        const g = ctx.createRadialGradient(0, 0, 2, 0, 0, 20)
        g.addColorStop(0, 'rgba(255,244,167,.75)')
        g.addColorStop(1, 'rgba(255,214,102,0)')
        ctx.fillStyle = g
        ctx.fillRect(-22, -22, 44, 44)
        ctx.fillStyle = '#f6cd62'
        ctx.strokeStyle = '#b9862e'
        ctx.lineWidth = 2
        ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
        ctx.fillStyle = '#fff3b0'
        starShape(ctx, 0, 0, 6, 2.6, 5)
        ctx.fill()
      } else if (item.type === 'heart') {
        ctx.fillStyle = '#ee8ba6'
        ctx.strokeStyle = '#b45d7a'
        ctx.lineWidth = 2
        heartShape(ctx, 12)
        ctx.fill(); ctx.stroke()
      } else {
        ctx.fillStyle = '#9a978c'
        ctx.strokeStyle = '#6e6c63'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.ellipse(0, 0, 13, 11, 0.2, 0, Math.PI * 2)
        ctx.fill(); ctx.stroke()
        ctx.fillStyle = 'rgba(255,255,255,.22)'
        ctx.beginPath(); ctx.ellipse(-4, -4, 4, 2.4, -0.4, 0, Math.PI * 2); ctx.fill()
      }
      ctx.restore()
    }

    // basket
    const bx = this.playerX
    const by = H - 58
    ctx.fillStyle = 'rgba(76,50,32,.18)'
    ctx.beginPath(); ctx.ellipse(bx, by + 43, 52, 8, 0, 0, Math.PI * 2); ctx.fill()
    // basket back rim
    ctx.fillStyle = '#b8814f'
    ctx.strokeStyle = '#7e5634'
    ctx.lineWidth = 3
    ctx.beginPath(); ctx.ellipse(bx, by, 50, 15, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
    ctx.fillStyle = '#e3b57c'
    ctx.beginPath(); ctx.ellipse(bx, by - 2, 43, 10, 0, 0, Math.PI * 2); ctx.fill()
    // front body
    ctx.fillStyle = '#c8935e'
    ctx.strokeStyle = '#7e5634'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(bx - 47, by + 2)
    ctx.quadraticCurveTo(bx - 38, by + 38, bx, by + 38)
    ctx.quadraticCurveTo(bx + 38, by + 38, bx + 47, by + 2)
    ctx.closePath(); ctx.fill(); ctx.stroke()
    // weave
    ctx.strokeStyle = 'rgba(110,72,40,.5)'
    ctx.lineWidth = 1.5
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath()
      ctx.moveTo(bx + i * 13, by + 7)
      ctx.lineTo(bx + i * 9, by + 30)
      ctx.stroke()
    }
    for (let i = 0; i < 3; i++) {
      ctx.beginPath()
      ctx.ellipse(bx, by + 12 + i * 8, 42 - i * 6, 4, 0, 0, Math.PI)
      ctx.stroke()
    }
    // little sprout on the basket
    ctx.strokeStyle = '#4f8b55'
    ctx.lineWidth = 2
    ctx.beginPath(); ctx.moveTo(bx + 40, by - 4); ctx.quadraticCurveTo(bx + 44, by - 16, bx + 41, by - 23); ctx.stroke()
    ctx.fillStyle = '#7fbb70'
    ctx.beginPath(); ctx.ellipse(bx + 38, by - 18, 8, 4, -0.5, 0, Math.PI * 2); ctx.fill()

    // pops
    for (const p of this.pops) {
      ctx.save()
      ctx.globalAlpha = Math.max(0, p.life)
      if (p.kind === 'spark') {
        ctx.fillStyle = p.color || '#ffe28a'
        ctx.beginPath(); ctx.arc(p.x, p.y, 2.6, 0, Math.PI * 2); ctx.fill()
      } else {
        ctx.font = '800 18px "Nunito", sans-serif'
        ctx.textAlign = 'center'
        ctx.fillStyle = p.kind === 'miss' ? '#9a4f4f' : p.kind === 'gold' ? '#a9771e' : '#8b4a55'
        ctx.fillText(p.text, p.x, p.y)
      }
      ctx.restore()
    }

    // HUD
    ctx.fillStyle = 'rgba(255,250,238,.88)'
    ctx.strokeStyle = 'rgba(121,85,57,.35)'
    ctx.lineWidth = 2
    roundRect(ctx, 18, 16, 142, 38, 12)
    ctx.fill(); ctx.stroke()
    ctx.fillStyle = '#5d4837'
    ctx.font = '800 14px "Nunito", sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('BERRIES', 32, 33)
    ctx.font = '800 22px "Nunito", sans-serif'
    ctx.fillStyle = '#b45f54'
    ctx.fillText(String(this.score), 34, 51)
    if (this.golden) {
      ctx.fillStyle = '#b98932'
      ctx.font = '700 12px "Nunito", sans-serif'
      ctx.fillText(`★ ${this.golden}`, 86, 50)
    }

    // timer
    const bw = W - 210
    ctx.fillStyle = 'rgba(255,250,238,.72)'
    roundRect(ctx, 176, 24, bw, 14, 7)
    ctx.fill()
    const frac = this.timeLeft / this.total
    const g = ctx.createLinearGradient(176, 0, 176 + bw, 0)
    g.addColorStop(0, '#8fc386')
    g.addColorStop(0.6, '#e8c268')
    g.addColorStop(1, '#e0836f')
    ctx.fillStyle = g
    roundRect(ctx, 176, 24, Math.max(14, bw * frac), 14, 7)
    ctx.fill()
    ctx.strokeStyle = 'rgba(121,85,57,.28)'
    ctx.lineWidth = 1.5
    roundRect(ctx, 176, 24, bw, 14, 7)
    ctx.stroke()
    ctx.fillStyle = '#6d5743'
    ctx.font = '800 12px "Nunito", sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(`${Math.ceil(this.timeLeft)}s`, W - 24, 36)

    if (this.timeLeft > this.total - 2.5) {
      ctx.fillStyle = 'rgba(70,48,34,.35)'
      ctx.fillRect(0, 0, W, H)
      ctx.fillStyle = '#5c4633'
      ctx.font = '800 34px "Nunito", sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Catch the berries!', W / 2, H / 2 - 8)
      ctx.font = '600 17px "Nunito", sans-serif'
      ctx.fillText('Drag or use arrow keys', W / 2, H / 2 + 26)
    }
  }
}

/* ------------------------------------------------------------------ */
/* Pulse Training                                                      */
/* ------------------------------------------------------------------ */

export function mountTrainGame(container, { sound, onFinish } = {}) {
  container.innerHTML = `
    <div class="train-game">
      <div class="train-top">
        <span class="train-round">Beat <b>1</b> / 3</span>
        <span class="train-score-copy">Follow the rhythm</span>
      </div>
      <div class="timing-track" aria-hidden="true">
        <div class="timing-perfect"></div>
        <div class="timing-zone"></div>
        <div class="timing-marker"><span></span></div>
      </div>
      <p class="train-copy">Tap when the glowing leaf drifts through the gold zone.</p>
      <button class="primary-btn train-hit" type="button">Tap!</button>
      <div class="train-feedback" aria-live="polite"></div>
    </div>
  `
  const marker = container.querySelector('.timing-marker')
  const zone = container.querySelector('.timing-zone')
  const perfect = container.querySelector('.timing-perfect')
  const hitBtn = container.querySelector('.train-hit')
  const feedback = container.querySelector('.train-feedback')
  const roundEl = container.querySelector('.train-round b')
  const abort = new AbortController()
  let round = 1
  let perfects = 0
  let goods = 0
  let misses = 0
  let position = 0
  let direction = 1
  let speed = 0.92
  let running = true
  let waiting = false
  let zoneCenter = 0.5
  let zoneWidth = 0.26
  let perfectWidth = 0.085
  let raf = 0
  let last = performance.now()

  const placeZone = () => {
    zoneCenter = 0.2 + Math.random() * 0.6
    zoneWidth = 0.24 + Math.random() * 0.06
    perfectWidth = 0.075 + Math.random() * 0.025
    zone.style.left = `${(zoneCenter - zoneWidth / 2) * 100}%`
    zone.style.width = `${zoneWidth * 100}%`
    perfect.style.left = `${(zoneCenter - perfectWidth / 2) * 100}%`
    perfect.style.width = `${perfectWidth * 100}%`
  }

  const loop = now => {
    if (!running) return
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now
    if (!waiting) {
      position += direction * speed * dt
      if (position > 1) { position = 1; direction = -1 }
      if (position < 0) { position = 0; direction = 1 }
      marker.style.left = `${position * 100}%`
    }
    raf = requestAnimationFrame(loop)
  }

  const judge = () => {
    if (!running || waiting) return
    waiting = true
    const dist = Math.abs(position - zoneCenter)
    let kind = 'miss'
    if (dist <= perfectWidth / 2) { kind = 'perfect'; perfects++; speed += 0.1 }
    else if (dist <= zoneWidth / 2) { kind = 'good'; goods++ }
    else misses++
    if (kind === 'perfect') {
      feedback.textContent = 'Perfect!'
      feedback.className = 'train-feedback is-perfect'
      sound?.play('perfect')
      zone.classList.add('flash')
    } else if (kind === 'good') {
      feedback.textContent = 'Nice!'
      feedback.className = 'train-feedback is-good'
      sound?.play('good')
      zone.classList.add('flash')
    } else {
      feedback.textContent = 'Just a little off...'
      feedback.className = 'train-feedback is-miss'
      sound?.play('miss')
    }
    hitBtn.disabled = true
    setTimeout(() => {
      if (!running) return
      zone.classList.remove('flash')
      feedback.textContent = ''
      feedback.className = 'train-feedback'
      if (round >= 3) {
        finish()
        return
      }
      round++
      roundEl.textContent = String(round)
      position = 0
      direction = 1
      placeZone()
      waiting = false
      hitBtn.disabled = false
      last = performance.now()
    }, kind === 'miss' ? 780 : 620)
  }

  const finish = () => {
    if (!running) return
    running = false
    cancelAnimationFrame(raf)
    abort.abort()
    onFinish?.({ perfects, goods, misses, score: perfects * 3 + goods * 2 })
  }

  hitBtn.addEventListener('click', judge, { signal: abort.signal })
  window.addEventListener('keydown', e => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      judge()
    }
  }, { signal: abort.signal })
  placeZone()
  marker.style.left = '0%'
  raf = requestAnimationFrame(loop)

  return {
    stop() {
      running = false
      cancelAnimationFrame(raf)
      abort.abort()
    }
  }
}

/* ------------------------------------------------------------------ */
/* Bubble Bath                                                         */
/* ------------------------------------------------------------------ */

export function mountBathGame(container, { stage, branch, sound, onFinish } = {}) {
  const bubbles = [
    [18, 30, 44], [43, 18, 38], [68, 28, 48], [82, 54, 34],
    [27, 60, 36], [57, 48, 46], [39, 76, 32], [72, 78, 40]
  ]
  container.innerHTML = `
    <div class="bath-game">
      <div class="bath-top">
        <span>Bubble bath</span>
        <span class="bath-count"><b>0</b> / ${bubbles.length}</span>
      </div>
      <div class="bath-scene">
        <canvas class="bath-pet" width="180" height="180" aria-hidden="true"></canvas>
        <div class="bath-tub" aria-hidden="true"></div>
        <div class="bath-foam" aria-hidden="true"></div>
        <div class="bath-bubbles">
          ${bubbles.map(([x, y, size], i) => `<button class="bath-bubble" style="left:${x}%;top:${y}%;width:${size}px;height:${size}px" data-bubble="${i}" aria-label="Pop bubble"></button>`).join('')}
        </div>
      </div>
      <p class="bath-copy">Pop every bubble before the water goes cold.</p>
      <div class="bath-timer"><i></i></div>
    </div>
  `
  const scene = container.querySelector('.bath-scene')
  const canvas = container.querySelector('.bath-pet')
  const countEl = container.querySelector('.bath-count b')
  const timerFill = container.querySelector('.bath-timer i')
  const abort = new AbortController()
  let popped = 0
  let timeLeft = 9
  let running = true
  let last = performance.now()
  let raf = 0
  let doneTimer = 0

  // draw the bather
  const off = document.createElement('canvas')
  off.width = 80; off.height = 80
  const octx = off.getContext('2d')
  drawCreature(octx, { stage, branch, mood: 'clean', t: 1.2, seed: 2.4 })
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(off, 0, 0, 180, 180)
  // suds in front of the creature
  ctx.fillStyle = 'rgba(255,255,255,.8)'
  for (let i = 0; i < 10; i++) {
    ctx.beginPath()
    ctx.arc(18 + i * 17, 144 + Math.sin(i * 2) * 6, 9 + (i % 3) * 4, 0, Math.PI * 2)
    ctx.fill()
  }

  const tick = now => {
    if (!running) return
    const elapsed = (now - last) / 1000
    const dt = Math.min(0.05, elapsed)
    last = now
    if (!doneTimer) {
      timeLeft -= Math.min(0.5, elapsed)
      timerFill.style.width = `${Math.max(0, timeLeft / 9) * 100}%`
      if (timeLeft <= 0) finish()
    }
    raf = requestAnimationFrame(tick)
  }

  const pop = e => {
    const btn = e.target.closest('.bath-bubble')
    if (!btn || !running || btn.classList.contains('is-popped')) return
    btn.classList.add('is-popped')
    popped++
    countEl.textContent = String(popped)
    sound?.play('pop')
    if (popped === bubbles.length) {
      doneTimer = setTimeout(() => finish(), 500)
    }
  }

  const finish = () => {
    if (!running) return
    running = false
    if (doneTimer) clearTimeout(doneTimer)
    cancelAnimationFrame(raf)
    abort.abort()
    onFinish?.({ popped, total: bubbles.length })
  }

  scene.addEventListener('pointerdown', pop, { signal: abort.signal })
  raf = requestAnimationFrame(tick)

  return {
    stop() {
      running = false
      if (doneTimer) clearTimeout(doneTimer)
      cancelAnimationFrame(raf)
      abort.abort()
    }
  }
}

/* ------------------------------------------------------------------ */

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function starShape(ctx, x, y, outer, inner, points) {
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

function heartShape(ctx, size) {
  ctx.beginPath()
  ctx.moveTo(0, size * 0.55)
  ctx.bezierCurveTo(-size * 1.1, -size * 0.45, -size * 0.62, -size * 1.16, 0, -size * 0.55)
  ctx.bezierCurveTo(size * 0.62, -size * 1.16, size * 1.1, -size * 0.45, 0, size * 0.55)
  ctx.closePath()
}
