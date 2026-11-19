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
    <div class="snowman-cloud"><span>☁</span><i>❄</i><i>❅</i><i>❄</i></div>
    <div class="snowman-illustration">
      <img class="snowman-original" src="./schneemann-lichter.png" alt="" />
      <svg class="snowman-lights" viewBox="0 0 274 378" aria-hidden="true" preserveAspectRatio="none">
        <ellipse class="light light-a" cx="215" cy="140" rx="8" ry="13" fill="#ffff55"/>
        <ellipse class="light light-b" cx="202" cy="175" rx="11" ry="7" fill="#34ff43"/>
        <ellipse class="light light-c" cx="155" cy="196" rx="9" ry="11" fill="#ff4040"/>
        <ellipse class="light light-d" cx="43" cy="223" rx="12" ry="7" fill="#30ff5a"/>
        <ellipse class="light light-e" cx="46" cy="254" rx="8" ry="11" fill="#32ff45"/>
        <ellipse class="light light-f" cx="97" cy="260" rx="8" ry="11" fill="#47faff"/>
        <ellipse class="light light-g" cx="65" cy="281" rx="9" ry="10" fill="#ff4b40"/>
        <ellipse class="light light-h" cx="140" cy="307" rx="8" ry="12" fill="#39ff49"/>
        <ellipse class="light light-i" cx="185" cy="263" rx="8" ry="11" fill="#ff5140"/>
      </svg>
    </div>
  </div>`;
  frame.appendChild(stage);
})();
