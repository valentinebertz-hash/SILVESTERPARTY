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
          <linearGradient id="icyCloudBase" x1="0" y1="0" x2=".3" y2="1">
            <stop offset="0" stop-color="#ffffff"/><stop offset=".38" stop-color="#e7faff"/>
            <stop offset=".73" stop-color="#b8dcec"/><stop offset="1" stop-color="#719ab8"/>
          </linearGradient>
          <radialGradient id="icyCloudGlint" cx=".3" cy=".1" r=".8">
            <stop offset="0" stop-color="#fff"/><stop offset=".65" stop-color="#effbff" stop-opacity=".7"/>
            <stop offset="1" stop-color="#d1edff" stop-opacity="0"/>
          </radialGradient>
          <linearGradient id="icyCloudFacet" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#fff" stop-opacity=".85"/><stop offset="1" stop-color="#82b8d6" stop-opacity=".5"/>
          </linearGradient>
        </defs>
        <path d="M20 52C9 51 5 40 11 31c5-7 12-9 20-6C33 12 46 7 58 12c9-10 24-7 31 3 14-1 23 9 23 21 0 10-9 17-20 17H21Z" fill="url(#icyCloudBase)" stroke="#7ba7c2" stroke-width="1.4"/>
        <path d="M13 38 25 29 33 33 40 19 52 13 61 26 73 16 86 22 98 20 108 32 99 42 87 37 77 49 65 38 51 48 40 36 28 47Z" fill="url(#icyCloudFacet)" opacity=".8"/>
        <path d="m21 43 12-10 7 4 13-17 10 11 10-13 11 12 12-4" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".95"/>
        <path d="m32 49 11-10 10 8 13-12 12 13 10-10 9 5" fill="none" stroke="#79b4d5" stroke-width="1.2" opacity=".72"/>
        <path d="m43 18 4 10-5 8m35-16-4 11 7 6M61 27l-4 9 9 6" fill="none" stroke="#a1d8ee" stroke-width="1.2" opacity=".85"/>
        <path d="M15 35q8-14 17-9 8-19 25-12" fill="none" stroke="#fff" stroke-width="2.8" stroke-linecap="round" opacity=".85"/>
        <ellipse cx="48" cy="23" rx="24" ry="11" fill="url(#icyCloudGlint)" opacity=".8"/>
        <g stroke="#fff" stroke-width="1.3" stroke-linecap="round" opacity=".9">
          <path d="M24 30v9m-4-4.5h8m-6-3 4 6m0-6-4 6"/>
          <path d="M88 25v11m-5.5-5.5h11m-9-4 7 8m0-8-7 8"/>
        </g>
      </svg>
      <i>❄</i><i>❅</i><i>❄</i><i>❅</i>
    </div>
    <div class="snowman-illustration">
      <img class="snowman-original" src="./schneemann-lichter.png" alt="" />
      <svg class="snowman-lights" viewBox="0 0 1068 1473" aria-hidden="true" preserveAspectRatio="none">
        <ellipse class="light-glow light-glow-a" cx="868" cy="545" rx="38.5" ry="64.0" fill="#ffe500"/>
        <ellipse class="light light-a" cx="868" cy="545" rx="22" ry="40" fill="#ffe500"/>
        <ellipse class="light-core light-core-a" cx="864" cy="536" rx="7.7" ry="14.0" fill="#fff"/>
        <ellipse class="light-glow light-glow-b" cx="794" cy="705" rx="45.5" ry="60.8" fill="#32ff29"/>
        <ellipse class="light light-b" cx="794" cy="705" rx="26" ry="38" fill="#32ff29"/>
        <ellipse class="light-core light-core-b" cx="790" cy="696" rx="9.1" ry="13.3" fill="#fff"/>
        <ellipse class="light-glow light-glow-c" cx="543" cy="795" rx="43.8" ry="60.8" fill="#ff2c2c"/>
        <ellipse class="light light-c" cx="543" cy="795" rx="25" ry="38" fill="#ff2c2c"/>
        <ellipse class="light-core light-core-c" cx="539" cy="786" rx="8.8" ry="13.3" fill="#fff"/>
        <ellipse class="light-glow light-glow-d" cx="155" cy="865" rx="45.5" ry="59.2" fill="#27ff2d"/>
        <ellipse class="light light-d" cx="155" cy="865" rx="26" ry="37" fill="#27ff2d"/>
        <ellipse class="light-core light-core-d" cx="151" cy="856" rx="9.1" ry="12.9" fill="#fff"/>
        <ellipse class="light-glow light-glow-e" cx="354" cy="900" rx="42.0" ry="62.4" fill="#ffef2b"/>
        <ellipse class="light light-e" cx="354" cy="900" rx="24" ry="39" fill="#ffef2b"/>
        <ellipse class="light-core light-core-e" cx="350" cy="891" rx="8.4" ry="13.6" fill="#fff"/>
        <ellipse class="light-glow light-glow-f" cx="389" cy="1037" rx="43.8" ry="67.2" fill="#00dfff"/>
        <ellipse class="light light-f" cx="389" cy="1037" rx="25" ry="42" fill="#00dfff"/>
        <ellipse class="light-core light-core-f" cx="385" cy="1028" rx="8.8" ry="14.7" fill="#fff"/>
        <ellipse class="light-glow light-glow-g" cx="708" cy="1032" rx="43.8" ry="62.4" fill="#ff3838"/>
        <ellipse class="light light-g" cx="708" cy="1032" rx="25" ry="39" fill="#ff3838"/>
        <ellipse class="light-core light-core-g" cx="704" cy="1023" rx="8.8" ry="13.6" fill="#fff"/>
        <ellipse class="light-glow light-glow-h" cx="246" cy="1161" rx="42.0" ry="60.8" fill="#ff3535"/>
        <ellipse class="light light-h" cx="246" cy="1161" rx="24" ry="38" fill="#ff3535"/>
        <ellipse class="light-core light-core-h" cx="242" cy="1152" rx="8.4" ry="13.3" fill="#fff"/>
        <ellipse class="light-glow light-glow-i" cx="548" cy="1234" rx="43.8" ry="64.0" fill="#32ff32"/>
        <ellipse class="light light-i" cx="548" cy="1234" rx="25" ry="40" fill="#32ff32"/>
        <ellipse class="light-core light-core-i" cx="544" cy="1225" rx="8.8" ry="14.0" fill="#fff"/>
      </svg>
    </div>
  </div>`;
  frame.appendChild(stage);
})();
