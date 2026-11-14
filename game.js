(() => {
  'use strict';

  const menu = [
    { id: 'tea-hot', jp: 'おちゃ', en: 'hot tea', voice: 'おちゃ', price: 120 },
    { id: 'tea-cold', jp: 'れいちゃ', en: 'iced tea', voice: 'れいちゃ', price: 120 },
    { id: 'water', jp: 'みず', en: 'water', voice: 'みず', price: 0 },
    { id: 'coffee', jp: 'コーヒー', en: 'coffee', voice: 'コーヒー', price: 180 },
    { id: 'ramen', jp: 'ラーメン', en: 'ramen', voice: 'ラーメン', price: 680 },
    { id: 'gyoza', jp: 'ぎょうざ', en: 'dumplings', voice: 'ぎょうざ', price: 320 },
    { id: 'onigiri', jp: 'おにぎり', en: 'rice ball', voice: 'おにぎり', price: 180 },
    { id: 'pudding', jp: 'プリン', en: 'pudding', voice: 'プリン', price: 240 },
    { id: 'taiyaki', jp: 'たいやき', en: 'taiyaki', voice: 'たいやき', price: 260 }
  ];
  const menuById = Object.fromEntries(menu.map(item => [item.id, item]));
  const plans = [
    [ [['ramen', 1]], [['tea-cold', 1]], [['gyoza', 1]], [['pudding', 1]] ],
    [ [['ramen', 1], ['water', 1]], [['onigiri', 2]], [['coffee', 1]], [['taiyaki', 1], ['tea-hot', 1]] ],
    [ [['ramen', 1], ['gyoza', 1]], [['tea-cold', 1], ['onigiri', 1]], [['gyoza', 2]], [['coffee', 1], ['pudding', 1]] ]
  ];
  const customers = [
    { name: 'あおいさん', skin: '#e9b18b', hair: '#263044', shirt: '#648c83', accessory: 'band' },
    { name: 'たけしさん', skin: '#d99a70', hair: '#342820', shirt: '#bd6b4f', accessory: 'cap' },
    { name: 'ゆきさん', skin: '#f0c5a5', hair: '#493342', shirt: '#7588b7', accessory: 'bow' },
    { name: 'はるさん', skin: '#bd805e', hair: '#202738', shirt: '#d49b4e', accessory: 'none' }
  ];
  const $ = id => document.getElementById(id);
  const els = {
    shelf: $('shelf'), tray: $('tray'), trayEmpty: $('trayEmpty'), serve: $('serveBtn'), clear: $('clearBtn'),
    overlay: $('overlay'), sentence: $('sentence'), who: $('whoName'), customer: $('customer'),
    speech: $('speech'), replay: $('replayBtn'), patience: $('patienceFill'), orderNo: $('orderNo'),
    coins: $('coinCount'), day: $('dayLabel'), combo: $('comboPill'), comboCount: $('comboCount'),
    sound: $('soundBtn'), floaty: $('floaty'), caption: $('sceneCaption'), shelfNote: $('shelfNote'), toast: $('toastWrap')
  };

  const state = { day: 1, order: 0, coins: 0, combo: 0, tray: {}, current: null, sound: true, running: false, locked: false, time: 0, tick: null, toastTimer: null };
  const colors = ['#e9b18b', '#d99a70', '#f0c5a5', '#bd805e'];

  function icon(id, cls = '') { return `<span class="${cls}">${Art.item(id)}</span>`; }
  function escapeHtml(text) { return String(text).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch])); }

  function drawShelf() {
    els.shelf.innerHTML = menu.map((item, index) => `
      <button class="item" type="button" data-item="${item.id}" aria-label="${item.jp}, ${item.en}. Add to tray; press ${index + 1}.">
        <span class="key">${index + 1}</span>
        <span class="art">${Art.item(item.id)}</span>
        <span class="jp">${item.jp}<span class="mod">${item.en}</span></span>
        <span class="price">${item.price ? `¥${item.price}` : 'free'}</span>
        <span class="say" aria-hidden="true">${Art.glyph('ear')}</span>
      </button>`).join('');
  }

  function customerArt(person) {
    const accessory = person.accessory === 'band'
      ? '<path d="M31 38 Q60 24 89 39" stroke="#e05b45" stroke-width="8" fill="none"/><circle cx="84" cy="34" r="7" fill="#ffc65c"/>'
      : person.accessory === 'cap'
        ? '<path d="M25 42 Q30 18 60 17 Q87 20 94 43 L68 39 L36 48Z" fill="#34465d"/><path d="M25 42 Q62 39 96 45" stroke="#e6b45e" stroke-width="5"/>'
        : person.accessory === 'bow'
          ? '<path d="M77 26q-15-12-15 2t15 3q15 9 14-4t-14-1" fill="#e76e73"/>' : '';
    return `<svg viewBox="0 0 220 250" role="img" aria-label="A diner customer" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="111" cy="237" rx="77" ry="10" fill="#111523" opacity=".35"/>
      <path d="M52 139 Q55 116 84 111h53q31 5 35 31l14 83H34z" fill="${person.shirt}"/>
      <path d="M84 110v29l26 20 27-20v-30" fill="${person.skin}"/>
      <ellipse cx="110" cy="74" rx="53" ry="61" fill="${person.skin}"/>
      <path d="M57 77Q47 15 108 12q58 1 57 60-7-25-18-32-30 12-73-2-2 23-17 39" fill="${person.hair}"/>
      ${accessory}
      <path d="M83 76q7-7 14 0M123 76q7-7 14 0" stroke="#34261f" stroke-width="4" stroke-linecap="round" fill="none"/>
      <circle cx="91" cy="80" r="2.5" fill="#33231b"/><circle cx="131" cy="80" r="2.5" fill="#33231b"/>
      <path d="M103 91q8 6 15 0" stroke="#a95d54" stroke-width="2.5" stroke-linecap="round" fill="none"/>
      <path d="M74 111q36 28 72 0" fill="none" stroke="rgba(255,255,255,.25)" stroke-width="3"/>
      <path d="M34 224h153" stroke="rgba(255,255,255,.1)" stroke-width="3"/>
      <circle cx="53" cy="149" r="8" fill="${person.skin}"/><circle cx="168" cy="149" r="8" fill="${person.skin}"/>
    </svg>`;
  }

  function phraseHTML(order) {
    const parts = [];
    order.items.forEach(([id, count], i) => {
      const item = menuById[id];
      parts.push(`<span class="tok"><span class="ico">${Art.item(id)}</span><span class="txt">${item.jp}</span></span>`);
      parts.push(`<span class="tok counter"><span class="txt">${count === 1 ? 'ひとつ' : 'ふたつ'}</span></span>`);
      if (i < order.items.length - 1) parts.push('<span class="tok particle">と</span>');
    });
    parts.push('<span class="tok particle">を</span><span class="tok"><span class="txt">ください</span></span><span class="punct">。</span>');
    return parts.join('');
  }

  function setOrder() {
    state.current = { items: plans[Math.min(state.day, 3) - 1][state.order] };
    state.tray = {};
    state.locked = false;
    const person = customers[(state.order + state.day - 1) % customers.length];
    els.who.textContent = person.name;
    els.customer.innerHTML = customerArt(person);
    els.customer.classList.remove('leaving');
    els.customer.classList.add('enter');
    window.setTimeout(() => els.customer.classList.remove('enter'), 600);
    els.sentence.innerHTML = phraseHTML(state.current);
    els.orderNo.textContent = `${state.order + 1} / 4`;
    els.caption.classList.remove('hide');
    els.shelfNote.textContent = state.day === 1 ? 'ことばは おさらの うえで おぼえる' : 'ことばを よくきいて、ちゅうもんを ととのえよう';
    renderTray();
    startPatience();
    window.setTimeout(() => speakOrder(), 400);
  }

  function renderTray() {
    els.tray.querySelectorAll('.tray-chip').forEach(node => node.remove());
    const entries = Object.entries(state.tray);
    els.trayEmpty.hidden = entries.length > 0;
    for (const [id, count] of entries) {
      const item = menuById[id];
      const chip = document.createElement('button');
      chip.type = 'button'; chip.className = 'tray-chip'; chip.setAttribute('aria-label', `Remove one ${item.en}`);
      chip.innerHTML = `<span class="mini">${Art.item(id)}</span><span class="lbl">${item.jp}<small>${item.en}</small></span>${count > 1 ? `<span class="cnt">${count}</span>` : ''}`;
      chip.addEventListener('click', () => { if (!state.locked) { state.tray[id]--; if (!state.tray[id]) delete state.tray[id]; renderTray(); } });
      els.tray.append(chip);
    }
    els.serve.disabled = !entries.length || state.locked;
    els.serve.classList.toggle('ready', entries.length > 0 && !state.locked);
  }

  function speechSpeak(text) {
    if (!state.sound) return;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ja-JP'; utterance.rate = 0.88; utterance.pitch = 1.02;
      const voices = window.speechSynthesis.getVoices();
      const japanese = voices.find(voice => voice.lang.toLowerCase().startsWith('ja'));
      if (japanese) utterance.voice = japanese;
      window.speechSynthesis.speak(utterance);
    }
    beep(520, .045, 'sine', .025);
  }

  function speakOrder() { speechSpeak(state.current.items.map(([id, n]) => `${menuById[id].voice}を${n === 1 ? 'ひとつ' : 'ふたつ'}`).join('、') + 'ください'); }
  function speakItem(id) { speechSpeak(menuById[id].voice); }

  function beep(freq, duration, type = 'sine', gain = .045) {
    if (!state.sound) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext(); const osc = ctx.createOscillator(); const vol = ctx.createGain();
      osc.type = type; osc.frequency.value = freq; vol.gain.setValueAtTime(gain, ctx.currentTime);
      vol.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + duration);
      osc.connect(vol); vol.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + duration);
      osc.onended = () => ctx.close();
    } catch (_) { /* Audio is an optional enhancement. */ }
  }

  function addItem(id) {
    if (!state.running || state.locked) return;
    const total = Object.values(state.tray).reduce((a, b) => a + b, 0);
    if (total >= 5) { notify('トレイがいっぱい！ (Tray is full)'); return; }
    state.tray[id] = (state.tray[id] || 0) + 1;
    if (state.tray[id] > 3) { state.tray[id] = 3; notify('ひとつずつ えらんでね'); }
    renderTray();
    document.querySelectorAll('.item').forEach(button => button.classList.toggle('hinted', button.dataset.item === id && state.current.items.some(([wanted]) => wanted === id)));
    const card = document.querySelector(`.item[data-item="${id}"]`);
    card?.classList.add('just-added'); window.setTimeout(() => card?.classList.remove('just-added'), 350);
    speakItem(id);
  }

  function isCorrect() {
    const wanted = Object.fromEntries(state.current.items);
    const keys = new Set([...Object.keys(wanted), ...Object.keys(state.tray)]);
    return [...keys].every(id => (wanted[id] || 0) === (state.tray[id] || 0));
  }

  function serve() {
    if (!state.running || state.locked || !Object.keys(state.tray).length) return;
    if (!isCorrect()) {
      state.combo = 0; els.combo.hidden = true;
      els.speech.classList.remove('shake'); void els.speech.offsetWidth; els.speech.classList.add('shake');
      beep(180, .15, 'triangle', .05);
      const wanted = Object.fromEntries(state.current.items);
      const missing = Object.keys(wanted).find(id => (state.tray[id] || 0) < wanted[id]);
      const extra = Object.keys(state.tray).find(id => !wanted[id] || state.tray[id] > wanted[id]);
      const clue = missing ? `「${menuById[missing].jp}を ${wanted[missing] === 1 ? 'ひとつ' : 'ふたつ'}」` : `「${menuById[extra].jp}」は ちがうみたい`;
      notify(`もういちど きいてみよう · ${clue}`);
      return;
    }
    state.locked = true; renderTray(); stopPatience();
    state.combo++; const earned = 10 + Math.min(state.combo - 1, 5) * 2;
    state.coins += earned; els.coins.textContent = state.coins;
    els.comboCount.textContent = state.combo; els.combo.hidden = state.combo < 2;
    $('coinCount').parentElement.classList.remove('bump'); void $('coinCount').offsetWidth; $('coinCount').parentElement.classList.add('bump');
    els.floaty.textContent = `+${earned} ✦`; els.floaty.classList.remove('show'); void els.floaty.offsetWidth; els.floaty.classList.add('show');
    beep(700, .12, 'sine', .07); window.setTimeout(() => beep(940, .16, 'sine', .05), 90);
    els.speech.classList.remove('shake');
    notify('ぴったり！ ありがとう！ · Exactly right!');
    window.setTimeout(() => {
      state.order++;
      if (state.order >= 4) showDayEnd(); else setOrder();
    }, 1000);
  }

  function startPatience() {
    stopPatience(); state.time = 60; updatePatience();
    state.tick = window.setInterval(() => { state.time = Math.max(0, state.time - .2); updatePatience(); }, 200);
  }
  function stopPatience() { if (state.tick) window.clearInterval(state.tick); state.tick = null; }
  function updatePatience() {
    els.patience.style.width = `${state.time / 60 * 100}%`;
    els.patience.classList.toggle('warn', state.time < 25 && state.time >= 12);
    els.patience.classList.toggle('low', state.time < 12);
  }

  function notify(message) {
    els.toast.innerHTML = `<div class="toast">${escapeHtml(message)}</div>`;
    window.clearTimeout(state.toastTimer); state.toastTimer = window.setTimeout(() => { els.toast.innerHTML = ''; }, 2600);
  }

  function openOverlay(content) { stopPatience(); els.overlay.innerHTML = content; els.overlay.hidden = false; }
  function closeOverlay() { els.overlay.hidden = true; els.overlay.innerHTML = ''; }
  function startGame() {
    closeOverlay(); state.running = true; state.order = 0; state.combo = 0;
    els.combo.hidden = true; els.day.textContent = `${state.day}日目`;
    setOrder();
  }

  function titleScreen() {
    state.running = false; stopPatience();
    openOverlay(`<section class="sheet title-screen" role="dialog" aria-modal="true" aria-labelledby="titleHeading">
      <div class="title-art">${Art.item('ramen')}</div>
      <h2 class="shop-name" id="titleHeading">ゆうやけ食堂</h2>
      <div class="tagline">Listen. Choose. Serve. Learn Japanese.</div>
      <div class="howto">
        <div class="step"><span class="num">1</span><div class="ic">${Art.glyph('ear')}</div><div class="jp">おきゃくさんの<br>ちゅうもんを きく</div><span class="en">listen to the order</span></div>
        <div class="step"><span class="num">2</span><div class="ic">${Art.glyph('tap')}</div><div class="jp">おしながきから<br>えらぶ</div><span class="en">choose from the menu</span></div>
        <div class="step"><span class="num">3</span><div class="ic">${Art.glyph('hand')}</div><div class="jp">トレイに のせて<br>「どうぞ」</div><span class="en">serve the right order</span></div>
      </div>
      <p>Learn by understanding real requests—not by drilling flashcards. Tap the speaker any time to listen again.</p>
      <button class="start-btn" id="startGameBtn" type="button">${state.day > 1 ? 'つぎの夜へ' : 'おみせを はじめる'} <span class="arrow">→</span></button>
      <div class="start-cheat">Day ${state.day} · 4 customers · Keyboard: 1–9, Enter to serve, Backspace to clear</div>
    </section>`);
    $('startGameBtn').addEventListener('click', startGame);
  }

  function showDayEnd() {
    state.running = false; stopPatience();
    const nextDay = Math.min(3, state.day + 1);
    const label = state.day === 3 ? 'また あした！' : `Day ${nextDay} adds new combinations.`;
    const action = state.day === 3 ? 'もういちど あそぶ' : 'つぎの夜へ';
    openOverlay(`<section class="sheet" role="dialog" aria-modal="true" aria-labelledby="endHeading">
      <div class="summary-head"><div class="stamp">満席<small>GOOD JOB</small></div><div><h2 id="endHeading">ごちそうさま！</h2><div class="sub">THE DINER IS HAPPY</div></div></div>
      <p>すべての ちゅうもんを とどけたよ。<br>You understood and served every order.</p>
      <div class="stars">${[1, 2, 3].map(() => `<span>${Art.glyph('star')}</span>`).join('')}</div>
      <div class="score-row"><div class="cell"><b>4 / 4</b><span>orders served</span></div><div class="cell"><b>${state.coins}</b><span>total coins</span></div><div class="cell"><b>${state.combo}×</b><span>final streak</span></div></div>
      <p><b>今日のことば · Words in context</b></p>
      <div class="word-list">${[...new Set(plans[state.day - 1].flatMap(order => order.map(([id]) => id)))].map(id => `<span class="word-chip"><span class="w-ico">${Art.item(id)}</span>${menuById[id].jp}<span class="w-en">${menuById[id].en}</span></span>`).join('')}</div>
      <div class="sheet-actions"><button class="btn-primary" id="nextDayBtn" type="button">${action} →</button><button class="btn-ghost" id="reviewBtn" type="button">もういちど</button></div>
      <p class="sub" style="margin:12px 0 0">Tap a menu card to hear how the word sounds.</p>
    </section>`);
    $('nextDayBtn').addEventListener('click', () => { state.day = nextDay; state.combo = 0; startGame(); });
    $('reviewBtn').addEventListener('click', () => { state.order = 0; startGame(); });
  }

  function showHelp() {
    openOverlay(`<section class="sheet" role="dialog" aria-modal="true" aria-labelledby="helpHeading">
      <button class="sheet-close" type="button" aria-label="Close">×</button><h2 id="helpHeading">あそびかた</h2><div class="sub">HOW TO PLAY</div>
      <div class="help-grid">
        <div class="help-row"><div class="ic">${Art.glyph('ear')}</div><div><b>Listen to the whole request</b><span>Tap the speech bubble or 「もういちど」 to hear it again in Japanese.</span><span class="en">「ひとつ」= one · 「ふたつ」= two · 「ください」= please / I'd like</span></div></div>
        <div class="help-row"><div class="ic">${Art.glyph('tap')}</div><div><b>Choose, then check the tray</b><span>Tap food to add it. Tap a tray item to remove one. A perfect match earns coins and builds your streak.</span></div></div>
        <div class="help-row"><div class="ic">${Art.glyph('hand')}</div><div><b>Serve with 「どうぞ」</b><span>If something is off, the customer gives you a gentle clue. There's no penalty for taking your time.</span></div></div>
      </div>
      <div class="toggle-row"><button class="toggle" id="helpSound" type="button" aria-pressed="${state.sound}">Sound ${state.sound ? 'on' : 'off'}</button></div>
      <div class="sheet-actions"><button class="btn-primary" id="helpDone" type="button">わかった！</button></div>
    </section>`);
    $('helpSound').addEventListener('click', toggleSound);
    $('helpDone').addEventListener('click', () => { closeOverlay(); if (state.running) startPatience(); });
    els.overlay.querySelector('.sheet-close').addEventListener('click', () => { closeOverlay(); if (state.running) startPatience(); });
  }

  function toggleSound() {
    state.sound = !state.sound; els.sound.setAttribute('aria-pressed', String(state.sound));
    els.sound.setAttribute('aria-label', state.sound ? 'Sound on' : 'Sound off');
    if (!state.sound && 'speechSynthesis' in window) window.speechSynthesis.cancel();
    const helpButton = $('helpSound');
    if (helpButton) { helpButton.setAttribute('aria-pressed', String(state.sound)); helpButton.textContent = `Sound ${state.sound ? 'on' : 'off'}`; }
  }

  function bind() {
    drawShelf();
    els.shelf.addEventListener('click', event => {
      const card = event.target.closest('.item'); if (!card) return;
      const id = card.dataset.item;
      if (event.target.closest('.say')) speakItem(id); else addItem(id);
    });
    els.serve.addEventListener('click', serve);
    els.clear.addEventListener('click', () => { if (state.running && !state.locked) { state.tray = {}; renderTray(); } });
    els.replay.addEventListener('click', event => { event.stopPropagation(); if (state.current) speakOrder(); });
    els.speech.addEventListener('click', event => { if (!event.target.closest('button') && state.current) speakOrder(); });
    els.speech.addEventListener('keydown', event => { if ((event.key === 'Enter' || event.key === ' ') && !event.target.closest('button')) { event.preventDefault(); speakOrder(); } });
    els.sound.addEventListener('click', toggleSound);
    $('helpBtn').addEventListener('click', showHelp);
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !els.overlay.hidden) { if (state.running) { closeOverlay(); startPatience(); } return; }
      if (!els.overlay.hidden || !state.running || event.target.closest('button')) return;
      if (/^[1-9]$/.test(event.key)) addItem(menu[Number(event.key) - 1].id);
      if (event.key === 'Enter') serve();
      if (event.key === 'Backspace' || event.key === 'Delete') { event.preventDefault(); state.tray = {}; renderTray(); }
    });
  }

  Art.sprite(); bind(); titleScreen();
})();
