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
  stage.innerHTML = `<div class="snowman-actor"><svg viewBox="0 -42 150 242" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <radialGradient id="snow-white" cx="35%" cy="25%" r="80%"><stop stop-color="#fff"/><stop offset=".75" stop-color="#f8fbfd"/><stop offset="1" stop-color="#e2eaf0"/></radialGradient>
    </defs>
    <ellipse cx="76" cy="192" rx="46" ry="5" fill="#173c4e" opacity=".18"/>
    <g class="snowman-whole">
      <g class="snowman-feet">
        <ellipse cx="55" cy="180" rx="20" ry="11" fill="url(#snow-white)" stroke="#202329" stroke-width="2.5"/>
        <ellipse cx="100" cy="180" rx="20" ry="11" fill="url(#snow-white)" stroke="#202329" stroke-width="2.5"/>
      </g>
      <g class="snowman-arm-left" fill="none" stroke="#70402b" stroke-width="8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M49 112 Q26 101 15 77 M15 77 L6 67 M15 77 L25 67 M15 77 L5 79"/>
      </g>
      <g class="snowman-arm-right" fill="none" stroke="#70402b" stroke-width="8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M102 113 Q126 94 132 71 M132 71 L122 62 M132 71 L144 62 M132 71 L145 77"/>
      </g>
      <ellipse cx="77" cy="138" rx="44" ry="47" fill="url(#snow-white)" stroke="#25272c" stroke-width="3"/>
      <ellipse cx="77" cy="102" rx="31" ry="30" fill="url(#snow-white)" stroke="#25272c" stroke-width="2.5"/>
      <circle cx="76" cy="111" r="7" fill="#161719"/><circle cx="75" cy="143" r="7.5" fill="#161719"/><circle cx="77" cy="166" r="7" fill="#161719"/>
      <!-- Face, neck and head move together, never separate. -->
      <g class="snowman-head-group">
        <path d="M44 72 Q28 54 37 27 Q45 1 77 1 Q110 0 120 31 Q130 65 108 83 Q78 100 48 81 Z" fill="url(#snow-white)" stroke="#24252a" stroke-width="3.2" stroke-linejoin="round"/>
        <g class="snowman-face-front">
          <ellipse cx="61" cy="40" rx="13" ry="17" fill="#fff" stroke="#202329" stroke-width="2.5"/>
          <ellipse cx="92" cy="40" rx="13" ry="17" fill="#fff" stroke="#202329" stroke-width="2.5"/>
          <circle cx="65" cy="42" r="6.5" fill="#131a20"/><circle cx="88" cy="42" r="6.5" fill="#131a20"/>
          <path d="M49 22 Q60 15 71 22 M82 21 Q94 15 104 22" fill="none" stroke="#25252a" stroke-width="3.2" stroke-linecap="round"/>
          <path d="M49 57 Q77 97 108 55 Q106 87 79 89 Q55 87 49 57" fill="#131318" stroke="#202329" stroke-width="2.5"/>
          <path d="M62 79 Q77 86 94 77" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/>
          <path d="M78 49 Q66 54 68 62 L95 61 Q93 53 78 49" fill="#ff8a22" stroke="#9d4e17" stroke-width="2"/>
        </g>
        <g class="snowman-face-profile">
          <ellipse cx="55" cy="40" rx="12" ry="16" fill="#fff" stroke="#202329" stroke-width="2.5"/>
          <circle cx="52" cy="41" r="6.5" fill="#131a20"/>
          <path d="M43 23 Q53 17 62 23" fill="none" stroke="#25252a" stroke-width="3" stroke-linecap="round"/>
          <path d="M44 57 Q56 89 91 70 Q75 94 53 82 Z" fill="#111117" stroke="#202329" stroke-width="2"/>
          <path d="M46 48 L7 57 L45 62 Z" fill="#ff8a22" stroke="#9d4e17" stroke-width="2"/>
        </g>
        <!-- Christmas hat, in the style of the user's cartoon reference. -->
        <path d="M45 17 Q44 -7 76 -31 Q85 -35 87 -22 L103 12 Z" fill="#e72f2c" stroke="#24252a" stroke-width="3"/>
        <path d="M47 14 Q71 5 102 12" fill="none" stroke="#fff" stroke-width="12" stroke-linecap="round"/>
        <path d="M47 14 Q71 5 102 12" fill="none" stroke="#22252a" stroke-width="1.8" stroke-linecap="round"/>
        <circle cx="87" cy="-26" r="9" fill="#fff" stroke="#22252a" stroke-width="2"/>
      </g>
    </g>
    <g class="snowman-cloud" aria-hidden="true">
      <path class="snowman-cloud-puff" d="M43 -27 C31 -29 32 -39 42 -42 C48 -52 60 -50 66 -43 C77 -55 91 -47 94 -39 C107 -41 113 -30 103 -25 Z" fill="#fff" stroke="#b7d5e4" stroke-width="1.6"/>
      <g class="snowman-cloud-flakes" fill="none" stroke="#c9efff" stroke-width="2" stroke-linecap="round">
        <path class="snowman-flake snowman-flake-a" d="M50 -19v9m-4 -5h8"/>
        <path class="snowman-flake snowman-flake-b" d="M75 -18v9m-4 -5h8"/>
        <path class="snowman-flake snowman-flake-c" d="M95 -18v9m-4 -5h8"/>
      </g>
    </g>
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
    await wait(2800);
    actor.className = 'snowman-actor snowman-turn-front';
    await wait(550);
    actor.className = 'snowman-actor snowman-wave';
    sound();
    await wait(3600);
    actor.className = 'snowman-actor snowman-turn-away';
    await wait(550);
    actor.className = 'snowman-actor snowman-exit';
    await wait(2300);
    actor.className = 'snowman-actor';
    active = false;
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
