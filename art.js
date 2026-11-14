/* Flat SVG artwork for the diner. Everything is drawn locally, no image assets. */
(function () {
  const defs = `
  <defs>
    <linearGradient id="g-cup" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffdf7"/><stop offset="1" stop-color="#e6d8c2"/></linearGradient>
    <linearGradient id="g-glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#eaf8ff" stop-opacity=".95"/><stop offset="1" stop-color="#b9d9e8" stop-opacity=".75"/></linearGradient>
    <linearGradient id="g-tea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c98a3e"/><stop offset="1" stop-color="#8c4c1c"/></linearGradient>
    <linearGradient id="g-ice" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd27f" stop-opacity=".9"/><stop offset="1" stop-color="#e5963a" stop-opacity=".9"/></linearGradient>
    <linearGradient id="g-ramen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f2c67c"/><stop offset="1" stop-color="#dfa250"/></linearGradient>
    <linearGradient id="g-bowl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fdf6e8"/><stop offset="1" stop-color="#dcccae"/></linearGradient>
    <linearGradient id="g-rice" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffdf7"/><stop offset="1" stop-color="#eee3cf"/></linearGradient>
    <linearGradient id="g-pud" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe6a8"/><stop offset="1" stop-color="#f2c264"/></linearGradient>
    <linearGradient id="g-fish" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6c266"/><stop offset="1" stop-color="#ce8a34"/></linearGradient>
    <linearGradient id="g-plate" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffaf0"/><stop offset="1" stop-color="#e3d5bc"/></linearGradient>
  </defs>`;

  const icons = {
    "tea-hot": `
      <ellipse cx="50" cy="79" rx="24" ry="6" fill="#000" opacity=".12"/>
      <ellipse cx="50" cy="72" rx="27" ry="7" fill="#e7d8c0"/>
      <path d="M26 47h48v18a20 20 0 0 1-20 20h-8a20 20 0 0 1-20-20z" fill="url(#g-cup)" stroke="#cbb694" stroke-width="1.6"/>
      <path d="M74 51c9-1 13 4 13 10s-5 11-13 10" fill="none" stroke="#cbb694" stroke-width="4" stroke-linecap="round"/>
      <ellipse cx="50" cy="47" rx="24" ry="7" fill="#7fae62"/>
      <ellipse cx="50" cy="45.5" rx="19" ry="5" fill="#a8c97f" opacity=".75"/>
      <path d="M36 40c-3-6 2-9 0-15M51 38c-3-6 2-9 0-16M65 40c-2-5 2-8 0-13" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".42"/>
      <path d="M32 60h24" stroke="#fff" stroke-width="2" opacity=".5"/>`,
    "tea-cold": `
      <ellipse cx="50" cy="84" rx="22" ry="5" fill="#000" opacity=".12"/>
      <path d="M33 25h36l-4 54a7 7 0 0 1-7 6H44a7 7 0 0 1-7-6z" fill="url(#g-glass)" stroke="#c3dce5" stroke-width="1.6"/>
      <path d="M35 42h32l-3 38a5 5 0 0 1-5 4H43a5 5 0 0 1-5-4z" fill="url(#g-tea)"/>
      <rect x="39" y="48" width="10" height="10" rx="2.5" fill="#ffe8bd" opacity=".75" transform="rotate(-12 44 53)"/>
      <rect x="53" y="53" width="9" height="9" rx="2.5" fill="#fff3d8" opacity=".7" transform="rotate(14 57 57)"/>
      <rect x="48" y="62" width="10" height="9" rx="2.5" fill="#ffe8bd" opacity=".55" transform="rotate(-7 53 66)"/>
      <path d="M57 25L66 6" stroke="#e2553f" stroke-width="4" stroke-linecap="round"/>
      <path d="M52 24l3-6" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".55"/>
      <ellipse cx="50" cy="25" rx="18" ry="4" fill="#d8eef5" opacity=".55"/>`,
    water: `
      <ellipse cx="50" cy="84" rx="22" ry="5" fill="#000" opacity=".12"/>
      <path d="M34 24h32l-4 56a7 7 0 0 1-7 6H45a7 7 0 0 1-7-6z" fill="url(#g-glass)" stroke="#bcd8e4" stroke-width="1.6"/>
      <path d="M36 45h28l-3 35a5 5 0 0 1-5 4H44a5 5 0 0 1-5-4z" fill="#8fd0e4" opacity=".62"/>
      <path d="M40 56h20M42 67h16" stroke="#fff" stroke-width="2" opacity=".5" stroke-linecap="round"/>
      <circle cx="44" cy="51" r="2" fill="#fff" opacity=".65"/>
      <circle cx="56" cy="72" r="1.6" fill="#fff" opacity=".55"/>
      <ellipse cx="50" cy="24" rx="16" ry="4" fill="#d8eef5" opacity=".5"/>`,
    coffee: `
      <ellipse cx="50" cy="80" rx="26" ry="6" fill="#000" opacity=".12"/>
      <ellipse cx="50" cy="73" rx="27" ry="7" fill="#e7d8c0"/>
      <path d="M28 44h44v26a17 17 0 0 1-17 17h-10a17 17 0 0 1-17-17z" fill="url(#g-cup)" stroke="#cbb694" stroke-width="1.6"/>
      <path d="M72 49c8 0 12 4 12 9s-4 9-12 9" fill="none" stroke="#cbb694" stroke-width="4" stroke-linecap="round"/>
      <ellipse cx="50" cy="44" rx="22" ry="7" fill="#5b3a24"/>
      <ellipse cx="50" cy="42" rx="15" ry="4.5" fill="#c99a6b" opacity=".5"/>
      <path d="M36 38c-2-6 3-8 1-14M52 35c-2-6 3-9 1-15M64 38c-2-5 2-7 0-12" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" opacity=".4"/>`,
    ramen: `
      <ellipse cx="50" cy="81" rx="30" ry="6" fill="#000" opacity=".13"/>
      <path d="M18 44h64c0 22-14 34-32 34S18 66 18 44z" fill="url(#g-bowl)" stroke="#c9b795" stroke-width="1.6"/>
      <ellipse cx="50" cy="44" rx="32" ry="9" fill="#b7452e" opacity=".16"/>
      <ellipse cx="50" cy="45" rx="27" ry="7.5" fill="url(#g-ramen)"/>
      <path d="M26 45c6 2 12-2 18 0s12-2 18 0 8 0 12-1" stroke="#f6dfae" stroke-width="2" fill="none" opacity=".9"/>
      <circle cx="38" cy="43" r="7" fill="#fffaf0"/><circle cx="38" cy="43" r="3.6" fill="#ffb640"/>
      <path d="M58 40a5 5 0 1 0 5 6" fill="none" stroke="#f2f0e8" stroke-width="3.2"/>
      <path d="M60 39l8 0" stroke="#e2553f" stroke-width="2.2"/>
      <path d="M31 38c4-5 9-2 10 2" fill="#5d8a4a" opacity=".9"/>
      <path d="M70 30L62 4M74 31L70 3" stroke="#7c4a26" stroke-width="3" stroke-linecap="round"/>
      <path d="M18 47h64" stroke="#e3d5bb" stroke-width="2" opacity=".6"/>`,
    gyoza: `
      <ellipse cx="50" cy="78" rx="32" ry="9" fill="#000" opacity=".12"/>
      <ellipse cx="50" cy="70" rx="32" ry="10" fill="url(#g-plate)" stroke="#cdbb9c" stroke-width="1.5"/>
      <ellipse cx="50" cy="70" rx="25" ry="7" fill="#e8dcc2"/>
      <g>
        <path d="M22 63c0-8 8-12 15-12s14 4 14 12c0 4-6 6-14 6s-15-2-15-6z" fill="#f0c471" stroke="#c89342" stroke-width="1.2"/>
        <path d="M25 58c4-4 9-4 12-2M34 55c4 1 8 3 10 6" stroke="#c89342" stroke-width="1.4" fill="none" stroke-linecap="round"/>
      </g>
      <g>
        <path d="M44 64c0-9 9-13 16-13s15 4 15 13c0 4-6 6-15 6s-16-2-16-6z" fill="#f5cd7f" stroke="#c89342" stroke-width="1.2"/>
        <path d="M48 59c4-4 9-4 12-2M57 56c4 1 8 3 10 6" stroke="#c89342" stroke-width="1.4" fill="none" stroke-linecap="round"/>
      </g>
      <path d="M18 77h64" stroke="#e2553f" stroke-width="2" opacity=".35" stroke-linecap="round"/>`,
    onigiri: `
      <ellipse cx="50" cy="80" rx="25" ry="6" fill="#000" opacity=".12"/>
      <path d="M50 18c5 0 8 4 11 9l17 34c5 10-2 16-12 16H34c-10 0-17-6-12-16l17-34c3-5 6-9 11-9z" fill="url(#g-rice)" stroke="#ddd0b8" stroke-width="1.6"/>
      <path d="M38 58h24v17c0 4-3 5-7 5H45c-4 0-7-1-7-5z" fill="#263a2c"/>
      <path d="M41 62h18" stroke="#3e5844" stroke-width="2" opacity=".8"/>
      <circle cx="44" cy="42" r="1.4" fill="#e6dcc9"/><circle cx="53" cy="37" r="1.2" fill="#e6dcc9"/><circle cx="57" cy="49" r="1.3" fill="#e6dcc9"/>
      <path d="M30 68c4 5 36 5 40 0" stroke="#000" stroke-width="1" opacity=".05" fill="none"/>`,
    pudding: `
      <ellipse cx="50" cy="80" rx="31" ry="8" fill="#000" opacity=".12"/>
      <ellipse cx="50" cy="73" rx="31" ry="9" fill="url(#g-plate)" stroke="#cdbb9c" stroke-width="1.5"/>
      <path d="M30 66c0-6 3-9 4-16 1-8 6-14 16-14s15 6 16 14c1 7 4 10 4 16 0 4-9 6-20 6s-20-2-20-6z" fill="url(#g-pud)" stroke="#d8a34c" stroke-width="1.4"/>
      <path d="M33 52c4-4 9-5 17-5s13 1 17 5c-2-7-7-11-17-11s-15 4-17 11z" fill="#a56722" opacity=".85"/>
      <path d="M38 44c4-3 9-4 12-4" stroke="#f7dca6" stroke-width="2" opacity=".6" fill="none" stroke-linecap="round"/>
      <circle cx="50" cy="31" r="5" fill="#d9473a"/><path d="M52 27c1-3 3-4 5-4" stroke="#4f7f43" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path d="M42 59c5 3 11 3 16 0" stroke="#fff" stroke-width="2" opacity=".28" fill="none" stroke-linecap="round"/>`,
    taiyaki: `
      <ellipse cx="50" cy="78" rx="31" ry="8" fill="#000" opacity=".12"/>
      <ellipse cx="50" cy="70" rx="32" ry="10" fill="url(#g-plate)" stroke="#cdbb9c" stroke-width="1.5"/>
      <path d="M23 63c-4-9 1-19 11-22 8-2 12 3 19 4 9 1 17-5 25 2 7 6 4 17-4 22-7 4-16 2-24 1-9-1-22 2-27-7z" fill="url(#g-fish)" stroke="#b97b2c" stroke-width="1.4"/>
      <path d="M22 59c-8 4-12 11-13 16 7-1 14-5 18-9M85 66c5 5 6 9 5 12-4-2-8-5-10-9" fill="#e0a44c" stroke="#b97b2c" stroke-width="1.3"/>
      <circle cx="38" cy="51" r="3.4" fill="#4a2a12"/><circle cx="39" cy="50" r="1.1" fill="#fff"/>
      <path d="M34 62c6 3 13 3 18 1M57 58c5 2 10 2 14 0" stroke="#c58a3e" stroke-width="1.4" fill="none" stroke-linecap="round"/>
      <path d="M52 48c7 0 14 0 20-1" stroke="#f6d79a" stroke-width="2" opacity=".5" fill="none" stroke-linecap="round"/>`
  };

  const other = {
    coin: `<circle cx="12" cy="12" r="9" fill="#ffc65c"/><circle cx="12" cy="12" r="6.4" fill="none" stroke="#b8761e" stroke-width="1.3"/><path d="M11 7h2v10h-2zM8 9h8M8 15h8" stroke="#8a5412" stroke-width="1.3" stroke-linecap="round"/>`,
    ear: `<path d="M8 10a6 6 0 0 1 12 0c0 4-4 5-4 9a3 3 0 0 1-5.6 1.4M12 10a2.4 2.4 0 0 1 3.4 2.2" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>`,
    tap: `<path d="M9 11V6.5a1.7 1.7 0 0 1 3.4 0V10m0-1.2a1.7 1.7 0 0 1 3.4 0V11m0-1a1.7 1.7 0 0 1 3.4 0v4.2c0 3.4-2.4 5.8-5.8 5.8h-1.3A5.7 5.7 0 0 1 7 16.6L5.2 14a1.6 1.6 0 0 1 2.3-2.2L9 13.4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>`,
    hand: `<path d="M4 11h13a3 3 0 0 1 3 3v2a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M4 11l3-5 3 3M12 8l2-4 3 4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`,
    star: `<path d="M12 3l2.6 5.6 6.1.8-4.5 4.3 1.1 6-5.3-3-5.3 3 1.1-6L3.3 9.4l6.1-.8z" fill="currentColor"/>`,
    check: `<circle cx="12" cy="12" r="9" fill="currentColor" opacity=".16"/><path d="M7.5 12.5l3 3 6-7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`,
    clock: `<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 7.5V12l3 2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>`,
    no: `<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M6.5 6.5l11 11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`
  };

  const numSvg = {
    1: `<circle cx="12" cy="12" r="10" fill="#e2553f"/><circle cx="12" cy="5.6" r="1.5" fill="#ffd9a0"/><path d="M11 7.5h2v9h-2z" fill="#fff8ea"/><path d="M8.5 9.5L12 7.2l2 2.3" fill="none" stroke="#fff8ea" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>`,
    2: `<circle cx="12" cy="12" r="10" fill="#e2553f"/><circle cx="12" cy="5.6" r="1.5" fill="#ffd9a0"/><path d="M8.4 10.2a3.7 3.7 0 1 1 3.9 4c-2.2 0-3.9 1.6-3.9 3.4h7.3" fill="none" stroke="#fff8ea" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>`,
    3: `<circle cx="12" cy="12" r="10" fill="#e2553f"/><circle cx="12" cy="5.6" r="1.5" fill="#ffd9a0"/><path d="M8.6 9.3a3.4 3.4 0 1 1 3.2 4.7h-.6M8.6 15.1a3.5 3.5 0 1 0 3.2-4.9" fill="none" stroke="#fff8ea" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`,
    4: `<circle cx="12" cy="12" r="10" fill="#e2553f"/><circle cx="12" cy="5.6" r="1.5" fill="#ffd9a0"/><path d="M14.2 7.4v9.2M9 11.4l5.2-1.6M9 11.4V7" fill="none" stroke="#fff8ea" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>`,
    5: `<circle cx="12" cy="12" r="10" fill="#e2553f"/><circle cx="12" cy="5.6" r="1.5" fill="#ffd9a0"/><path d="M9 7.5h5.6l-.7 4.1h1.2a3.4 3.4 0 0 1 0 6.8 3.9 3.9 0 0 1-3.3-1.8" fill="none" stroke="#fff8ea" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`
  };

  function sprite() {
    let out = defs;
    Object.keys(icons).forEach(id => { out += `<symbol id="ic-${id}" viewBox="0 0 100 100">${icons[id]}</symbol>`; });
    Object.keys(other).forEach(id => { out += `<symbol id="ic-${id}" viewBox="0 0 24 24">${other[id]}</symbol>`; });
    Object.keys(numSvg).forEach(id => { out += `<symbol id="num-${id}" viewBox="0 0 24 24">${numSvg[id]}</symbol>`; });
    document.getElementById('sprite').innerHTML = out;
  }

  function item(id) { return `<svg viewBox="0 0 100 100" aria-hidden="true"><use href="#ic-${id}"/></svg>`; }
  function glyph(id, cls) { return `<svg class="${cls || ''}" viewBox="0 0 24 24" aria-hidden="true"><use href="#ic-${id}"/></svg>`; }
  function num(n) { return `<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#num-${n}"/></svg>`; }

  window.Art = { sprite, item, glyph, num, icons };
})();
