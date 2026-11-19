(() => {
  'use strict';
  const bulbColors = ['#ffe28a','#ff696c','#85e7ff','#baff8a','#ffb6ee','#ffe28a','#82eaff','#ff7777','#fff0a4','#9be9ff','#baff8a'];
  const makeLights = () => {
    const bulbs = bulbColors.map((color,i) => {
      const x=18+i*36, y=15+12*Math.sin(Math.PI*i/(bulbColors.length-1));
      return `<g style="color:${color}"><path d="M${x} ${y-6}v5" stroke="#273e30" stroke-width="3"/><ellipse class="bulb" cx="${x}" cy="${y+4}" rx="5" ry="8" fill="${color}"/></g>`;
    }).join('');
    return `<svg class="party-light-wire" viewBox="0 0 400 80" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 13 Q200 72 400 13"/>${bulbs}</svg>`;
  };
  function ensure() {
    const frame=document.querySelector('.snowman-photo-frame');
    if (!frame || frame.querySelector('.party-light-tint')) return;
    const tint=document.createElement('div');
    tint.className='party-light-tint';
    tint.setAttribute('aria-hidden','true');
    const lights=document.createElement('div');
    lights.className='party-festive-lights';
    lights.setAttribute('aria-hidden','true');
    lights.innerHTML=makeLights()+[
      [11,22],[25,43],[45,19],[66,31],[83,49],[92,15],[36,63],[72,70]
    ].map(([x,y])=>`<i class="party-spark" style="left:${x}%;top:${y}%"></i>`).join('');
    frame.append(tint,lights);
    update();
  }
  function update() {
    const frame=document.querySelector('.snowman-photo-frame');
    if (!frame) return;
    // Ortszeit des jeweiligen Browsers. 08-17 Uhr hell, 20-06 Uhr dunkel.
    const now=new Date(), h=now.getHours()+now.getMinutes()/60;
    let night;
    if(h>=6 && h<8) night=(8-h)/2;
    else if(h>=8 && h<17) night=0;
    else if(h>=17 && h<20) night=(h-17)/3;
    else night=1;
    frame.style.setProperty('--party-night',night.toFixed(3));
    frame.style.setProperty('--party-lights',Math.max(0,(night-.18)/.82).toFixed(3));
  }
  ensure();
  const observer=new MutationObserver(ensure);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  setInterval(update,60000);
})();
