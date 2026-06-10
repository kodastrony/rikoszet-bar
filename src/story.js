// Scrollowane intro: splash → mglisty widok z góry → historia z latami,
// kamera płynie po krzywej w stronę baru, mgła się przeciera.
import * as THREE from 'three';
import { STORY, BRAND } from './data.js';

export function createStory({ camera, controls, scene, onDone }) {
  const posCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(14, 175, 8),
    new THREE.Vector3(75, 105, 78),
    new THREE.Vector3(46, 48, 70),
    new THREE.Vector3(27, 21, 52),
    new THREE.Vector3(17, 12.8, 42),
  ]);
  const tgtCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 1.5, 0),
    new THREE.Vector3(0.5, 2.6, 0),
    new THREE.Vector3(1, 3.2, 0),
    new THREE.Vector3(1, 3.4, 0),
  ]);
  const FOG = { near0: 35, far0: 130, near1: 110, far1: 290 };

  const space = document.getElementById('scroll-space');
  const storyEl = document.getElementById('story');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── budowa DOM ─────────────────────────────────────────────
  storyEl.innerHTML = `
    <div class="splash" id="splash">
      <div class="splash-inner">
        <svg viewBox="0 0 40 40" class="logo-mark" aria-hidden="true">
          <circle cx="20" cy="20" r="18.5" fill="#10231b"/>
          <circle cx="20" cy="20" r="18.5" fill="none" stroke="#e3a93c" stroke-width="2.2"/>
          <circle cx="20" cy="15.4" r="8.6" fill="#f2e9d6"/>
          <text x="20" y="19.8" font-size="12.5" font-weight="800" text-anchor="middle" fill="#10231b" font-family="'Bricolage Grotesque Variable',sans-serif">8</text>
        </svg>
        <h1 class="splash-name">${BRAND.name}</h1>
        <p class="splash-tag">${BRAND.tagline}</p>
        <p class="splash-claim">${BRAND.claim}</p>
        <div class="splash-scroll"><span class="ss-mouse"><i></i></span> przewiń, aby poznać historię</div>
      </div>
    </div>
    ${STORY.map((s, i) => `
      <section class="chapter ${i % 2 ? 'right' : ''}" data-ch="${i}">
        <div class="ch-year">${s.year}</div>
        <div class="ch-body">
          <h2>${s.title}</h2>
          <p>${s.text}</p>
        </div>
      </section>`).join('')}
    <div class="story-end" data-end>
      <p>…a dziś? Rozejrzyj się.</p>
    </div>
    <button class="story-skip" id="story-skip">Pomiń intro →</button>`;

  const chapters = [...storyEl.querySelectorAll('.chapter')];
  const endEl = storyEl.querySelector('[data-end]');
  const splash = storyEl.querySelector('#splash');

  let finished = false;
  let target = 0; // docelowy postęp z przewijania
  let p = 0; // wygładzony postęp

  const maxScroll = () => Math.max(1, space.offsetHeight - innerHeight);

  function chapterWindow(i) {
    const n = STORY.length;
    const start = 0.08 + (i * 0.8) / n;
    return { start, end: start + 0.8 / n };
  }

  function applyDOM() {
    splash.style.opacity = String(Math.max(0, 1 - p * 14));
    splash.style.pointerEvents = p > 0.04 ? 'none' : 'auto';
    chapters.forEach((el, i) => {
      const { start, end } = chapterWindow(i);
      const mid = (start + end) / 2;
      const span = (end - start) / 2;
      const d = Math.abs(p - mid) / span;
      const vis = Math.max(0, 1 - d);
      el.style.opacity = String(Math.min(1, vis * 1.6));
      const dir = el.classList.contains('right') ? 1 : -1;
      el.style.transform = `translateY(${(p - mid) * -340}px) translateX(${dir * (1 - Math.min(1, vis * 1.6)) * 26}px)`;
      el.style.visibility = vis > 0.01 ? 'visible' : 'hidden';
    });
    const endVis = Math.max(0, (p - 0.9) / 0.08);
    endEl.style.opacity = String(Math.min(1, endVis));
  }

  function applyCamera() {
    const e = p; // krzywe same wygładzają
    camera.position.copy(posCurve.getPoint(e));
    controls.target.copy(tgtCurve.getPoint(e));
    if (scene.fog) {
      scene.fog.near = FOG.near0 + (FOG.near1 - FOG.near0) * e;
      scene.fog.far = FOG.far0 + (FOG.far1 - FOG.far0) * e;
    }
  }

  function finish() {
    if (finished) return;
    finished = true;
    document.body.classList.remove('introing');
    storyEl.classList.add('done');
    space.style.display = 'none';
    document.documentElement.classList.remove('intro-scroll');
    scrollTo(0, 0);
    if (scene.fog) { scene.fog.near = FOG.near1; scene.fog.far = FOG.far1; }
    camera.position.copy(posCurve.getPoint(1));
    controls.target.copy(tgtCurve.getPoint(1));
    setTimeout(() => storyEl.remove(), 900);
    onDone?.();
  }

  function onScroll() {
    if (finished) return;
    target = Math.min(1, Math.max(0, scrollY / maxScroll()));
  }

  // pętla wygładzająca (wołana z głównego RAF-a)
  function update() {
    if (finished) return;
    p += (target - p) * 0.07;
    if (target >= 0.985 && p > 0.975) {
      p = 1;
      applyDOM();
      applyCamera();
      finish();
      return;
    }
    applyDOM();
    applyCamera();
  }

  // ── start ──────────────────────────────────────────────────
  if (reduced) {
    space.style.display = 'none';
    storyEl.innerHTML = '';
    document.body.classList.remove('introing');
    camera.position.copy(posCurve.getPoint(1));
    controls.target.copy(tgtCurve.getPoint(1));
    finished = true;
    onDone?.();
    return { update: () => {}, finished: () => true };
  }

  document.documentElement.classList.add('intro-scroll');
  document.body.classList.add('introing');
  addEventListener('scroll', onScroll, { passive: true });
  storyEl.querySelector('#story-skip').addEventListener('click', () => {
    scrollTo({ top: maxScroll() });
    target = 1;
    p = Math.max(p, 0.9); // szybki, ale wciąż płynny dolot
  });
  applyCamera();
  applyDOM();

  return { update, finished: () => finished };
}
