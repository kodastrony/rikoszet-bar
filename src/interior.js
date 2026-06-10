// Wnętrza budynku: bar + rzutki (parter), scena (hala), bilard + salka (piętro).
// Budowane z prymitywów, mocno instancjonowane. Liner-y BackSide dają ściany,
// które same znikają, gdy patrzysz z góry w trybie przekroju.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { plankTexture, signTexture } from './textures.js';
import { SHELL } from './bar.js';

const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const cyl = (rt, rb, h, s = 10) => new THREE.CylinderGeometry(rt, rb, h, s);

function m(geo, mat, x = 0, y = 0, z = 0, opts = {}) {
  const ms = new THREE.Mesh(geo, mat);
  ms.position.set(x, y, z);
  if (opts.ry) ms.rotation.y = opts.ry;
  if (opts.rx) ms.rotation.x = opts.rx;
  if (opts.rz) ms.rotation.z = opts.rz;
  ms.castShadow = opts.cast !== false;
  ms.receiveShadow = opts.recv !== false;
  return ms;
}

function merged(parts) {
  // parts: [geo, x,y,z, ryOpt][]
  const list = parts.map(([g, x, y, z, ry]) => {
    const c = g.clone();
    if (ry) c.rotateY(ry);
    c.translate(x, y, z);
    return c;
  });
  return mergeGeometries(list, false);
}

function dartboardTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#16181a';
  ctx.beginPath(); ctx.arc(64, 64, 62, 0, 7); ctx.fill();
  for (let s = 0; s < 20; s++) {
    ctx.fillStyle = s % 2 ? '#ece4d0' : '#23231f';
    ctx.beginPath();
    ctx.moveTo(64, 64);
    ctx.arc(64, 64, 52, (s * Math.PI) / 10, ((s + 1) * Math.PI) / 10);
    ctx.fill();
  }
  ctx.strokeStyle = '#c2452f'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.arc(64, 64, 30, 0, 7); ctx.stroke();
  ctx.beginPath(); ctx.arc(64, 64, 52, 0, 7); ctx.stroke();
  ctx.fillStyle = '#2e7d5b';
  ctx.beginPath(); ctx.arc(64, 64, 7, 0, 7); ctx.fill();
  ctx.fillStyle = '#c2452f';
  ctx.beginPath(); ctx.arc(64, 64, 3, 0, 7); ctx.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function karaokeTexture() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 144;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#10231b';
  ctx.fillRect(0, 0, 256, 144);
  ctx.fillStyle = '#e3a93c';
  ctx.font = '700 30px "Bricolage Grotesque Variable", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('KARAOKE', 128, 62);
  ctx.fillStyle = '#f2e9d6';
  ctx.font = '600 18px "Bricolage Grotesque Variable", sans-serif';
  ctx.fillText('♪ piątek 21:00 ♪', 128, 95);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function buildInteriors(scene, { night, mats, nightT = 0 }) {
  const { W, D, T, H1, H2, WING } = SHELL;
  const parterInt = new THREE.Group();
  const pietroInt = new THREE.Group();

  // ── materiały ──────────────────────────────────────────────
  const plaster = new THREE.MeshStandardMaterial({ color: 0xf3ead8, roughness: 0.95, side: THREE.BackSide });
  const plasterHall = new THREE.MeshStandardMaterial({ color: 0xeee2cc, roughness: 0.95, side: THREE.BackSide });
  const wainscot = new THREE.MeshStandardMaterial({ color: 0x21473a, roughness: 0.85, side: THREE.BackSide });
  const floorWood = new THREE.MeshStandardMaterial({ map: plankTexture({ repeat: [8, 5] }), roughness: 0.85 });
  const floorWoodUp = new THREE.MeshStandardMaterial({ map: plankTexture({ repeat: [8, 5] }), roughness: 0.85, color: 0xd8cdbb });
  const darkWood = new THREE.MeshStandardMaterial({ color: 0x6e4527, roughness: 0.7 });
  const oak = new THREE.MeshStandardMaterial({ color: 0x9c7a52, roughness: 0.6 });
  const green = mats.doorGreen;
  const leather = new THREE.MeshStandardMaterial({ color: 0x2e5c47, roughness: 0.75 });
  const leatherWarm = new THREE.MeshStandardMaterial({ color: 0xb3683a, roughness: 0.75 });
  const steel = mats.steelDark;
  const brass = mats.brass;
  const felt = new THREE.MeshStandardMaterial({ color: 0x1f5c41, roughness: 0.95 });
  const black = new THREE.MeshStandardMaterial({ color: 0x1c1f21, roughness: 0.7 });
  const rugMat = new THREE.MeshStandardMaterial({ color: 0x335445, roughness: 1 });
  const bulb = mats.bulbMat;

  const X0 = -W / 2 + T, X1 = W / 2 - T, Z0 = -D / 2 + T, Z1 = D / 2 - T;

  // ── liner-y (ściany + sufit od środka); wcięte 6 cm, żeby nie
  //    walczyły o głębię z cegłą. Piętro celowo z gołą cegłą (loft).
  parterInt.add(m(box(X1 - X0 - 0.06, H1, Z1 - Z0 - 0.06), plaster, 0, H1 / 2, 0, { cast: false, recv: false }));
  parterInt.add(m(box(X1 - X0 - 0.12, 1.1, Z1 - Z0 - 0.12), wainscot, 0, 0.55, 0, { cast: false, recv: false }));
  const hallX0 = WING.X0 + T, hallX1 = WING.X1 - 0.0, hallZ = WING.D / 2 - T;
  parterInt.add(m(box(hallX1 - hallX0 - 0.06, WING.H, hallZ * 2 - 0.06), plasterHall, (hallX0 + hallX1) / 2, WING.H / 2, 0, { cast: false, recv: false }));

  // podłogi
  parterInt.add(m(box(X1 - X0, 0.12, Z1 - Z0), floorWood, 0, 0.06, 0, { cast: false }));
  parterInt.add(m(box(hallX1 - hallX0, 0.12, hallZ * 2), floorWood, (hallX0 + hallX1) / 2, 0.06, 0, { cast: false }));

  // ════════ PARTER: BAR GŁÓWNY ════════
  {
    // kontuar L (front przy x -7.5..0.5, z -2.6)
    const counter = new THREE.Group();
    counter.add(m(box(9, 0.08, 0.78), oak, -3.5, 1.08, -2.2));
    counter.add(m(box(9, 1.04, 0.6), green, -3.5, 0.54, -2.28));
    counter.add(m(box(9, 0.04, 0.05), brass, -3.5, 0.18, -1.95)); // podnóżek
    // krany na blacie
    [-5.6, -4.9, -4.2, -3.5].forEach((x) => {
      counter.add(m(cyl(0.025, 0.035, 0.34, 8), brass, x, 1.3, -2.25));
      counter.add(m(box(0.04, 0.12, 0.04), black, x, 1.5, -2.25));
    });
    counter.add(m(box(0.9, 0.32, 0.5), steel, -1.4, 1.28, -2.3)); // ekspres/kasa
    parterInt.add(counter);

    // backbar przy ścianie tylnej
    const back = new THREE.Group();
    back.add(m(box(8.6, 0.95, 0.5), darkWood, -3.6, 0.48, -4.9));
    [1.65, 2.3].forEach((y) => back.add(m(box(8.2, 0.05, 0.32), oak, -3.6, y, -4.95)));
    const glow = new THREE.MeshStandardMaterial({ color: 0xffe2b0, emissive: 0xffc878, emissiveIntensity: 0.15, roughness: 0.6 });
    [1.62, 2.27].forEach((y) => back.add(m(box(8.2, 0.025, 0.03), glow, -3.6, y, -4.8, { cast: false })));
    night.neons.push({ mat: glow, emissive: 1.6 });
    // butelki (instancje)
    {
      const r = (() => { let s = 7; return () => ((s = (s * 1664525 + 1013904223) >>> 0), s / 4294967296); })();
      const bottleGeo = cyl(0.035, 0.045, 0.3, 7);
      const colors = [0xc98f2c, 0x7c4a2d, 0x3f6f4f, 0xa33d2a, 0xcbb27e, 0x4a6a8a];
      const inst = new THREE.InstancedMesh(bottleGeo, new THREE.MeshStandardMaterial({ roughness: 0.35 }), 46);
      const M = new THREE.Matrix4();
      const C = new THREE.Color();
      for (let i = 0; i < 46; i++) {
        const shelfY = i % 2 ? 1.83 : 2.48;
        const x = -7.5 + (i / 46) * 7.8 + r() * 0.12;
        M.makeScale(1, 0.8 + r() * 0.5, 1).setPosition(x, shelfY, -4.95);
        inst.setMatrixAt(i, M);
        inst.setColorAt(i, C.setHex(colors[Math.floor(r() * colors.length)]));
      }
      inst.castShadow = false;
      back.add(inst);
    }
    // mały neon nad backbarem
    const nt = signTexture('RIKOSZET');
    const nm = new THREE.MeshStandardMaterial({
      map: nt, transparent: true, emissiveMap: nt, emissive: 0xff6a4d, emissiveIntensity: 0.1, roughness: 0.6,
    });
    back.add(m(new THREE.PlaneGeometry(3.4, 0.8), nm, -3.6, 3.3, -5.12, { cast: false, recv: false }));
    night.neons.push({ mat: nm, emissive: 1.8 });
    parterInt.add(back);

    // hokery przy barze (instancje: siedzisko + noga + podstawa)
    {
      const stoolGeo = merged([
        [cyl(0.21, 0.21, 0.06, 12), 0, 0.78, 0],
        [cyl(0.03, 0.03, 0.75, 8), 0, 0.4, 0],
        [cyl(0.16, 0.18, 0.04, 12), 0, 0.02, 0],
      ]);
      const inst = new THREE.InstancedMesh(stoolGeo, leatherWarm, 8);
      const M = new THREE.Matrix4();
      for (let i = 0; i < 8; i++) {
        M.makeTranslation(-7.2 + i * 1.06, 0.12, -1.45);
        inst.setMatrixAt(i, M);
      }
      inst.castShadow = true;
      parterInt.add(inst);
    }

    // lampy nad barem
    [-6.4, -4.5, -2.6, -0.7].forEach((x) => {
      parterInt.add(m(cyl(0.012, 0.012, 1.5, 6), black, x, H1 - 0.75, -2.2, { cast: false }));
      parterInt.add(m(cyl(0.16, 0.26, 0.22, 12), green, x, H1 - 1.55, -2.2));
      parterInt.add(m(new THREE.SphereGeometry(0.06, 8, 6), bulb, x, H1 - 1.68, -2.2, { cast: false }));
    });

    // dywan + stoliki lounge przy oknach
    parterInt.add(m(box(7.6, 0.025, 3.4), rugMat, -4.6, 0.13, 2.6, { cast: false }));
    const chairGeo = merged([
      [box(0.46, 0.06, 0.44), 0, 0.46, 0],
      [box(0.46, 0.52, 0.06), 0, 0.74, -0.21],
      [box(0.05, 0.46, 0.05), -0.18, 0.23, -0.18],
      [box(0.05, 0.46, 0.05), 0.18, 0.23, -0.18],
      [box(0.05, 0.46, 0.05), -0.18, 0.23, 0.18],
      [box(0.05, 0.46, 0.05), 0.18, 0.23, 0.18],
    ]);
    const chairInst = new THREE.InstancedMesh(chairGeo, darkWood, 14);
    let ci = 0;
    const CM = new THREE.Matrix4();
    const addChair = (x, z, ry) => {
      CM.makeRotationY(ry).setPosition(x, 0.12, z);
      chairInst.setMatrixAt(ci++, CM);
    };
    [[-6.6, 2.6], [-4.6, 3.1], [-2.6, 2.4]].forEach(([x, z], i) => {
      parterInt.add(m(cyl(0.42, 0.42, 0.05, 14), oak, x, 0.86, z));
      parterInt.add(m(cyl(0.05, 0.07, 0.74, 8), black, x, 0.49, z));
      addChair(x - 0.7, z + 0.1, Math.PI / 2 + i);
      addChair(x + 0.7, z - 0.1, -Math.PI / 2 + i * 0.5);
      addChair(x + 0.1, z + 0.7, Math.PI + i);
    });
    addChair(-1.2, 4.0, 0.4);
    addChair(0.2, 2.6, -0.9);
    chairInst.count = ci;
    chairInst.castShadow = true;
    parterInt.add(chairInst);

    // loże przy prawej ścianie
    [[-3.9], [-1.4], [1.1]].forEach(([z]) => {
      const L = new THREE.Group();
      L.add(m(box(0.55, 0.5, 1.9), leather, 0.62, 0.37, 0));
      L.add(m(box(0.18, 1.05, 1.9), leather, 0.86, 0.64, 0));
      L.add(m(cyl(0.38, 0.38, 0.05, 12), oak, -0.15, 0.82, 0));
      L.add(m(cyl(0.05, 0.06, 0.7, 8), black, -0.15, 0.47, 0));
      L.position.set(X1 - 1.0, 0.12, z);
      parterInt.add(L);
    });
  }

  // ════════ PARTER: STREFA RZUTEK (tylna prawa) ════════
  {
    const boardTex = dartboardTexture();
    const boardMat = new THREE.MeshStandardMaterial({ map: boardTex, roughness: 0.9 });
    [3.2, 4.6, 6.0, 7.4].forEach((x, i) => {
      // tarcza + obudowa na tylnej ścianie
      parterInt.add(m(box(0.78, 1.3, 0.05), i % 2 ? green : black, x, 1.95, Z0 + 0.05, { cast: false }));
      const b = m(cyl(0.27, 0.27, 0.06, 20), boardMat, x, 1.95, Z0 + 0.11, { rx: Math.PI / 2, cast: false });
      parterInt.add(b);
      // mata toru + linia rzutu
      parterInt.add(m(box(0.8, 0.02, 2.7), new THREE.MeshStandardMaterial({ color: 0x24433a, roughness: 1 }), x, 0.14, Z0 + 1.6, { cast: false }));
      parterInt.add(m(box(0.8, 0.03, 0.08), new THREE.MeshStandardMaterial({ color: 0xece2cc, roughness: 0.8 }), x, 0.15, Z0 + 2.85, { cast: false }));
      // tablet punktacji
      parterInt.add(m(box(0.3, 0.2, 0.03), black, x - 0.55, 1.45, Z0 + 0.08, { cast: false }));
    });
    // stolik koktajlowy między torami
    parterInt.add(m(cyl(0.32, 0.32, 0.05, 12), oak, 8.6, 1.05, -2.2));
    parterInt.add(m(cyl(0.04, 0.05, 1.0, 8), black, 8.6, 0.55, -2.2));
    // niski murek oddzielający od baru
    parterInt.add(m(box(0.12, 0.9, 3.4), wainscotSolid(), 1.9, 0.57, Z0 + 1.75));
  }
  function wainscotSolid() {
    return new THREE.MeshStandardMaterial({ color: 0x21473a, roughness: 0.85 });
  }

  // ════════ PARTER: schody przy lewej ścianie ════════
  {
    const steps = 15;
    const x = -8.95, w = 1.45;
    const z0 = 4.55, z1 = -0.3;
    const stepGeo = box(w, 0.295, Math.abs(z1 - z0) / steps + 0.04);
    const inst = new THREE.InstancedMesh(stepGeo, darkWood, steps);
    const M = new THREE.Matrix4();
    for (let i = 0; i < steps; i++) {
      const z = z0 + ((z1 - z0) * (i + 0.5)) / steps;
      M.makeTranslation(x, 0.15 + (H1 / steps) * (i + 0.5) - 0.15, z);
      inst.setMatrixAt(i, M);
    }
    inst.castShadow = true;
    parterInt.add(inst);
    // pochwyt wzdłuż biegu (cylinder Y obrócony wokół X w kierunek schodów)
    const railLen = Math.hypot(H1, z0 - z1) + 0.4;
    const rail = m(cyl(0.03, 0.03, railLen, 8), brass, x + w / 2 + 0.06, H1 / 2 + 0.62, (z0 + z1) / 2);
    rail.rotation.x = -Math.atan2(z0 - z1, H1);
    parterInt.add(rail);
    [0, 1, 2, 3].forEach((i) => {
      const z = z0 + ((z1 - z0) * i) / 3;
      const y = (H1 * i) / 3;
      parterInt.add(m(cyl(0.022, 0.022, 0.85, 6), steel, x + w / 2 + 0.06, y + 0.45, z));
    });
  }

  // ════════ HALA: SCENA & KARAOKE ════════
  {
    const cx = (WING.X0 + WING.X1) / 2;
    // podest sceny
    const stage = new THREE.Group();
    stage.add(m(box(3.4, 0.5, 7.2), darkWood, 0, 0.25, 0));
    stage.add(m(box(3.4, 0.08, 7.2), oak, 0, 0.54, 0));
    // kurtyna na ścianie zachodniej
    const curtain = new THREE.MeshStandardMaterial({ color: 0x7e2f24, roughness: 0.9 });
    stage.add(m(box(0.16, 3.6, 7.0), curtain, -1.5, 2.4, 0, { cast: false }));
    // mikrofon
    stage.add(m(cyl(0.02, 0.03, 1.5, 6), steel, 0.7, 1.33, 0));
    stage.add(m(new THREE.SphereGeometry(0.07, 8, 6), black, 0.7, 2.12, 0));
    // głośniki + monitory
    stage.add(m(box(0.55, 1.0, 0.5), black, 0.9, 1.08, 2.95));
    stage.add(m(box(0.55, 1.0, 0.5), black, 0.9, 1.08, -2.95));
    stage.add(m(box(0.5, 0.3, 0.4), black, 1.45, 0.73, 1.2, { ry: 0.5 }));
    stage.position.set(WING.X0 + 2.0, 0.12, 0);
    parterInt.add(stage);

    // truss z reflektorami
    const trussY = WING.H - 0.7;
    parterInt.add(m(cyl(0.04, 0.04, 7.6, 8), steel, WING.X0 + 3.6, trussY, 0, { rx: Math.PI / 2, cast: false }));
    const spotCols = [0xffb070, 0xff6a4d, 0xe3a93c, 0xffb070];
    [-2.7, -0.9, 0.9, 2.7].forEach((z, i) => {
      parterInt.add(m(cyl(0.09, 0.13, 0.26, 10), black, WING.X0 + 3.6, trussY - 0.18, z, { rx: 0.7, cast: false }));
      const lens = new THREE.MeshStandardMaterial({ color: spotCols[i], emissive: spotCols[i], emissiveIntensity: 0.15, roughness: 0.4 });
      parterInt.add(m(new THREE.SphereGeometry(0.055, 8, 6), lens, WING.X0 + 3.68, trussY - 0.27, z, { cast: false }));
      night.neons.push({ mat: lens, emissive: 2.2 });
    });

    // kula disco
    const disco = new THREE.MeshStandardMaterial({ color: 0xd9dee2, metalness: 0.95, roughness: 0.18 });
    parterInt.add(m(cyl(0.005, 0.005, 0.7, 4), steel, cx, WING.H - 0.35, 0, { cast: false }));
    parterInt.add(m(new THREE.SphereGeometry(0.38, 14, 12), disco, cx, WING.H - 0.9, 0));

    // parkiet + stoliki koktajlowe
    parterInt.add(m(box(4.6, 0.02, 4.6), new THREE.MeshStandardMaterial({ color: 0x4f3a26, roughness: 0.6 }), cx + 0.4, 0.14, 0, { cast: false }));
    [[-13.4, 2.6], [-12.2, 0.2], [-13.6, -2.4], [-15.6, 3.1], [-15.8, -3.0]].forEach(([x, z]) => {
      parterInt.add(m(cyl(0.32, 0.32, 0.05, 12), oak, x, 1.05, z));
      parterInt.add(m(cyl(0.04, 0.05, 1.0, 8), black, x, 0.55, z));
    });

    // ekran karaoke na tylnej ścianie
    const km = new THREE.MeshStandardMaterial({
      map: karaokeTexture(), emissiveMap: karaokeTexture(), emissive: 0xffffff, emissiveIntensity: 0.25, roughness: 0.7,
    });
    parterInt.add(m(new THREE.PlaneGeometry(2.0, 1.15), km, cx + 1.5, 3.1, -WING.D / 2 + T + 0.04, { cast: false, recv: false }));
    night.neons.push({ mat: km, emissive: 1.1 });
  }

  // ════════ PIĘTRO: STREFA BILARDA ════════
  const upY = H1 + 0.22; // poziom podłogi piętra
  {
    // stoły wg planu rezerwacji: 1-3 przy oknach (front), 4-5 z tyłu
    const tables = [[-6.3, 2.0], [-1.7, 2.0], [2.9, 2.0], [-4.0, -1.9], [0.6, -1.9]];
    tables.forEach(([x, z], i) => {
      const t = new THREE.Group();
      t.add(m(box(2.6, 0.16, 1.42), oak, 0, 0.78, 0));
      t.add(m(box(2.36, 0.05, 1.18), felt, 0, 0.875, 0, { cast: false }));
      t.add(m(box(2.6, 0.5, 0.16), darkWood, 0, 0.55, 0.63));
      t.add(m(box(2.6, 0.5, 0.16), darkWood, 0, 0.55, -0.63));
      t.add(m(box(0.16, 0.5, 1.42), darkWood, 1.22, 0.55, 0));
      t.add(m(box(0.16, 0.5, 1.42), darkWood, -1.22, 0.55, 0));
      [[-1.16, -0.58], [1.16, -0.58], [-1.16, 0.58], [1.16, 0.58], [0, -0.62], [0, 0.62]].forEach(([px, pz]) =>
        t.add(m(cyl(0.055, 0.055, 0.06, 10), black, px, 0.84, pz, { cast: false })));
      [[-1.05, -0.5], [1.05, -0.5], [-1.05, 0.5], [1.05, 0.5]].forEach(([px, pz]) =>
        t.add(m(box(0.14, 0.5, 0.14), darkWood, px, 0.25, pz)));
      // kilka bil
      const cols = [0xf3ecda, 0xc2452f, 0x2f5d8a, 0xe3a93c];
      for (let b = 0; b < 4; b++) {
        t.add(m(new THREE.SphereGeometry(0.045, 8, 6), new THREE.MeshStandardMaterial({ color: cols[(b + i) % 4], roughness: 0.3 }), -0.6 + b * 0.34 + (i % 3) * 0.1, 0.93, (b % 2 ? 0.18 : -0.12), { cast: false }));
      }
      // lampa nad stołem
      t.add(m(cyl(0.012, 0.012, 1.15, 6), black, 0, 2.32, 0, { cast: false }));
      t.add(m(box(1.7, 0.16, 0.5), green, 0, 1.78, 0));
      [-0.5, 0.1, 0.7].forEach((lx) => t.add(m(new THREE.SphereGeometry(0.05, 8, 6), bulb, lx, 1.68, 0, { cast: false })));
      t.position.set(x, upY, z);
      pietroInt.add(t);
    });

    // wieszak na kije + półka z bilami przy lewej ścianie
    pietroInt.add(m(box(1.9, 1.5, 0.08), darkWood, X0 + 0.36, upY + 1.7, -3.4, { ry: Math.PI / 2, cast: false }));
    for (let i = 0; i < 6; i++) {
      pietroInt.add(m(cyl(0.015, 0.02, 1.45, 6), oak, X0 + 0.3, upY + 1.66, -4.05 + i * 0.26, { cast: false }));
    }
    {
      const ballGeo = new THREE.SphereGeometry(0.05, 8, 6);
      const inst = new THREE.InstancedMesh(ballGeo, new THREE.MeshStandardMaterial({ roughness: 0.3 }), 10);
      const M = new THREE.Matrix4();
      const C = new THREE.Color();
      const cols = [0xc2452f, 0xe3a93c, 0x2f5d8a, 0x2e7d5b, 0x16181a, 0xf3ecda, 0xb04a8f, 0xc2452f, 0xe3a93c, 0x2f5d8a];
      for (let i = 0; i < 10; i++) {
        M.makeTranslation(X0 + 0.34, upY + 0.95, -4.0 + (i % 5) * 0.13 + Math.floor(i / 5) * 0.06);
        inst.setMatrixAt(i, M);
        inst.setColorAt(i, C.setHex(cols[i]));
      }
      pietroInt.add(inst);
      pietroInt.add(m(box(0.16, 0.05, 0.8), oak, X0 + 0.34, upY + 0.9, -3.75, { ry: 0, cast: false }));
    }

    // ławki między oknami
    [[-5.8], [2.2]].forEach(([x]) => {
      pietroInt.add(m(box(1.7, 0.42, 0.5), leather, x, upY + 0.33, Z1 - 0.45));
    });

    // balustrada wokół klatki schodowej
    const railMat = steel;
    const post = cyl(0.022, 0.022, 0.95, 6);
    const rails = new THREE.Group();
    // wzdłuż otworu (oś Z) i krótki powrót (oś X)
    rails.add(m(cyl(0.028, 0.028, 5.3, 8), brass, -8.15, upY + 0.98, 2.15, { rx: Math.PI / 2 }));
    rails.add(m(cyl(0.028, 0.028, 1.6, 8), brass, -8.93, upY + 0.98, -0.4, { rz: Math.PI / 2 }));
    [[-8.15, -0.4], [-8.15, 0.9], [-8.15, 2.2], [-8.15, 3.5], [-8.15, 4.75], [-8.93, -0.4], [-9.65, -0.4]].forEach(([px, pz]) =>
      rails.add(m(post, railMat, px, upY + 0.5, pz, { cast: false })));
    pietroInt.add(rails);
  }

  // ════════ PIĘTRO: SALKA EVENTOWA ════════
  {
    // szklana ściana działowa na x = 4.6
    const px = 4.6;
    const glassWall = new THREE.MeshStandardMaterial({
      color: 0xcfe0e0, roughness: 0.08, metalness: 0.05, transparent: true, opacity: 0.26, side: THREE.DoubleSide,
    });
    [[Z0 + 1.05, 2.1], [0.65, 1.7], [3.05, 2.5]].forEach(([zc, w]) => {
      pietroInt.add(m(new THREE.PlaneGeometry(w, H2 - H1 - 0.5), glassWall, px, upY + (H2 - H1 - 0.5) / 2, zc, { ry: Math.PI / 2, cast: false }));
    });
    [Z0, Z0 + 2.1, -0.2, 1.5, 4.3, Z1].forEach((z) => {
      pietroInt.add(m(box(0.07, H2 - H1 - 0.35, 0.07), black, px, upY + (H2 - H1 - 0.35) / 2, z, { cast: false }));
    });
    pietroInt.add(m(box(0.07, 0.07, Z1 - Z0), black, px, H2 - 0.32, 0, { cast: false }));

    // sofy L + stolik
    const sofa = new THREE.Group();
    sofa.add(m(box(2.6, 0.42, 0.85), leather, 0, 0.3, 0));
    sofa.add(m(box(2.6, 0.55, 0.2), leather, 0, 0.75, -0.36));
    sofa.add(m(box(0.85, 0.42, 1.7), leather, 1.75, 0.3, 0.55));
    sofa.add(m(box(0.2, 0.55, 1.7), leather, 2.08, 0.75, 0.55));
    sofa.position.set(6.4, upY, -3.4);
    pietroInt.add(sofa);
    pietroInt.add(m(cyl(0.5, 0.5, 0.34, 12), oak, 6.8, upY + 0.18, -2.0));

    // stół bankietowy + krzesła
    pietroInt.add(m(box(2.6, 0.08, 1.1), oak, 7.4, upY + 0.76, 2.2));
    [[6.4, 2.2], [8.4, 2.2]].forEach(([x, z]) =>
      pietroInt.add(m(box(0.12, 0.72, 0.9), darkWood, x, upY + 0.37, z)));
    // barek salki
    pietroInt.add(m(box(1.7, 0.95, 0.5), darkWood, X1 - 0.95, upY + 0.48, -4.4, { ry: 0 }));
    pietroInt.add(m(box(1.7, 0.06, 0.6), oak, X1 - 0.95, upY + 0.98, -4.4));

    // girlanda proporczyków
    {
      const flagGeo = new THREE.ConeGeometry(0.09, 0.22, 3);
      const cols = [0xff5a48, 0xe3a93c, 0x2e7d5b, 0xf2e9d6];
      const inst = new THREE.InstancedMesh(flagGeo, new THREE.MeshStandardMaterial({ roughness: 0.9 }), 14);
      const M = new THREE.Matrix4();
      const C = new THREE.Color();
      for (let i = 0; i < 14; i++) {
        const t = i / 13;
        const x = 5.0 + t * 4.6;
        const y = H2 - 0.55 - Math.sin(Math.PI * t) * 0.45;
        M.makeRotationX(Math.PI).setPosition(x, y, 0.1 - t * 0.3);
        inst.setMatrixAt(i, M);
        inst.setColorAt(i, C.setHex(cols[i % 4]));
      }
      inst.castShadow = false;
      pietroInt.add(inst);
    }
    // balony w rogu
    const balloons = [[9.0, -0.4, 0xff5a48], [9.3, -0.1, 0xe3a93c], [8.8, 0.1, 0x16181a]];
    balloons.forEach(([x, z, c], i) => {
      pietroInt.add(m(new THREE.SphereGeometry(0.22, 10, 8), new THREE.MeshStandardMaterial({ color: c, roughness: 0.45 }), x, upY + 1.7 + i * 0.22, z, { cast: false }));
      pietroInt.add(m(cyl(0.004, 0.004, 1.5, 4), black, x, upY + 0.85 + i * 0.11, z, { cast: false }));
    });
    // lampki wiszące
    [[6.2, 0.2], [7.6, -1.2], [8.6, 1.4]].forEach(([x, z]) => {
      pietroInt.add(m(cyl(0.01, 0.01, 0.9, 5), black, x, H2 - 0.65, z, { cast: false }));
      pietroInt.add(m(new THREE.SphereGeometry(0.07, 8, 6), bulb, x, H2 - 1.12, z, { cast: false }));
    });
  }

  // ── nocne światła wnętrz ───────────────────────────────────
  const innerLights = [
    [-3.5, 3.1, -2.0, 11, 11], // bar
    [-17.0, 3.4, 0, 10, 11], // hala
    [-2, upY + 2.6, 0.3, 13, 12], // bilard
    [7.2, upY + 2.4, 0, 8, 8], // salka
  ];
  for (const [x, y, z, intensity, dist] of innerLights) {
    const pl = new THREE.PointLight(0xffc88a, nightT > 0 ? intensity * nightT : 0, dist, 2);
    pl.position.set(x, y, z);
    parterInt.add(pl);
    night.pointLights.push({ light: pl, intensity });
  }

  scene.add(parterInt, pietroInt);
  return { parterInt, pietroInt };
}
