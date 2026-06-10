// Kreator rezerwacji: zasób → termin → miejsce → dane → potwierdzenie.
// Dostępność symulowana deterministycznie + rezerwacje zapisane w localStorage.
import { RESOURCES, HOURS, fmtTime, STORAGE_KEY } from './data.js';
import { icon } from './svgart.js';

let root, toastFn;
let overlay = null;

const pad = (n) => String(n).padStart(2, '0');
const todayStr = (off = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + off);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const weekdayOf = (dateStr) => new Date(`${dateStr}T12:00:00`).getDay();
const dateLabel = (dateStr) =>
  new Intl.DateTimeFormat('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(`${dateStr}T12:00:00`));

function hash(s) {
  let h = 2166136261;
  for (const ch of s) {
    h ^= ch.codePointAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// ── dostępność ───────────────────────────────────────────────
const storedBookings = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? []; }
  catch { return []; }
};
const saveBooking = (b) => {
  const all = storedBookings();
  all.push(b);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
};

function simTaken(dateStr, resId, unit, hourMin) {
  if (resId === 'salka') return hash(`${dateStr}|salka|${Math.floor(hourMin / 240)}`) % 100 < 18;
  return hash(`${dateStr}|${resId}|${unit}|${hourMin}`) % 100 < 26;
}

function unitFree(dateStr, resId, unit, startMin, durH) {
  for (let h = 0; h < durH; h++) {
    if (simTaken(dateStr, resId, unit, startMin + h * 60)) return false;
  }
  for (const b of storedBookings()) {
    if (b.date !== dateStr || b.resource !== resId || b.unit !== unit) continue;
    const aEnd = startMin + durH * 60;
    const bEnd = b.start + b.dur * 60;
    if (startMin < bEnd && b.start < aEnd) return false;
  }
  return true;
}

function freeUnits(dateStr, resId, startMin, durH) {
  const res = RESOURCES[resId];
  const out = [];
  for (let u = 1; u <= res.units; u++) if (unitFree(dateStr, resId, u, startMin, durH)) out.push(u);
  return out;
}

function slotsFor(dateStr, resId, durH) {
  const win = HOURS[weekdayOf(dateStr)];
  const slots = [];
  const now = new Date();
  const isToday = dateStr === todayStr();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  for (let s = win.open; s + durH * 60 <= win.close; s += 60) {
    if (isToday && s < nowMin + 30) continue;
    slots.push({ start: s, free: freeUnits(dateStr, resId, s, durH).length });
  }
  return slots;
}

// ── stan kreatora ───────────────────────────────────────────
let st = null;
const fresh = (resource = 'bilard') => ({
  step: 0,
  resource,
  date: todayStr(),
  dur: RESOURCES[resource].durations[0],
  start: null,
  unit: null,
  guests: RESOURCES.salka.guests.default,
  pkg: 'none',
  name: '', phone: '', email: '', notes: '',
  consent: false,
  saved: false,
  code: '',
});

const stepsFor = (resId) =>
  resId === 'salka'
    ? ['Rodzaj', 'Termin', 'Impreza', 'Dane', 'Gotowe']
    : ['Rodzaj', 'Termin', 'Miejsce', 'Dane', 'Gotowe'];

// ── cena ─────────────────────────────────────────────────────
function priceInfo() {
  const r = RESOURCES[st.resource];
  if (st.resource === 'salka') {
    const base = r.basePrice[st.dur] ?? 0;
    const p = r.packages.find((x) => x.id === st.pkg);
    const extra = p ? (p.perPerson ? p.price * st.guests : p.price) : 0;
    return { total: base + extra, label: `${base + extra} zł`, note: p && p.id !== 'none' ? `w tym ${p.name.toLowerCase()}` : 'sala + obsługa' };
  }
  if (st.resource === 'loza') return { total: 0, label: '0 zł', note: `min. barowe ${r.minSpend} zł` };
  let rate = r.pricePerHour;
  if (st.resource === 'bilard' && st.start != null) {
    const wd = weekdayOf(st.date);
    if (wd >= 1 && wd <= 4 && st.start < 18 * 60) rate = r.offPeak.price;
  }
  return { total: rate * st.dur, label: `${rate * st.dur} zł`, note: `${rate} zł/h × ${st.dur} h` };
}

// ── mapki sal ───────────────────────────────────────────────
function unitClass(u, frees) {
  if (st.unit === u) return 'unit sel';
  return frees.includes(u) ? 'unit free' : 'unit busy';
}

function mapBilard(frees) {
  const tables = [[120, 96], [245, 96], [370, 96], [182, 222], [307, 222]];
  return `
  <svg viewBox="0 0 460 310" class="floor-map">
    <rect x="8" y="8" width="444" height="294" rx="14" fill="var(--map-floor)" stroke="var(--map-wall)" stroke-width="3"/>
    <g stroke="#7fb89a" stroke-width="5" stroke-linecap="round">
      <line x1="60" y1="8" x2="150" y2="8"/><line x1="190" y1="8" x2="280" y2="8"/><line x1="320" y1="8" x2="410" y2="8"/>
    </g>
    <text x="235" y="28" class="map-note" text-anchor="middle">okna · front budynku</text>
    <path d="M40 302 a34 34 0 0 1 34 -34" fill="none" stroke="var(--map-wall)" stroke-width="2.5" stroke-dasharray="4 5"/>
    <line x1="40" y1="302" x2="74" y2="302" stroke="var(--map-floor)" stroke-width="5"/>
    <text x="96" y="292" class="map-note">wejście</text>
    <rect x="408" y="210" width="36" height="84" rx="8" fill="#caa05c" opacity=".8"/>
    <text x="426" y="256" class="map-note" text-anchor="middle" transform="rotate(-90 426 256)">barek</text>
    ${tables.map(([x, y], i) => `
      <g class="${unitClass(i + 1, frees)}" data-unit="${i + 1}" transform="translate(${x},${y})">
        <rect x="-52" y="-30" width="104" height="60" rx="8" class="u-frame"/>
        <rect x="-44" y="-22" width="88" height="44" rx="4" class="u-fill"/>
        ${[[-44, -22], [0, -24], [44, -22], [-44, 22], [0, 24], [44, 22]].map(([px, py]) => `<circle cx="${px}" cy="${py}" r="4.5" fill="#10231b"/>`).join('')}
        <text y="6" text-anchor="middle" class="u-num">${i + 1}</text>
      </g>`).join('')}
  </svg>`;
}

function mapRzutki(frees) {
  return `
  <svg viewBox="0 0 460 310" class="floor-map">
    <rect x="8" y="8" width="444" height="294" rx="14" fill="var(--map-floor)" stroke="var(--map-wall)" stroke-width="3"/>
    <text x="230" y="30" class="map-note" text-anchor="middle">ściana z tarczami</text>
    ${[0, 1, 2, 3].map((i) => {
      const x = 64 + i * 110;
      return `
      <g class="${unitClass(i + 1, frees)}" data-unit="${i + 1}" transform="translate(${x},0)">
        <rect x="-42" y="40" width="84" height="240" rx="10" class="u-fill" opacity="0.94"/>
        <circle cy="86" r="27" class="u-board"/>
        ${Array.from({ length: 10 }, (_, k) => `<line x1="${Math.cos(k * 0.628) * 27}" y1="${86 + Math.sin(k * 0.628) * 27}" x2="${Math.cos(k * 0.628) * 8}" y2="${86 + Math.sin(k * 0.628) * 8}" stroke="rgba(255,255,255,.5)" stroke-width="1.4"/>`).join('')}
        <circle cy="86" r="9" fill="#ff5a48"/><circle cy="86" r="3.4" fill="#10231b"/>
        <line x1="-34" y1="244" x2="34" y2="244" stroke="#f2e9d6" stroke-width="4" stroke-linecap="round"/>
        <text y="270" text-anchor="middle" class="u-num">${i + 1}</text>
      </g>`;
    }).join('')}
  </svg>`;
}

function mapLoza(frees) {
  const pos = [[96, 92, 'Pod oknem'], [330, 92, 'Przy scenie'], [96, 240, 'Kominkowa'], [330, 240, 'Narożna']];
  return `
  <svg viewBox="0 0 460 330" class="floor-map">
    <rect x="8" y="8" width="444" height="314" rx="14" fill="var(--map-floor)" stroke="var(--map-wall)" stroke-width="3"/>
    <rect x="180" y="140" width="100" height="52" rx="10" fill="#caa05c" opacity=".85"/>
    <text x="230" y="170" class="map-note" text-anchor="middle">bar</text>
    ${pos.map(([x, y, name], i) => `
      <g class="${unitClass(i + 1, frees)}" data-unit="${i + 1}" transform="translate(${x},${y})">
        <path d="M-58 -34 h116 a10 10 0 0 1 10 10 v48 h-18 v-40 h-100 v40 h-18 v-48 a10 10 0 0 1 10 -10z" class="u-fill"/>
        <ellipse cy="14" rx="34" ry="20" class="u-table"/>
        <text y="20" text-anchor="middle" class="u-num">${i + 1}</text>
        <text y="48" text-anchor="middle" class="u-name">${name}</text>
      </g>`).join('')}
  </svg>`;
}

const MAPS = { bilard: mapBilard, rzutki: mapRzutki, loza: mapLoza };

// ── render ───────────────────────────────────────────────────
const $ = (sel, r = overlay) => r.querySelector(sel);

function stepResource() {
  return `
    <p class="bk-lead">Co chcesz zarezerwować?</p>
    <div class="res-grid">
      ${Object.values(RESOURCES).map((r) => `
        <button class="res-card ${st.resource === r.id ? 'sel' : ''}" data-res="${r.id}">
          <span class="res-ico">${icon(r.icon)}</span>
          <span class="res-name">${r.label}</span>
          <span class="res-blurb">${r.blurb}</span>
        </button>`).join('')}
    </div>`;
}

const FREE_WORDS = {
  bilard: ['wolny', 'wolne', 'wolnych'],
  rzutki: ['wolny', 'wolne', 'wolnych'],
  loza: ['wolna', 'wolne', 'wolnych'],
  salka: ['wolna', 'wolne', 'wolnych'],
};
function freeWord(n, resId) {
  const w = FREE_WORDS[resId] ?? FREE_WORDS.bilard;
  if (n === 1) return w[0];
  if (n >= 2 && n <= 4) return w[1];
  return w[2];
}

function stepWhen() {
  const r = RESOURCES[st.resource];
  const slots = slotsFor(st.date, st.resource, st.dur);
  const quick = [
    ['Dziś', todayStr()], ['Jutro', todayStr(1)],
    ...[5, 6].map((wd) => {
      const d = new Date();
      let off = (wd - d.getDay() + 7) % 7;
      if (off < 2) off += 7;
      return [wd === 5 ? 'Piątek' : 'Sobota', todayStr(off)];
    }),
  ];
  return `
    <p class="bk-lead">Kiedy gracie? <span class="bk-dim">${dateLabel(st.date)}</span></p>
    <div class="when-grid">
      <div class="when-row">
        <label class="fld-label">Data</label>
        <div class="date-line">
          <input type="date" id="bk-date" value="${st.date}" min="${todayStr()}" max="${todayStr(60)}"/>
          <div class="quick-dates">
            ${quick.map(([l, v]) => `<button class="chip-btn ${st.date === v ? 'sel' : ''}" data-date="${v}">${l}</button>`).join('')}
          </div>
        </div>
      </div>
      <div class="when-row">
        <label class="fld-label">Na ile godzin</label>
        <div class="seg">
          ${r.durations.map((d) => `<button class="seg-btn ${st.dur === d ? 'sel' : ''}" data-dur="${d}">${d} h</button>`).join('')}
        </div>
      </div>
      <div class="when-row">
        <label class="fld-label">Start ${st.resource === 'bilard' ? '<span class="off-hint">· pn–czw przed 18:00 taniej</span>' : ''}</label>
        ${slots.length ? `<div class="slot-grid">
          ${slots.map((s) => `
            <button class="slot ${st.start === s.start ? 'sel' : ''}" data-start="${s.start}" ${s.free === 0 ? 'disabled' : ''}>
              <strong>${fmtTime(s.start)}</strong>
              <span>${s.free === 0 ? 'brak' : `${s.free} ${freeWord(s.free, st.resource)}`}</span>
            </button>`).join('')}
        </div>` : `<p class="note">Tego dnia brak slotów dla wybranej długości — wybierz inny dzień.</p>`}
      </div>
    </div>`;
}

function stepUnit() {
  const r = RESOURCES[st.resource];
  const frees = freeUnits(st.date, st.resource, st.start, st.dur);
  const mapFn = MAPS[r.map];
  return `
    <p class="bk-lead">Wybierz ${st.resource === 'bilard' ? 'stół' : st.resource === 'rzutki' ? 'tor' : 'lożę'} na planie sali
      <span class="bk-dim">${dateLabel(st.date)} · ${fmtTime(st.start)}–${fmtTime(st.start + st.dur * 60)}</span>
    </p>
    ${mapFn(frees)}
    <div class="map-legend">
      <span><i class="lg lg-free"></i>wolny</span>
      <span><i class="lg lg-busy"></i>zajęty</span>
      <span><i class="lg lg-sel"></i>twój wybór</span>
      ${st.resource === 'loza' ? `<span class="lg-note">loża bez opłaty — obowiązuje min. barowe ${r.minSpend} zł</span>` : ''}
    </div>`;
}

function stepParty() {
  const r = RESOURCES.salka;
  return `
    <p class="bk-lead">Szczegóły imprezy <span class="bk-dim">${dateLabel(st.date)} · ${fmtTime(st.start)}–${fmtTime(st.start + st.dur * 60)}</span></p>
    <div class="when-row">
      <label class="fld-label">Liczba gości: <strong id="guest-count">${st.guests}</strong></label>
      <input type="range" id="bk-guests" min="${r.guests.min}" max="${r.guests.max}" value="${st.guests}" step="2"/>
    </div>
    <div class="when-row">
      <label class="fld-label">Pakiet</label>
      <div class="pkg-grid">
        ${r.packages.map((p) => `
          <button class="pkg-card ${st.pkg === p.id ? 'sel' : ''}" data-pkg="${p.id}">
            <strong>${p.name}</strong>
            <span>${p.desc}</span>
            <em>${p.price === 0 ? 'w cenie' : p.perPerson ? `+${p.price} zł / os.` : `+${p.price} zł`}</em>
          </button>`).join('')}
      </div>
    </div>`;
}

function stepDetails() {
  const r = RESOURCES[st.resource];
  const what = st.resource === 'salka' ? 'Salka eventowa' : `${r.unitName(st.unit)} · ${r.label.toLowerCase()}`;
  return `
    <p class="bk-lead">Twoje dane</p>
    <div class="bk-summary-mini">
      <strong>${what}</strong>
      <span>${dateLabel(st.date)} · ${fmtTime(st.start)}–${fmtTime(st.start + st.dur * 60)}${st.resource === 'salka' ? ` · ${st.guests} osób` : ''}</span>
    </div>
    <div class="form-grid">
      <label class="fld"><span>Imię i nazwisko *</span><input id="f-name" type="text" autocomplete="name" value="${st.name}" placeholder="np. Jan Bila"/></label>
      <label class="fld"><span>Telefon *</span><input id="f-phone" type="tel" autocomplete="tel" value="${st.phone}" placeholder="np. 600 700 800"/></label>
      <label class="fld fld-full"><span>E-mail (opcjonalnie)</span><input id="f-email" type="email" autocomplete="email" value="${st.email}" placeholder="np. jan@poczta.pl"/></label>
      <label class="fld fld-full"><span>Uwagi</span><textarea id="f-notes" rows="2" placeholder="${st.resource === 'salka' ? 'np. urodziny 30-tki, prosimy o stół pod tort' : 'np. przyjdziemy z własnymi kijami'}">${st.notes}</textarea></label>
      <label class="consent fld-full"><input id="f-consent" type="checkbox" ${st.consent ? 'checked' : ''}/><span>Zgadzam się na kontakt telefoniczny lub SMS w sprawie tej rezerwacji. *</span></label>
    </div>
    <p class="err" id="f-err" hidden></p>`;
}

function stepDone() {
  const r = RESOURCES[st.resource];
  const what = st.resource === 'salka' ? `Salka eventowa (${st.guests} osób)` : `${r.unitName(st.unit)} — ${r.label.toLowerCase()}`;
  const p = priceInfo();
  const pkg = st.resource === 'salka' ? RESOURCES.salka.packages.find((x) => x.id === st.pkg) : null;
  return `
    <div class="done-wrap">
      <div class="done-check">
        <svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="24"/><path d="M15 27.5 22.5 35 37 18.5"/></svg>
      </div>
      <h3>Rezerwacja przyjęta!</h3>
      <p class="done-code-label">Twój kod rezerwacji</p>
      <div class="done-code">${st.code}</div>
      <dl class="done-summary">
        <div><dt>Co</dt><dd>${what}${pkg && pkg.id !== 'none' ? ` · ${pkg.name}` : ''}</dd></div>
        <div><dt>Kiedy</dt><dd>${dateLabel(st.date)}, ${fmtTime(st.start)}–${fmtTime(st.start + st.dur * 60)}</dd></div>
        <div><dt>Rezerwujący</dt><dd>${st.name} · ${st.phone}</dd></div>
        <div><dt>Do zapłaty na miejscu</dt><dd>${p.label} <span class="bk-dim">(${p.note})</span></dd></div>
      </dl>
      <p class="note">Potwierdzenie wyślemy SMS-em. Rezerwację możesz odwołać bezpłatnie do 4 h przed terminem — wystarczy telefon.</p>
      <div class="done-actions">
        <button class="btn btn-ghost" data-again>Nowa rezerwacja</button>
        <button class="btn btn-primary" data-finish>Gotowe</button>
      </div>
    </div>`;
}

function canNext() {
  const steps = stepsFor(st.resource);
  const cur = steps[st.step];
  if (cur === 'Rodzaj') return !!st.resource;
  if (cur === 'Termin') return st.start != null;
  if (cur === 'Miejsce') return st.unit != null;
  if (cur === 'Impreza') return true;
  if (cur === 'Dane') return st.name.trim().length >= 3 && /^[\d +()-]{9,}$/.test(st.phone.trim()) && st.consent && (!st.email || /^\S+@\S+\.\S+$/.test(st.email));
  return false;
}

function render() {
  if (!overlay) return;
  const steps = stepsFor(st.resource);
  const cur = steps[st.step];
  const p = priceInfo();
  const isDone = cur === 'Gotowe';

  $('.bk-steps').innerHTML = steps.map((s, i) => `
    <div class="bk-step ${i === st.step ? 'cur' : ''} ${i < st.step ? 'done' : ''}">
      <span class="bk-dot">${i < st.step ? '✓' : i + 1}</span><span class="bk-step-name">${s}</span>
    </div>${i < steps.length - 1 ? '<span class="bk-sep"></span>' : ''}`).join('');

  const body = $('.bk-body');
  body.innerHTML =
    cur === 'Rodzaj' ? stepResource()
    : cur === 'Termin' ? stepWhen()
    : cur === 'Miejsce' ? stepUnit()
    : cur === 'Impreza' ? stepParty()
    : cur === 'Dane' ? stepDetails()
    : stepDone();
  body.scrollTop = 0;

  $('.bk-foot').innerHTML = isDone ? '' : `
    <button class="btn btn-ghost" data-back ${st.step === 0 ? 'disabled' : ''}>Wstecz</button>
    <div class="bk-price">
      ${st.start != null && cur !== 'Rodzaj' ? `<span class="bk-price-label">Razem</span><strong>${p.label}</strong><span class="bk-dim">${p.note}</span>` : ''}
    </div>
    <button class="btn btn-primary" data-next ${canNext() ? '' : 'disabled'}>
      ${cur === 'Dane' ? 'Rezerwuję' : 'Dalej'}
    </button>`;

  wire(cur);
}

function wire(cur) {
  $('[data-back]')?.addEventListener('click', () => { st.step--; render(); });
  $('[data-next]')?.addEventListener('click', () => {
    if (!canNext()) return;
    const steps = stepsFor(st.resource);
    if (steps[st.step] === 'Dane' && !st.saved) {
      st.code = `RKS-${hash(`${st.date}${st.resource}${st.unit}${st.start}${st.name}${Date.now()}`).toString(36).slice(0, 5).toUpperCase()}`;
      saveBooking({ date: st.date, resource: st.resource, unit: st.unit ?? 1, start: st.start, dur: st.dur, code: st.code });
      st.saved = true;
    }
    st.step++;
    render();
  });

  if (cur === 'Rodzaj') {
    overlay.querySelectorAll('[data-res]').forEach((b) =>
      b.addEventListener('click', () => {
        const id = b.dataset.res;
        if (st.resource !== id) {
          st.resource = id;
          st.dur = RESOURCES[id].durations[0];
          st.start = null;
          st.unit = null;
        }
        st.step = 1;
        render();
      }));
  }

  if (cur === 'Termin') {
    $('#bk-date')?.addEventListener('change', (e) => {
      if (!e.target.value) return;
      st.date = e.target.value; st.start = null; st.unit = null; render();
    });
    overlay.querySelectorAll('[data-date]').forEach((b) =>
      b.addEventListener('click', () => { st.date = b.dataset.date; st.start = null; st.unit = null; render(); }));
    overlay.querySelectorAll('[data-dur]').forEach((b) =>
      b.addEventListener('click', () => { st.dur = +b.dataset.dur; st.start = null; st.unit = null; render(); }));
    overlay.querySelectorAll('[data-start]').forEach((b) =>
      b.addEventListener('click', () => {
        st.start = +b.dataset.start;
        st.unit = null;
        if (st.resource === 'salka') st.unit = 1;
        render();
      }));
  }

  if (cur === 'Miejsce') {
    overlay.querySelectorAll('.unit').forEach((u) =>
      u.addEventListener('click', () => {
        if (u.classList.contains('busy')) { toastFn('Ten termin jest już zajęty — wybierz inny.', 'warn'); return; }
        st.unit = +u.dataset.unit;
        render();
      }));
  }

  if (cur === 'Impreza') {
    const g = $('#bk-guests');
    g?.addEventListener('input', () => {
      st.guests = +g.value;
      $('#guest-count').textContent = st.guests;
      const p = priceInfo();
      const priceEl = $('.bk-price');
      if (priceEl) priceEl.innerHTML = `<span class="bk-price-label">Razem</span><strong>${p.label}</strong><span class="bk-dim">${p.note}</span>`;
    });
    overlay.querySelectorAll('[data-pkg]').forEach((b) =>
      b.addEventListener('click', () => { st.pkg = b.dataset.pkg; render(); }));
  }

  if (cur === 'Dane') {
    const bind = (id, key) => {
      const el = $(id);
      el?.addEventListener('input', () => {
        st[key] = el.type === 'checkbox' ? el.checked : el.value;
        const next = $('[data-next]');
        if (next) next.disabled = !canNext();
        const err = $('#f-err');
        if (err && !err.hidden) err.hidden = true;
      });
    };
    bind('#f-name', 'name'); bind('#f-phone', 'phone');
    bind('#f-email', 'email'); bind('#f-notes', 'notes'); bind('#f-consent', 'consent');
  }

  if (cur === 'Gotowe') {
    $('[data-finish]')?.addEventListener('click', () => { close(); toastFn(`Do zobaczenia! Kod ${st.code} czeka przy barze.`, 'ok'); });
    $('[data-again]')?.addEventListener('click', () => { st = fresh(st.resource); render(); });
  }
}

// ── API ──────────────────────────────────────────────────────
export function mount({ root: r, toast }) {
  root = r;
  toastFn = toast;
}

export const isOpen = () => !!overlay;

export function open(resource = 'bilard') {
  if (overlay) close(true);
  st = fresh(resource);
  overlay = document.createElement('div');
  overlay.className = 'overlay bk-overlay';
  overlay.innerHTML = `
    <div class="bk" role="dialog" aria-modal="true" aria-label="Rezerwacja">
      <header class="bk-head">
        <div class="bk-title"><strong>Rezerwacja</strong><span>zajmie ci to minutę</span></div>
        <button class="icon-btn bk-close" aria-label="Zamknij">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M5.5 5.5l13 13M18.5 5.5l-13 13"/></svg>
        </button>
      </header>
      <div class="bk-steps"></div>
      <div class="bk-body"></div>
      <footer class="bk-foot"></footer>
    </div>`;
  root.appendChild(overlay);
  overlay.addEventListener('pointerdown', (e) => { if (e.target === overlay) close(); });
  overlay.querySelector('.bk-close').addEventListener('click', () => close());
  document.body.classList.add('booking-open');
  if (document.hidden) overlay.classList.add('show');
  else requestAnimationFrame(() => overlay.classList.add('show'));
  render();
}

export function close(immediate = false) {
  if (!overlay) return;
  const el = overlay;
  overlay = null;
  el.classList.remove('show');
  document.body.classList.remove('booking-open');
  if (immediate) el.remove();
  else setTimeout(() => el.remove(), 280);
}
