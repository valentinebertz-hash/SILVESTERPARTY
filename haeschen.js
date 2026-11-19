/* Eigenständige Hasenanimation; keine Änderungen an Supabase oder dem Schneemann. */
(() => {
  'use strict';
  const photo = document.getElementById('locationPhoto');
  if (!photo) return;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const bunnySVG = `<svg viewBox="0 0 64 78" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
    <g class="bunny-body" stroke="#8ba9bc" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round">
      <ellipse cx="20" cy="22" rx="8" ry="20" fill="#f7fcff" transform="rotate(-12 20 22)"/>
      <ellipse cx="41" cy="22" rx="8" ry="20" fill="#f7fcff" transform="rotate(11 41 22)"/>
      <ellipse cx="20" cy="22" rx="3.3" ry="14" fill="#f6c7d4" stroke="none" transform="rotate(-12 20 22)"/>
      <ellipse cx="41" cy="22" rx="3.3" ry="14" fill="#f6c7d4" stroke="none" transform="rotate(11 41 22)"/>
      <ellipse cx="32" cy="60" rx="22" ry="15" fill="#dceefa"/>
      <circle cx="11" cy="58" r="8" fill="#fff"/>
      <circle cx="32" cy="45" r="19" fill="#fff"/>
      <circle cx="26" cy="44" r="2.7" fill="#243b4d" stroke="none"/>
      <circle cx="39" cy="44" r="2.7" fill="#243b4d" stroke="none"/>
      <path d="M30 52l3 3 3-3z" fill="#e9a7bb" stroke="none"/>
      <path d="M33 55v3m-6-1 6 1 6-1" fill="none" stroke="#849db0" stroke-width="1.5"/>
      <ellipse cx="20" cy="70" rx="10" ry="5" fill="#fff"/>
      <ellipse cx="46" cy="70" rx="10" ry="5" fill="#fff"/>
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
    layer.appendChild(bunny);
    // Die Hasen bleiben im unteren rechten Bereich des Bildes.
    const startX = bounds.width + size;
    const endX = bounds.width + size*2;
    const farX = rand(bounds.width*.63,bounds.width*.82);
    const yBase = rand(bounds.height*.78,bounds.height*.91);
    const duration = rand(5300,8800);
    const jumps = [
      {offset:0,transform:`translate(${startX}px,${yBase}px) scaleX(-1)`},
      {offset:.14,transform:`translate(${bounds.width*.91}px,${yBase-size*.85}px) scaleX(-1)`},
      {offset:.27,transform:`translate(${bounds.width*.85}px,${yBase+size*.1}px) scaleX(-1)`},
      {offset:.40,transform:`translate(${farX}px,${yBase-size*.65}px) scaleX(-1)`},
      {offset:.52,transform:`translate(${farX+size*.8}px,${yBase}px) scaleX(1)`},
      {offset:.66,transform:`translate(${bounds.width*.83}px,${yBase-size*1.2}px) scaleX(1)`},
      {offset:.80,transform:`translate(${bounds.width*.91}px,${yBase+size*.1}px) scaleX(1)`},
      {offset:1,transform:`translate(${endX}px,${yBase-size*.6}px) scaleX(1)`}
    ];
    const motion = bunny.animate(jumps,{duration,easing:'ease-in-out',fill:'forwards'});
    motion.finished.catch(()=>{}).finally(()=>{bunny.remove();active--;});
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
