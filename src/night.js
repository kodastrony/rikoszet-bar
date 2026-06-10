// Przełącznik dzień/noc: niebo, światła, neony, gwiazdy, bloom.
import * as THREE from 'three';
import { tween } from './tween.js';

const DAY = {
  bg: new THREE.Color(0xf2efe7),
  fog: new THREE.Color(0xf2efe7),
  hemiSky: new THREE.Color(0xfff4e0),
  hemiGround: new THREE.Color(0xe2dccb),
  hemiInt: 0.68,
  sun: new THREE.Color(0xfff1da),
  sunInt: 1.5,
  interiorTint: new THREE.Color(0x8a8a8a),
};
const NIGHT = {
  bg: new THREE.Color(0x0c1320),
  fog: new THREE.Color(0x0c1320),
  hemiSky: new THREE.Color(0x26365a),
  hemiGround: new THREE.Color(0x0c1016),
  hemiInt: 0.42,
  sun: new THREE.Color(0x93aee0),
  sunInt: 0.32,
  interiorTint: new THREE.Color(0x151515),
};

export function createNight({ scene, hemi, sun, barNight, lampHeads, bloomPass }) {
  let mode = 'day';
  let t = 0;

  // gwiazdy
  const starGeo = new THREE.BufferGeometry();
  const N = 700;
  const pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const a = Math.random() * Math.PI * 2;
    const e = Math.random() * Math.PI * 0.42 + 0.12;
    const r = 270;
    pos[i * 3] = Math.cos(a) * Math.cos(e) * r;
    pos[i * 3 + 1] = Math.sin(e) * r;
    pos[i * 3 + 2] = Math.sin(a) * Math.cos(e) * r;
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const starMat = new THREE.PointsMaterial({
    color: 0xeef2ff, size: 1.5, sizeAttenuation: false,
    transparent: true, opacity: 0, depthWrite: false, fog: false,
  });
  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);

  const tmp = new THREE.Color();

  function apply(x) {
    t = x;
    scene.background.lerpColors(DAY.bg, NIGHT.bg, x);
    if (scene.fog) scene.fog.color.lerpColors(DAY.fog, NIGHT.fog, x);
    hemi.color.lerpColors(DAY.hemiSky, NIGHT.hemiSky, x);
    hemi.groundColor.lerpColors(DAY.hemiGround, NIGHT.hemiGround, x);
    hemi.intensity = DAY.hemiInt + (NIGHT.hemiInt - DAY.hemiInt) * x;
    sun.color.lerpColors(DAY.sun, NIGHT.sun, x);
    sun.intensity = DAY.sunInt + (NIGHT.sunInt - DAY.sunInt) * x;

    // okna i wnętrza
    for (const m of barNight.interiors) {
      m.emissiveIntensity = 1.55 * x;
      m.color.lerpColors(DAY.interiorTint, NIGHT.interiorTint, x);
    }
    // żarówki girland i kinkietów
    for (const m of barNight.bulbs) m.emissiveIntensity = 0.05 + 2.6 * x;
    // neony / szyldy
    for (const n of barNight.neons) {
      if (n.emissive != null && n.mat.emissiveIntensity != null) n.mat.emissiveIntensity = n.emissive * x;
      if (n.nightOpacity != null) n.mat.opacity = (n.day ?? 0) + (n.nightOpacity - (n.day ?? 0)) * x;
    }
    for (const { light, intensity } of barNight.pointLights) light.intensity = intensity * x;
    for (const m of lampHeads) m.emissiveIntensity = 2.2 * x;

    starMat.opacity = 0.85 * x;
    if (bloomPass) bloomPass.strength = 0.55 * x;
  }

  apply(0);

  return {
    get mode() { return mode; },
    get t() { return t; },
    /** Ponowne nałożenie stanu (np. po dobudowaniu wnętrz). */
    refresh() { apply(t); },
    toggle() {
      mode = mode === 'day' ? 'night' : 'day';
      const from = t;
      const to = mode === 'night' ? 1 : 0;
      document.body.classList.toggle('night', mode === 'night');
      tween({ dur: 1500, update: (e) => apply(from + (to - from) * e) });
      return mode;
    },
  };
}
