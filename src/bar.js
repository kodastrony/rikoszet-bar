// Bohater sceny: ceglany budynek RIKOSZET w warstwach (parter / piętro /
// dachy), z prawdziwymi otworami okiennymi — działa widok przekrojowy.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  brickTexture, plankTexture, metalRoofTexture, membraneTexture,
  signTexture, muralTexture, chalkboardTexture,
} from './textures.js';

// wymiary współdzielone z wnętrzami
export const SHELL = {
  W: 20, D: 11, T: 0.3, // bryła główna + grubość ścian
  H1: 4.4, H2: 8.2, // strop parteru / strop piętra
  WING: { X0: -22.5, X1: -10, D: 9, H: 5.4, RIDGE: 2.4 },
};

function mesh(geo, mat, x = 0, y = 0, z = 0, opts = {}) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  if (opts.ry) m.rotation.y = opts.ry;
  if (opts.rx) m.rotation.x = opts.rx;
  if (opts.rz) m.rotation.z = opts.rz;
  m.castShadow = opts.cast !== false;
  m.receiveShadow = opts.recv !== false;
  return m;
}

// UV w jednostkach świata, żeby cegła miała stałą skalę na każdym segmencie
function brickUV(geo, w, h, t, s = 3.05) {
  const uv = geo.attributes.uv;
  const dims = [[t, h], [t, h], [w, t], [w, t], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) {
    const [du, dv] = dims[f];
    for (let i = f * 4; i < f * 4 + 4; i++) {
      uv.setXY(i, (uv.getX(i) * du) / s, (uv.getY(i) * dv) / s);
    }
  }
  uv.needsUpdate = true;
}

/**
 * Ściana wzdłuż lokalnej osi X (środek w 0), z otworami.
 * openings: { x, w, y0, y1 } — pozycja środka, szerokość, parapet, nadproże.
 * Zwraca jedną zmergowaną geometrię.
 */
function wallGeometry({ len, h, t, base = 0, openings = [] }) {
  const parts = [];
  const add = (cx, cy, w, hh) => {
    if (w <= 0.01 || hh <= 0.01) return;
    const g = new THREE.BoxGeometry(w, hh, t);
    brickUV(g, w, hh, t);
    g.translate(cx, cy, 0);
    parts.push(g);
  };
  const ops = [...openings].sort((a, b) => a.x - b.x);
  let cursor = -len / 2;
  for (const op of ops) {
    const left = op.x - op.w / 2;
    add((cursor + left) / 2, base + h / 2, left - cursor, h);
    // pod parapetem i nad nadprożem
    add(op.x, base + (op.y0 - base) / 2 + 0, op.w, op.y0 - base);
    add(op.x, op.y1 + (base + h - op.y1) / 2, op.w, base + h - op.y1);
    cursor = op.x + op.w / 2;
  }
  add((cursor + len / 2) / 2, base + h / 2, len / 2 - cursor, h);
  return mergeGeometries(parts, false);
}

function stripeCanvasTexture() {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 32;
  const ctx = c.getContext('2d');
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = i % 2 ? '#ece2cc' : '#1f4a38';
    ctx.fillRect(i * 16, 0, 16, 32);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function eightBallTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 256, 256);
  ctx.fillStyle = '#16181a';
  ctx.beginPath(); ctx.arc(128, 128, 120, 0, 7); ctx.fill();
  ctx.fillStyle = '#f3ecda';
  ctx.beginPath(); ctx.arc(128, 118, 56, 0, 7); ctx.fill();
  ctx.fillStyle = '#16181a';
  ctx.font = '800 78px "Bricolage Grotesque Variable", sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('8', 128, 122);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function neonTextTexture(text, color = '#ff6a4d') {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 128;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 512, 128);
  ctx.font = '700 74px "Bricolage Grotesque Variable", sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.strokeStyle = color;
  ctx.lineWidth = 5;
  ctx.strokeText(text, 256, 66);
  ctx.fillStyle = '#fff1e8';
  ctx.fillText(text, 256, 66);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function buildBar(scene) {
  const { W, D, T, H1, H2, WING } = SHELL;
  const night = { interiors: [], bulbs: [], neons: [], pointLights: [] };

  const groups = {
    parter: new THREE.Group(),
    pietro: new THREE.Group(),
    roof: new THREE.Group(),
    wing: new THREE.Group(),
    wingRoof: new THREE.Group(),
    always: new THREE.Group(),
  };

  // ── materiały ──────────────────────────────────────────────
  const brickTex = brickTexture({ repeat: [1, 1] });
  const brick = new THREE.MeshStandardMaterial({ map: brickTex, roughness: 0.92 });
  const brickTexW = brickTexture({ repeat: [1, 1], tone: 5 });
  const brickWing = new THREE.MeshStandardMaterial({ map: brickTexW, roughness: 0.92 });
  const stone = new THREE.MeshStandardMaterial({ color: 0xe7dcc6, roughness: 0.8 });
  const cutCap = new THREE.MeshStandardMaterial({ color: 0xe3d6bd, roughness: 0.85 });
  const plinth = new THREE.MeshStandardMaterial({ color: 0x675b4e, roughness: 0.9 });
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x262b27, roughness: 0.55, metalness: 0.25 });
  const steelDark = new THREE.MeshStandardMaterial({ color: 0x33383b, roughness: 0.5, metalness: 0.55 });
  const doorGreen = new THREE.MeshStandardMaterial({ color: 0x1f4a38, roughness: 0.5 });
  const brass = new THREE.MeshStandardMaterial({ color: 0xc9982c, roughness: 0.35, metalness: 0.85 });
  const membrane = new THREE.MeshStandardMaterial({ map: membraneTexture({ repeat: [6, 4] }), roughness: 1 });
  const metalRoof = new THREE.MeshStandardMaterial({ map: metalRoofTexture({ repeat: [5, 2], light: true }), roughness: 0.65, metalness: 0.2 });
  const deck = new THREE.MeshStandardMaterial({ map: plankTexture({ repeat: [6, 6] }), roughness: 0.9 });
  const barrelWood = new THREE.MeshStandardMaterial({ map: plankTexture({ repeat: [2.4, 1] }), roughness: 0.9 });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0xcfdee0, roughness: 0.1, metalness: 0.08,
    transparent: true, opacity: 0.22, side: THREE.DoubleSide,
  });
  const awningStripes = stripeCanvasTexture();
  const awningMat = new THREE.MeshStandardMaterial({ map: awningStripes, roughness: 0.85, side: THREE.DoubleSide });
  const bushMat = new THREE.MeshStandardMaterial({ color: 0x55784a, roughness: 0.95 });
  const bulbMat = new THREE.MeshStandardMaterial({ color: 0xfff0d2, emissive: 0xffd27a, emissiveIntensity: 0.05, roughness: 0.4 });
  night.bulbs.push(bulbMat);

  const mats = { brick, brickWing, stone, frameMat, steelDark, doorGreen, brass, glassMat, deck, bulbMat, plinth };

  // ── okno (rama + szpros + szyba) ───────────────────────────
  function makeWindow({ w, h, mullions = [2, 2] }) {
    const win = new THREE.Group();
    const f = 0.1;
    [[0, h / 2 - f / 2, w, f], [0, -h / 2 + f / 2, w, f]].forEach(([x, y, ww, hh]) =>
      win.add(mesh(new THREE.BoxGeometry(ww, hh, 0.14), frameMat, x, y, 0)));
    [[w / 2 - f / 2, 0], [-w / 2 + f / 2, 0]].forEach(([x, y]) =>
      win.add(mesh(new THREE.BoxGeometry(f, h - 2 * f, 0.14), frameMat, x, y, 0)));
    win.add(mesh(new THREE.BoxGeometry(w + 0.24, 0.1, 0.3), stone, 0, -h / 2 - 0.05, 0.06));
    const [cols, rows] = mullions;
    for (let i = 1; i < cols; i++)
      win.add(mesh(new THREE.BoxGeometry(0.045, h - 2 * f, 0.1), frameMat, -w / 2 + (w / cols) * i, 0, 0));
    for (let i = 1; i < rows; i++)
      win.add(mesh(new THREE.BoxGeometry(w - 2 * f, 0.045, 0.1), frameMat, 0, -h / 2 + (h / rows) * i, 0));
    win.add(mesh(new THREE.PlaneGeometry(w - f, h - f), glassMat, 0, 0, 0.01, { cast: false }));
    return win;
  }

  const place = (grp, obj, x, y, z, ry = 0) => {
    obj.position.set(x, y, z);
    obj.rotation.y = ry;
    grp.add(obj);
    return obj;
  };

  function awning(w) {
    const a = new THREE.Group();
    const slope = mesh(new THREE.PlaneGeometry(w, 1.3), awningMat, 0, 0, 0, { rx: -1.05, cast: true });
    slope.position.set(0, -0.28, 0.52);
    a.add(slope);
    a.add(mesh(new THREE.BoxGeometry(w, 0.22, 0.03), awningMat, 0, -0.62, 1.06));
    return a;
  }

  // ── definicje otworów ──────────────────────────────────────
  const FZ = D / 2, BZ = -D / 2, RX = W / 2, LX = -W / 2;
  const opsFrontP = [
    ...[-8, -4.4, -0.8, 2.8].map((x) => ({ x, w: 2.5, y0: 1.0, y1: 3.9 })),
    { x: 7, w: 2.8, y0: 0, y1: 3.55 }, // wejście
  ];
  const opsFrontU = [-8, -4, 0, 4, 8].map((x) => ({ x, w: 2.9, y0: 5.43, y1: 7.78 }));
  const opsBackP = [
    ...[-1, 2.6, 6.2].map((x) => ({ x, w: 2.5, y0: 1.05, y1: 3.65 })),
    { x: -6.5, w: 1.9, y0: 0, y1: 2.6 }, // dostawy
  ];
  const opsBackU = [-7, -3.4, 0.2, 3.8, 7.4].map((x) => ({ x, w: 2.5, y0: 5.45, y1: 7.75 }));
  const opsRightP = [
    { x: -1.8, w: 2.2, y0: 1.1, y1: 3.7 },
    { x: 2.6, w: 1.4, y0: 0, y1: 2.5 }, // drzwi na patio
  ];
  const opsRightU = [-3.2, 0.2, 3.6].map((x) => ({ x, w: 2.2, y0: 5.45, y1: 7.75 }));
  const opsLeftP = [{ x: 0, w: 2.6, y0: 0, y1: 3.3 }]; // przejście do hali

  // ── ściany parteru ─────────────────────────────────────────
  const wallP = (ops, len) => wallGeometry({ len, h: H1, t: T, base: 0, openings: ops });

  const addWall = (grp, geo, mat, x, z, ry = 0) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, 0, z);
    m.rotation.y = ry;
    m.castShadow = m.receiveShadow = true;
    grp.add(m);
    return m;
  };

  addWall(groups.parter, wallP(opsFrontP, W), brick, 0, FZ - T / 2);
  addWall(groups.parter, wallP(opsBackP, W), brick, 0, BZ + T / 2, Math.PI);
  addWall(groups.parter, wallP(opsRightP, D - 2 * T), brick, RX - T / 2, 0, -Math.PI / 2);
  addWall(groups.parter, wallP(opsLeftP, D - 2 * T), brick, LX + T / 2, 0, Math.PI / 2);

  // cokół (rama dookoła, bez wnętrza)
  [[0, FZ + 0.02, W + 0.24, 0.34], [0, BZ - 0.02, W + 0.24, 0.34]].forEach(([x, z, w, d]) =>
    groups.parter.add(mesh(new THREE.BoxGeometry(w, 0.55, d), plinth, x, 0.275, z)));
  [[RX + 0.02, 0, 0.34, D + 0.24], [LX - 0.02, 0, 0.34, D + 0.24]].forEach(([x, z, w, d]) =>
    groups.parter.add(mesh(new THREE.BoxGeometry(w, 0.55, d), plinth, x, 0.275, z)));

  // czapki cięcia parteru (widoczne w trybie przekroju)
  const capP = (len, x, z, ry = 0) =>
    groups.parter.add(mesh(new THREE.BoxGeometry(len, 0.1, T + 0.03), cutCap, x, H1 + 0.05, z, { ry, cast: false }));
  capP(W + 0.03, 0, FZ - T / 2);
  capP(W + 0.03, 0, BZ + T / 2);
  capP(D - 2 * T, RX - T / 2, 0, Math.PI / 2);
  capP(D - 2 * T, LX + T / 2, 0, Math.PI / 2);

  // okna parteru + markizy (przód)
  [-8, -4.4, -0.8, 2.8].forEach((x) => {
    place(groups.parter, makeWindow({ w: 2.5, h: 2.9 }), x, 2.45, FZ - 0.07);
    place(groups.parter, awning(2.9), x, 4.02, FZ + 0.02);
  });
  [-1, 2.6, 6.2].forEach((x) => place(groups.parter, makeWindow({ w: 2.5, h: 2.6 }), x, 2.35, BZ + 0.07, Math.PI));
  place(groups.parter, makeWindow({ w: 2.2, h: 2.6 }), RX - 0.07, 2.4, -1.8, -Math.PI / 2);

  // ── wejście główne ─────────────────────────────────────────
  {
    const E = new THREE.Group();
    E.add(mesh(new THREE.BoxGeometry(2.8, 3.55, 0.18), frameMat, 0, 1.77, -0.06));
    [-0.62, 0.62].forEach((dx) => {
      E.add(mesh(new THREE.BoxGeometry(1.12, 2.6, 0.09), doorGreen, dx, 1.3, 0.0));
      E.add(mesh(new THREE.PlaneGeometry(0.78, 1.7), glassMat, dx, 1.55, 0.05, { cast: false }));
      E.add(mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.5, 8), brass, dx - Math.sign(dx) * 0.42, 1.25, 0.08));
    });
    E.add(mesh(new THREE.PlaneGeometry(2.4, 0.6), glassMat, 0, 3.18, 0.0, { cast: false }));
    place(groups.parter, E, 7, 0, FZ - T / 2);

    // schody, daszek, lampka
    [[3.6, 0.42], [3.1, 0.84], [2.7, 1.22]].forEach(([w, zz], i) =>
      groups.parter.add(mesh(new THREE.BoxGeometry(w, 0.13, 0.45), stone, 7, 0.065 + i * 0.0, FZ + zz)));
    groups.parter.add(mesh(new THREE.BoxGeometry(3.4, 0.1, 1.25), frameMat, 7, 3.6, FZ + 0.55));
    groups.parter.add(mesh(new THREE.BoxGeometry(3.4, 0.05, 0.06), brass, 7, 3.67, FZ + 1.14));
    [[5.55, 0.95], [8.45, 0.95]].forEach(([x, dz]) => {
      groups.parter.add(mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.0, 6), steelDark, x, 4.05, FZ + dz - 0.35, { rx: 0.55 }));
    });
    groups.parter.add(mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.28, 6), steelDark, 7, 3.42, FZ + 0.55));
    groups.parter.add(mesh(new THREE.SphereGeometry(0.09, 10, 8), bulbMat, 7, 3.26, FZ + 0.55, { cast: false }));

    const pl = new THREE.PointLight(0xffc878, 0, 9, 2);
    pl.position.set(7, 3.1, FZ + 1.2);
    groups.always.add(pl);
    night.pointLights.push({ light: pl, intensity: 14 });
  }

  // drzwi boczne na patio + dostawcze
  {
    const sd = new THREE.Group();
    sd.add(mesh(new THREE.BoxGeometry(0.1, 2.45, 1.3), frameMat, 0.04, 1.25, 0));
    sd.add(mesh(new THREE.BoxGeometry(0.07, 2.3, 1.1), doorGreen, 0, 1.18, 0));
    sd.add(mesh(new THREE.BoxGeometry(0.16, 0.1, 1.6), stone, 0.06, 2.95, 0));
    sd.add(mesh(new THREE.SphereGeometry(0.08, 10, 8), bulbMat, 0.2, 2.68, 0, { cast: false }));
    place(groups.parter, sd, RX - 0.12, 0, 2.6);
    groups.parter.add(mesh(new THREE.BoxGeometry(1.8, 2.55, 0.1), steelDark, -6.5, 1.3, BZ + 0.12));
  }

  // neon „OTWARTE" w oknie
  {
    const t = neonTextTexture('OTWARTE');
    const m = new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity: 0 });
    groups.parter.add(mesh(new THREE.PlaneGeometry(1.7, 0.42), m, 2.8, 3.1, FZ - 0.16, { cast: false, recv: false }));
    night.neons.push({ mat: m, nightOpacity: 1, day: 0 });
  }

  // ── ściany piętra ──────────────────────────────────────────
  const wallU = (ops, len) => wallGeometry({ len, h: H2 - H1, t: T, base: H1, openings: ops });
  addWall(groups.pietro, wallU(opsFrontU, W), brick, 0, FZ - T / 2);
  addWall(groups.pietro, wallU(opsBackU, W), brick, 0, BZ + T / 2, Math.PI);
  addWall(groups.pietro, wallU(opsRightU, D - 2 * T), brick, RX - T / 2, 0, -Math.PI / 2);
  addWall(groups.pietro, wallU([], D - 2 * T), brick, LX + T / 2, 0, Math.PI / 2);

  // gzyms międzykondygnacyjny
  groups.pietro.add(mesh(new THREE.BoxGeometry(W + 0.3, 0.22, D + 0.3), stone, 0, H1 + 0.02, 0, { cast: false }));

  // okna piętra
  [-8, -4, 0, 4, 8].forEach((x) => place(groups.pietro, makeWindow({ w: 2.9, h: 2.35, mullions: [3, 2] }), x, 6.6, FZ - 0.07));
  [-7, -3.4, 0.2, 3.8, 7.4].forEach((x) => place(groups.pietro, makeWindow({ w: 2.5, h: 2.3 }), x, 6.6, BZ + 0.07, Math.PI));
  [-3.2, 0.2, 3.6].forEach((z) => place(groups.pietro, makeWindow({ w: 2.2, h: 2.3 }), RX - 0.07, 6.6, z, -Math.PI / 2));

  // strop nad parterem (podłoga piętra) z otworem na schody
  {
    const floorTex = plankTexture({ repeat: [7, 4] });
    const slabTop = new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.85 });
    const slabSide = new THREE.MeshStandardMaterial({ color: 0xded2bb, roughness: 0.9 });
    const slabMats = [slabSide, slabSide, slabTop, slabSide, slabSide, slabSide];
    const X0 = LX + T, X1 = RX - T, Z0 = BZ + T, Z1 = FZ - T;
    const hole = { x0: -9.7, x1: -8.15, z0: -0.45, z1: 4.75 };
    const slabs = [
      [X0, X1, Z0, hole.z0],
      [hole.x1, X1, hole.z0, Z1],
      [X0, hole.x0, hole.z0, Z1], // wąski pasek przy ścianie? (x0<hole.x0 → zero) — pomijane gdy puste
      [X0, X1, hole.z1, Z1],
    ];
    for (const [x0, x1, z0, z1] of slabs) {
      const w = x1 - x0, d = z1 - z0;
      if (w <= 0.02 || d <= 0.02) continue;
      groups.pietro.add(mesh(new THREE.BoxGeometry(w, 0.22, d), slabMats, x0 + w / 2, H1 + 0.11, z0 + d / 2, { cast: false }));
    }
  }

  // szyld RIKOSZET + wywieszka 8-ball (warstwa piętra)
  {
    const t = signTexture('RIKOSZET');
    const m = new THREE.MeshStandardMaterial({
      map: t, transparent: true, emissiveMap: t, emissive: 0xff6a4d, emissiveIntensity: 0,
      roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -1,
    });
    groups.pietro.add(mesh(new THREE.PlaneGeometry(5.9, 1.38), m, -2.6, 4.86, FZ + 0.04, { cast: false, recv: false }));
    night.neons.push({ mat: m, emissive: 2.0 });

    const S = new THREE.Group();
    S.add(mesh(new THREE.BoxGeometry(0.06, 0.06, 1.05), steelDark, 0, 0.55, 0.45));
    S.add(mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 6), steelDark, 0, 0.3, 0.93));
    const bm = new THREE.MeshStandardMaterial({ map: eightBallTexture(), transparent: true, side: THREE.DoubleSide, roughness: 0.5 });
    S.add(mesh(new THREE.PlaneGeometry(1.0, 1.0), bm, 0, -0.45, 0.93, { cast: false }));
    const ringMat = new THREE.MeshStandardMaterial({ color: 0xff6a4d, emissive: 0xff5a3c, emissiveIntensity: 0.12, roughness: 0.4 });
    S.add(mesh(new THREE.TorusGeometry(0.52, 0.022, 10, 40), ringMat, 0, -0.45, 0.93));
    night.neons.push({ mat: ringMat, emissive: 2.6 });
    place(groups.pietro, S, 7, 5.35, FZ);
  }

  // ── dach bryły głównej ─────────────────────────────────────
  {
    const R = groups.roof;
    R.add(mesh(new THREE.BoxGeometry(W + 0.34, 0.26, D + 0.34), stone, 0, H2 + 0.05, 0));
    const parapetH = 0.62;
    const pInner = new THREE.MeshStandardMaterial({ color: 0x8a4a36, roughness: 0.95 });
    [[0, D / 2 - 0.16, W + 0.3, 0.32], [0, -(D / 2 - 0.16), W + 0.3, 0.32]].forEach(([x, z, w, d]) =>
      R.add(mesh(new THREE.BoxGeometry(w, parapetH, d), pInner, x, H2 + 0.13 + parapetH / 2, z)));
    [[W / 2 - 0.16, 0, 0.32, D + 0.3], [-(W / 2 - 0.16), 0, 0.32, D + 0.3]].forEach(([x, z, w, d]) =>
      R.add(mesh(new THREE.BoxGeometry(w, parapetH, d), pInner, x, H2 + 0.13 + parapetH / 2, z)));
    R.add(mesh(new THREE.BoxGeometry(W + 0.42, 0.12, 0.46), stone, 0, H2 + 0.13 + parapetH, D / 2 - 0.16));
    R.add(mesh(new THREE.BoxGeometry(W + 0.42, 0.12, 0.46), stone, 0, H2 + 0.13 + parapetH, -(D / 2 - 0.16)));
    R.add(mesh(new THREE.BoxGeometry(0.46, 0.12, D + 0.42), stone, W / 2 - 0.16, H2 + 0.13 + parapetH, 0));
    R.add(mesh(new THREE.BoxGeometry(0.46, 0.12, D + 0.42), stone, -(W / 2 - 0.16), H2 + 0.13 + parapetH, 0));
    R.add(mesh(new THREE.BoxGeometry(W - 0.6, 0.08, D - 0.6), membrane, 0, H2 + 0.4, 0, { cast: false }));
    R.add(mesh(new THREE.BoxGeometry(1.7, 0.95, 1.1), steelDark, -3.5, H2 + 0.92, -2.4));
    R.add(mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.08, 18), new THREE.MeshStandardMaterial({ color: 0x22272a, roughness: 0.4 }), -3.5, H2 + 1.44, -2.4));
    R.add(mesh(new THREE.BoxGeometry(2.4, 0.42, 1.6), steelDark, 2.5, H2 + 0.64, -1.6));
    R.add(mesh(new THREE.PlaneGeometry(2.2, 1.4), glassMat, 2.5, H2 + 0.86, -1.6, { rx: -Math.PI / 2, cast: false }));
    R.add(mesh(new THREE.BoxGeometry(0.9, 1.6, 0.9), brick, -7.5, H2 + 1.06, -3.4));
    R.add(mesh(new THREE.BoxGeometry(1.1, 0.12, 1.1), stone, -7.5, H2 + 1.92, -3.4));
    [[5.5, -3.5], [7.2, 2.8]].forEach(([x, z]) => {
      R.add(mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.7, 10), steelDark, x, H2 + 0.76, z));
      R.add(mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.1, 10), steelDark, x, H2 + 1.16, z));
    });
  }

  // ── HALA (scena & karaoke) ─────────────────────────────────
  {
    const WW = WING.X1 - WING.X0, WD = WING.D, WH = WING.H;
    const cx = (WING.X0 + WING.X1) / 2;
    const wing = groups.wing;
    const wallW = (ops, len) => wallGeometry({ len, h: WH, t: T, base: 0, openings: ops });

    const front = addWall(wing, wallW([{ x: 4.4, w: 1.6, y0: 0, y1: 2.7 }], WW), brickWing, cx, WD / 2 - T / 2);
    addWall(wing, wallW([-3.4, 0, 3.4].map((x) => ({ x, w: 2.0, y0: 2.75, y1: 4.45 })), WW), brickWing, cx, -WD / 2 + T / 2, Math.PI);
    addWall(wing, wallW([{ x: 0, w: 2.2, y0: 2.0, y1: 4.4 }], WD - 2 * T), brickWing, WING.X0 + T / 2, 0, Math.PI / 2);

    // cokół + czapki cięcia
    [[cx, WD / 2 + 0.02, WW + 0.2, 0.34], [cx, -WD / 2 - 0.02, WW + 0.2, 0.34]].forEach(([x, z, w, d]) =>
      wing.add(mesh(new THREE.BoxGeometry(w, 0.5, d), plinth, x, 0.25, z)));
    wing.add(mesh(new THREE.BoxGeometry(0.34, 0.5, WD + 0.2), plinth, WING.X0 - 0.02, 0.25, 0));
    wing.add(mesh(new THREE.BoxGeometry(WW + 0.03, 0.1, T + 0.03), cutCap, cx, WH + 0.05, WD / 2 - T / 2, { cast: false }));
    wing.add(mesh(new THREE.BoxGeometry(WW + 0.03, 0.1, T + 0.03), cutCap, cx, WH + 0.05, -WD / 2 + T / 2, { cast: false }));
    wing.add(mesh(new THREE.BoxGeometry(T + 0.03, 0.1, WD - 2 * T), cutCap, WING.X0 + T / 2, WH + 0.05, 0, { cast: false }));

    // mural
    const mm = new THREE.MeshStandardMaterial({ map: muralTexture(), roughness: 0.92, polygonOffset: true, polygonOffsetFactor: -1 });
    wing.add(mesh(new THREE.PlaneGeometry(WW - 0.04, WH - 0.04), mm, cx, WH / 2, WD / 2 + 0.02, { cast: false }));

    // okna hali + drzwi sceniczne
    [-3.4, 0, 3.4].forEach((x) => place(wing, makeWindow({ w: 2.0, h: 1.7, mullions: [2, 1] }), cx + x, 3.6, -WD / 2 + 0.07, Math.PI));
    place(wing, makeWindow({ w: 2.2, h: 2.4 }), WING.X0 + 0.07, 3.2, 0, Math.PI / 2);
    {
      const sd = new THREE.Group();
      sd.add(mesh(new THREE.BoxGeometry(1.5, 2.65, 0.12), frameMat, 0, 1.32, -0.02));
      sd.add(mesh(new THREE.BoxGeometry(1.3, 2.5, 0.08), doorGreen, 0, 1.25, 0.02));
      sd.add(mesh(new THREE.BoxGeometry(2.0, 0.12, 0.7), frameMat, 0, 2.85, 0.3));
      sd.add(mesh(new THREE.SphereGeometry(0.08, 10, 8), bulbMat, 0, 2.62, 0.32, { cast: false }));
      sd.add(mesh(new THREE.BoxGeometry(1.9, 0.13, 0.5), stone, 0, 0.065, 0.55));
      place(wing, sd, cx + 4.4, 0, WD / 2 - T / 2 + 0.02);
    }

    // dach hali
    const WR = groups.wingRoof;
    const ridgeH = WING.RIDGE;
    const slopeLen = Math.hypot(WD / 2 + 0.5, ridgeH);
    const ang = Math.atan2(ridgeH, WD / 2 + 0.5);
    WR.add(mesh(new THREE.BoxGeometry(WW + 0.7, 0.09, slopeLen), metalRoof, cx, WH + ridgeH / 2, WD / 4 + 0.18, { rx: ang }));
    WR.add(mesh(new THREE.BoxGeometry(WW + 0.7, 0.09, slopeLen), metalRoof, cx, WH + ridgeH / 2, -(WD / 4 + 0.18), { rx: -ang }));
    WR.add(mesh(new THREE.BoxGeometry(WW + 0.74, 0.12, 0.3), steelDark, cx, WH + ridgeH + 0.02, 0));
    const shape = new THREE.Shape();
    shape.moveTo(-WD / 2, 0); shape.lineTo(WD / 2, 0); shape.lineTo(0, ridgeH);
    shape.closePath();
    const tri = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.3, bevelEnabled: false }), brickWing);
    tri.rotation.y = Math.PI / 2;
    tri.position.set(WING.X0, WH, 0.15);
    tri.castShadow = true;
    WR.add(tri);
    [-3.6, 0, 3.6].forEach((x) => {
      WR.add(mesh(new THREE.PlaneGeometry(2.0, 1.5), glassMat, cx + x, WH + ridgeH / 2 + 0.35, WD / 4 + 0.6, { rx: ang - Math.PI / 2 + 0.02, cast: false }));
    });
  }

  // ── OGRÓDEK / PATIO (zawsze widoczny) ─────────────────────
  {
    const patio = new THREE.Group();
    patio.add(mesh(new THREE.BoxGeometry(13, 0.26, 12), deck, 0, 0.13, 0));
    const planterBrick = new THREE.MeshStandardMaterial({ map: brickTexture({ repeat: [10, 0.55], tone: 3 }), roughness: 0.95 });
    patio.add(mesh(new THREE.BoxGeometry(13.2, 0.62, 0.45), planterBrick, 0, 0.31, 6.1));
    patio.add(mesh(new THREE.BoxGeometry(0.45, 0.62, 12.4), planterBrick, 6.6, 0.31, 0));
    patio.add(mesh(new THREE.BoxGeometry(13.2, 0.08, 0.5), stone, 0, 0.64, 6.1));
    patio.add(mesh(new THREE.BoxGeometry(0.5, 0.08, 12.4), stone, 6.6, 0.64, 0));
    {
      const bush = new THREE.IcosahedronGeometry(0.34, 1);
      const inst = new THREE.InstancedMesh(bush, bushMat, 26);
      const M = new THREE.Matrix4();
      let i = 0;
      for (let k = 0; k < 14; k++) { M.makeTranslation(-6 + k * 0.92, 0.78, 6.1); inst.setMatrixAt(i++, M); }
      for (let k = 0; k < 12; k++) { M.makeTranslation(6.6, 0.78, -5.4 + k * 0.98); inst.setMatrixAt(i++, M); }
      inst.castShadow = true;
      patio.add(inst);
    }
    const tableTop = new THREE.MeshStandardMaterial({ color: 0x9c7a52, roughness: 0.6 });
    function tableSet(withUmbrella) {
      const t = new THREE.Group();
      t.add(mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.05, 18), tableTop, 0, 0.78, 0));
      t.add(mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.78, 8), steelDark, 0, 0.39, 0));
      t.add(mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.04, 12), steelDark, 0, 0.03, 0));
      for (let k = 0; k < 3; k++) {
        const a = (k / 3) * Math.PI * 2 + 0.5;
        t.add(mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.5, 10), doorGreen, Math.cos(a) * 1.0, 0.25, Math.sin(a) * 1.0));
      }
      if (withUmbrella) {
        t.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.5, 8), steelDark, 0, 1.7, 0));
        const um = new THREE.MeshStandardMaterial({ map: awningStripes.clone(), roughness: 0.85, side: THREE.DoubleSide });
        um.map.repeat.set(2.2, 1);
        t.add(mesh(new THREE.ConeGeometry(1.55, 0.55, 10, 1, true), um, 0, 2.78, 0));
        t.add(mesh(new THREE.SphereGeometry(0.05, 8, 8), brass, 0, 3.1, 0));
      }
      return t;
    }
    [[-3.6, -2.6, 1], [0.6, 0.4, 0], [-3.0, 2.9, 1], [3.4, -3.4, 0], [3.2, 3.4, 1]].forEach(([x, z, u]) => {
      const t = tableSet(!!u);
      t.position.set(x, 0.26, z);
      t.rotation.y = x * 1.7;
      patio.add(t);
    });
    [[5.6, 4.9, 0], [5.7, -4.4, 1]].forEach(([x, z, table]) => {
      const b = new THREE.Group();
      b.add(mesh(new THREE.CylinderGeometry(0.42, 0.46, 0.95, 14), barrelWood, 0, 0.48, 0));
      [0.18, 0.48, 0.78].forEach((y) => b.add(mesh(new THREE.TorusGeometry(0.45, 0.018, 8, 24), steelDark, 0, y, 0, { rx: Math.PI / 2 })));
      if (table) {
        b.add(mesh(new THREE.CylinderGeometry(0.58, 0.58, 0.05, 16), tableTop, 0, 0.98, 0));
        b.add(mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.46, 10), doorGreen, 0.85, 0.23, 0.2));
        b.add(mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.46, 10), doorGreen, -0.5, 0.23, 0.75));
      }
      b.position.set(x, 0.26, z);
      patio.add(b);
    });
    const wireMat = new THREE.MeshStandardMaterial({ color: 0x2c2c2c, roughness: 0.8 });
    const postMat = new THREE.MeshStandardMaterial({ color: 0x4b4136, roughness: 0.8 });
    const posts = [
      new THREE.Vector3(-6.2, 0, -5.6), new THREE.Vector3(6.3, 0, -5.6),
      new THREE.Vector3(6.3, 0, 5.8), new THREE.Vector3(-6.2, 0, 5.8),
    ];
    posts.forEach((p) => {
      patio.add(mesh(new THREE.CylinderGeometry(0.05, 0.07, 3.1, 8), postMat, p.x, 1.8, p.z));
      patio.add(mesh(new THREE.SphereGeometry(0.05, 8, 6), brass, p.x, 3.36, p.z));
    });
    const bulbGeo = new THREE.SphereGeometry(0.05, 8, 6);
    const strands = [[posts[0], posts[1]], [posts[1], posts[2]], [posts[2], posts[3]], [posts[3], posts[0]], [posts[0], posts[2]]];
    const bulbs = new THREE.InstancedMesh(bulbGeo, bulbMat, strands.length * 11);
    bulbs.castShadow = false;
    let bi = 0;
    const Mb = new THREE.Matrix4();
    strands.forEach(([a, b]) => {
      const A = a.clone().setY(3.34), B = b.clone().setY(3.34);
      const mid = A.clone().lerp(B, 0.5); mid.y -= 0.55;
      const curve = new THREE.QuadraticBezierCurve3(A, mid, B);
      patio.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.012, 5), wireMat));
      for (let k = 1; k <= 11; k++) {
        const pt = curve.getPoint(k / 12);
        Mb.makeTranslation(pt.x, pt.y - 0.05, pt.z);
        bulbs.setMatrixAt(bi++, Mb);
      }
    });
    patio.add(bulbs);
    patio.position.set(17.2, 0, 0.2);
    groups.always.add(patio);

    [[14, 4.2, -2], [20, 4.2, 3]].forEach(([x, y, z]) => {
      const pl = new THREE.PointLight(0xffc878, 0, 13, 2);
      pl.position.set(x, y, z);
      groups.always.add(pl);
      night.pointLights.push({ light: pl, intensity: 11 });
    });
  }

  // drobiazgi przed wejściem
  {
    const chm = new THREE.MeshStandardMaterial({ map: chalkboardTexture(), roughness: 0.9 });
    const a = new THREE.Group();
    a.add(mesh(new THREE.BoxGeometry(0.78, 1.1, 0.04), chm, 0, 0.62, -0.18, { rx: 0.21 }));
    a.add(mesh(new THREE.BoxGeometry(0.78, 1.1, 0.04), new THREE.MeshStandardMaterial({ color: 0x23291f, roughness: 0.9 }), 0, 0.62, 0.18, { rx: -0.21 }));
    a.position.set(4.6, 0, 7.6);
    a.rotation.y = 0.5;
    groups.always.add(a);
    [[5.4, 6.9], [8.7, 6.9]].forEach(([x, z]) => {
      groups.always.add(mesh(new THREE.BoxGeometry(0.62, 0.62, 0.62), frameMat, x, 0.31, z));
      groups.always.add(mesh(new THREE.IcosahedronGeometry(0.42, 1), bushMat, x, 0.85, z));
    });
    [[-3.2], [-4.0], [-4.8]].forEach(([x]) => {
      groups.always.add(mesh(new THREE.TorusGeometry(0.42, 0.03, 8, 20, Math.PI), steelDark, x, 0.42, 8.3));
    });
  }

  Object.values(groups).forEach((g) => scene.add(g));
  return { groups, night, mats };
}
