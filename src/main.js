import './styles.css';
import '@fontsource-variable/inter';
import '@fontsource-variable/bricolage-grotesque';

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

import { tween, updateTweens, easeInOutCubic } from './tween.js';
import { ATTRACTIONS, MODE_VIEWS } from './data.js';
import { buildCity } from './city.js';
import { buildBar } from './bar.js';
import { buildInteriors } from './interior.js';
import { buildLabels } from './labels.js';
import { createNight } from './night.js';
import { createModes } from './modes.js';
import { createIntro } from './intro.js';
import { mountUI, openAttraction, syncModeUI } from './ui.js';

const appEl = document.getElementById('app');
const labelEl = document.getElementById('labels');

const vw = () => Math.max(1, innerWidth || document.documentElement.clientWidth);
const vh = () => Math.max(1, innerHeight || document.documentElement.clientHeight);
// rAF z fallbackiem na setTimeout — init nie zawiesza się, gdy karta jest w tle
const nextFrame = () => new Promise((r) => {
  let done = false;
  const fin = () => { if (!done) { done = true; r(); } };
  requestAnimationFrame(fin);
  setTimeout(fin, 48);
});

async function init() {
  try {
    await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1500))]);
  } catch { /* lecimy dalej */ }

  // ── renderer + tiery jakości ───────────────────────────────
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  let gpuName = '';
  try {
    const glCtx = renderer.getContext();
    const ext = glCtx.getExtension('WEBGL_debug_renderer_info');
    gpuName = String(ext ? glCtx.getParameter(ext.UNMASKED_RENDERER_WEBGL) : glCtx.getParameter(glCtx.RENDERER));
  } catch { /* nieistotne */ }
  let lowPower = /swiftshader|llvmpipe|software/i.test(gpuName);
  const isMobile = matchMedia('(pointer: coarse)').matches || vw() < 820;

  renderer.setPixelRatio(lowPower ? 0.75 : Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
  renderer.setSize(vw(), vh());
  renderer.shadowMap.enabled = !lowPower;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.domElement.style.touchAction = 'none'; // gesty trafiają do OrbitControls, nie do przeglądarki
  appEl.appendChild(renderer.domElement);

  const labelRenderer = new CSS2DRenderer({ element: labelEl });
  labelRenderer.setSize(vw(), vh());

  // ── scena i kamera ─────────────────────────────────────────
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf2efe7);
  scene.fog = new THREE.Fog(0xf2efe7, 110, 290);

  const camera = new THREE.PerspectiveCamera(38, vw() / vh(), 0.5, 900);
  camera.position.set(10, 122, 22);

  // ── sterowanie: wygodne i płynne (desktop + dotyk) ─────────
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;        // gładki, krótki wybieg po puszczeniu
  controls.rotateSpeed = 0.82;          // spokojniejszy obrót, łatwiej trafić
  controls.zoomSpeed = 0.8;             // kółko mniej „skacze"
  controls.zoomToCursor = true;         // kółko przybliża tam, gdzie kursor — naturalniej
  controls.minDistance = 9;
  controls.maxDistance = 112;           // węższy zakres = równomierny, przewidywalny zoom
  controls.maxPolarAngle = 1.48;
  controls.minPolarAngle = 0.12;
  controls.enablePan = false;           // budynek zawsze w kadrze, nie da się „zgubić"
  // jeden palec obraca, dwa palce przybliżają (pan wyłączony → bez zgubienia obiektu)
  controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
  controls.enabled = false;             // do końca intra

  // ── światła ────────────────────────────────────────────────
  const hemi = new THREE.HemisphereLight(0xfff4e0, 0xe2dccb, 0.68);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xfff1da, 1.5);
  sun.position.set(46, 60, 28);
  sun.castShadow = !lowPower;
  sun.shadow.mapSize.setScalar(isMobile ? 1024 : 2048);
  sun.shadow.camera.left = -55;
  sun.shadow.camera.right = 55;
  sun.shadow.camera.top = 55;
  sun.shadow.camera.bottom = -55;
  sun.shadow.camera.far = 180;
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.02;
  scene.add(sun);

  const fill = new THREE.DirectionalLight(0xdfe8f5, 0.32);
  fill.position.set(-40, 30, -30);
  scene.add(fill);

  // ── intro startuje wcześnie: trzyma splash i progres ───────
  const intro = createIntro({
    camera, controls, scene,
    onDone: () => {
      controls.enabled = true;
      controls.autoRotate = true;
      controls.autoRotateSpeed = -0.3;
    },
  });

  // ── świat (budowany etapami, by splash pozostał responsywny) ─
  intro.setProgress(0.14, 'Budujemy okolicę…');
  await nextFrame();
  const { lampHeads } = buildCity(scene);

  intro.setProgress(0.46, 'Stawiamy budynek…');
  await nextFrame();
  const bar = buildBar(scene);

  intro.setProgress(0.68, 'Rozwieszamy światła…');
  await nextFrame();
  const labels = buildLabels(scene, (id) => openAttraction(id));

  const modes = createModes({
    scene,
    groups: bar.groups,
    onModeChange: (m) => {
      labels.setMode(m);
      syncModeUI(m);
    },
  });
  labels.setMode('full');

  // ── postprocessing (bloom nocą) ────────────────────────────
  const rt = new THREE.WebGLRenderTarget(vw(), vh(), {
    type: THREE.HalfFloatType,
    samples: lowPower || isMobile ? 0 : 4,
  });
  const composer = new EffectComposer(renderer, rt);
  composer.setPixelRatio(renderer.getPixelRatio()); // bufory w rozdzielczości efektywnej (DPR) od 1. klatki — noc nie rozmyta
  composer.addPass(new RenderPass(scene, camera));
  const bloomPass = new UnrealBloomPass(new THREE.Vector2(vw(), vh()), 0.0, 0.5, 0.82);
  composer.addPass(bloomPass);
  composer.addPass(new OutputPass());

  const night = createNight({ scene, hemi, sun, barNight: bar.night, lampHeads, bloomPass });

  // ── ruch kamery ────────────────────────────────────────────
  // przesunięcie kadru, gdy otwarty jest panel (obiekt ląduje obok/nad panelem)
  let panelOffset = false;
  function applyViewOffset() {
    const W = vw(), H = vh();
    if (panelOffset) {
      if (W > 980) {
        // desktop: panel po prawej → obiekt w lewej części kadru
        camera.setViewOffset(W, H, Math.min(235, W * 0.17), 0, W, H);
      } else {
        // mobile: panel to dolny arkusz (~46vh) → wynieś obiekt w górną strefę nad panel,
        // ale nie pod topbar (offset dobrany tak, by środek strefy był ok. 30% wysokości)
        camera.setViewOffset(W, H, 0, Math.round(H * 0.22), W, H);
      }
    } else {
      camera.clearViewOffset();
    }
  }

  // powolny filmowy dryf wokół celu (gdy klient czyta panel)
  let driftActive = false;
  let lastInteract = performance.now();
  const UP = new THREE.Vector3(0, 1, 0);
  const stopDrift = () => { driftActive = false; };
  // interakcja użytkownika wstrzymuje auto-obrót; wraca po chwili bezczynności
  controls.addEventListener('start', () => { stopDrift(); lastInteract = performance.now(); controls.autoRotate = false; });

  let cancelFly = null;
  const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _mid = new THREE.Vector3();
  function flyTo(view, dur = 1500, after) {
    cancelFly?.();
    stopDrift();
    controls.enabled = false;
    const p0 = camera.position.clone();
    const t0 = controls.target.clone();
    const p1 = new THREE.Vector3(...(view.pos.toArray ? view.pos.toArray() : view.pos));
    const t1 = new THREE.Vector3(...(view.target.toArray ? view.target.toArray() : view.target));
    const dist = p0.distanceTo(p1);
    _mid.lerpVectors(p0, p1, 0.5);
    _mid.y += Math.min(3.0, Math.max(0.2, dist * 0.06)); // łagodny łuk; krótkie skoki niemal liniowe
    const mid = _mid.clone();
    cancelFly = tween({
      dur: Math.min(1600, dur + dist * 5), // żwawsza nawigacja między atrakcjami
      ease: easeInOutCubic,
      update: (e) => {
        _a.lerpVectors(p0, mid, e);
        _b.lerpVectors(mid, p1, e);
        camera.position.lerpVectors(_a, _b, e);
        controls.target.lerpVectors(t0, t1, e);
      },
      done: () => {
        controls.enabled = true;
        cancelFly = null;
        after?.();
      },
    });
  }

  let modeBeforeFocus = null;
  function focusAttraction(id) {
    if (!intro.finished()) return;
    const a = ATTRACTIONS.find((x) => x.id === id);
    if (!a) return;
    controls.autoRotate = false;
    if (modeBeforeFocus === null) modeBeforeFocus = modes.mode;
    panelOffset = true;
    applyViewOffset();
    modes.set(a.view.mode);
    modes.highlight(a.view.zone);
    flyTo(a.view.camera, 1500, () => { driftActive = true; });
  }
  function resetCamera() {
    const back = modeBeforeFocus ?? modes.mode;
    modeBeforeFocus = null;
    panelOffset = false;
    applyViewOffset();
    stopDrift();
    modes.highlight(null);
    modes.set(back);
    flyTo(MODE_VIEWS[back], 1300);
  }
  function setMode(m) {
    if (!intro.finished() || m === modes.mode) return;
    modeBeforeFocus = null;
    panelOffset = false;
    applyViewOffset();
    stopDrift();
    modes.highlight(null);
    modes.set(m);
    flyTo(MODE_VIEWS[m], 1200);
  }

  // ── UI ─────────────────────────────────────────────────────
  mountUI({
    focusAttraction,
    resetCamera,
    setMode,
    toggleNight: () => night.toggle(),
    setLabelActive: (id) => labels.setActive(id),
  });
  syncModeUI('full');

  // ── dynamiczny downgrade przy bardzo wolnych klatkach ─────
  let frameCount = 0;
  let slowFrames = 0;
  let lastT = performance.now();
  function maybeDowngrade(now) {
    if (document.hidden) { lastT = now; return; }
    if (lowPower || frameCount > 240) return;
    frameCount++;
    const dt = now - lastT;
    lastT = now;
    if (frameCount > 10 && dt > 80) slowFrames++;
    if (slowFrames > 14) {
      lowPower = true;
      renderer.setPixelRatio(0.75);
      composer.setPixelRatio(0.75); // downgrade obejmuje też łańcuch postprocessingu (bloom nocą)
      renderer.shadowMap.enabled = false;
      sun.castShadow = false;
      console.info('[rikoszet] tryb oszczędny: wyłączam cienie i obniżam rozdzielczość');
    }
  }

  // ── pętla + rozmiar ────────────────────────────────────────
  function onResize() {
    camera.aspect = vw() / vh();
    applyViewOffset(); // offset liczony od bieżącego rozmiaru
    camera.updateProjectionMatrix();
    renderer.setSize(vw(), vh());
    composer.setSize(vw(), vh());
    bloomPass.setSize(vw(), vh());
    labelRenderer.setSize(vw(), vh());
  }
  addEventListener('resize', onResize);

  let lastW = vw(), lastH = vh();
  let lastNow = performance.now();
  function tick(now) {
    if (lastW !== vw() || lastH !== vh()) {
      lastW = vw(); lastH = vh();
      onResize();
    }
    const dt = Math.min(60, now - lastNow);
    lastNow = now;
    maybeDowngrade(now);
    updateTweens(now);
    intro.update(now);
    // po ~12 s bezczynności (i gdy nie czytasz panelu) scena znów delikatnie się obraca
    if (intro.finished() && !controls.autoRotate && !driftActive && !cancelFly &&
        modeBeforeFocus === null && !document.body.classList.contains('modal-open') &&
        !document.body.classList.contains('booking-open') && now - lastInteract > 12000) {
      controls.autoRotate = true;
    }
    if (driftActive && !cancelFly) {
      // bardzo wolny obrót w lewo wokół celu — klient widzi więcej, czytając
      const off = camera.position.clone().sub(controls.target);
      off.applyAxisAngle(UP, dt * 0.000042);
      camera.position.copy(controls.target).add(off);
    }
    controls.update();
    // w dzień (brak bloomu) renderujemy wprost — pomijamy kosztowny łańcuch postprocessingu;
    // composer wchodzi tylko, gdy świeci noc (night.t > 0)
    if (night.t === 0) {
      renderer.render(scene, camera);
    } else {
      composer.render();
    }
    labelRenderer.render(scene, camera);
  }
  renderer.setAnimationLoop(tick);

  // jedna złożona klatka zanim ruszy najazd (gładkie odsłonięcie)
  intro.setProgress(0.92, 'Prawie gotowe…');
  await nextFrame();
  await nextFrame();
  intro.setProgress(1, 'Zapraszamy');
  intro.begin();

  // ── wnętrza dobudowujemy w tle, już po starcie intra ───────
  setTimeout(() => {
    const ints = buildInteriors(scene, { night: bar.night, mats: bar.mats, nightT: night.t });
    modes.attachInteriors(ints);
    night.refresh();
  }, 300);

  // DEV: gdy karta jest ukryta, rAF stoi — podtrzymujemy render interwałem
  // (w produkcji oszczędzamy baterię i nic nie renderujemy w tle)
  if (import.meta.env.DEV) {
    let hiddenTimer = null;
    const syncHiddenLoop = () => {
      if (document.hidden && !hiddenTimer) {
        hiddenTimer = setInterval(() => tick(performance.now()), 250);
      } else if (!document.hidden && hiddenTimer) {
        clearInterval(hiddenTimer);
        hiddenTimer = null;
      }
    };
    document.addEventListener('visibilitychange', syncHiddenLoop);
    syncHiddenLoop();
    window.__rks = { renderer, scene, camera, controls, composer, night, modes, tick, flyTo, intro, MODE_VIEWS, openAttraction, setMode };
  }
}

init();
