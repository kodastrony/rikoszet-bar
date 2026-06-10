// Fabryka tekstur rysowanych w canvasie — bez zewnętrznych plików.
import * as THREE from 'three';

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')];
}

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function toTexture(canvas, { repeat = [1, 1], srgb = true } = {}) {
  const tex = new THREE.CanvasTexture(canvas);
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat[0], repeat[1]);
  tex.anisotropy = 8;
  return tex;
}

function speckle(ctx, w, h, n, alpha, seed = 7) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const g = Math.floor(r() * 70);
    ctx.fillStyle = `rgba(${g},${g},${g},${alpha * r()})`;
    ctx.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2);
  }
}

// ── Cegła ────────────────────────────────────────────────────
export function brickTexture({ repeat = [1, 1], tone = 0 } = {}) {
  const [c, ctx] = makeCanvas(512, 512);
  const r = rng(42 + tone);
  ctx.fillStyle = '#cbbfae'; // fuga
  ctx.fillRect(0, 0, 512, 512);

  const bh = 26;
  const bw = 62;
  for (let row = 0; row * bh < 512 + bh; row++) {
    const off = row % 2 ? bw / 2 : 0;
    for (let col = -1; col * bw < 512 + bw; col++) {
      const x = col * bw + off;
      const y = row * bh;
      const base = 22 + r() * 14 + tone; // hue jitter
      const light = 38 + r() * 14;
      ctx.fillStyle = `hsl(${base}, ${42 + r() * 14}%, ${light}%)`;
      ctx.fillRect(x + 2, y + 2, bw - 4, bh - 4);
      // cień u dołu cegły
      ctx.fillStyle = 'rgba(60,25,15,0.18)';
      ctx.fillRect(x + 2, y + bh - 5, bw - 4, 3);
      // rozjaśnienie u góry
      ctx.fillStyle = 'rgba(255,235,210,0.10)';
      ctx.fillRect(x + 2, y + 2, bw - 4, 3);
    }
  }
  speckle(ctx, 512, 512, 900, 0.16, 5);
  return toTexture(c, { repeat });
}

// ── Deski tarasu ─────────────────────────────────────────────
export function plankTexture({ repeat = [1, 1] } = {}) {
  const [c, ctx] = makeCanvas(512, 512);
  const r = rng(11);
  const pw = 64;
  for (let i = 0; i < 512 / pw; i++) {
    const l = 52 + r() * 12;
    ctx.fillStyle = `hsl(${28 + r() * 8}, ${30 + r() * 10}%, ${l}%)`;
    ctx.fillRect(i * pw, 0, pw, 512);
    // słoje
    ctx.strokeStyle = `hsla(${24 + r() * 6}, 35%, ${l - 14}%, 0.5)`;
    ctx.lineWidth = 1.4;
    for (let s = 0; s < 5; s++) {
      ctx.beginPath();
      const x = i * pw + 8 + r() * (pw - 16);
      ctx.moveTo(x, 0);
      ctx.bezierCurveTo(x + r() * 8 - 4, 170, x + r() * 8 - 4, 340, x, 512);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(40,22,8,0.5)';
    ctx.fillRect(i * pw, 0, 2, 512);
  }
  // poprzeczne łączenia desek
  const r2 = rng(99);
  ctx.fillStyle = 'rgba(40,22,8,0.45)';
  for (let i = 0; i < 512 / pw; i++) {
    for (let k = 0; k < 2; k++) ctx.fillRect(i * pw, r2() * 512, pw, 2);
  }
  return toTexture(c, { repeat });
}

// ── Dach: rąbek stojący (blacha) ─────────────────────────────
export function metalRoofTexture({ repeat = [1, 1], light = false } = {}) {
  const [c, ctx] = makeCanvas(512, 512);
  ctx.fillStyle = light ? '#5a6168' : '#3c4247';
  ctx.fillRect(0, 0, 512, 512);
  for (let x = 0; x < 512; x += 42) {
    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    ctx.fillRect(x, 0, 3, 512);
    ctx.fillStyle = 'rgba(0,0,0,0.30)';
    ctx.fillRect(x + 3, 0, 3, 512);
  }
  speckle(ctx, 512, 512, 500, 0.1, 21);
  return toTexture(c, { repeat });
}

// ── Papa / membrana dachowa ──────────────────────────────────
export function membraneTexture({ repeat = [1, 1] } = {}) {
  const [c, ctx] = makeCanvas(256, 256);
  ctx.fillStyle = '#585b5e';
  ctx.fillRect(0, 0, 256, 256);
  speckle(ctx, 256, 256, 1500, 0.2, 31);
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  for (let y = 0; y < 256; y += 52) ctx.fillRect(0, y, 256, 2);
  return toTexture(c, { repeat });
}

// ── Asfalt i chodnik ─────────────────────────────────────────
export function asphaltTexture({ repeat = [8, 8] } = {}) {
  const [c, ctx] = makeCanvas(256, 256);
  ctx.fillStyle = '#d9d6cc';
  ctx.fillRect(0, 0, 256, 256);
  speckle(ctx, 256, 256, 1600, 0.12, 51);
  return toTexture(c, { repeat });
}

export function paverTexture({ repeat = [10, 10] } = {}) {
  const [c, ctx] = makeCanvas(256, 256);
  ctx.fillStyle = '#cfccc2';
  ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = '#e6e3da';
  const s = 64;
  for (let y = 0; y < 256; y += s)
    for (let x = 0; x < 256; x += s) ctx.fillRect(x + 2, y + 2, s - 4, s - 4);
  speckle(ctx, 256, 256, 500, 0.08, 61);
  return toTexture(c, { repeat });
}

// ── Szyld RIKOSZET (przezroczyste tło, świeci nocą) ──────────
export function signTexture(text = 'RIKOSZET') {
  const [c, ctx] = makeCanvas(1024, 240);
  ctx.clearRect(0, 0, 1024, 240);
  ctx.font = '800 150px "Bricolage Grotesque Variable", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.letterSpacing = '14px';
  // cień montażowy
  ctx.fillStyle = 'rgba(30,12,8,0.55)';
  ctx.fillText(text, 516, 130);
  // litery
  ctx.fillStyle = '#ffe9c9';
  ctx.fillText(text, 512, 120);
  const tex = toTexture(c, { repeat: [1, 1] });
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

// ── Mural na ścianie hali ────────────────────────────────────
export function muralTexture() {
  const [c, ctx] = makeCanvas(1024, 512);
  // cegła w tle (przerysowana z funkcji wyżej, ciemniejsza)
  const r = rng(77);
  ctx.fillStyle = '#b9ac9b';
  ctx.fillRect(0, 0, 1024, 512);
  const bh = 26, bw = 62;
  for (let row = 0; row * bh < 512 + bh; row++) {
    const off = row % 2 ? bw / 2 : 0;
    for (let col = -1; col * bw < 1024 + bw; col++) {
      const x = col * bw + off, y = row * bh;
      ctx.fillStyle = `hsl(${20 + r() * 12}, ${40 + r() * 12}%, ${34 + r() * 12}%)`;
      ctx.fillRect(x + 2, y + 2, bw - 4, bh - 4);
    }
  }
  // malowany napis
  ctx.save();
  ctx.translate(512, 268);
  ctx.font = '800 148px "Bricolage Grotesque Variable", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(245,238,226,0.88)';
  ctx.fillText('RIKOSZET', 0, -52);
  ctx.font = '600 44px "Bricolage Grotesque Variable", sans-serif';
  ctx.fillStyle = 'rgba(224,164,60,0.92)';
  ctx.letterSpacing = '10px';
  ctx.fillText('BAR · BILARD · KARAOKE', 0, 58);
  ctx.strokeStyle = 'rgba(245,238,226,0.8)';
  ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(-300, 8); ctx.lineTo(300, 8); ctx.stroke();
  ctx.restore();
  // przetarcia farby
  const r2 = rng(123);
  ctx.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 1400; i++) {
    ctx.fillStyle = `rgba(0,0,0,${0.25 * r2()})`;
    ctx.fillRect(r2() * 1024, r2() * 512, 2 + r2() * 3, 1 + r2() * 2);
  }
  ctx.globalCompositeOperation = 'source-over';
  speckle(ctx, 1024, 512, 1200, 0.14, 9);
  const tex = toTexture(c);
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

// ── Wnętrza widoczne przez okna ──────────────────────────────
// Karta wnętrza sali bilardowej (piętro).
export function interiorBilliardsTexture() {
  const [c, ctx] = makeCanvas(512, 256);
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, '#241c14');
  g.addColorStop(1, '#0f0b08');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 256);

  // tylna ściana z cegły w półmroku
  ctx.fillStyle = 'rgba(120,62,40,0.35)';
  ctx.fillRect(0, 30, 512, 110);

  for (let i = 0; i < 3; i++) {
    const x = 60 + i * 160;
    // stożek światła
    const lg = ctx.createRadialGradient(x + 40, 60, 6, x + 40, 130, 110);
    lg.addColorStop(0, 'rgba(255,205,120,0.50)');
    lg.addColorStop(1, 'rgba(255,205,120,0)');
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.moveTo(x + 28, 58);
    ctx.lineTo(x - 18, 190);
    ctx.lineTo(x + 98, 190);
    ctx.lineTo(x + 52, 58);
    ctx.fill();
    // lampa
    ctx.fillStyle = '#143526';
    ctx.fillRect(x + 18, 44, 44, 14);
    ctx.fillStyle = '#ffd98e';
    ctx.fillRect(x + 24, 56, 32, 5);
    // stół
    ctx.fillStyle = '#1d5c40';
    ctx.fillRect(x - 16, 168, 112, 34);
    ctx.fillStyle = '#3a2417';
    ctx.fillRect(x - 22, 198, 124, 12);
    ctx.fillRect(x - 16, 210, 10, 30);
    ctx.fillRect(x + 86, 210, 10, 30);
    // bile
    ctx.fillStyle = '#f3e8d2';
    ctx.beginPath(); ctx.arc(x + 18, 176, 4, 0, 7); ctx.fill();
    ctx.fillStyle = '#d2552f';
    ctx.beginPath(); ctx.arc(x + 44, 182, 4, 0, 7); ctx.fill();
  }
  const tex = toTexture(c);
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

// Karta wnętrza baru (parter): półki z butelkami i kontuar.
export function interiorBarTexture() {
  const [c, ctx] = makeCanvas(512, 256);
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, '#2a1d12');
  g.addColorStop(1, '#120b06');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 256);

  // podświetlony backbar
  const bg = ctx.createRadialGradient(256, 110, 30, 256, 110, 260);
  bg.addColorStop(0, 'rgba(255,190,110,0.45)');
  bg.addColorStop(1, 'rgba(255,190,110,0)');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 256);

  const r = rng(404);
  for (let shelf = 0; shelf < 3; shelf++) {
    const y = 60 + shelf * 52;
    ctx.fillStyle = 'rgba(255,215,150,0.25)';
    ctx.fillRect(40, y + 26, 432, 5);
    for (let b = 0; b < 16; b++) {
      const x = 52 + b * 26 + r() * 6;
      const h = 18 + r() * 14;
      const hues = ['#c98f2c', '#7c4a2d', '#3f6f4f', '#a33d2a', '#cbb27e'];
      ctx.fillStyle = hues[Math.floor(r() * hues.length)];
      ctx.fillRect(x, y + 26 - h, 9, h);
      ctx.fillRect(x + 3, y + 26 - h - 7, 3, 7);
    }
  }
  // kontuar
  ctx.fillStyle = '#4a2f1b';
  ctx.fillRect(0, 212, 512, 44);
  ctx.fillStyle = 'rgba(255,205,130,0.25)';
  ctx.fillRect(0, 212, 512, 5);
  const tex = toTexture(c);
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

// Karta wnętrza z tarczami do darta (tył parteru).
export function interiorDartsTexture() {
  const [c, ctx] = makeCanvas(512, 256);
  ctx.fillStyle = '#171108';
  ctx.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 3; i++) {
    const x = 100 + i * 156;
    const lg = ctx.createRadialGradient(x, 110, 8, x, 110, 90);
    lg.addColorStop(0, 'rgba(255,205,130,0.5)');
    lg.addColorStop(1, 'rgba(255,205,130,0)');
    ctx.fillStyle = lg;
    ctx.fillRect(x - 90, 20, 180, 200);
    // tarcza
    ctx.fillStyle = '#0d0d0d';
    ctx.beginPath(); ctx.arc(x, 112, 34, 0, 7); ctx.fill();
    for (let s = 0; s < 20; s++) {
      ctx.fillStyle = s % 2 ? '#e8e0cc' : '#1f1f1f';
      ctx.beginPath();
      ctx.moveTo(x, 112);
      ctx.arc(x, 112, 30, (s * Math.PI) / 10, ((s + 1) * Math.PI) / 10);
      ctx.fill();
    }
    ctx.strokeStyle = '#c2452f';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(x, 112, 18, 0, 7); ctx.stroke();
    ctx.fillStyle = '#c2452f';
    ctx.beginPath(); ctx.arc(x, 112, 4, 0, 7); ctx.fill();
  }
  const tex = toTexture(c);
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

// Tablica kredowa przy wejściu.
export function chalkboardTexture() {
  const [c, ctx] = makeCanvas(256, 384);
  ctx.fillStyle = '#23291f';
  ctx.fillRect(0, 0, 256, 384);
  ctx.strokeStyle = 'rgba(240,235,220,0.85)';
  ctx.fillStyle = 'rgba(240,235,220,0.9)';
  ctx.textAlign = 'center';
  ctx.font = '700 40px "Bricolage Grotesque Variable", sans-serif';
  ctx.fillText('DZIŚ', 128, 70);
  ctx.font = '600 26px "Bricolage Grotesque Variable", sans-serif';
  ctx.fillText('KARAOKE', 128, 150);
  ctx.fillText('21:00', 128, 186);
  ctx.font = '500 20px "Bricolage Grotesque Variable", sans-serif';
  ctx.fillText('shoty dla', 128, 268);
  ctx.fillText('śpiewających', 128, 294);
  ctx.beginPath(); ctx.moveTo(56, 102); ctx.lineTo(200, 102); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(56, 224); ctx.lineTo(200, 224); ctx.stroke();
  const tex = toTexture(c);
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}
