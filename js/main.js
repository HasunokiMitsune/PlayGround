import { Scene } from './scene.js'
import { Sound } from './audio.js'
import { drawCreature } from './creature.js'
import { BerryCatch, mountTrainGame, mountBathGame } from './minigames.js'
import {
  SAVE_KEY, STATS, FOODS, STAGES, BRANCHES, ACHIEVEMENTS, TIPS,
  PET_LINES, IDLE_LINES, HUNGRY_LINES, SLEEPY_LINES, DIRTY_LINES, SAD_LINES, CLOCK_LABELS
} from './data.js'

/* ------------------------------------------------------------------ */
/* Elements                                                            */
/* ------------------------------------------------------------------ */

const $ = sel => document.querySelector(sel)
const el = {
  scene: $('#scene'),
  sceneWrap: $('#sceneWrap'),
  petName: $('#petName'),
  stageTag: $('#stageTag'),
  petAvatar: $('#petAvatar'),
  clockText: $('#clockText'),
  clockIcon: $('#clockIcon'),
  bubble: $('#bubble'),
  soundBtn: $('#soundBtn'),
  helpBtn: $('#helpBtn'),
  diaryBtn: $('#diaryBtn'),
  sickBanner: $('#sickBanner'),
  medicineBtn: $('#medicineBtn'),
  hatchPanel: $('#hatchPanel'),
  carePanel: $('#carePanel'),
  warmBtn: $('#warmBtn'),
  warmPips: $('#warmPips'),
  growthLabel: $('#growthLabel'),
  growthFill: $('#growthFill'),
  growthTrack: $('#growthTrack'),
  hint: $('#hint'),
  saveState: $('#saveState'),
  stats: $('#stats'),
  actions: $('#actions'),
  overlay: $('#overlay'),
  dialog: $('#dialog')
}

const statEls = {}
for (const stat of STATS) {
  const cap = stat.key[0].toUpperCase() + stat.key.slice(1)
  statEls[stat.key] = {
    root: document.querySelector(`.stat[data-stat="${stat.key}"]`),
    value: $(`#stat${cap}`),
    fill: $(`#fill${cap}`)
  }
}

const actionEls = {}
document.querySelectorAll('.action').forEach(btn => {
  actionEls[btn.dataset.action] = {
    btn,
    label: btn.querySelector('.action-label'),
    ico: btn.querySelector('.action-ico use')
  }
})

/* ------------------------------------------------------------------ */
/* State                                                               */
/* ------------------------------------------------------------------ */

const CHILD_AGE = 90
const CHILD_GROWTH = 6
const ADULT_AGE = 300
const ADULT_GROWTH = 24

function defaultState() {
  return {
    v: 1,
    hatched: false,
    name: '',
    stage: 'egg',
    branch: 'verdant',
    warm: 0,
    stats: { food: 76, joy: 78, energy: 86, clean: 94 },
    bond: 10,
    growth: 0,
    care: { snack: 0, play: 0, bath: 0, rest: 0, train: 0 },
    totalCare: 0,
    createdAt: Date.now(),
    hatchedAt: null,
    lastSeen: Date.now(),
    worldMinutes: 8 * 60,
    day: 1,
    asleep: false,
    sick: false,
    sickTimer: 0,
    muted: false,
    achievements: [],
    bestCatch: 0,
    diary: []
  }
}

function loadState() {
  const base = defaultState()
  try {
    const raw = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null')
    if (!raw || raw.v !== 1) return base
    const num = (v, fallback) => Number.isFinite(Number(v)) ? Number(v) : fallback
    const clamped = (v, fallback) => clamp(num(v, fallback), 0, 100)
    return {
      ...base,
      ...raw,
      name: typeof raw.name === 'string' ? raw.name.slice(0, 12) : '',
      stage: ['egg', 'baby', 'child', 'adult'].includes(raw.stage) ? raw.stage : 'baby',
      branch: BRANCHES[raw.branch] ? raw.branch : 'verdant',
      hatched: Boolean(raw.hatched),
      asleep: Boolean(raw.asleep),
      sick: Boolean(raw.sick),
      muted: Boolean(raw.muted),
      warm: clamp(num(raw.warm, 0), 0, 3),
      worldMinutes: ((num(raw.worldMinutes, 480) % 1440) + 1440) % 1440,
      day: Math.max(1, Math.floor(num(raw.day, 1))),
      bond: clamped(raw.bond, base.bond),
      growth: Math.max(0, num(raw.growth, 0)),
      sickTimer: Math.max(0, num(raw.sickTimer, 0)),
      bestCatch: Math.max(0, num(raw.bestCatch, 0)),
      totalCare: Math.max(0, num(raw.totalCare, 0)),
      stats: {
        food: clamped(raw.stats?.food, base.stats.food),
        joy: clamped(raw.stats?.joy, base.stats.joy),
        energy: clamped(raw.stats?.energy, base.stats.energy),
        clean: clamped(raw.stats?.clean, base.stats.clean)
      },
      care: {
        snack: Math.max(0, num(raw.care?.snack, 0)),
        play: Math.max(0, num(raw.care?.play, 0)),
        bath: Math.max(0, num(raw.care?.bath, 0)),
        rest: Math.max(0, num(raw.care?.rest, 0)),
        train: Math.max(0, num(raw.care?.train, 0))
      },
      achievements: Array.isArray(raw.achievements) ? raw.achievements.filter(id => ACHIEVEMENTS.some(a => a.id === id)) : [],
      diary: Array.isArray(raw.diary) ? raw.diary.filter(d => d && typeof d.text === 'string').slice(-40) : [],
      lastSeen: num(raw.lastSeen, Date.now()),
      hatchedAt: raw.hatchedAt ? num(raw.hatchedAt, null) : null
    }
  } catch {
    return base
  }
}

let state = loadState()
const sound = new Sound({ muted: state.muted })
const scene = new Scene(el.scene)

let overlayOpen = false
let modalDismissible = true
let activeGame = null
let evolving = false
let lastFocus = null
let bubbleTimer = 0
let saveTimer = 0
let lastPetAt = 0
let lastTick = performance.now()
let lastSaveAt = Date.now()
let nextTipAt = Date.now() + 9000
let tipIndex = 0
let nextIdleAt = Date.now() + 32000
let pendingWelcome = null

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */

function clamp(v, min = 0, max = 100) {
  return Math.min(max, Math.max(min, Number(v) || 0))
}

function esc(text) {
  return String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)]
}

function statSnapshot() {
  return { ...state.stats }
}

function speciesName() {
  if (!state.hatched) return 'Mystery Egg'
  if (state.stage === 'adult') return BRANCHES[state.branch]?.name || STAGES.adult.label
  return STAGES[state.stage]?.label || 'Mossling'
}

function speciesBlurb() {
  if (!state.hatched) return 'A warm little mystery, waiting for you.'
  if (state.stage === 'adult') return BRANCHES[state.branch]?.blurb || STAGES.adult.tagline
  return STAGES[state.stage]?.tagline || ''
}

function avatarIcon() {
  if (state.stage === 'adult') {
    if (state.branch === 'bloom') return '#i-flower'
    if (state.branch === 'zephyr') return '#i-spark'
    if (state.branch === 'lumen') return '#i-moon'
    return '#i-leaf'
  }
  return '#i-leaf'
}

function ageSeconds() {
  return state.hatchedAt ? Math.max(0, (Date.now() - state.hatchedAt) / 1000) : 0
}

function ageText() {
  if (!state.hatched) return 'still an egg'
  const s = ageSeconds()
  if (s < 60) return 'under a minute'
  if (s < 3600) return `${Math.floor(s / 60)} min together`
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return `${h}h ${m}m together`
}

function awayText(mins) {
  if (mins < 60) return `${Math.max(1, Math.round(mins))} minutes`
  const h = Math.floor(mins / 60)
  const m = Math.round(mins % 60)
  return m ? `${h}h ${m}m` : `${h} hour${h === 1 ? '' : 's'}`
}

function stageProgress() {
  if (!state.hatched) return clamp((state.warm / 3) * 100)
  if (state.stage === 'baby') {
    const a = Math.min(1, ageSeconds() / CHILD_AGE)
    const g = Math.min(1, state.growth / CHILD_GROWTH)
    return clamp((a * 0.5 + g * 0.5) * 100)
  }
  if (state.stage === 'child') {
    const a = Math.min(1, ageSeconds() / ADULT_AGE)
    const g = Math.min(1, state.growth / ADULT_GROWTH)
    return clamp((a * 0.5 + g * 0.5) * 100)
  }
  return 100
}

function growthLabel() {
  if (!state.hatched) return 'Warmth'
  if (state.stage === 'baby') return 'Next leaf'
  if (state.stage === 'child') return 'First bloom'
  return 'In full bloom'
}

function clockText() {
  const h = Math.floor(state.worldMinutes / 60) % 24
  const m = Math.floor(state.worldMinutes % 60)
  const h12 = h % 12 || 12
  const suffix = h < 12 ? 'AM' : 'PM'
  return `Day ${state.day} · ${h12}:${String(m).padStart(2, '0')} ${suffix}`
}

function isNight() {
  const h = Math.floor(state.worldMinutes / 60) % 24
  return h >= 19 || h < 6
}

function currentMood() {
  if (!state.hatched) return 'idle'
  if (state.asleep) return 'sleep'
  if (state.sick) return 'sick'
  if (state.stats.joy < 20) return 'sad'
  if (state.stats.clean < 16) return 'sad'
  return 'idle'
}

function markSaving() {
  if (!el.saveState) return
  clearTimeout(saveTimer)
  el.saveState.classList.add('is-saving')
  el.saveState.innerHTML = '<i></i> Saving'
  saveTimer = setTimeout(() => {
    el.saveState.classList.remove('is-saving')
    el.saveState.innerHTML = '<i></i> Saved'
  }, 650)
}

function save({ quiet = false } = {}) {
  state.lastSeen = Date.now()
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state))
    if (!quiet) markSaving()
  } catch {
    if (!quiet) {
      el.saveState.classList.remove('is-saving')
      el.saveState.innerHTML = '<i></i> Local save unavailable'
    }
  }
}

function addDiary(text) {
  state.diary.push({ t: Date.now(), text })
  if (state.diary.length > 40) state.diary = state.diary.slice(-40)
}

function syncScene() {
  scene.setState({
    stage: state.stage,
    branch: state.branch || 'verdant',
    mood: currentMood(),
    eggProgress: state.warm / 3,
    minutes: state.worldMinutes,
    name: state.name
  })
  sound.setMood(isNight() ? 'night' : 'day')
}

/* ------------------------------------------------------------------ */
/* Saving indicator / offline care                                     */
/* ------------------------------------------------------------------ */

function applyOfflineCare() {
  const now = Date.now()
  const awaySec = Math.max(0, (now - (state.lastSeen || now)) / 1000)
  let summary = null
  if (state.hatched && awaySec > 120) {
    const mins = Math.min(awaySec / 60, 180)
    const drops = {
      food: Math.round(mins * 2.4 * 0.3),
      joy: Math.round(mins * 1.9 * 0.25),
      clean: Math.round(mins * 1.5 * 0.3),
      energy: 0
    }
    if (state.asleep) {
      state.stats.energy = clamp(state.stats.energy + mins * 4)
    } else {
      drops.energy = Math.round(mins * 1.6 * 0.2)
    }
    state.stats.food = clamp(state.stats.food - drops.food)
    state.stats.joy = clamp(state.stats.joy - drops.joy)
    state.stats.clean = clamp(state.stats.clean - drops.clean)
    state.stats.energy = clamp(state.stats.energy - drops.energy)
    if (awaySec > 600) {
      summary = { mins, drops, asleep: state.asleep }
    }
    state.lastSeen = now
    save({ quiet: true })
  }
  state.lastSeen = now
  return summary
}

function toggleMute() {
  state.muted = !state.muted
  sound.setMuted(state.muted)
  el.soundBtn.classList.toggle('is-muted', state.muted)
  el.soundBtn.setAttribute('aria-label', state.muted ? 'Unmute sound' : 'Mute sound')
  save()
  toast(state.muted ? 'Sound off' : 'Sound on', state.muted ? 'mute' : 'sound')
}

/* ------------------------------------------------------------------ */
/* Speech, toast, achievements                                         */
/* ------------------------------------------------------------------ */

function say(text, ms = 4400) {
  if (!text) return
  clearTimeout(bubbleTimer)
  el.bubble.textContent = text
  el.bubble.classList.add('is-visible')
  bubbleTimer = setTimeout(() => el.bubble.classList.remove('is-visible'), ms)
}

function toast(text, icon = 'spark') {
  let stack = document.querySelector('.toast-stack')
  if (!stack) {
    stack = document.createElement('div')
    stack.className = 'toast-stack'
    document.body.appendChild(stack)
  }
  const node = document.createElement('div')
  node.className = 'toast'
  const symbol = ['leaf', 'flower', 'heart', 'spark', 'star', 'moon', 'bubble', 'berry', 'sound', 'mute'].includes(icon) ? icon : 'spark'
  node.innerHTML = `<svg class="ico"><use href="#i-${symbol}"/></svg><span>${esc(text)}</span>`
  stack.appendChild(node)
  setTimeout(() => node.remove(), 3500)
}

function unlockAchievement(id, { quiet = false } = {}) {
  const achievement = ACHIEVEMENTS.find(a => a.id === id)
  if (!achievement || state.achievements.includes(id)) return false
  state.achievements.push(id)
  addDiary(`Earned the “${achievement.name}” badge.`)
  if (!quiet) {
    toast(`Badge earned · ${achievement.name}`, achievement.icon)
    sound.play('perfect')
  }
  save()
  return true
}

function touchBond(amount) {
  const before = state.bond
  state.bond = clamp(state.bond + amount)
  if (before < 80 && state.bond >= 80) unlockAchievement('bestfriends')
}

function adjustStats(patch) {
  for (const [key, value] of Object.entries(patch)) {
    if (key in state.stats) state.stats[key] = clamp(state.stats[key] + value)
  }
}

function addCare(kind, growth = 0, bond = 0) {
  state.care[kind] = (state.care[kind] || 0) + 1
  state.totalCare++
  state.growth = Math.max(0, state.growth + growth)
  if (bond) touchBond(bond)
}

/* ------------------------------------------------------------------ */
/* Rendering the touch screen                                          */
/* ------------------------------------------------------------------ */

function advanceTip() {
  if (Date.now() < nextTipAt) return
  tipIndex = (tipIndex + 1) % TIPS.length
  nextTipAt = Date.now() + 16000
}

function hintText() {
  if (!state.hatched) return 'Tap the egg, or press W, to keep it warm.'
  if (state.asleep) return 'Dreaming... tap Wake whenever you are ready.'
  if (state.sick) return 'Not feeling well. A remedy should help.'
  if (state.stats.food < 30) return 'A tummy is rumbling. A snack would be lovely.'
  if (state.stats.clean < 30) return 'A little muddy. Bath time?'
  if (state.stats.energy < 26) return 'Eyelids drooping... a nap would help.'
  if (state.stats.joy < 30) return 'Feeling a little lonely. Play together?'
  if (state.stage === 'baby' && ageSeconds() >= CHILD_AGE && state.growth < CHILD_GROWTH) return 'So close to growing! A little more care.'
  if (state.stage === 'child' && ageSeconds() >= ADULT_AGE && state.growth < ADULT_GROWTH) return 'Almost ready to bloom. Keep caring for your friend.'
  return TIPS[tipIndex]
}

function renderUI() {
  const hatched = state.hatched
  el.hatchPanel.hidden = hatched
  el.carePanel.hidden = !hatched
  el.sickBanner.hidden = !(hatched && state.sick)
  el.petName.textContent = hatched ? (state.name || speciesName()) : 'Mystery Egg'
  el.stageTag.textContent = hatched ? speciesName() : 'Hatch me'
  const avatarUse = el.petAvatar.querySelector('use')
  if (avatarUse) avatarUse.setAttribute('href', avatarIcon())

  const progress = stageProgress()
  el.growthLabel.textContent = growthLabel()
  el.growthFill.style.width = `${progress.toFixed(1)}%`
  el.growthTrack.setAttribute('aria-valuenow', String(Math.round(progress)))

  for (const key in statEls) {
    const value = Math.round(state.stats[key])
    statEls[key].value.textContent = String(value)
    statEls[key].fill.style.width = `${clamp(value)}%`
    statEls[key].root.classList.toggle('is-low', value < 26)
  }

  el.clockText.textContent = clockText()
  const clockUse = el.clockIcon.querySelector('use')
  if (clockUse) clockUse.setAttribute('href', isNight() ? '#i-moon' : '#i-sun')

  for (const [key, action] of Object.entries(actionEls)) {
    const isRest = key === 'rest'
    action.btn.disabled = !hatched || (state.asleep && !isRest)
    action.btn.classList.toggle('is-active', hatched && isRest && state.asleep)
    if (isRest) {
      action.label.textContent = state.asleep ? 'Wake' : 'Nap'
      action.btn.setAttribute('aria-label', state.asleep ? 'Wake up' : 'Tuck in for a nap')
      action.btn.title = state.asleep ? 'Wake up (N)' : 'Nap (N)'
    }
  }

  const lowCount = Object.values(state.stats).filter(v => v < 26).length
  el.stats.classList.toggle('is-needy', lowCount > 0)
  el.hint.textContent = hintText()
  el.hatchPanel.classList.toggle('is-ready', state.warm >= 3)

  const pips = [...el.warmPips.children]
  pips.forEach((pip, i) => pip.classList.toggle('is-on', i < state.warm))
  el.warmBtn.disabled = !hatched ? state.warm >= 3 : false

  syncScene()
}

/* ------------------------------------------------------------------ */
/* Simulation tick                                                     */
/* ------------------------------------------------------------------ */

function tick() {
  const now = performance.now()
  let dt = (now - lastTick) / 1000
  lastTick = now
  if (document.hidden) return
  dt = Math.min(1, Math.max(0, dt))

  if (!overlayOpen && !evolving) {
    state.worldMinutes += dt * 2
    if (state.worldMinutes >= 1440) {
      state.worldMinutes -= 1440
      state.day++
      addDiary(`A new day dawned. Day ${state.day}.`)
    }

    if (state.hatched) {
      const asleep = state.asleep
      const rates = asleep
        ? { food: 0.45, joy: 0.3, energy: -9.2, clean: 0.35 }
        : { food: 2.45, joy: 1.9, energy: 1.55, clean: 1.45 }
      const sickMult = state.sick && !asleep ? 1.3 : 1
      for (const key of Object.keys(rates)) {
        const rate = rates[key] * (key === 'energy' ? 1 : sickMult)
        state.stats[key] = clamp(state.stats[key] - rate * dt / 60)
      }

      if (state.sick) state.stats.joy = clamp(state.stats.joy - 0.35 * dt / 60)

      const low = state.stats.food < 10 || state.stats.clean < 10 || state.stats.joy < 8
      if (low) state.sickTimer += dt
      else state.sickTimer = Math.max(0, state.sickTimer - dt * 2)
      if (!state.sick && state.sickTimer > 40) {
        state.sick = true
        state.stats.joy = clamp(state.stats.joy - 4)
        addDiary(`${state.name || speciesName()} caught a little tummy bug.`)
        sound.play('error')
        say(`${state.name || 'Your friend'} isn't feeling well...`)
        save()
        toast('A little remedy is needed', 'bubble')
      }

      if (!state.asleep && state.stats.energy <= 0.4) {
        state.asleep = true
        addDiary('Fell asleep on the rug after a very long day.')
        sound.play('sleep')
        say('So... sleepy...')
        save()
      } else if (state.asleep && state.stats.energy >= 99.5) {
        wakeUp(true)
      }

      maybeEvolve()
    }

    advanceTip()

    if (state.hatched && !state.asleep && !state.sick && Date.now() > nextIdleAt) {
      nextIdleAt = Date.now() + 42000 + Math.random() * 22000
      if (!el.bubble.classList.contains('is-visible')) {
        let line = pick(IDLE_LINES)
        if (state.stats.food < 34) line = pick(HUNGRY_LINES)
        else if (state.stats.energy < 30) line = pick(SLEEPY_LINES)
        else if (state.stats.clean < 30) line = pick(DIRTY_LINES)
        else if (state.stats.joy < 30) line = pick(SAD_LINES)
        say(line)
      }
    }

    if (state.hatched && Date.now() - lastSaveAt > 15000) {
      save({ quiet: true })
      lastSaveAt = Date.now()
    }
  }

  renderUI()
}

/* ------------------------------------------------------------------ */
/* Direct interactions                                                 */
/* ------------------------------------------------------------------ */

function sceneTap(event) {
  if (overlayOpen || evolving) return
  const rect = el.scene.getBoundingClientRect()
  const x = ((event.clientX - rect.left) / rect.width) * 480
  const y = ((event.clientY - rect.top) / rect.height) * 300
  if (!state.hatched) {
    warmEgg()
    return
  }
  if (!state.name) return
  if (scene.hitTest(x, y)) petCreature()
  else scene.rippleAt(x, y)
}

function petCreature() {
  if (!state.hatched || overlayOpen || evolving) return
  if (state.asleep) {
    say('Zzz... zzz...')
    return
  }
  const now = Date.now()
  scene.react('love', 2400)
  scene.burst('heart', 8)
  scene.burst('spark', 3)
  scene.rippleAt(240, 250)
  say(state.sick ? 'Thank you... that helps a little.' : pick(PET_LINES))
  sound.play('pet')
  if (now - lastPetAt > 2600) {
    lastPetAt = now
    adjustStats({ joy: 2 })
    touchBond(1)
    save()
    renderUI()
  }
}

function warmEgg() {
  if (state.hatched || overlayOpen) return
  state.warm = Math.min(3, state.warm + 1)
  sound.play('tap')
  scene.burst('spark', 3, { x: 240, y: 218 })
  scene.flashScreen(0.08)
  const lines = [
    'The egg wobbles!',
    'A tiny crack appears...',
    'It is hatching!'
  ]
  say(lines[state.warm - 1] || 'The egg is warm.')
  save()
  renderUI()
  if (state.warm >= 3) setTimeout(hatchEgg, 320)
}

function hatchEgg() {
  if (state.hatched) return
  state.hatched = true
  state.stage = 'baby'
  state.branch = 'verdant'
  state.warm = 3
  state.hatchedAt = Date.now()
  state.bond = 10
  state.growth = 0
  state.sick = false
  state.sickTimer = 0
  state.stats = { food: 72, joy: 78, energy: 86, clean: 94 }
  state.lastSeen = Date.now()
  addDiary('A tiny Mossling hatched from the mystery egg.')
  save()
  renderUI()
  scene.flashScreen(1)
  scene.burst('confetti', 22)
  scene.burst('spark', 14)
  sound.play('hatch')
  setTimeout(() => openNameDialog(false), 700)
}

function toggleNap() {
  if (!state.hatched || overlayOpen) return
  if (state.asleep) {
    wakeUp(false)
    return
  }
  state.asleep = true
  adjustStats({ energy: 1 })
  sound.play('sleep')
  scene.react('sleep', 3000)
  scene.burst('zzz', 4)
  say('Zzz... just five minutes...')
  addCare('rest', 1, 1)
  unlockAchievement('sweetdreams')
  addDiary('Tucked in for a cosy nap.')
  save()
  renderUI()
}

function wakeUp(auto = false) {
  if (!state.asleep) return
  state.asleep = false
  sound.play('wake')
  scene.react('happy', 2200)
  scene.burst('spark', 5)
  say(auto ? 'All rested up!' : 'That was a lovely nap.')
  save()
  renderUI()
}

function administerRemedy() {
  if (!state.sick) return
  state.sick = false
  state.sickTimer = 0
  adjustStats({ clean: 12, joy: 2 })
  sound.play('happy')
  scene.react('happy', 2200)
  scene.burst('spark', 9)
  say('Blegh... but I feel better!')
  addDiary('Took a little remedy and bounced back.')
  save()
  renderUI()
  toast('Remedy taken', 'bubble')
}

function careAction(name) {
  if (!state.hatched) {
    warmEgg()
    return
  }
  if (overlayOpen || evolving) return
  if (state.asleep && name !== 'rest') {
    say('Zzz... wake me up first?')
    return
  }
  if (name === 'snack') openFeed()
  else if (name === 'play') openPlay()
  else if (name === 'bath') openBath()
  else if (name === 'rest') toggleNap()
  else if (name === 'train') openTrain()
}

/* ------------------------------------------------------------------ */
/* Snacks                                                              */
/* ------------------------------------------------------------------ */

const FOOD_TINTS = {
  sunberry: ['#fbe2d7', '#c26b58'],
  honeybun: ['#fcf0cf', '#997526'],
  mintdew: ['#dceff4', '#418ca4']
}

function foodChips(food) {
  const chips = []
  const rows = [['food', 'Food', 'berry'], ['joy', 'Joy', 'heart'], ['energy', 'Energy', 'spark'], ['clean', 'Clean', 'bubble']]
  for (const [key, label, icon] of rows) {
    const value = food[key]
    if (!value) continue
    chips.push(`<span class="chip ${value < 0 ? 'neg' : ''}"><svg class="ico"><use href="#i-${icon}"/></svg>${value > 0 ? '+' : ''}${value} ${label}</span>`)
  }
  return chips.join('')
}

function openFeed() {
  const full = state.stats.food >= 97
  const cards = FOODS.map(food => {
    const [tint, ink] = FOOD_TINTS[food.id] || ['#fbe2d7', '#c26b58']
    return `
      <button class="food-card" type="button" data-food="${food.id}" ${full ? 'disabled' : ''} style="--food-tint:${tint};--food-ink:${ink}">
        <span class="food-top">
          <span class="food-ico"><svg class="ico"><use href="#i-${food.icon}"/></svg></span>
          <span class="food-names">
            <span class="food-name">${food.name}</span>
            <span class="food-kind">${food.kind}</span>
          </span>
        </span>
        <span class="food-line">“${food.line}”</span>
        <span class="chip-row">${foodChips(food)}</span>
      </button>
    `
  }).join('')

  openDialog(dialogShell(
    'Pantry',
    full ? 'A very full little friend' : 'What shall we nibble?',
    `<p class="dialog-copy">${full
      ? 'The snack jar is safe for now. Try a cuddle, a bath, or a little play instead.'
      : 'Every snack fills the belly a little differently. Pick whichever feels right.'}</p>
     <div class="food-grid">${cards}</div>
     <div class="dialog-actions"><button class="ghost-btn" type="button" data-close>Maybe later</button></div>`
  ))

  if (!full) {
    el.dialog.querySelectorAll('[data-food]').forEach(btn => {
      btn.addEventListener('click', () => feed(btn.dataset.food))
    })
  }
}

function feed(foodId) {
  const food = FOODS.find(f => f.id === foodId)
  if (!food || overlayOpen === false) return
  if (state.stats.food >= 98) {
    sound.play('error')
    toast('Too full for another bite', 'berry')
    return
  }
  adjustStats({ food: food.food, joy: food.joy, energy: food.energy, clean: food.clean })
  addCare('snack', 1, 1)
  unlockAchievement('firstbite')
  save()
  closeDialog()
  renderUI()
  scene.react('eat', 2600)
  scene.burst('crumb', 7)
  scene.burst('heart', 3)
  sound.play('eat')
  say(food.line, 3800)
  if (state.stats.food >= 99) {
    setTimeout(() => say('Full. So very full. Happy.'), 3900)
  }
}

/* ------------------------------------------------------------------ */
/* Berry Catch                                                         */
/* ------------------------------------------------------------------ */

function starsHTML(count) {
  return `<span class="stars">${[1, 2, 3].map(i => `<span class="${i <= count ? 'on' : 'off'}">★</span>`).join('')}</span>`
}

function openPlay() {
  if (state.stats.energy < 8) {
    sound.play('error')
    say('I am too sleepy for a game... maybe a nap?')
    return
  }
  openDialog(dialogShell(
    'Playtime',
    'Berry Catch',
    `<div class="game-intro">
       <div class="game-art">
         <span class="art-title">Berry Catch</span>
         <span class="art-sub">a sunset garden game</span>
         <span class="art-berry b1"></span><span class="art-berry b2"></span><span class="art-berry b3"></span><span class="art-berry b4"></span>
       </div>
       <p class="dialog-copy" style="margin:0">Little berries are tumbling from the bushes. Slide the basket with your finger, or use the arrow keys, and catch as many as you can in 24 seconds. Watch out for the grey pebbles!</p>
       <div class="chip-row">
         <span class="chip"><svg class="ico"><use href="#i-spark"/></svg>Gold berries = 3</span>
         <span class="chip warm"><svg class="ico"><use href="#i-spark"/></svg>Costs a little energy</span>
         <span class="chip"><svg class="ico"><use href="#i-heart"/></svg>Joy &amp; growth</span>
       </div>
       <div class="dialog-actions">
         <button class="ghost-btn" type="button" data-close>Maybe later</button>
         <button class="primary-btn" type="button" id="startBerry">Start catching</button>
       </div>
     </div>`
  ))
  el.dialog.querySelector('#startBerry')?.addEventListener('click', startBerryGame)
}

function startBerryGame() {
  stopActiveGame()
  setDialogContent(dialogShell(
    'Playtime',
    'Berry Catch',
    `<div class="game-hud"><span>Slide, catch, repeat</span><span>24 seconds</span></div>
     <div class="game-frame"><canvas id="berryCanvas" width="640" height="400" aria-label="Berry Catch mini-game"></canvas></div>
     <p class="dialog-copy" style="margin:8px 0 0;font-size:10.5px;text-align:center">Drag the basket, or use ← → keys.</p>
     <div class="dialog-actions"><button class="ghost-btn" type="button" data-close>Leave game</button></div>`
  ), { wide: true })
  const canvas = el.dialog.querySelector('#berryCanvas')
  if (!canvas) return
  const game = new BerryCatch(canvas, {
    sound,
    onEnd: result => {
      activeGame = null
      finishBerry(result)
    }
  })
  activeGame = game
}

function finishBerry(result) {
  const joyGain = Math.round(Math.min(36, 10 + result.score * 0.9))
  const growth = 2 + Math.min(4, Math.floor(result.score / 5))
  adjustStats({ joy: joyGain, energy: -6 })
  addCare('play', growth, result.score >= 10 ? 3 : 2)
  const best = Math.max(state.bestCatch, result.score)
  const newBest = result.score > state.bestCatch && state.bestCatch > 0
  state.bestCatch = best
  if (result.score >= 15) unlockAchievement('berrybest')
  addDiary(`Played Berry Catch and scored ${result.score}.`)
  save()
  renderUI()
  sound.play(result.score >= 10 ? 'happy' : 'good')
  const rating = result.score >= 20 ? 3 : result.score >= 10 ? 2 : 1
  const title = result.score >= 20 ? 'Berry spectacular!' : result.score >= 10 ? 'A basketful!' : 'A gentle start.'
  const line = result.score >= 20
    ? 'The basket is practically overflowing. Someone is very proud of you.'
    : result.score >= 10
      ? 'A very respectable haul. Your friend is glowing a little.'
      : result.score > 0
        ? 'A few berries, a lot of enthusiasm. That still counts.'
        : 'A quiet minute in the garden. The fresh air still counts.'
  setDialogContent(dialogShell(
    'Berry Catch',
    title,
    `<div class="result">
       <span class="result-label">Final score</span>
       <div class="result-score">${result.score}</div>
       ${starsHTML(rating)}
       <p class="result-copy">Caught ${result.caught}${result.golden ? ` · ${result.golden} golden` : ''}${result.misses ? ` · ${result.misses} missed` : ''}${newBest ? ' · new best!' : ''}</p>
       <p class="result-copy" style="max-width:320px">${line}</p>
       <div class="reward-row">
         <span class="chip"><svg class="ico"><use href="#i-heart"/></svg>+${joyGain} Joy</span>
         <span class="chip"><svg class="ico"><use href="#i-leaf"/></svg>+${growth} Growth</span>
         <span class="chip neg"><svg class="ico"><use href="#i-spark"/></svg>-6 Energy</span>
       </div>
     </div>
     <div class="dialog-actions">
       ${state.stats.energy >= 8 ? '<button class="ghost-btn" type="button" id="playAgain">Play again</button>' : '<span class="chip neg">Too sleepy to replay</span>'}
       <button class="primary-btn" type="button" data-close>Lovely</button>
     </div>`,
    { wide: true }
  ))
  el.dialog.querySelector('#playAgain')?.addEventListener('click', () => {
    if (state.stats.energy < 8) return
    sound.play('open')
    startBerryGame()
  })
}

/* ------------------------------------------------------------------ */
/* Bubble bath                                                         */
/* ------------------------------------------------------------------ */

function openBath() {
  openDialog(dialogShell(
    'Care',
    'Bubble bath',
    `<p class="dialog-copy">A warm bath and a sky full of bubbles. Pop them all before the water goes cold.</p>
     <div id="bathMount"></div>
     <div class="dialog-actions"><button class="ghost-btn" type="button" data-close>Not now</button></div>`
  ))
  const mount = el.dialog.querySelector('#bathMount')
  if (!mount) return
  const game = mountBathGame(mount, {
    stage: state.stage,
    branch: state.branch || 'verdant',
    sound,
    onFinish: result => {
      activeGame = null
      finishBath(result)
    }
  })
  activeGame = game
}

function finishBath(result) {
  const cleanGain = Math.min(58, 32 + result.popped * 3)
  adjustStats({ clean: cleanGain, joy: 5 })
  addCare('bath', 2, 2)
  unlockAchievement('bubblebuddy')
  addDiary('Had a bubble bath and popped every bubble they could find.')
  save()
  renderUI()
  sound.play('clean')
  const all = result.popped >= result.total
  setDialogContent(dialogShell(
    'Care',
    all ? 'Squeaky clean!' : 'Much fresher!',
    `<div class="result">
       <span class="result-label">Bubbles popped</span>
       <div class="result-score">${result.popped}<span style="font-size:20px;color:#9a927c"> / ${result.total}</span></div>
       <p class="result-copy">${all ? 'The tub is empty, the bubbles are gone, and your friend is gleaming.' : 'A few bubbles escaped, but the important bits are very clean.'}</p>
       <div class="reward-row">
         <span class="chip"><svg class="ico"><use href="#i-bubble"/></svg>+${cleanGain} Clean</span>
         <span class="chip"><svg class="ico"><use href="#i-heart"/></svg>+5 Joy</span>
         <span class="chip"><svg class="ico"><use href="#i-leaf"/></svg>+2 Growth</span>
       </div>
     </div>
     <div class="dialog-actions"><button class="primary-btn" type="button" data-close>Snug</button></div>`
  ))
}

/* ------------------------------------------------------------------ */
/* Pulse training                                                      */
/* ------------------------------------------------------------------ */

function openTrain() {
  if (state.stats.energy < 8) {
    sound.play('error')
    say('Too tired to focus... could we nap first?')
    return
  }
  openDialog(dialogShell(
    'Training',
    'Pulse practice',
    `<p class="dialog-copy">Three beats. One little leaf. Tap when the leaf drifts through the gold zone. Perfect timing grows your bond a little faster.</p>
     <div id="trainMount"></div>
     <div class="dialog-actions"><button class="ghost-btn" type="button" data-close>Maybe later</button></div>`
  ))
  const mount = el.dialog.querySelector('#trainMount')
  if (!mount) return
  const game = mountTrainGame(mount, {
    sound,
    onFinish: result => {
      activeGame = null
      finishTrain(result)
    }
  })
  activeGame = game
}

function finishTrain(result) {
  const joyGain = 4 + result.goods * 2 + result.perfects * 3
  const growth = 2 + result.goods + result.perfects * 2
  adjustStats({ energy: -8, joy: joyGain, clean: -2 })
  addCare('train', growth, 3)
  if (result.perfects === 3) unlockAchievement('perfectpulse')
  addDiary(`Practised a little pulse training. ${result.perfects} perfect beat${result.perfects === 1 ? '' : 's'}.`)
  save()
  renderUI()
  sound.play(result.perfects ? 'perfect' : 'good')
  const title = result.perfects === 3 ? 'In perfect rhythm' : result.perfects ? 'Beautiful focus' : 'Good practice'
  setDialogContent(dialogShell(
    'Training',
    title,
    `<div class="result">
       <span class="result-label">Perfect beats</span>
       <div class="result-score">${result.perfects}<span style="font-size:20px;color:#9a927c"> / 3</span></div>
       ${starsHTML(result.perfects)}
       <p class="result-copy">${result.perfects === 3 ? 'Three perfect beats. The whole room feels a little brighter.' : result.perfects ? 'Sharp timing and a very pleased little face.' : 'A wobbly start, but practice is still practice.'}</p>
       <div class="reward-row">
         <span class="chip"><svg class="ico"><use href="#i-heart"/></svg>+${joyGain} Joy</span>
         <span class="chip"><svg class="ico"><use href="#i-leaf"/></svg>+${growth} Growth</span>
         <span class="chip neg"><svg class="ico"><use href="#i-spark"/></svg>-8 Energy</span>
       </div>
     </div>
     <div class="dialog-actions">
       ${state.stats.energy >= 8 ? '<button class="ghost-btn" type="button" id="trainAgain">Train again</button>' : ''}
       <button class="primary-btn" type="button" data-close>Well done</button>
     </div>`
  ))
  el.dialog.querySelector('#trainAgain')?.addEventListener('click', () => {
    if (state.stats.energy < 8) return
    sound.play('open')
    openTrain()
  })
}

/* ------------------------------------------------------------------ */
/* Growth & evolution                                                  */
/* ------------------------------------------------------------------ */

function pickBranch() {
  const scores = {
    bloom: state.care.snack,
    zephyr: state.care.play + state.care.train,
    lumen: state.care.bath + state.care.rest
  }
  const entries = Object.entries(scores).sort((a, b) => b[1] - a[1])
  const top = entries[0][1]
  if (top <= 2) return 'verdant'
  if (top - entries[2][1] <= 1) return 'verdant'
  const tied = entries.filter(([, value]) => value === top)
  return tied.length > 1 ? 'verdant' : entries[0][0]
}

function maybeEvolve() {
  if (!state.hatched || evolving || overlayOpen) return
  const age = ageSeconds()
  if (state.stage === 'baby' && age >= CHILD_AGE && state.growth >= CHILD_GROWTH) {
    evolveTo('child')
  } else if (state.stage === 'child' && age >= ADULT_AGE && state.growth >= ADULT_GROWTH) {
    evolveTo('adult')
  }
}

function evolveTo(next) {
  if (!state.hatched || evolving) return
  const old = state.stage
  if (old === next) return
  state.stage = next
  if (next === 'adult') state.branch = pickBranch()
  state.growth = Math.max(state.growth, next === 'child' ? CHILD_GROWTH : ADULT_GROWTH)
  adjustStats({ joy: 8, energy: 8 })
  touchBond(8)
  addDiary(next === 'child'
    ? `${state.name || 'Mossling'} grew into a Fernling.`
    : `${state.name || 'Fernling'} reached their final form: ${speciesName()}.`)
  addDiary(next === 'child'
    ? 'Their second leaf finally unfurled.'
    : `${BRANCHES[state.branch]?.title || 'A new chapter'} · ${BRANCHES[state.branch]?.blurb || ''}`)
  if (next === 'child') unlockAchievement('growingsprout')
  if (next === 'adult') unlockAchievement('fullbloom')
  save()
  renderUI()
  syncScene()
  scene.flashScreen(1)
  scene.burst('spark', 20)
  scene.burst('confetti', 10)
  sound.play('evolve')
  evolving = true
  setTimeout(() => openEvolution(old, next), 900)
}

function openEvolution(oldStage, newStage) {
  const oldName = STAGES[oldStage]?.label || 'Little sprout'
  const newSpecies = newStage === 'adult' ? (BRANCHES[state.branch]?.name || STAGES.adult.label) : STAGES[newStage].label
  const blurb = newStage === 'adult'
    ? BRANCHES[state.branch]?.blurb
    : 'The second leaf unfurled, the tail grew a little longer, and suddenly the room feels full of possibility.'
  const title = newStage === 'adult'
    ? `${BRANCHES[state.branch]?.title || 'Fully bloomed'}!`
    : 'A brand new leaf!'

  openDialog(dialogShell(
    newStage === 'adult' ? 'Final form' : 'Growing up',
    title,
    `<div class="evo-wrap">
       <div class="sparkle-row">
         <svg class="ico"><use href="#i-spark"/></svg>
         <svg class="ico"><use href="#i-spark"/></svg>
         <svg class="ico"><use href="#i-spark"/></svg>
       </div>
       <div class="evo-stage">
         <div class="evo-card">
           <canvas data-preview data-stage="${oldStage}" data-branch="verdant" data-mood="happy" width="80" height="80"></canvas>
           <b>${esc(oldName)}</b>
           <span>before</span>
         </div>
         <span class="evo-arrow"><svg class="ico"><use href="#i-arrow"/></svg></span>
         <div class="evo-card is-new">
           <canvas data-preview data-stage="${newStage}" data-branch="${state.branch}" data-mood="happy" width="80" height="80"></canvas>
           <b>${esc(newSpecies)}</b>
           <span>now</span>
         </div>
       </div>
       <div class="evo-title"><h3>${esc(state.name || newSpecies)} ${newStage === 'adult' ? 'is all grown up' : 'is growing up'}</h3><p>${esc(blurb || '')}</p></div>
       <div class="reward-row">
         <span class="chip"><svg class="ico"><use href="#i-heart"/></svg>+8 Bond</span>
         <span class="chip"><svg class="ico"><use href="#i-spark"/></svg>+8 Energy</span>
         ${newStage === 'adult' ? `<span class="chip warm"><svg class="ico"><use href="#i-flower"/></svg>${esc(BRANCHES[state.branch]?.title || '')}</span>` : ''}
       </div>
     </div>
     <div class="dialog-actions"><button class="primary-btn" type="button" data-close data-autofocus>Hello, ${esc(state.name || newSpecies)}</button></div>`
  ), {
    wide: true,
    onClose: () => {
      evolving = false
      renderUI()
      say(newStage === 'adult' ? `${state.name} is all grown up. Look at them!` : 'Look at my new leaf!')
      scene.react('happy', 2400)
      scene.burst('heart', 6)
    }
  })
}

/* ------------------------------------------------------------------ */
/* Hatching / naming                                                   */
/* ------------------------------------------------------------------ */

const NAME_SUGGESTIONS = ['Mochi', 'Pip', 'Fern', 'Button', 'Kiwi', 'Moss', 'Pebble', 'Clover', 'Juniper', 'Biscuit']

function openNameDialog(rename = false) {
  const suggestions = [...NAME_SUGGESTIONS].sort(() => Math.random() - 0.5).slice(0, 5)
  const stage = state.stage === 'egg' ? 'baby' : state.stage
  const previewBranch = state.stage === 'adult' ? state.branch : 'verdant'

  openDialog(dialogShell(
    rename ? 'Care diary' : 'A new friend',
    rename ? 'What should we call them?' : 'A tiny sprout!',
    `<div class="name-stage">
       <canvas data-preview data-stage="${stage}" data-branch="${previewBranch}" data-mood="happy" width="80" height="80"></canvas>
       <span class="name-species">${esc(rename ? speciesName() : 'Mossling · newly hatched')}</span>
     </div>
     <p class="dialog-copy">${rename
       ? 'Names are important. Pick something that feels like home.'
       : 'The egg cracked open and a mossy little friend tumbled out. What should we call them?'}</p>
     <label class="name-label" for="nameInput">Name</label>
     <input class="name-input" id="nameInput" type="text" maxlength="12" autocomplete="off" spellcheck="false" placeholder="${esc(speciesName())}" value="${rename ? esc(state.name) : ''}" data-autofocus>
     <div class="name-suggestions">
       ${suggestions.map(name => `<button class="name-chip" type="button" data-suggest="${esc(name)}">${esc(name)}</button>`).join('')}
     </div>
     <div class="dialog-actions">
       ${rename ? '<button class="ghost-btn" type="button" data-close>Keep current name</button>' : ''}
       <button class="primary-btn" type="button" id="confirmName">${rename ? 'Save name' : 'Welcome home'}</button>
     </div>`,
    { closable: rename }
  ), {
    dismissible: rename,
    onClose: null
  })

  const input = el.dialog.querySelector('#nameInput')
  const confirm = el.dialog.querySelector('#confirmName')
  el.dialog.querySelectorAll('[data-suggest]').forEach(btn => {
    btn.addEventListener('click', () => {
      input.value = btn.dataset.suggest
      input.focus()
      input.select()
    })
  })

  const commit = () => {
    const chosen = (input.value || '').trim().slice(0, 12) || speciesName()
    state.name = chosen
    if (!rename) {
      addDiary(`Named the new Mossling “${chosen}”.`)
      save()
      renderUI()
      closeDialog()
      sound.play('happy')
      scene.react('love', 2200)
      scene.burst('heart', 9)
      scene.flashScreen(0.4)
      say(`Hi! I'm ${chosen}.`)
      setTimeout(() => toast(`${chosen} has joined the room`, 'flower'), 450)
    } else {
      save()
      renderUI()
      closeDialog()
      sound.play('happy')
      say(`I like ${chosen}. It feels like me.`)
      toast('Name updated', 'leaf')
    }
  }

  confirm.addEventListener('click', commit)
  input.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      event.preventDefault()
      commit()
    }
  })
  setTimeout(() => { input.focus({ preventScroll: true }); input.select() }, 80)
}

/* ------------------------------------------------------------------ */
/* Diary                                                               */
/* ------------------------------------------------------------------ */

function openDiary() {
  const hatched = state.hatched
  const previewStage = hatched ? state.stage : 'egg'
  const previewBranch = state.stage === 'adult' ? state.branch : 'verdant'
  const title = hatched ? (state.name || speciesName()) : 'Mystery Egg'
  const subtitle = hatched
    ? `${speciesName()}${state.stage === 'adult' ? ` · ${BRANCHES[state.branch]?.title || ''}` : ''}`
    : 'Not hatched yet'

  const badges = ACHIEVEMENTS.map(a => {
    const unlocked = state.achievements.includes(a.id)
    return `
      <div class="badge ${unlocked ? '' : 'is-locked'}">
        <span class="badge-ico"><svg class="ico"><use href="#i-${a.icon}"/></svg></span>
        <span><b>${esc(a.name)}</b><span>${esc(a.desc)}</span></span>
      </div>
    `
  }).join('')

  const memories = state.diary.slice(-6).reverse()
  const memoryRows = memories.length
    ? memories.map(m => `<div class="memory"><span>${new Date(m.t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span><p>${esc(m.text)}</p></div>`).join('')
    : '<div class="memory"><span>today</span><p>No memories yet. Go make one.</p></div>'

  openDialog(dialogShell(
    'Care diary',
    title,
    `<div class="pet-summary">
       <span class="summary-art"><canvas data-preview data-stage="${previewStage}" data-branch="${previewBranch}" data-mood="happy" width="80" height="80"></canvas></span>
       <span class="summary-copy">
         <h3>${esc(title)}</h3>
         <div class="summary-species">${esc(subtitle)}</div>
         <p class="summary-blurb">${esc(hatched ? speciesBlurb() : 'A warm little mystery, waiting for you.')}</p>
       </span>
     </div>
     <div class="diary-meta">
       <span>${esc(ageText())}</span>
       <span>Bond ${Math.round(state.bond)} / 100</span>
       <span>Growth ${Math.round(state.growth)}</span>
       ${hatched ? `<span>Best catch ${state.bestCatch}</span>` : ''}
     </div>
     <h3>Care so far</h3>
     <div class="care-counts">
       <div class="count-card"><b>${state.care.snack}</b><span>Snacks</span></div>
       <div class="count-card"><b>${state.care.play}</b><span>Games</span></div>
       <div class="count-card"><b>${state.care.bath}</b><span>Baths</span></div>
       <div class="count-card"><b>${state.care.rest}</b><span>Naps</span></div>
       <div class="count-card"><b>${state.care.train}</b><span>Trains</span></div>
     </div>
     <h3>Badges</h3>
     <div class="badge-grid">${badges}</div>
     <h3>Little memories</h3>
     <div class="memory-list">${memoryRows}</div>
     <div class="diary-actions">
       <button class="ghost-btn" type="button" data-close>Close</button>
       ${hatched ? '<button class="ghost-btn" type="button" id="renameBtn">Rename</button>' : ''}
       <button class="danger-btn" type="button" id="resetBtn">Start over</button>
     </div>`
  ), { wide: true })

  el.dialog.querySelector('#renameBtn')?.addEventListener('click', () => openNameDialog(true))

  const resetBtn = el.dialog.querySelector('#resetBtn')
  let armed = false
  let armTimer = 0
  resetBtn?.addEventListener('click', () => {
    if (!armed) {
      armed = true
      resetBtn.textContent = 'Tap again to start over'
      resetBtn.classList.add('is-armed')
      armTimer = setTimeout(() => {
        armed = false
        resetBtn.textContent = 'Start over'
        resetBtn.classList.remove('is-armed')
      }, 3500)
      return
    }
    clearTimeout(armTimer)
    resetGame()
  })
}

/* ------------------------------------------------------------------ */
/* Help & welcome back                                                 */
/* ------------------------------------------------------------------ */

function openHelp() {
  openDialog(dialogShell(
    'How to play',
    'A tiny guide to a tiny friend',
    `<p class="dialog-copy">There is no rush in Pocket Sprout. Your friend asks for four simple things, and everything else is a bonus.</p>
     <div class="help-list">
       <div class="help-item"><span class="help-ico"><svg class="ico"><use href="#i-berry"/></svg></span><span><b>Feed the belly</b><p>Snacks fill Food. Honey Buns lift Joy, Mint Dew wakes up Energy.</p></span></div>
       <div class="help-item"><span class="help-ico"><svg class="ico"><use href="#i-heart"/></svg></span><span><b>Make room for joy</b><p>Play Berry Catch, train together, or simply tap your friend. Bond grows when you spend time together.</p></span></div>
       <div class="help-item"><span class="help-ico"><svg class="ico"><use href="#i-bubble"/></svg></span><span><b>Keep them cosy</b><p>A bubble bath restores Clean. A nap restores Energy faster than anything else.</p></span></div>
       <div class="help-item"><span class="help-ico"><svg class="ico"><use href="#i-leaf"/></svg></span><span><b>Watch them grow</b><p>Care, time, and a little patience unlock new stages. The way you care shapes their final form.</p></span></div>
     </div>
     <h3>Keyboard</h3>
     <div class="shortcut-grid">
       <div class="shortcut-row"><kbd>F</kbd> Snack</div>
       <div class="shortcut-row"><kbd>P</kbd> Play</div>
       <div class="shortcut-row"><kbd>B</kbd> Bath</div>
       <div class="shortcut-row"><kbd>N</kbd> Nap / wake</div>
       <div class="shortcut-row"><kbd>T</kbd> Train</div>
       <div class="shortcut-row"><kbd>M</kbd> Mute sound</div>
       <div class="shortcut-row"><kbd>D</kbd> Diary</div>
       <div class="shortcut-row"><kbd>W</kbd> Warm the egg</div>
     </div>
     <p class="dialog-copy" style="margin-top:12px">Progress saves in this browser. If you leave for a while, your friend will get a little hungry and dusty, but never cross.</p>
     <div class="dialog-actions"><button class="primary-btn" type="button" data-close>Let's care</button></div>`
  ))
}

function openWelcome(summary) {
  const drops = summary.drops
  const chips = []
  if (drops.food) chips.push(`<span class="chip neg">Food -${drops.food}</span>`)
  if (drops.joy) chips.push(`<span class="chip neg">Joy -${drops.joy}</span>`)
  if (drops.clean) chips.push(`<span class="chip neg">Clean -${drops.clean}</span>`)
  if (drops.energy) chips.push(`<span class="chip neg">Energy -${drops.energy}</span>`)
  if (!chips.length) chips.push('<span class="chip">Still cosy</span>')

  openDialog(dialogShell(
    'Welcome back',
    `${state.name || speciesName()} kept the rug warm`,
    `<p class="dialog-copy">You were away for <strong>${awayText(summary.mins)}</strong>. ${summary.asleep ? 'Your friend slept through most of it.' : 'Someone waited by the window for you.'} Here is how the room is doing now.</p>
     <div class="welcome-grid">
       <div class="welcome-chip"><svg class="ico"><use href="#i-berry"/></svg><b>${Math.round(state.stats.food)}</b><span>Food</span></div>
       <div class="welcome-chip"><svg class="ico"><use href="#i-heart"/></svg><b>${Math.round(state.stats.joy)}</b><span>Joy</span></div>
       <div class="welcome-chip"><svg class="ico"><use href="#i-spark"/></svg><b>${Math.round(state.stats.energy)}</b><span>Energy</span></div>
       <div class="welcome-chip"><svg class="ico"><use href="#i-bubble"/></svg><b>${Math.round(state.stats.clean)}</b><span>Clean</span></div>
     </div>
     <div class="chip-row" style="margin:8px 0 2px">${chips.join('')}</div>
     <p class="dialog-copy" style="margin-top:10px">${state.stats.food < 30 ? 'A snack would be very welcome.' : 'A cuddle would be very welcome.'}</p>
     <div class="dialog-actions"><button class="primary-btn" type="button" data-autofocus data-close>I'm here now</button></div>`
  ))
}

/* ------------------------------------------------------------------ */
/* Dialog plumbing                                                     */
/* ------------------------------------------------------------------ */

let modalOnClose = null

function dialogShell(kicker, title, body, { closable = true } = {}) {
  return `${closable ? '<button class="dialog-close" type="button" data-close aria-label="Close"><svg class="ico"><use href="#i-close"/></svg></button>' : ''}
    <div class="dialog-head">
      <div>
        <p class="dialog-kicker">${esc(kicker)}</p>
        <h2 id="dialogTitle">${title}</h2>
      </div>
    </div>
    ${body}`
}

function paintSprite(canvas, stage, branch = 'verdant', mood = 'happy') {
  if (!canvas) return
  canvas.width = 80
  canvas.height = 80
  const ctx = canvas.getContext('2d')
  drawCreature(ctx, { stage, branch, mood, t: 1.4, eggProgress: 1, seed: 2.1 })
}

function paintPreviews() {
  el.dialog.querySelectorAll('canvas[data-preview]').forEach(canvas => {
    paintSprite(canvas, canvas.dataset.stage || 'baby', canvas.dataset.branch || 'verdant', canvas.dataset.mood || 'happy')
  })
}

function focusDialog() {
  requestAnimationFrame(() => {
    const target = el.dialog.querySelector('[data-autofocus]') || el.dialog.querySelector('.primary-btn') || el.dialog.querySelector('button, input')
    try { target?.focus({ preventScroll: true }) } catch { target?.focus() }
  })
}

function openDialog(html, { wide = false, dismissible = true, onClose = null } = {}) {
  const wasOpen = !el.overlay.hidden
  if (!wasOpen) {
    lastFocus = document.activeElement
    el.overlay.hidden = false
    overlayOpen = true
    document.body.classList.add('modal-open')
    sound.play('open')
  }
  setDialogContent(html, { wide, dismissible, onClose })
}

function setDialogContent(html, { wide = false, dismissible = true, onClose = null } = {}) {
  el.dialog.className = `dialog${wide ? ' wide' : ''}`
  el.dialog.innerHTML = html
  modalDismissible = dismissible
  modalOnClose = onClose
  paintPreviews()
  focusDialog()
}

function closeDialog({ silent = false } = {}) {
  if (el.overlay.hidden) return
  stopActiveGame()
  const callback = modalOnClose
  modalOnClose = null
  el.overlay.hidden = true
  overlayOpen = false
  document.body.classList.remove('modal-open')
  if (!silent) sound.play('close')
  lastFocus?.focus?.({ preventScroll: true })
  lastFocus = null
  renderUI()
  if (callback) callback()
}

function stopActiveGame() {
  if (!activeGame) return
  try { activeGame.stop() } catch {}
  activeGame = null
}

/* ------------------------------------------------------------------ */
/* Reset                                                               */
/* ------------------------------------------------------------------ */

function resetGame() {
  const muted = state.muted
  closeDialog({ silent: true })
  try { localStorage.removeItem(SAVE_KEY) } catch {}
  state = defaultState()
  state.muted = muted
  evolving = false
  lastPetAt = 0
  lastSaveAt = Date.now()
  lastTick = performance.now()
  nextTipAt = Date.now() + 9000
  nextIdleAt = Date.now() + 32000
  tipIndex = 0
  sound.setMuted(muted)
  save()
  renderUI()
  syncScene()
  scene.flashScreen(0.6)
  scene.burst('spark', 10)
  say('A little egg appeared on the rug...', 5200)
  toast('A fresh start', 'leaf')
}

/* ------------------------------------------------------------------ */
/* Event wiring                                                        */
/* ------------------------------------------------------------------ */

function greetingLine() {
  if (state.stats.food < 30) return pick(HUNGRY_LINES)
  if (state.stats.clean < 30) return pick(DIRTY_LINES)
  if (state.stats.energy < 28) return pick(SLEEPY_LINES)
  if (state.stats.joy < 30) return pick(SAD_LINES)
  return 'You are back! I kept the rug warm.'
}

function bindEvents() {
  el.warmBtn.addEventListener('click', warmEgg)
  el.scene.addEventListener('pointerdown', sceneTap)
  el.soundBtn.addEventListener('click', toggleMute)
  el.helpBtn.addEventListener('click', openHelp)
  el.diaryBtn.addEventListener('click', openDiary)
  el.medicineBtn.addEventListener('click', administerRemedy)

  el.actions.addEventListener('click', event => {
    const btn = event.target.closest('[data-action]')
    if (!btn || btn.disabled) return
    sound.play('click')
    careAction(btn.dataset.action)
  })

  el.overlay.addEventListener('click', event => {
    if (event.target === el.overlay && modalDismissible) closeDialog()
  })

  el.dialog.addEventListener('click', event => {
    const closer = event.target.closest('[data-close]')
    if (closer && !closer.disabled) closeDialog()
  })

  window.addEventListener('keydown', event => {
    const key = event.key
    if (overlayOpen) {
      if (key === 'Escape' && modalDismissible) {
        event.preventDefault()
        closeDialog()
        return
      }
      if (key === 'Tab') {
        const focusables = [...el.dialog.querySelectorAll('button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])')]
          .filter(node => node.offsetParent !== null)
        if (!focusables.length) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
      return
    }

    if (event.metaKey || event.ctrlKey || event.altKey) return
    const target = event.target
    if (target instanceof HTMLElement && target.closest('input, textarea, select')) return
    if (event.repeat) return
    const lower = key.toLowerCase()
    const map = { f: 'snack', p: 'play', b: 'bath', n: 'rest', t: 'train' }
    if (map[lower]) {
      event.preventDefault()
      sound.play('click')
      careAction(map[lower])
    } else if (lower === 'w' && !state.hatched) {
      event.preventDefault()
      warmEgg()
    } else if (lower === 'd') {
      event.preventDefault()
      openDiary()
    } else if (lower === 'h' || key === '?') {
      event.preventDefault()
      openHelp()
    } else if (lower === 'm') {
      event.preventDefault()
      toggleMute()
    }
  })

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (state.hatched) save({ quiet: true })
    } else {
      lastTick = performance.now()
    }
  })

  window.addEventListener('pagehide', () => {
    if (state.hatched) save({ quiet: true })
  })

  const unlock = () => sound.unlock()
  document.addEventListener('pointerdown', unlock, { once: true, capture: true })
  document.addEventListener('keydown', unlock, { once: true, capture: true })
}

/* ------------------------------------------------------------------ */
/* Boot                                                                */
/* ------------------------------------------------------------------ */

function init() {
  if (!state.hatched) {
    state.stage = 'egg'
    state.asleep = false
  }
  el.soundBtn.classList.toggle('is-muted', state.muted)
  el.soundBtn.setAttribute('aria-label', state.muted ? 'Unmute sound' : 'Mute sound')
  bindEvents()

  const awayMins = (Date.now() - state.lastSeen) / 60000
  const welcome = applyOfflineCare()

  sound.setMood(isNight() ? 'night' : 'day')
  syncScene()
  renderUI()

  if (welcome) {
    pendingWelcome = welcome
    setTimeout(() => openWelcome(welcome), 700)
  } else if (state.hatched) {
    setTimeout(() => {
      say(awayMins > 2 ? greetingLine() : (state.name ? `Hi again, ${state.name}!` : greetingLine()))
    }, 550)
  } else {
    setTimeout(() => say(pick([
      'A little egg appeared on the rug...',
      'Something is warm inside this egg.',
      'Tap the egg to keep it cosy.'
    ])), 700)
  }

  lastTick = performance.now()
  setInterval(tick, 250)
  setInterval(() => {
    if (state.hatched && !overlayOpen && !evolving && !document.hidden) {
      save({ quiet: true })
      lastSaveAt = Date.now()
    }
  }, 15000)

  // Keep the scene loop honest after returning to the tab.
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) scene.last = performance.now()
  })
}

/* ------------------------------------------------------------------ */
/* Debug helpers (useful for previews & automated checks)              */
/* ------------------------------------------------------------------ */

window.__pocketSprout = {
  get state() { return state },
  save,
  reset: resetGame,
  hatch() {
    if (!state.hatched) {
      state.warm = 2
      warmEgg()
    }
  },
  makeStage(stage = 'child', branch = 'verdant') {
    if (!state.hatched) {
      state.hatched = true
      state.hatchedAt = Date.now() - ADULT_AGE * 1000
      state.name = state.name || 'Mochi'
      state.stats = { food: 86, joy: 88, energy: 90, clean: 92 }
      state.growth = ADULT_GROWTH
    }
    closeDialog({ silent: true })
    state.stage = stage
    state.branch = branch
    state.hatchedAt = Date.now() - (stage === 'adult' ? ADULT_AGE : CHILD_AGE) * 1000
    state.growth = Math.max(state.growth, stage === 'adult' ? ADULT_GROWTH : CHILD_GROWTH)
    state.sick = false
    state.asleep = false
    state.name = state.name || 'Mochi'
    save()
    renderUI()
    syncScene()
    scene.flashScreen(0.4)
    scene.burst('spark', 8)
  },
  makeAdult(branch = 'bloom') { this.makeStage('adult', branch) },
  setStats(patch = {}) {
    adjustStats(patch)
    save()
    renderUI()
  },
  fastForward(seconds = 200) {
    if (!state.hatched) return
    state.hatchedAt = (state.hatchedAt || Date.now()) - seconds * 1000
    state.growth = Math.max(state.growth, ADULT_GROWTH)
    maybeEvolve()
    renderUI()
  },
  openDiary,
  openHelp,
  openFeed,
  openPlay,
  openBath,
  openTrain
}

init()




