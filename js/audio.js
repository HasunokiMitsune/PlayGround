// A tiny generative music box + sound effects, built on Web Audio.

export class Sound {
  constructor({ muted = false } = {}) {
    this.muted = muted
    this.ctx = null
    this.master = null
    this.musicGain = null
    this.sfxGain = null
    this.delay = null
    this.timer = null
    this.step = 0
    this.nextTime = 0
    this.mood = 'day'
    this.unlocked = false
    this.volume = 0.5
  }

  unlock() {
    if (this.unlocked) return
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return
    try {
      this.ctx = new Ctx()
      this.master = this.ctx.createGain()
      this.master.gain.value = this.muted ? 0 : this.volume
      const comp = this.ctx.createDynamicsCompressor()
      comp.threshold.value = -18
      comp.knee.value = 18
      comp.ratio.value = 3
      comp.attack.value = 0.008
      comp.release.value = 0.22
      this.master.connect(comp)
      comp.connect(this.ctx.destination)

      this.musicGain = this.ctx.createGain()
      this.musicGain.gain.value = 0.32
      this.musicGain.connect(this.master)

      this.sfxGain = this.ctx.createGain()
      this.sfxGain.gain.value = 0.75
      this.sfxGain.connect(this.master)

      this.delay = this.ctx.createDelay(0.6)
      this.delay.delayTime.value = 0.31
      const feedback = this.ctx.createGain()
      feedback.gain.value = 0.22
      const wet = this.ctx.createGain()
      wet.gain.value = 0.16
      this.delay.connect(feedback); feedback.connect(this.delay)
      this.delay.connect(wet); wet.connect(this.musicGain)

      this.unlocked = true
      if (!this.muted) this.startMusic()
    } catch {
      this.ctx = null
    }
  }

  setMuted(muted) {
    this.muted = muted
    if (!this.ctx) {
      if (!muted) this.unlock()
      return
    }
    const now = this.ctx.currentTime
    this.master.gain.cancelScheduledValues(now)
    this.master.gain.setTargetAtTime(muted ? 0 : this.volume, now, 0.05)
    if (!muted) {
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {})
      this.startMusic()
    }
  }

  setMood(mood) {
    if (mood === this.mood) return
    this.mood = mood
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(mood === 'night' ? 0.22 : 0.32, this.ctx.currentTime, 1.2)
    }
  }

  startMusic() {
    if (!this.ctx || this.timer) return
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {})
    this.nextTime = this.ctx.currentTime + 0.15
    this.timer = setInterval(() => this.schedule(), 110)
  }

  stopMusic() {
    if (this.timer) clearInterval(this.timer)
    this.timer = null
  }

  schedule() {
    if (!this.ctx) return
    const lookahead = this.ctx.currentTime + 0.35
    while (this.nextTime < lookahead) {
      this.playStep(this.step, this.nextTime)
      this.nextTime += this.mood === 'night' ? 0.42 : 0.345
      this.step = (this.step + 1) % 32
    }
  }

  // A gentle 8-bar loop in C, with a sparse night variation.
  playStep(step, when) {
    const night = this.mood === 'night'
    const chords = [
      [48, 52, 55, 59], // Cmaj7
      [45, 48, 52, 55], // Am7
      [41, 45, 48, 52], // Fmaj7
      [43, 47, 50, 53]  // G7
    ]
    const bar = Math.floor(step / 8) % 4
    const chord = chords[bar]
    const inBar = step % 8

    if (inBar === 0) {
      this.tone({ freq: mtof(chord[0] - 12), type: 'sine', when, dur: 1.5, gain: 0.20, attack: 0.02, dest: this.musicGain })
      this.tone({ freq: mtof(chord[2]), type: 'sine', when: when + 0.02, dur: 1.2, gain: 0.035, attack: 0.35, dest: this.musicGain })
      this.tone({ freq: mtof(chord[3]), type: 'triangle', when: when + 0.02, dur: 1.1, gain: 0.028, attack: 0.3, dest: this.musicGain })
    }
    if (inBar === 4) {
      this.tone({ freq: mtof(chord[1] - 12), type: 'sine', when, dur: 0.8, gain: 0.13, attack: 0.02, dest: this.musicGain })
    }

    const pattern = night
      ? [12, null, null, 7, null, 16, null, null]
      : [12, null, 16, 19, null, 16, 14, null]
    const note = pattern[inBar]
    if (note != null) {
      const scale = [0, 2, 4, 7, 9, 12, 14, 16, 19]
      const pitch = chord[note === 12 ? 2 : note === 16 ? 3 : 1] + 12 + (note === 19 ? 2 : 0)
      this.tone({
        freq: mtof(pitch), type: 'triangle', when, dur: night ? 0.65 : 0.42,
        gain: night ? 0.055 : 0.075, attack: 0.008, dest: this.musicGain, delay: true
      })
      if (!night && step % 8 === 2) {
        this.tone({ freq: mtof(pitch + 12), type: 'sine', when: when + 0.13, dur: 0.22, gain: 0.018, attack: 0.01, dest: this.musicGain })
      }
    }
    // A soft, brushed shaker for a little forward motion.
    if (!night && (inBar === 2 || inBar === 6)) {
      this.noise({ when, dur: 0.05, gain: 0.012, filter: 5200, dest: this.musicGain })
    }
  }

  tone({ freq, freqEnd, type = 'sine', when = 0, dur = 0.2, gain = 0.1, attack = 0.005, dest, delay = false }) {
    if (!this.ctx) return
    const t = when || this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const g = this.ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(Math.max(20, freq), t)
    if (freqEnd) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), t + dur)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t + Math.max(0.005, attack))
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    osc.connect(g)
    g.connect(dest || this.sfxGain)
    if (delay && this.delay) g.connect(this.delay)
    osc.start(t)
    osc.stop(t + dur + 0.05)
  }

  noise({ when = 0, dur = 0.1, gain = 0.1, filter = 2000, dest } = {}) {
    if (!this.ctx) return
    const t = when || this.ctx.currentTime
    const length = Math.max(1, Math.floor(this.ctx.sampleRate * dur))
    const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length)
    const src = this.ctx.createBufferSource()
    src.buffer = buffer
    const biquad = this.ctx.createBiquadFilter()
    biquad.type = 'bandpass'
    biquad.frequency.value = filter
    biquad.Q.value = 0.8
    const g = this.ctx.createGain()
    g.gain.setValueAtTime(gain, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    src.connect(biquad); biquad.connect(g); g.connect(dest || this.sfxGain)
    src.start(t)
  }

  play(name) {
    if (!this.ctx || this.muted) return
    const now = this.ctx.currentTime
    switch (name) {
      case 'tap':
        this.tone({ freq: 720, freqEnd: 980, type: 'square', when: now, dur: 0.05, gain: 0.028 })
        break
      case 'click':
        this.tone({ freq: 520, freqEnd: 660, type: 'triangle', when: now, dur: 0.06, gain: 0.05 })
        break
      case 'open':
        this.tone({ freq: 440, freqEnd: 880, type: 'sine', when: now, dur: 0.16, gain: 0.05 })
        break
      case 'close':
        this.tone({ freq: 700, freqEnd: 360, type: 'sine', when: now, dur: 0.13, gain: 0.04 })
        break
      case 'eat':
        this.noise({ when: now, dur: 0.09, gain: 0.09, filter: 900 })
        this.noise({ when: now + 0.1, dur: 0.08, gain: 0.07, filter: 700 })
        this.tone({ freq: 300, freqEnd: 420, type: 'triangle', when: now + 0.02, dur: 0.14, gain: 0.05 })
        break
      case 'happy':
        [523, 659, 784].forEach((f, i) => this.tone({ freq: f, type: 'triangle', when: now + i * 0.075, dur: 0.2, gain: 0.045 }))
        break
      case 'pet':
        [784, 988, 1175].forEach((f, i) => this.tone({ freq: f, type: 'sine', when: now + i * 0.055, dur: 0.16, gain: 0.032 }))
        break
      case 'clean':
        this.noise({ when: now, dur: 0.25, gain: 0.05, filter: 3200 });
        [1047, 1319, 1568, 2093].forEach((f, i) => this.tone({ freq: f, type: 'sine', when: now + i * 0.05, dur: 0.18, gain: 0.022 }))
        break
      case 'pop':
        this.tone({ freq: 380 + Math.random() * 300, freqEnd: 900 + Math.random() * 500, type: 'sine', when: now, dur: 0.07, gain: 0.05 })
        break
      case 'catch':
        this.tone({ freq: 880, type: 'triangle', when: now, dur: 0.1, gain: 0.05 })
        this.tone({ freq: 1320, type: 'sine', when: now + 0.05, dur: 0.12, gain: 0.035 })
        break
      case 'miss':
        this.tone({ freq: 190, freqEnd: 120, type: 'sawtooth', when: now, dur: 0.18, gain: 0.045 })
        break
      case 'sleep':
        [440, 349, 262].forEach((f, i) => this.tone({ freq: f, type: 'sine', when: now + i * 0.16, dur: 0.4, gain: 0.03 }))
        break
      case 'wake':
        [392, 523, 659].forEach((f, i) => this.tone({ freq: f, type: 'triangle', when: now + i * 0.08, dur: 0.22, gain: 0.04 }))
        break
      case 'evolve':
        [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => {
          this.tone({ freq: f, type: 'triangle', when: now + i * 0.11, dur: 0.5, gain: 0.055 })
          this.tone({ freq: f / 2, type: 'sine', when: now + i * 0.11, dur: 0.45, gain: 0.03 })
        })
        break
      case 'hatch':
        this.noise({ when: now, dur: 0.18, gain: 0.08, filter: 2400 });
        [587, 740, 880, 1109, 1319].forEach((f, i) => this.tone({ freq: f, type: 'triangle', when: now + 0.08 + i * 0.09, dur: 0.35, gain: 0.05 }))
        break
      case 'good':
        [659, 880].forEach((f, i) => this.tone({ freq: f, type: 'triangle', when: now + i * 0.08, dur: 0.2, gain: 0.04 }))
        break
      case 'perfect':
        [880, 1175, 1568, 2093].forEach((f, i) => this.tone({ freq: f, type: 'sine', when: now + i * 0.06, dur: 0.28, gain: 0.04 }))
        break
      case 'error':
        this.tone({ freq: 240, freqEnd: 200, type: 'square', when: now, dur: 0.12, gain: 0.03 })
        break
    }
  }
}

function mtof(note) {
  return 440 * Math.pow(2, (note - 69) / 12)
}
