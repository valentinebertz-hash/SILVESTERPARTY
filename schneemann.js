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
    <img class="snowman-original" src="./schneemann-original.png" alt="" />
  </div>`;
  frame.appendChild(stage);
})();
