// Krótkie kinowe intro: marka na splashu → kamera płynnie wlatuje po łagodnej
// krzywej z ujęcia z góry na bohaterski kadr baru, mgła się przeciera.
// Sterowane CZASEM (nie scrollem) — identyczne na PC i mobile, z przyciskiem skip.
import * as THREE from 'three';
import { easeInOutQuart } from './tween.js';

const FLY_MS = 2400;       // długość najazdu kamery — krótszy i lepiej rozłożony
const EXIT_MS = 1050;      // „odlot" plakatu, zanim sprzątniemy #story z DOM
const EXIT_MS_FAST = 420;  // szybkie domknięcie (pominięcie / reduced-motion)

export function createIntro({ camera, controls, scene, onDone }) {
  const posCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(10, 122, 22),
    new THREE.Vector3(50, 64, 62),
    new THREE.Vector3(30, 25, 54),
    new THREE.Vector3(17, 12.8, 42),
  ], false, 'centripetal');
  const tgtCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.5, 0),
    new THREE.Vector3(0.5, 2.4, 0),
    new THREE.Vector3(1, 3.2, 0),
    new THREE.Vector3(1, 3.4, 0),
  ], false, 'centripetal');
  const FOG = { near0: 46, far0: 150, near1: 110, far1: 290 };

  const storyEl = document.getElementById('story');
  const splash = document.getElementById('splash');
  const bar = document.getElementById('splash-bar');
  const statusEl = document.getElementById('splash-status');
  const skipBtn = document.getElementById('story-skip');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let begun = false;
  let finished = false;
  let exiting = false;
  let cleaned = false;
  let chromeShown = false;
  let startT = 0;
  let p = 0;

  function applyCamera(t) {
    camera.position.copy(posCurve.getPoint(t));
    controls.target.copy(tgtCurve.getPoint(t));
    if (scene.fog) {
      scene.fog.near = FOG.near0 + (FOG.near1 - FOG.near0) * t;
      scene.fog.far = FOG.far0 + (FOG.far1 - FOG.far0) * t;
    }
  }

  // ── „odlot" plakatu ────────────────────────────────────────
  // Wyjście prowadzi KOMPOZYTOR (klasa .leaving → tranzycje opacity/transform w CSS),
  // a nie wątek główny — dlatego jest płynne nawet gdy scena 3D właśnie się renderuje.
  function playOut(fast) {
    if (exiting) return;
    exiting = true;
    if (splash) {
      splash.classList.add('leaving');
      if (fast) splash.classList.add('leaving-fast');
    }
    // bezpiecznik: gdy karta jest w tle, tranzycje CSS stoją — i tak sprzątamy DOM po czasie
    setTimeout(cleanup, fast || reduced ? EXIT_MS_FAST : EXIT_MS);
  }
  function cleanup() {
    if (cleaned) return;
    cleaned = true;
    storyEl.remove();
  }
  function showChrome() {
    if (chromeShown) return;
    chromeShown = true;
    document.body.classList.remove('introing'); // chrom UI wpływa łagodnie (transition w CSS)
  }

  function finish() {
    if (finished) return;
    finished = true;
    p = 1;
    applyCamera(1);
    if (scene.fog) { scene.fog.near = FOG.near1; scene.fog.far = FOG.far1; }
    showChrome();
    playOut(false);
    onDone?.();
  }

  // ── splash / loader ────────────────────────────────────────
  function setProgress(frac, label) {
    if (bar) bar.style.width = `${Math.round(Math.max(6, Math.min(1, frac) * 100))}%`;
    if (label && statusEl) statusEl.textContent = label;
  }

  function revealSkip() {
    if (!skipBtn) return;
    skipBtn.hidden = false;
    requestAnimationFrame(() => skipBtn.classList.add('show'));
  }

  // ── start najazdu ──────────────────────────────────────────
  function begin() {
    if (begun || finished) return;
    // DEV: otwórz z #hold, by zatrzymać splash do podglądu (nie odpala najazdu/zanikania).
    // Tylko w trybie deweloperskim — w buildzie produkcyjnym ta gałąź jest usuwana.
    if (import.meta.env.DEV && location.hash.includes('hold')) { revealSkip(); if (statusEl) statusEl.textContent = 'Podgląd splashu'; return; }
    begun = true;
    if (statusEl) statusEl.textContent = 'Zapraszamy do środka';
    revealSkip();
    if (reduced) { finish(); return; }
    startT = 0; // ustawiane przy pierwszym update
    // plakat odlatuje od razu, gdy kamera rusza — świat odsłania się spod niego w ruchu
    playOut(false);
  }

  function skip() {
    if (finished) return;
    // szybkie, jednolite domknięcie; kamera ląduje na finalnym kadrze
    playOut(true);
    finish();
  }

  // ── pętla (wołana z głównego RAF) ──────────────────────────
  function update(now) {
    if (!begun || finished) return;
    if (!startT) startT = now;
    const e = easeInOutQuart(Math.min(1, (now - startT) / FLY_MS));
    p = e;
    applyCamera(e);
    // chrom UI wpływa pod koniec najazdu, „dolatując" razem z kamerą
    if (e > 0.82) showChrome();
    if (e >= 1) finish();
  }

  // ── wejście / reduced-motion ───────────────────────────────
  applyCamera(0);
  if (reduced) {
    // bez animacji: pokaż markę chwilę, potem od razu finalny kadr
    setProgress(1, 'Gotowe');
  }

  skipBtn?.addEventListener('click', skip);
  splash?.addEventListener('pointerdown', () => { if (begun && !finished) skip(); });

  return {
    update,
    setProgress,
    begin,
    skip,
    finished: () => finished,
    started: () => begun,
  };
}
