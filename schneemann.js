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
  stage.innerHTML = `<div class="snowman-actor"><svg viewBox="0 -49 130 233" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs><radialGradient id="snowbody" cx="38%" cy="24%" r="73%"><stop stop-color="#faf9fc"/><stop offset=".52" stop-color="#f1f0f5"/><stop offset=".83" stop-color="#e5e5ec"/><stop offset="1" stop-color="#cdd0da"/></radialGradient></defs>
    <ellipse cx="66" cy="174" rx="40" ry="6" fill="#365d73" opacity=".25"/>
    <g class="snowman-legs"><path d="M49 148 Q42 168 35 171" stroke="#e9e8ef" stroke-width="15" stroke-linecap="round"/><path d="M79 148 Q84 168 93 171" stroke="#e9e8ef" stroke-width="15" stroke-linecap="round"/></g>
    <g class="snowman-body"><ellipse cx="65" cy="130" rx="39" ry="41" fill="url(#snowbody)" stroke="#d5d5de" stroke-width="1.5"/><ellipse cx="65" cy="91" rx="28" ry="29" fill="url(#snowbody)"/><circle cx="63" cy="106" r="5.5" fill="#333c40"/><circle cx="63" cy="127" r="6.5" fill="#333c40"/><circle cx="63" cy="148" r="6.5" fill="#333c40"/></g>
    <g class="snowman-arm snowman-arm-left"><path d="M41 109 Q23 96 13 83 M21 94 L9 92 M21 94 L17 81" fill="none" stroke="#6b4834" stroke-width="5" stroke-linecap="round"/></g>
    <g class="snowman-arm snowman-arm-right"><path d="M89 109 Q108 93 113 75 M106 88 L124 84 M106 88 L108 73" fill="none" stroke="#6b4834" stroke-width="5" stroke-linecap="round"/></g>
    <!-- Soft neck connection stays behind the face and overlaps the upper snowball. -->
    <path class="snowman-neck" d="M48 74 Q47 85 45 96 Q65 108 85 96 Q83 85 82 74 Z" fill="url(#snowbody)" stroke="#dedee6" stroke-width="1"/>
    <g class="snowman-head"><image href="./schneemann-gesicht.png" x="32" y="-1" width="66" height="101" preserveAspectRatio="none" /></g>
    <g class="snowman-cloud" aria-hidden="true">
      <g class="snowman-cloud-puff" fill="#f8fcff" stroke="#c8dce8" stroke-width="1.4">
        <path d="M39 -22 C29 -22 27 -31 34 -35 C37 -43 49 -44 55 -38 C61 -48 77 -46 82 -36 C92 -38 101 -31 98 -23 C96 -18 89 -16 82 -16 L46 -16 C42 -16 39 -18 39 -22 Z"/>
      </g>
      <g class="snowman-cloud-flakes" fill="#e8faff" stroke="#a4d7f4" stroke-width="1.1" stroke-linecap="round">
        <g class="snowman-flake snowman-flake-a" transform="translate(45 -13)"><path d="M0 -4 V4 M-4 0 H4 M-3 -3 L3 3 M3 -3 L-3 3"/></g>
        <g class="snowman-flake snowman-flake-b" transform="translate(67 -11)"><path d="M0 -4 V4 M-4 0 H4 M-3 -3 L3 3 M3 -3 L-3 3"/></g>
        <g class="snowman-flake snowman-flake-c" transform="translate(87 -12)"><path d="M0 -4 V4 M-4 0 H4 M-3 -3 L3 3 M3 -3 L-3 3"/></g>
      </g>
    </g>
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
