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
  stage.innerHTML = `<div class="snowman-actor"><svg viewBox="0 0 130 184" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs><radialGradient id="snowbody" cx="35%" cy="20%"><stop stop-color="#fff"/><stop offset=".8" stop-color="#eef9ff"/><stop offset="1" stop-color="#b7d7eb"/></radialGradient></defs>
    <ellipse cx="66" cy="174" rx="40" ry="6" fill="#365d73" opacity=".25"/>
    <g class="snowman-legs"><path d="M49 148 Q42 168 35 171" stroke="#f7fcff" stroke-width="15" stroke-linecap="round"/><path d="M79 148 Q84 168 93 171" stroke="#f7fcff" stroke-width="15" stroke-linecap="round"/></g>
    <g class="snowman-body"><ellipse cx="65" cy="130" rx="39" ry="41" fill="url(#snowbody)" stroke="#d4e9f4" stroke-width="1.5"/><ellipse cx="65" cy="91" rx="28" ry="29" fill="url(#snowbody)"/><circle cx="63" cy="106" r="5.5" fill="#333c40"/><circle cx="63" cy="127" r="6.5" fill="#333c40"/><circle cx="63" cy="148" r="6.5" fill="#333c40"/></g>
    <g class="snowman-arm snowman-arm-left"><path d="M41 109 Q23 96 13 83 M21 94 L9 92 M21 94 L17 81" fill="none" stroke="#6b4834" stroke-width="5" stroke-linecap="round"/></g>
    <g class="snowman-arm snowman-arm-right"><path d="M89 109 Q108 93 113 75 M106 88 L124 84 M106 88 L108 73" fill="none" stroke="#6b4834" stroke-width="5" stroke-linecap="round"/></g>
    <g class="snowman-head"><image href="./schneemann-gesicht.png" x="32" y="-3" width="66" height="98" preserveAspectRatio="none" /></g>
    <g class="snowman-juggle"><circle cx="24" cy="25" r="10" fill="#fff" stroke="#c7dfea" stroke-width="2"/><circle cx="69" cy="9" r="10" fill="#fff" stroke="#c7dfea" stroke-width="2"/><circle cx="112" cy="25" r="10" fill="#fff" stroke="#c7dfea" stroke-width="2"/></g>
  </svg></div>`;
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
