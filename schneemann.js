(() => {
  const photo = document.getElementById('locationPhoto');
  if (!photo) return;
  const frame = document.createElement('div');
  frame.className = 'snowman-photo-frame';
  photo.parentNode.insertBefore(frame, photo);
  frame.appendChild(photo);
  const stage = document.createElement('div');
  stage.className = 'snowman-stage';
  stage.setAttribute('aria-hidden', 'true');
  stage.innerHTML = `<div class="snowman-actor"><div class="snowman-figure"><img class="sm-body" src="./schneemann-body.png" alt="" draggable="false"><img class="sm-head" src="./schneemann-head.png" alt="" draggable="false"><img class="sm-arm-left" src="./schneemann-arm-left.png" alt="" draggable="false"><img class="sm-arm-right" src="./schneemann-arm-right.png" alt="" draggable="false"><img class="sm-foot-left" src="./schneemann-foot-left.png" alt="" draggable="false"><img class="sm-foot-right" src="./schneemann-foot-right.png" alt="" draggable="false"><span class="snowman-snowballs" aria-hidden="true"><i></i><i></i><i></i></span></div></div>`;
  frame.appendChild(stage);
  const actor = stage.querySelector('.snowman-actor');
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'snowman-sound-toggle';
  button.textContent = '🔇 Schneemann-Töne aus';
  button.title = 'Lustige Schneemann-Geräusche einschalten';
  frame.insertAdjacentElement('afterend', button);
  let audio = null, soundOn = false, active = false, stopped = false;
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  function sound() {
    if (!soundOn) return;
    try {
      audio ??= new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === 'suspended') audio.resume();
      const t = audio.currentTime;
      for (let i=0; i<3; i++) {
        const o=audio.createOscillator(), g=audio.createGain();
        o.type = i===1 ? 'triangle' : 'sine';
        o.frequency.setValueAtTime([390,530,440][i],t+i*.16);
        o.frequency.exponentialRampToValueAtTime([540,350,660][i],t+i*.16+.13);
        g.gain.setValueAtTime(.0001,t+i*.16);
        g.gain.exponentialRampToValueAtTime(.075,t+i*.16+.025);
        g.gain.exponentialRampToValueAtTime(.0001,t+i*.16+.15);
        o.connect(g); g.connect(audio.destination);
        o.start(t+i*.16); o.stop(t+i*.16+.16);
      }
    } catch (_) {}
  }
  button.addEventListener('click', () => {
    soundOn = !soundOn;
    button.textContent = soundOn ? '🔊 Schneemann-Töne an' : '🔇 Schneemann-Töne aus';
    if (soundOn) sound();
  });
  async function visit() {
    if (active || stopped || photo.hidden || photo.offsetParent === null) return;
    active = true;
    actor.className = 'snowman-actor snowman-enter';
    await wait(4200);
    actor.className = 'snowman-actor snowman-wave'; sound();
    await wait(2100);
    actor.className = 'snowman-actor snowman-grimace'; sound();
    await wait(1700);
    actor.className = 'snowman-actor snowman-juggling'; sound();
    await wait(3000);
    actor.className = 'snowman-actor snowman-exit';
    await wait(3800);
    actor.className = 'snowman-actor'; active = false;
  }
  // First visit shortly after the photo becomes visible; later visits are irregular.
  let nextVisit = Date.now() + 3500;
  setInterval(() => {
    if (document.hidden || photo.hidden || photo.offsetParent === null) return;
    if (Date.now() >= nextVisit && !active) {
      visit();
      nextVisit = Date.now() + 28000 + Math.random()*26000;
    }
  }, 1100);
  document.addEventListener('visibilitychange', () => { if (document.hidden) { /* keep animation silent in background */ } });
})();
