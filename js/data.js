// Static game data: creatures, food, achievements, and flavour text.

export const SAVE_KEY = 'pocket-sprout.v1'

export const STATS = [
  { key: 'food',   label: 'Food',   icon: 'berry',  color: '#ef8f7c', empty: '#f7d4cb' },
  { key: 'joy',    label: 'Joy',    icon: 'heart',  color: '#e98aa8', empty: '#f6cfdb' },
  { key: 'energy', label: 'Energy', icon: 'spark',  color: '#e7b958', empty: '#f6e5ba' },
  { key: 'clean',  label: 'Clean',  icon: 'bubble', color: '#6fbcd1', empty: '#cfe9ef' }
]

export const FOODS = [
  {
    id: 'sunberry',
    name: 'Sunberry',
    kind: 'Crunchy & sweet',
    icon: 'berry',
    color: '#ef8f7c',
    food: 30, joy: 4, energy: 2, clean: 0,
    line: 'A pocketful of sunshine!'
  },
  {
    id: 'honeybun',
    name: 'Honey Bun',
    kind: 'Sticky & warm',
    icon: 'bun',
    color: '#e7b958',
    food: 22, joy: 12, energy: 4, clean: -6,
    line: 'Mmm... sticky paws.'
  },
  {
    id: 'mintdew',
    name: 'Mint Dew',
    kind: 'Cool & fizzy',
    icon: 'dew',
    color: '#6fbcd1',
    food: 12, joy: 6, energy: 14, clean: 6,
    line: 'A fizzy little pick-me-up!'
  }
]

export const STAGES = {
  egg: {
    key: 'egg',
    label: 'Mystery Egg',
    short: 'Egg',
    next: 'baby'
  },
  baby: {
    key: 'baby',
    label: 'Mossling',
    short: 'Mossling',
    tagline: 'A mossy little orb with one brave leaf.',
    next: 'child'
  },
  child: {
    key: 'child',
    label: 'Fernling',
    short: 'Fernling',
    tagline: 'Two leaves, a tiny tail, and a lot more confidence.',
    next: 'adult'
  },
  adult: {
    key: 'adult',
    label: 'Sylvan',
    short: 'Sylvan',
    tagline: 'Fully bloomed and absolutely full of themselves.',
    next: null
  }
}

// Care style decides which adult form your friend grows into.
export const BRANCHES = {
  verdant: {
    key: 'verdant',
    name: 'Sylvan',
    title: 'Meadow Guardian',
    blurb: 'A gentle soul with a crown of leaves. You raised them with a little bit of everything.',
    body: '#a9d98c', bodyDark: '#7dbb73', belly: '#d7efb9',
    accent: '#f3c85c', accentDark: '#d99d43',
    leaf: '#5aa760', leafDark: '#3c854f',
    aura: '#b9e6a2'
  },
  bloom: {
    key: 'bloom',
    name: 'Bloomkin',
    title: 'Petal Friend',
    blurb: 'Plump, warm, and always thinking about snacks. Their flower smells faintly of honey.',
    body: '#f2b6c4', bodyDark: '#d98fa9', belly: '#ffe1e2',
    accent: '#ef7f92', accentDark: '#cf5c78',
    leaf: '#64a968', leafDark: '#43834f',
    aura: '#ffc4d2'
  },
  zephyr: {
    key: 'zephyr',
    name: 'Zephyroo',
    title: 'Breeze Chaser',
    blurb: 'A bright spark who never sits still. Their long ears pick up the sound of incoming fun.',
    body: '#a9d8e8', bodyDark: '#7db4cf', belly: '#ddf4f8',
    accent: '#f6c95c', accentDark: '#d99c39',
    leaf: '#5aa7a0', leafDark: '#3c817f',
    aura: '#b5e7f1'
  },
  lumen: {
    key: 'lumen',
    name: 'Lunelle',
    title: 'Moon Dreamer',
    blurb: 'Soft-spoken and cosy. Their tiny halo glows brightest just before a very good nap.',
    body: '#c9b9e6', bodyDark: '#a493c8', belly: '#ece3fb',
    accent: '#f4e4a6', accentDark: '#d1b96a',
    leaf: '#7f9e77', leafDark: '#5c7d5e',
    aura: '#d9c9f4'
  }
}

export const ACHIEVEMENTS = [
  { id: 'firstbite',   name: 'First Bite',      desc: 'Share a snack.',                    icon: 'berry' },
  { id: 'bubblebuddy', name: 'Bubble Buddy',     desc: 'Finish a bath.',                     icon: 'bubble' },
  { id: 'berrybest',   name: 'Berry Best',       desc: 'Catch 15 berries in one game.',      icon: 'star' },
  { id: 'sweetdreams', name: 'Sweet Dreams',     desc: 'Tuck your friend in.',               icon: 'moon' },
  { id: 'growingsprout', name: 'Growing Sprout', desc: 'Reach the Fernling stage.',          icon: 'leaf' },
  { id: 'fullbloom',   name: 'Full Bloom',       desc: 'Raise a fully grown friend.',        icon: 'flower' },
  { id: 'perfectpulse', name: 'Perfect Pulse',   desc: 'Nail all three training beats.',     icon: 'spark' },
  { id: 'bestfriends', name: 'Best Friends',     desc: 'Reach a bond of 80.',                icon: 'heart' }
]

export const TIPS = [
  'Tap your friend for a tiny boost of joy.',
  'A nap restores energy faster than anything else.',
  'Golden berries are worth three points in Berry Catch.',
  'Bond grows when you play, train, and simply say hello.',
  'Every snack fills the belly a little differently.',
  'Your friend evolves faster when they are well cared for.',
  'The room changes with the in-game clock. Stay for sunset.',
  'A dirty room is a sure way to make a little creature grumpy.',
  'Progress saves automatically in this browser.',
  'The Berry Catch basket follows your finger.'
]

export const PET_LINES = [
  'Hehe, that tickles!',
  'You are my favourite person.',
  'Again! Again!',
  'Mmm... warm hands.',
  'I was hoping you would visit.',
  'Do you like my leaf today?'
]

export const IDLE_LINES = [
  'What should we do next?',
  'The window looks nice today.',
  'I wonder what clouds taste like.',
  'I think I felt my leaf grow!',
  'Is it snack time yet?',
  'This rug is extremely good.'
]

export const HUNGRY_LINES = [
  'My tummy is making a tiny thunderstorm.',
  'Maybe... a little snack?',
  'I could eat a whole berry bush.'
]

export const SLEEPY_LINES = [
  'My eyelids are so heavy...',
  'Just five more minutes...',
  'Yaaawn. The rug is calling me.'
]

export const DIRTY_LINES = [
  'I have a leaf full of dust.',
  'A bath would be lovely right now.',
  'I think a berry got stuck to my tail.'
]

export const SAD_LINES = [
  'Could we play for a bit?',
  'I feel a little lonely.',
  'You have been busy, huh?'
]

export const CLOCK_LABELS = ['12 AM', '1 AM', '2 AM', '3 AM', '4 AM', '5 AM', '6 AM', '7 AM', '8 AM', '9 AM', '10 AM', '11 AM',
  '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM', '6 PM', '7 PM', '8 PM', '9 PM', '10 PM', '11 PM']
