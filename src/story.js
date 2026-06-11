// Scrollowane intro: splash → mglisty widok z góry → trzy rozdziały historii,
// kamera płynie po łagodnej krzywej w stronę baru, mgła się przeciera.
import * as THREE from 'three';
import { STORY } from './data.js';

export function createStory({ camera, controls, scene, onDone }) {
  const posCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(8, 118, 14),
    new THREE.Vector3(48, 62, 60),
    new THREE.Vector3(28, 24, 52),
    new THREE.Vector3(17, 12.8, 42),
  ], false, 'centripetal');
  const tgtCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.5, 2.2, 0),
    new THREE.Vector3(1, 3.2, 0),
    new THREE.Vector3(1, 3.4, 0),
  ], false, 'centripetal');
  const FOG = { near0: 42, far0: 150, near1: 110, far1: 290 };

  const space = document.getElementById('scroll-space');
  const storyEl = document.getElementById('story');
  const splash = document.getElementById('splash'); // statyczny w index.html
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // rozdziały dokładamy do istniejącego splasha
  splash.insertAdjacentHTML('afterend', `
    ${STORY.map((s, i) => `
      <section class="chapter ${i % 2 ? 'right' : ''}" data-ch="${i}">
        <div class="ch-year">${s.year}</div>
        <div class="ch-body">
          <h2>${s.title}</h2>
          <p>${s.text}</p>
        </div>
      </section>`).join('')}
    <div class="story-end" data-end>
      <p>Rozejrzyj się — i zajrzyj do środka.</p>
    </div>
    <button class="story-skip" id="story-skip">Pomiń intro →</button>`);

  const chapters = [...storyEl.querySelectorAll('.chapter')];
  const endEl = storyEl.querySelector('[data-end]');

  let finished = false;
  let target = 0;
  let p = 0;

  const maxScroll = () => Math.max(1, space.offsetHeight - innerHeight);

  function chapterWindow(i) {
    const n = STORY.length;
    const start = 0.1 + (i * 0.74) / n;
    return { start, end: start + 0.74 / n };
  }

  function applyDOM() {
    splash.style.opacity = String(Math.max(0, 1 - p * 16));
    splash.style.pointerEvents = p > 0.035 ? 'none' : 'auto';
    chapters.forEach((el, i) => {
      const { start, end } = chapterWindow(i);
      const mid = (start + end) / 2;
      const span = (end - start) / 2;
      const d = Math.abs(p - mid) / span;
      const vis = Math.max(0, 1 - d);
      const o = Math.min(1, vis * 1.7);
      el.style.opacity = String(o);
      const dir = el.classList.contains('right') ? 1 : -1;
      el.style.transform = `translateY(${(p - mid) * -300}px) translateX(${dir * (1 - o) * 22}px)`;
      el.style.visibility = vis > 0.01 ? 'visible' : 'hidden';
    });
    const endVis = Math.max(0, (p - 0.88) / 0.09);
    endEl.style.opacity = String(Math.min(1, endVis));
  }

  function applyCamera() {
    camera.position.copy(posCurve.getPoint(p));
    controls.target.copy(tgtCurve.getPoint(p));
    if (scene.fog) {
      scene.fog.near = FOG.near0 + (FOG.near1 - FOG.near0) * p;
      scene.fog.far = FOG.far0 + (FOG.far1 - FOG.far0) * p;
    }
  }

  function finish() {
    if (finished) return;
    finished = true;
    // najpierw wracamy na górę, dopiero potem zwijamy przestrzeń scrolla —
    // inaczej przeglądarka na klatkę pokazuje tło dokumentu
    scrollTo(0, 0);
    document.body.classList.remove('introing');
    storyEl.classList.add('done');
    requestAnimationFrame(() => {
      space.style.display = 'none';
      document.documentElement.classList.remove('intro-scroll');
      document.documentElement.style.background = '#f2efe7';
    });
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
    p += (target - p) * 0.085;
    if (target >= 0.985 && p > 0.972) {
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
    storyEl.remove();
    document.body.classList.remove('introing');
    document.documentElement.classList.remove('intro-scroll');
    camera.position.copy(posCurve.getPoint(1));
    controls.target.copy(tgtCurve.getPoint(1));
    finished = true;
    onDone?.();
    return { update: () => {}, finished: () => true };
  }

  addEventListener('scroll', onScroll, { passive: true });
  storyEl.querySelector('#story-skip').addEventListener('click', () => {
    scrollTo({ top: maxScroll() });
    target = 1;
    p = Math.max(p, 0.9);
  });
  applyCamera();
  applyDOM();

  return { update, finished: () => finished };
}
