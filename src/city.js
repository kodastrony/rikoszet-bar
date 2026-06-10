// Miasto-duch: gęste, niemal białe bryły wokół bohatera sceny.
// Wszystkie domy są mergowane do kilku geometrii — tanio dla GPU.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { asphaltTexture, paverTexture } from './textures.js';

function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0), s / 4294967296);
}

function gableGeometry(w, h, d) {
  const shape = new THREE.Shape();
  shape.moveTo(-w / 2, 0);
  shape.lineTo(w / 2, 0);
  shape.lineTo(0, h);
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: false });
  geo.translate(0, 0, -d / 2);
  return geo;
}

export function buildCity(scene) {
  const r = rng(20260610);
  const M = new THREE.Matrix4();
  const wallGeos = [];
  const roofGeos = [];

  // merge wymaga jednolitych geometrii (bez indeksów)
  const flat = (geo) => (geo.index ? geo.toNonIndexed() : geo);
  const pushWall = (geo, x, y, z, ry = 0) => {
    M.makeRotationY(ry).setPosition(x, y, z);
    geo.applyMatrix4(M);
    wallGeos.push(flat(geo));
  };
  const pushRoof = (geo, x, y, z, ry = 0, sx = 1, sz = 1) => {
    const S = new THREE.Matrix4().makeScale(sx, 1, sz);
    M.makeRotationY(ry).setPosition(x, y, z);
    geo.applyMatrix4(new THREE.Matrix4().multiplyMatrices(M, S));
    roofGeos.push(flat(geo));
  };

  function house(x, z, ry) {
    const w = 6 + r() * 7;
    const d = 6 + r() * 6;
    const floors = r() < 0.18 ? 3 : r() < 0.62 ? 2 : 1;
    const h = floors * (2.9 + r() * 0.7);
    pushWall(new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0), x, 0, z, ry);
    // czasem skrzydło L
    if (r() < 0.3) {
      const w2 = w * (0.45 + r() * 0.25);
      const d2 = d * (0.6 + r() * 0.4);
      const h2 = h * (0.65 + r() * 0.3);
      pushWall(new THREE.BoxGeometry(w2, h2, d2).translate(w / 2 + w2 / 2 - 0.02, h2 / 2, (r() - 0.5) * d * 0.4), x, 0, z, ry);
    }
    const kind = r();
    if (kind < 0.46) {
      pushRoof(gableGeometry(w + 0.5, 1.5 + r() * 1.7, d + 0.5).translate(0, h, 0), x, 0, z, ry);
    } else if (kind < 0.82) {
      const rh = 1.6 + r() * 1.4;
      const cone = new THREE.ConeGeometry(Math.max(w, d) * 0.71, rh, 4).translate(0, h + rh / 2 - 0.04, 0);
      cone.rotateY(Math.PI / 4 + ry);
      const S = new THREE.Matrix4().makeScale(w / Math.max(w, d), 1, d / Math.max(w, d));
      cone.applyMatrix4(S);
      cone.applyMatrix4(new THREE.Matrix4().makeTranslation(x, 0, z));
      roofGeos.push(flat(cone));
    } else {
      pushRoof(new THREE.BoxGeometry(w + 0.4, 0.32, d + 0.4).translate(0, h + 0.16, 0), x, 0, z, ry);
    }
  }

  // ── rozmieszczenie ─────────────────────────────────────────
  const keepClear = (x, z) =>
    (x > -36 && x < 36 && z > -17 && z < 23) || // działka baru
    (x > -48 && x < 62 && z > 23 && z < 100) || // skwer naprzeciwko — korytarz widokowy
    (x > 22 && x < 40 && z > -210 && z < 210) || // boczna ulica
    (z > 7 && z < 23 && x > -210 && x < 210) || // przednia ulica
    (z > -62 && z < -46 && x > -210 && x < 210) || // równoległa ulica za barem
    (x > -56 && x < -42 && z > -210 && z < 210); // równoległa ulica z lewej

  // pierzeje wzdłuż ulic (gęsto)
  for (let x = -200; x <= 200; x += 11.5) {
    if (!keepClear(x + r() * 3, 27)) house(x + r() * 3, 27 + r() * 4, (r() - 0.5) * 0.06);
    if (!keepClear(x + r() * 3, -68)) house(x + r() * 3, -68 - r() * 4, (r() - 0.5) * 0.06);
    if (!keepClear(x + r() * 3, -42)) house(x + r() * 3, -42 + r() * 3, Math.PI + (r() - 0.5) * 0.06);
  }
  for (let z = -200; z <= 200; z += 11.5) {
    if (!keepClear(43, z + r() * 3)) house(43 + r() * 4, z + r() * 3, Math.PI / 2);
    if (!keepClear(-60, z + r() * 3)) house(-60 - r() * 4, z + r() * 3, -Math.PI / 2);
  }
  // kwartały dalej — luźny rozsyp
  let placed = 0;
  for (let i = 0; i < 600 && placed < 150; i++) {
    const a = r() * Math.PI * 2;
    const d = 46 + Math.pow(r(), 0.8) * 165;
    const x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (keepClear(x, z)) continue;
    house(x, z, Math.floor(r() * 4) * (Math.PI / 2) + (r() - 0.5) * 0.1);
    placed++;
  }

  // landmarki na horyzoncie
  {
    // wieża ciśnień
    const t = new THREE.CylinderGeometry(2.6, 3.3, 16, 12).translate(0, 8, 0);
    pushWall(t, -98, 0, -88);
    roofGeos.push(flat(new THREE.ConeGeometry(3.6, 3.2, 12).translate(-98, 17.6, -88)));
    // kościółek z wieżą
    pushWall(new THREE.BoxGeometry(10, 8, 18).translate(0, 4, 0), 120, 0, -60, 0.4);
    pushRoof(gableGeometry(10.6, 3.4, 18.6).translate(0, 8, 0), 120, 0, -60, 0.4);
    pushWall(new THREE.BoxGeometry(4.4, 15, 4.4).translate(0, 7.5, 0), 112.4, 0, -66.5, 0.4);
    roofGeos.push(flat(new THREE.ConeGeometry(3.4, 4.6, 4).rotateY(Math.PI / 4 + 0.4).translate(112.4, 17.3, -66.5)));
    // komin fabryczny
    pushWall(new THREE.CylinderGeometry(1.1, 1.7, 24, 10).translate(0, 12, 0), -120, 0, 70);
  }

  const WALL = new THREE.MeshStandardMaterial({ color: 0xfdfdf8, roughness: 0.94 });
  const ROOF = new THREE.MeshStandardMaterial({ color: 0xedeae0, roughness: 0.9 });
  const wallsMesh = new THREE.Mesh(mergeGeometries(wallGeos, false), WALL);
  const roofsMesh = new THREE.Mesh(mergeGeometries(roofGeos, false), ROOF);
  wallsMesh.castShadow = wallsMesh.receiveShadow = true;
  roofsMesh.castShadow = true;
  scene.add(wallsMesh, roofsMesh);

  // ── teren ──────────────────────────────────────────────────
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(340, 64),
    new THREE.MeshStandardMaterial({ color: 0xe9e4d6, roughness: 1 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // ── ulice ──────────────────────────────────────────────────
  const city = new THREE.Group();
  const asphalt = new THREE.MeshStandardMaterial({ map: asphaltTexture({ repeat: [26, 2] }), roughness: 1 });
  const asphalt2 = new THREE.MeshStandardMaterial({ map: asphaltTexture({ repeat: [2, 26] }), roughness: 1 });
  const paver = new THREE.MeshStandardMaterial({ map: paverTexture({ repeat: [60, 1.6] }), roughness: 1 });
  const paver2 = new THREE.MeshStandardMaterial({ map: paverTexture({ repeat: [1.6, 60] }), roughness: 1 });

  const mkStrip = (w, d, mat, x, z, y = 0.02) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.04, d), mat);
    m.position.set(x, y, z);
    m.receiveShadow = true;
    city.add(m);
  };
  mkStrip(420, 7.4, asphalt, 0, 14.7);
  mkStrip(7.4, 420, asphalt2, 30.7, 0);
  mkStrip(420, 6.5, asphalt, 0, -54, 0.015);
  mkStrip(6.5, 420, asphalt2, -49, 0, 0.015);
  mkStrip(420, 2.6, paver, 0, 9.7, 0.1);
  mkStrip(420, 2.6, paver, 0, 19.7, 0.1);
  mkStrip(2.6, 420, paver2, 25.7, 0, 0.1);
  mkStrip(2.6, 420, paver2, 35.7, 0, 0.1);

  const zebra = new THREE.MeshStandardMaterial({ color: 0xf7f5ee, roughness: 0.9 });
  for (let i = 0; i < 5; i++) {
    const s1 = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.045, 6.6), zebra);
    s1.position.set(20.5 + i * 1.3, 0.03, 14.7);
    city.add(s1);
    const s2 = new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.045, 0.7), zebra);
    s2.position.set(30.7, 0.03, 5.2 + i * 1.3);
    city.add(s2);
  }

  // ── latarnie ───────────────────────────────────────────────
  const lampHeads = [];
  const post = new THREE.MeshStandardMaterial({ color: 0x3a3f3c, roughness: 0.6, metalness: 0.4 });
  [[-14, 10.35], [12, 10.35], [27, 8.4]].forEach(([x, z]) => {
    const g = new THREE.Group();
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 4.6, 8), post);
    p.position.y = 2.3;
    p.castShadow = true;
    g.add(p);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.07, 0.07), post);
    arm.position.set(0.4, 4.55, 0);
    g.add(arm);
    const headMat = new THREE.MeshStandardMaterial({
      color: 0xf5efdf, roughness: 0.4, emissive: 0xffd9a0, emissiveIntensity: 0,
    });
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 10), headMat);
    head.position.set(0.82, 4.5, 0);
    g.add(head);
    g.position.set(x, 0.1, z);
    g.rotation.y = z > 10 ? Math.PI : 0;
    city.add(g);
    lampHeads.push(headMat);
  });

  // ── drzewa (instancje) ─────────────────────────────────────
  {
    const blobGeo = new THREE.IcosahedronGeometry(1, 1);
    const trunkGeo = new THREE.CylinderGeometry(0.12, 0.18, 1.4, 6);
    const paleLeaf = new THREE.MeshStandardMaterial({ color: 0xe2e4d6, roughness: 1 });
    const paleTrunk = new THREE.MeshStandardMaterial({ color: 0xd5cfc1, roughness: 1 });
    const N = 84;
    const blobs = new THREE.InstancedMesh(blobGeo, paleLeaf, N * 2);
    const trunks = new THREE.InstancedMesh(trunkGeo, paleTrunk, N);
    let bi = 0, ti = 0;
    const T = new THREE.Matrix4();
    // skwer naprzeciwko baru — luźny park zamiast pierzei
    const parkSpots = [];
    for (let i = 0; i < 26; i++) parkSpots.push([-40 + r() * 96, 30 + r() * 56]);
    for (const [x, z] of parkSpots) {
      const s = 0.9 + r() * 1.0;
      T.makeScale(s, s, s).setPosition(x, 0.7 * s, z);
      trunks.setMatrixAt(ti++, T);
      for (let k = 0; k < 2; k++) {
        const bs = s * (0.75 + r() * 0.5);
        T.makeScale(bs, bs * (0.85 + r() * 0.3), bs).setPosition(x + (r() - 0.5) * s, (1.8 + r() * 0.8) * s, z + (r() - 0.5) * s);
        blobs.setMatrixAt(bi++, T);
      }
    }
    for (let i = 0; i < N * 4 && ti < N; i++) {
      const a = r() * Math.PI * 2;
      const d = 40 + r() * 150;
      const x = Math.cos(a) * d, z = Math.sin(a) * d;
      if (keepClear(x, z)) continue;
      const s = 0.8 + r() * 1.0;
      T.makeScale(s, s, s).setPosition(x, 0.7 * s, z);
      trunks.setMatrixAt(ti++, T);
      for (let k = 0; k < 2; k++) {
        const bs = s * (0.75 + r() * 0.5);
        T.makeScale(bs, bs * (0.85 + r() * 0.3), bs).setPosition(x + (r() - 0.5) * s, (1.8 + r() * 0.8) * s, z + (r() - 0.5) * s);
        blobs.setMatrixAt(bi++, T);
      }
    }
    trunks.count = ti;
    blobs.count = bi;
    blobs.castShadow = true;
    city.add(blobs, trunks);
  }

  // żywe drzewa przy barze
  {
    const leaf = new THREE.MeshStandardMaterial({ color: 0x5d7d4f, roughness: 0.95 });
    const trunk = new THREE.MeshStandardMaterial({ color: 0x6e5640, roughness: 1 });
    [[-26.5, 8.2, 1.25], [16.5, 10.1, 1.0], [-6.5, 10.1, 0.9]].forEach(([x, z, s]) => {
      const g = new THREE.Group();
      const t = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 1.4, 6), trunk);
      t.position.y = 0.7;
      g.add(t);
      for (let i = 0; i < 3; i++) {
        const blob = new THREE.Mesh(new THREE.IcosahedronGeometry(0.8 + r() * 0.6, 1), leaf);
        blob.position.set((r() - 0.5) * 1.1, 1.6 + r() * 1.1, (r() - 0.5) * 1.1);
        blob.castShadow = true;
        g.add(blob);
      }
      g.scale.setScalar(s);
      g.position.set(x, 0.1, z);
      city.add(g);
    });
  }

  scene.add(city);
  return { lampHeads };
}
