// Cały interfejs 2D: topbar, panel atrakcji, modale, statusy, toasty.
import { BRAND, ATTRACTIONS, HOURS, PROGRAM, PRICING, openState, fmtTime } from './data.js';
import { art, LOGO_SVG } from './svgart.js';
import * as booking from './booking.js';

let deps = null; // { focusAttraction, resetCamera, toggleNight, setLabelActive }
let drawerEl, modalRoot, toastRoot, statusChip;

const $ = (sel, root = document) => root.querySelector(sel);

const ICO = {
  moon: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20 13.5A8.5 8.5 0 0 1 10.5 4 7 7 0 1 0 20 13.5Z"/></svg>`,
  sun: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4.4"/><path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5 5l1.7 1.7M17.3 17.3 19 19M19 5l-1.7 1.7M6.7 17.3 5 19"/></svg>`,
  reset: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 2.6-6.3"/><path d="M3 4.8v4h4"/></svg>`,
  close: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M5.5 5.5l13 13M18.5 5.5l-13 13"/></svg>`,
  phone: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 4h4l1.6 4.2-2.2 1.6a13 13 0 0 0 5.8 5.8l1.6-2.2L20 15v4a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 3 6.2 2 2 0 0 1 5 4Z"/></svg>`,
  pin: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11Z"/><circle cx="12" cy="10" r="2.6"/></svg>`,
  mail: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3.5" y="5.5" width="17" height="13" rx="2.5"/><path d="m4.5 7 7.5 6 7.5-6"/></svg>`,
  burger: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>`,
  chevL: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 5.5 8 12l6.5 6.5"/></svg>`,
  chevR: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m9.5 5.5 6.5 6.5-6.5 6.5"/></svg>`,
};

// ── toast ────────────────────────────────────────────────────
export function toast(msg, kind = 'info') {
  const t = document.createElement('div');
  t.className = `toast toast-${kind}`;
  t.textContent = msg;
  toastRoot.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => t.remove(), 350);
  }, 3400);
}

// ── modale ───────────────────────────────────────────────────
let openModalEl = null;
export function closeModal() {
  if (!openModalEl) return;
  openModalEl.classList.remove('show');
  const el = openModalEl;
  openModalEl = null;
  setTimeout(() => el.remove(), 280);
  document.body.classList.remove('modal-open');
}

export function openModal({ title, body, wide = false, className = '' }) {
  closeModal();
  const ov = document.createElement('div');
  ov.className = `overlay ${className}`;
  ov.innerHTML = `
    <div class="modal ${wide ? 'modal-wide' : ''}" role="dialog" aria-modal="true" aria-label="${title}">
      <header class="modal-head">
        <h2>${title}</h2>
        <button class="icon-btn modal-close" aria-label="Zamknij">${ICO.close}</button>
      </header>
      <div class="modal-body">${body}</div>
    </div>`;
  modalRoot.appendChild(ov);
  ov.addEventListener('pointerdown', (e) => { if (e.target === ov) closeModal(); });
  $('.modal-close', ov).addEventListener('click', closeModal);
  openModalEl = ov;
  document.body.classList.add('modal-open');
  if (document.hidden) ov.classList.add('show');
  else requestAnimationFrame(() => ov.classList.add('show'));
  return ov;
}

// ── panel atrakcji (drawer) ─────────────────────────────────
let currentAttractionId = null;

export function navAttraction(dir) {
  const idx = ATTRACTIONS.findIndex((x) => x.id === currentAttractionId);
  if (idx === -1) return;
  const next = ATTRACTIONS[(idx + dir + ATTRACTIONS.length) % ATTRACTIONS.length];
  openAttraction(next.id);
}

export function openAttraction(id) {
  const a = ATTRACTIONS.find((x) => x.id === id);
  if (!a) return;
  booking.close();
  closeModal();
  currentAttractionId = id;

  const idx = ATTRACTIONS.indexOf(a);
  const facts = a.facts.map(([k, v]) => `<div class="fact"><dt>${k}</dt><dd>${v}</dd></div>`).join('');
  const timeline = a.timeline
    ? `<div class="timeline">${a.timeline.map(([y, t]) => `<div class="tl-row"><span class="tl-year">${y}</span><span class="tl-text">${t}</span></div>`).join('')}</div>`
    : '';
  const ctaBtn = a.cta
    ? `<button class="btn btn-primary" data-cta="${a.cta.type}" data-resource="${a.cta.resource ?? ''}">${a.cta.label}</button>`
    : '';

  drawerEl.innerHTML = `
    <div class="drawer-nav">
      <button class="icon-btn drawer-arrow" data-nav-dir="-1" aria-label="Poprzednia atrakcja">${ICO.chevL}</button>
      <button class="icon-btn drawer-arrow" data-nav-dir="1" aria-label="Następna atrakcja">${ICO.chevR}</button>
      <span class="drawer-count">${idx + 1} / ${ATTRACTIONS.length}</span>
    </div>
    <button class="icon-btn drawer-close" aria-label="Zamknij panel">${ICO.close}</button>
    <div class="drawer-scroll swap">
      <div class="drawer-art">${art(a.art)}</div>
      <div class="drawer-content">
        <p class="kicker">${a.kicker}</p>
        <h2 class="drawer-title">${a.name}</h2>
        ${a.desc.map((p) => `<p class="drawer-p">${p}</p>`).join('')}
        ${timeline}
        <dl class="facts">${facts}</dl>
      </div>
    </div>
    <div class="drawer-cta">
      ${ctaBtn}
      <button class="btn btn-ghost" data-cta="close">Wróć do widoku</button>
    </div>`;

  $('.drawer-close', drawerEl).addEventListener('click', closeAttraction);
  drawerEl.querySelectorAll('[data-nav-dir]').forEach((b) =>
    b.addEventListener('click', (e) => { e.stopPropagation(); navAttraction(+b.dataset.navDir); }));
  drawerEl.querySelectorAll('[data-cta]').forEach((b) =>
    b.addEventListener('click', () => {
      const t = b.dataset.cta;
      if (t === 'booking') booking.open(b.dataset.resource || 'bilard');
      else if (t === 'program') openProgram();
      else if (t === 'contact') openContact();
      else closeAttraction();
    })
  );

  document.body.classList.add('drawer-open');
  drawerEl.classList.add('open');
  deps.setLabelActive(id);
  deps.focusAttraction(id);
}

export function closeAttraction() {
  currentAttractionId = null;
  document.body.classList.remove('drawer-open');
  drawerEl.classList.remove('open');
  deps.setLabelActive(null);
  deps.resetCamera();
}

// ── modale treściowe ────────────────────────────────────────
function hoursTable() {
  const today = new Date().getDay();
  const order = [1, 2, 3, 4, 5, 6, 0]; // od poniedziałku
  return `<table class="hours-table">${order.map((i) => `
    <tr class="${i === today ? 'today' : ''}">
      <td>${HOURS[i].day}</td><td>${fmtTime(HOURS[i].open)} – ${fmtTime(HOURS[i].close)}</td>
    </tr>`).join('')}</table>`;
}

const MAP_SVG = `
<svg viewBox="0 0 360 200" class="mini-map" aria-label="Mapa dojazdu">
  <rect width="360" height="200" rx="14" fill="#e8ecdf"/>
  <path d="M-10 40 Q120 10 200 60 T380 70" stroke="#aecbe0" stroke-width="26" fill="none"/>
  <path d="M-10 40 Q120 10 200 60 T380 70" stroke="#cfe2ef" stroke-width="18" fill="none"/>
  <g stroke="#f7f5ee" stroke-width="10" stroke-linecap="round" fill="none">
    <path d="M30 210 L80 20"/><path d="M140 210 L170 16"/><path d="M250 205 L262 14"/>
    <path d="M-10 150 L370 120"/><path d="M-10 96 Q180 130 370 92"/>
  </g>
  <g stroke="#e3ded0" stroke-width="4" fill="none">
    <path d="M60 70 L330 50"/><path d="M40 180 L340 160"/>
  </g>
  <rect x="186" y="96" width="34" height="22" rx="3" fill="#a04a33"/>
  <rect x="160" y="100" width="22" height="16" rx="3" fill="#c9bfa8"/>
  <g transform="translate(203,84)">
    <path d="M0 26 C-13 12 -13 -2 0 -8 C13 -2 13 12 0 26Z" fill="#ff5a48"/>
    <circle cx="0" cy="2" r="5.4" fill="#fff"/>
  </g>
  <text x="200" y="146" font-size="11" font-weight="700" fill="#5a6157" text-anchor="middle">ul. Słodowa 8</text>
  <text x="316" y="38" font-size="10" font-weight="600" fill="#7d9bb5">Odra</text>
</svg>`;

export function openContact() {
  const st = openState();
  const body = `
    <div class="contact-grid">
      <div>
        <div class="status-line ${st.open ? 'is-open' : 'is-closed'}"><span class="dot"></span>${st.label}</div>
        <ul class="contact-list">
          <li>${ICO.pin}<span>${BRAND.address}</span></li>
          <li>${ICO.phone}<a href="tel:${BRAND.phone.replace(/ /g, '')}">${BRAND.phone}</a></li>
          <li>${ICO.mail}<a href="mailto:${BRAND.email}">${BRAND.email}</a></li>
        </ul>
        <div class="socials">
          ${BRAND.socials.map((s) => `<button class="social-pill" data-social="${s.label}">${s.label} <span>${s.handle}</span></button>`).join('')}
        </div>
        ${MAP_SVG}
      </div>
      <div>
        <h3 class="sub-h">Godziny otwarcia</h3>
        ${hoursTable()}
        <p class="note">Kuchnia przyjmuje zamówienia do 22:00. Ostatnie rezerwacje stołów na godzinę przed zamknięciem.</p>
        <button class="btn btn-primary btn-block" data-open-booking>Zarezerwuj wizytę</button>
      </div>
    </div>`;
  const m = openModal({ title: 'Godziny i kontakt', body, wide: true });
  m.querySelectorAll('[data-social]').forEach((b) =>
    b.addEventListener('click', () => toast('Wersja demo — profile społecznościowe wkrótce.')));
  $('[data-open-booking]', m).addEventListener('click', () => { closeModal(); booking.open('bilard'); });
}

export function openProgram() {
  const today = (new Date().getDay() + 6) % 7; // pon=0
  const body = `
    <div class="program-list">
      ${PROGRAM.map((p, i) => `
        <div class="program-row ${i === today ? 'today' : ''}">
          <span class="pr-day">${p.day.slice(0, 3).toUpperCase()}</span>
          <div class="pr-main"><strong>${p.name}</strong><span>${p.desc}</span></div>
          <span class="pr-time">${p.time}</span>
        </div>`).join('')}
    </div>
    <p class="note">Wstęp na wszystkie wydarzenia jest wolny. Salka eventowa działa niezależnie od programu.</p>`;
  openModal({ title: 'Program tygodnia', body });
}

export function openPricing() {
  const body = `
    <div class="pricing-grid">
      ${PRICING.map((g) => `
        <div class="price-group">
          <h3>${g.group}</h3>
          ${g.rows.map(([k, v]) => `<div class="price-row"><span>${k}</span><i></i><strong>${v}</strong></div>`).join('')}
        </div>`).join('')}
    </div>
    <p class="note">Rezerwacje grupowe i eventy firmowe wyceniamy indywidualnie — napisz na ${BRAND.email}.</p>`;
  openModal({ title: 'Cennik', body, wide: true });
}

export function openAttractionsList() {
  const body = `
    <div class="attr-grid">
      ${ATTRACTIONS.map((a) => `
        <button class="attr-card" data-attr="${a.id}">
          <span class="attr-art">${art(a.art)}</span>
          <span class="attr-name">${a.name}</span>
          <span class="attr-kicker">${a.kicker}</span>
        </button>`).join('')}
    </div>`;
  const m = openModal({ title: 'Atrakcje', body, wide: true });
  m.querySelectorAll('[data-attr]').forEach((b) =>
    b.addEventListener('click', () => { closeModal(); openAttraction(b.dataset.attr); }));
}

/** Podświetlenie aktywnego trybu w przełączniku pięter. */
export function syncModeUI(mode) {
  document.querySelectorAll('.fs-btn').forEach((b) =>
    b.classList.toggle('sel', b.dataset.mode === mode));
}

// ── status otwarcia ─────────────────────────────────────────
function refreshStatus() {
  const st = openState();
  statusChip.className = `chip status-chip ${st.open ? 'is-open' : 'is-closed'}`;
  $('.chip-label', statusChip).textContent = st.label;
}

// ── montaż całości ──────────────────────────────────────────
export function mountUI(d) {
  deps = d;
  const ui = document.getElementById('ui');

  ui.innerHTML = `
    <header class="topbar">
      <button class="brand" data-nav="home" aria-label="RIKOSZET — widok główny">
        ${LOGO_SVG}
        <span class="brand-text"><strong>${BRAND.name}</strong><span>${BRAND.tagline}</span></span>
      </button>
      <nav class="topnav">
        <button data-nav="attractions">Atrakcje</button>
        <button data-nav="program">Program</button>
        <button data-nav="pricing">Cennik</button>
        <button data-nav="contact">Kontakt</button>
      </nav>
      <div class="topbar-right">
        <button class="btn btn-primary btn-book" data-nav="booking">Zarezerwuj</button>
        <button class="icon-btn burger" data-nav="menu" aria-label="Menu">${ICO.burger}</button>
      </div>
    </header>

    <aside class="drawer" id="drawer" aria-label="Szczegóły atrakcji"></aside>

    <button class="chip status-chip" id="status-chip">
      <span class="dot"></span><span class="chip-label">…</span>
    </button>

    <div class="view-controls">
      <button class="icon-btn ctl" id="night-btn" aria-label="Tryb nocny" data-tip="Tryb nocny">${ICO.moon}</button>
      <button class="icon-btn ctl" id="reset-btn" aria-label="Resetuj widok" data-tip="Resetuj widok">${ICO.reset}</button>
    </div>

    <div class="floor-switch" id="floor-switch" role="group" aria-label="Widok budynku">
      <button data-mode="full" class="fs-btn sel">
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M4 11.5 12 5l8 6.5"/><path d="M6.5 10.5V19h11v-8.5"/></svg>
        Budynek
      </button>
      <button data-mode="parter" class="fs-btn">
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="5" y="13" width="14" height="7" rx="1.5"/><path d="M5 9h14" stroke-dasharray="3 2.4"/></svg>
        Parter
      </button>
      <button data-mode="pietro" class="fs-btn">
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="5" y="4" width="14" height="7.5" rx="1.5" stroke-dasharray="3 2.4"/><rect x="5" y="13" width="14" height="7" rx="1.5"/></svg>
        Piętro
      </button>
    </div>

    <div class="hint" id="hint">${matchMedia('(pointer: coarse)').matches
      ? 'Obracaj palcem · szczypnij, aby przybliżyć · stukaj znaczniki <b>+</b>'
      : 'Przeciągnij, by obrócić · kółko przybliża · klikaj <b>+</b> · klawisze <b>1·2·3</b>'}</div>

    <footer class="credit">
      <span>© 2026 ${BRAND.name}</span>
      <span class="sep">·</span>
      <span>Made with <b class="heart">♥</b> by <a href="#" data-koda>KODA</a></span>
      <span class="sep">·</span>
      <a href="#" data-imprint>Polityka prywatności</a>
    </footer>

    <div id="modal-root"></div>
    <div id="toast-root"></div>`;

  drawerEl = $('#drawer', ui);
  modalRoot = $('#modal-root', ui);
  toastRoot = $('#toast-root', ui);
  statusChip = $('#status-chip', ui);

  // nawigacja
  ui.querySelectorAll('[data-nav]').forEach((b) =>
    b.addEventListener('click', () => {
      const t = b.dataset.nav;
      if (t === 'home') { closeAttraction(); closeModal(); booking.close(); }
      else if (t === 'attractions') openAttractionsList();
      else if (t === 'program') openProgram();
      else if (t === 'pricing') openPricing();
      else if (t === 'contact') openContact();
      else if (t === 'booking') booking.open('bilard');
      else if (t === 'menu') openMobileMenu();
    })
  );

  statusChip.addEventListener('click', openContact);

  $('#night-btn', ui).addEventListener('click', () => {
    const mode = deps.toggleNight();
    $('#night-btn', ui).innerHTML = mode === 'night' ? ICO.sun : ICO.moon;
    $('#night-btn', ui).dataset.tip = mode === 'night' ? 'Tryb dzienny' : 'Tryb nocny';
  });
  $('#reset-btn', ui).addEventListener('click', () => { closeAttraction(); });

  ui.querySelectorAll('.fs-btn').forEach((b) =>
    b.addEventListener('click', () => {
      if (drawerEl.classList.contains('open')) closeAttraction();
      deps.setMode(b.dataset.mode);
    }));

  $('[data-koda]', ui).addEventListener('click', (e) => { e.preventDefault(); toast('Strona-demo z portfolio KODA.'); });
  $('[data-imprint]', ui).addEventListener('click', (e) => { e.preventDefault(); toast('Dokument dostępny w pełnej wersji serwisu.'); });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (booking.isOpen()) booking.close();
      else if (openModalEl) closeModal();
      else if (drawerEl.classList.contains('open')) closeAttraction();
      return;
    }
    // nie przejmujemy klawiszy podczas pisania w formularzu ani ze skrótami systemowymi
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.target.matches?.('input, textarea, select')) return;

    // strzałki przełączają atrakcje, gdy otwarty jest tylko panel
    if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') &&
        drawerEl.classList.contains('open') && !openModalEl && !booking.isOpen()) {
      e.preventDefault();
      navAttraction(e.key === 'ArrowRight' ? 1 : -1);
      return;
    }

    // skróty kamery/trybów działają tylko bez otwartych modali (reużywają istniejących przycisków)
    if (openModalEl || booking.isOpen()) return;
    const click = (sel) => document.querySelector(sel)?.click();
    if (e.key === '1') click('.fs-btn[data-mode="full"]');
    else if (e.key === '2') click('.fs-btn[data-mode="parter"]');
    else if (e.key === '3') click('.fs-btn[data-mode="pietro"]');
    else if (e.key === 'r' || e.key === 'R') click('#reset-btn');
    else if (e.key === 'n' || e.key === 'N') click('#night-btn');
  });

  refreshStatus();
  setInterval(refreshStatus, 30_000);
  setTimeout(() => $('#hint', ui)?.classList.add('hide'), 8000);

  booking.mount({ root: modalRoot, toast });
}

function openMobileMenu() {
  const st = openState();
  const body = `
    <div class="mobile-menu">
      <button class="mm-link" data-mm="attractions">Atrakcje</button>
      <button class="mm-link" data-mm="program">Program</button>
      <button class="mm-link" data-mm="pricing">Cennik</button>
      <button class="mm-link" data-mm="contact">Kontakt</button>
      <button class="btn btn-primary btn-block" data-mm="booking">Zarezerwuj</button>
      <p class="note status-line ${st.open ? 'is-open' : 'is-closed'}"><span class="dot"></span>${st.label}</p>
    </div>`;
  const m = openModal({ title: BRAND.name, body });
  m.querySelectorAll('[data-mm]').forEach((b) =>
    b.addEventListener('click', () => {
      closeModal();
      const t = b.dataset.mm;
      if (t === 'attractions') openAttractionsList();
      else if (t === 'program') openProgram();
      else if (t === 'pricing') openPricing();
      else if (t === 'contact') openContact();
      else if (t === 'booking') booking.open('bilard');
    }));
}
