// Tryby widoku budynku: full (całość) / parter / pietro (bez dachu).
// Warstwy zdejmują się „dollhouse'owo" — unoszą się i znikają.
import * as THREE from 'three';
import { tween, easeOutCubic, easeInOutCubic } from './tween.js';

const VISIBILITY = {
  full: { parter: true, pietro: true, roof: true, wing: true, wingRoof: true, parterInt: true, pietroInt: true },
  parter: { parter: true, pietro: false, roof: false, wing: true, wingRoof: false, parterInt: true, pietroInt: false },
  pietro: { parter: true, pietro: true, roof: false, wing: true, wingRoof: false, parterInt: true, pietroInt: true },
};
const LIFT = { pietro: 5, roof: 4, wingRoof: 4, pietroInt: 5 };

export function createModes({ scene, groups, onModeChange }) {
  let mode = 'full';
  let ints = { parterInt: null, pietroInt: null };
  let busy = false;
  let pending = null; // klik w trakcie animacji nie ginie — wykona się po niej

  // ── pierścień podświetlenia strefy ─────────────────────────
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xe3a93c, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false,
  });
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.82, 1, 48), ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.visible = false;
  const discMat = new THREE.MeshBasicMaterial({
    color: 0xe3a93c, transparent: true, opacity: 0, depthWrite: false,
  });
  const disc = new THREE.Mesh(new THREE.CircleGeometry(1, 48), discMat);
  disc.rotation.x = -Math.PI / 2;
  disc.visible = false;
  scene.add(ring, disc);
  let pulseStop = null;

  function highlight(zone) {
    pulseStop?.();
    pulseStop = null;
    if (!zone) {
      ring.visible = disc.visible = false;
      ringMat.opacity = discMat.opacity = 0;
      return;
    }
    const [x, y, z, r] = zone;
    ring.position.set(x, y, z);
    disc.position.set(x, y + 0.005, z);
    disc.scale.setScalar(r * 0.99);
    ring.visible = disc.visible = true;
    discMat.opacity = 0.1;
    let alive = true;
    pulseStop = () => { alive = false; };
    const pulse = () => {
      if (!alive) return;
      tween({
        dur: 1500,
        ease: easeOutCubic,
        update: (e) => {
          if (!alive) return;
          ring.scale.setScalar(r * (0.85 + e * 0.3));
          ringMat.opacity = 0.85 * (1 - e);
        },
        done: pulse,
      });
    };
    pulse();
  }

  // ── przełączanie warstw ────────────────────────────────────
  function allGroups() {
    return { ...groups, parterInt: ints.parterInt, pietroInt: ints.pietroInt };
  }

  function applyInstant(next) {
    const target = VISIBILITY[next];
    const all = allGroups();
    for (const [key, grp] of Object.entries(all)) {
      if (!grp || target[key] === undefined) continue;
      grp.visible = target[key];
      grp.position.y = 0;
    }
  }

  function set(next, { animate = true } = {}) {
    if (!VISIBILITY[next] || next === mode) return Promise.resolve(mode);
    if (busy) {
      pending = next;
      return Promise.resolve(mode);
    }
    const prevVis = VISIBILITY[mode];
    const nextVis = VISIBILITY[next];
    mode = next;
    onModeChange?.(mode);

    if (!animate) {
      applyInstant(next);
      return Promise.resolve(mode);
    }

    busy = true;
    const all = allGroups();
    const hides = [];
    const shows = [];
    for (const [key, grp] of Object.entries(all)) {
      if (!grp || nextVis[key] === undefined) continue;
      if (prevVis[key] && !nextVis[key]) hides.push([grp, LIFT[key] ?? 4]);
      if (!prevVis[key] && nextVis[key]) shows.push([grp, LIFT[key] ?? 4]);
      if (prevVis[key] && nextVis[key]) grp.visible = true;
    }
    return new Promise((resolve) => {
      let waiting = 0;
      const doneOne = () => {
        if (--waiting > 0) return;
        busy = false;
        resolve(mode);
        if (pending && pending !== mode) {
          const p = pending;
          pending = null;
          set(p);
        } else {
          pending = null;
        }
      };
      if (!hides.length && !shows.length) { busy = false; resolve(mode); return; }
      hides.forEach(([grp, lift]) => {
        waiting++;
        tween({
          dur: 360,
          ease: easeInOutCubic,
          update: (e) => { grp.position.y = e * lift; },
          done: () => { grp.visible = false; grp.position.y = 0; doneOne(); },
        });
      });
      shows.forEach(([grp, lift]) => {
        waiting++;
        grp.visible = true;
        grp.position.y = lift;
        tween({
          dur: 420,
          ease: easeOutCubic,
          update: (e) => { grp.position.y = lift * (1 - e); },
          done: () => { grp.position.y = 0; doneOne(); },
        });
      });
    });
  }

  return {
    get mode() { return mode; },
    set,
    highlight,
    attachInteriors(groupsIn) {
      ints = groupsIn;
      applyInstant(mode);
    },
  };
}
