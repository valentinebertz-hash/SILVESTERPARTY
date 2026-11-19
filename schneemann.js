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
  stage.innerHTML = `<div class="snowman-in-yard">
    <div class="snowman-cloud">
      <svg viewBox="0 0 120 70" aria-hidden="true" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="cloud3dGradient" x1="0" y1="0" x2=".65" y2="1">
            <stop offset="0" stop-color="#ffffff"/><stop offset=".42" stop-color="#f7fcff"/>
            <stop offset=".76" stop-color="#d8e7f2"/><stop offset="1" stop-color="#a2b8d1"/>
          </linearGradient>
          <radialGradient id="cloud3dShine" cx=".33" cy=".15" r=".9">
            <stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <path d="M21 52C8 51 4 35 12 26c6-7 14-7 20-4C34 8 48 3 59 9c7-7 23-6 30 5 12-2 23 7 23 20 0 11-9 19-21 19H22Z" fill="url(#cloud3dGradient)" stroke="#8fa9bd" stroke-width="1.5"/>
        <ellipse cx="46" cy="24" rx="26" ry="14" fill="url(#cloud3dShine)"/>
      </svg>
      <i>❄</i><i>❅</i><i>❄</i><i>❅</i>
    </div>
    <div class="snowman-illustration">
      <img class="snowman-original" src="./schneemann-lichter.png" alt="" />
      <svg class="snowman-lights" viewBox="0 0 1068 1473" aria-hidden="true" preserveAspectRatio="none">
        <ellipse class="light light-a" cx="926" cy="628" rx="23" ry="40" fill="#ff3434"/>
        <ellipse class="light light-b" cx="242" cy="802" rx="33" ry="23" fill="#39f847"/>
        <ellipse class="light light-c" cx="716" cy="800" rx="24" ry="36" fill="#fff332"/>
        <ellipse class="light light-d" cx="398" cy="928" rx="25" ry="37" fill="#ff4545"/>
        <ellipse class="light light-e" cx="319" cy="1090" rx="23" ry="36" fill="#ffef3b"/>
        <ellipse class="light light-f" cx="453" cy="1125" rx="23" ry="38" fill="#2beeff"/>
        <ellipse class="light light-g" cx="699" cy="1123" rx="23" ry="37" fill="#ff4b48"/>
      </svg>
    </div>
  </div>`;
  frame.appendChild(stage);
})();
