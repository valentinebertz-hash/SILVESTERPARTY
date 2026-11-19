/* Eigenständige Hasenanimation; keine Änderungen an Supabase oder dem Schneemann. */
(() => {
  'use strict';
  const photo = document.getElementById('locationPhoto');
  if (!photo) return;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  // Plastische Seitenansicht: Schattierung, rundes Volumen, abgesetzte Pfoten.
  // Beim Richtungswechsel wird die Blickrichtung gewechselt, nicht die Figur um ihre Y-Achse gedreht.
  const bunnySVG = `<svg viewBox="0 0 90 82" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <radialGradient id="bunnyFur" cx="28%" cy="20%" r="85%">
        <stop offset="0" stop-color="#fff"/><stop offset=".48" stop-color="#f9fdff"/><stop offset=".77" stop-color="#d9eaf7"/><stop offset="1" stop-color="#8faec6"/>
      </radialGradient>
      <linearGradient id="bunnyEar" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#fff"/><stop offset=".6" stop-color="#e8f3fb"/><stop offset="1" stop-color="#a3c0d3"/></linearGradient>
      <radialGradient id="bunnyTail"><stop stop-color="#fff"/><stop offset=".7" stop-color="#f7fcff"/><stop offset="1" stop-color="#a8c2d7"/></radialGradient>
    </defs>
    <g class="bunny-body" stroke="#86a4bb" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round">
      <ellipse cx="40" cy="57" rx="30" ry="19" fill="url(#bunnyFur)"/>
      <circle cx="16" cy="49" r="10" fill="url(#bunnyTail)"/>
      <ellipse cx="55" cy="70" rx="15" ry="6" fill="url(#bunnyFur)"/>
      <ellipse cx="25" cy="72" rx="13" ry="6" fill="url(#bunnyFur)"/>
      <path d="M58 36 Q54 17 58 4 Q64 -3 69 7 Q72 20 67 36Z" fill="url(#bunnyEar)"/>
      <path d="M67 37 Q69 17 76 9 Q83 4 84 13 Q83 27 76 41Z" fill="url(#bunnyEar)"/>
      <path d="M62 30 Q59 13 63 8 Q67 18 65 30Z" fill="#eeb5c8" stroke="none"/>
      <path d="M73 32 Q76 16 80 14 Q79 25 75 34Z" fill="#eeb5c8" stroke="none"/>
      <circle cx="67" cy="44" r="19" fill="url(#bunnyFur)"/>
      <ellipse cx="82" cy="49" rx="8" ry="6" fill="#edf7ff" stroke="none"/>
      <circle cx="72" cy="41" r="3" fill="#263a4a" stroke="none"/>
      <circle cx="73" cy="40" r=".9" fill="#fff" stroke="none"/>
      <ellipse cx="86" cy="48" rx="3" ry="2.5" fill="#e8a1b8" stroke="none"/>
      <path d="M82 52l-8 2m8-1 8 1m-8 1-7 3" stroke="#879eaf" stroke-width=".9" fill="none"/>
      <path d="M32 46q10-11 21-8" stroke="#fff" stroke-width="2.2" opacity=".7" fill="none"/>
    </g></svg>`;
  let layer;
  let stopped = false;
  let active = 0;
  let timer;
  const rand = (a,b) => a + Math.random() * (b-a);
  function start() {
    const frame = photo.closest('.snowman-photo-frame');
    if (!frame) return false;
    if (layer) return true;
    layer = document.createElement('div');
    layer.className = 'bunny-layer';
    layer.setAttribute('aria-hidden','true');
    frame.appendChild(layer);
    schedule(1800);
    return true;
  }
  function schedule(ms) {
    clearTimeout(timer);
    if (stopped || reduceMotion.matches) return;
    timer = setTimeout(() => {
      if (!photo.hidden && getComputedStyle(photo).display !== 'none' && active < 3) {
        // 1-3 kleine Hasen, zeitversetzt und mit wechselnden Laufwegen.
        const count = Math.floor(rand(1,4));
        for (let i=0; i<count; i++) setTimeout(spawn, i*rand(300,700));
      }
      schedule(rand(11000,19000));
    }, ms);
  }
  function spawn() {
    if (!layer || reduceMotion.matches || active >= 3 || photo.hidden) return;
    const bounds = layer.getBoundingClientRect();
    if (bounds.width < 80 || bounds.height < 60) return;
    active++;
    const bunny = document.createElement('div');
    bunny.className='bunny';
    const snowman = layer.parentElement.querySelector('.snowman-in-yard');
    const snowmanWidth = snowman ? snowman.getBoundingClientRect().width : Math.min(60,bounds.width*.12);
    const size = Math.max(8,Math.min(18,snowmanWidth/4));
    bunny.style.setProperty('--bunny-size', `${size}px`);
    bunny.innerHTML = bunnySVG;
    bunny.dataset.direction = "left";
    layer.appendChild(bunny);
    // Die Hasen bleiben im unteren rechten Bereich des Bildes.
    const startX = bounds.width + size;
    const endX = bounds.width + size*2;
    const farX = rand(bounds.width*.63,bounds.width*.82);
    const yBase = rand(bounds.height*.78,bounds.height*.91);
    const duration = rand(5300,8800);
    const jumps = [
      {offset:0,transform:`translate(${startX}px,${yBase}px)`},
      {offset:.14,transform:`translate(${bounds.width*.91}px,${yBase-size*.85}px)`},
      {offset:.27,transform:`translate(${bounds.width*.85}px,${yBase+size*.1}px)`},
      {offset:.40,transform:`translate(${farX}px,${yBase-size*.65}px)`},
      {offset:.52,transform:`translate(${farX+size*.8}px,${yBase}px)`},
      {offset:.66,transform:`translate(${bounds.width*.83}px,${yBase-size*1.2}px)`},
      {offset:.80,transform:`translate(${bounds.width*.91}px,${yBase+size*.1}px)`},
      {offset:1,transform:`translate(${endX}px,${yBase-size*.6}px)`}
    ];
    // Eine schattierte Seitenansicht bleibt während des ganzen Laufs volumig.
    // Richtung durch horizontales Spiegeln der Ansicht, ohne 3D-Klapp-Effekt.
    const turnTimer = setTimeout(() => { if (bunny.isConnected) bunny.dataset.direction = 'right'; }, duration * .50);
    const motion = bunny.animate(jumps,{duration,easing:'ease-in-out',fill:'forwards'});
    motion.finished.catch(()=>{}).finally(()=>{clearTimeout(turnTimer);bunny.remove();active--;});
  }
  if (!start()) {
    const observer = new MutationObserver(() => {if (start()) observer.disconnect();});
    observer.observe(document.body,{childList:true,subtree:true});
    setTimeout(()=>observer.disconnect(),15000);
  }
  reduceMotion.addEventListener?.('change', () => {
    stopped=reduceMotion.matches;
    if (stopped) {clearTimeout(timer);layer?.replaceChildren();active=0;}
    else schedule(1000);
  });
})();
