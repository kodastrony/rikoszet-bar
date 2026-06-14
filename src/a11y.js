// Dostępność: pułapka fokusu dla modali/dialogów + przywracanie fokusu do wyzwalacza.
// WCAG 2.4.3 (Focus Order) / 2.1.2 (No Keyboard Trap) / wzorzec dialogu ARIA.

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), ' +
  'textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function focusable(container) {
  return [...container.querySelectorAll(FOCUSABLE)].filter(
    (el) => el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.activeElement
  );
}

// Tło, które wyłączamy (inert) na czas otwartego modala/kreatora — fokus i czytnik
// ekranu nie wchodzą pod overlay, a aria-modal="true" przestaje „kłamać" o stanie tła.
const BG_SELECTORS = ['#app', '#labels', '.topbar', '#drawer', '.hud', '.credit', '#seo-fallback'];
let inertDepth = 0;
export function setBackgroundInert(on) {
  inertDepth = Math.max(0, inertDepth + (on ? 1 : -1));
  const active = inertDepth > 0;
  for (const sel of BG_SELECTORS) {
    document.querySelectorAll(sel).forEach((el) => {
      if (active) el.setAttribute('inert', '');
      else el.removeAttribute('inert');
    });
  }
}

/** Przenosi fokus na pierwszy sensowny element w kontenerze (pomija przycisk zamknięcia). */
export function focusFirst(container) {
  const items = focusable(container);
  const preferred = items.find((el) => !el.className?.includes?.('close')) || items[0] || container;
  preferred.focus?.();
}

/**
 * Uwięź fokus w kontenerze (modal). Zwraca funkcję zwalniającą, która oddaje
 * fokus elementowi aktywnemu w chwili wywołania (zwykle przycisk otwierający).
 */
export function trapFocus(container, { initial } = {}) {
  const restoreTo = document.activeElement;
  (initial || focusable(container)[0] || container).focus?.();

  function onKey(e) {
    if (e.key !== 'Tab') return;
    const items = focusable(container);
    if (!items.length) { e.preventDefault(); return; }
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    // fokus uciekł poza dialog (np. po podmianie DOM kroku) → ściągnij go z powrotem
    if (!container.contains(active)) {
      e.preventDefault(); (e.shiftKey ? last : first).focus(); return;
    }
    if (e.shiftKey && active === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault(); first.focus();
    }
  }
  container.addEventListener('keydown', onKey);

  return function release() {
    container.removeEventListener('keydown', onKey);
    if (restoreTo && restoreTo.isConnected && restoreTo.focus) {
      restoreTo.focus();
    }
  };
}
