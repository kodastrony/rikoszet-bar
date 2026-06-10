// Pigułkowe etykiety (CSS2D) z kotwicami zależnymi od trybu widoku.
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { ATTRACTIONS } from './data.js';

export function buildLabels(scene, onOpen) {
  const labels = new Map();

  for (const a of ATTRACTIONS) {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'hotspot';
    el.setAttribute('aria-label', `Otwórz: ${a.name}`);
    el.innerHTML = `
      <span class="hs-pill">
        <span class="hs-name">${a.name}</span>
        <span class="hs-plus" aria-hidden="true">
          <svg viewBox="0 0 12 12" width="11" height="11"><path d="M6 1v10M1 6h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        </span>
      </span>`;
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      onOpen(a.id);
    });
    const obj = new CSS2DObject(el);
    obj.position.set(...a.anchor);
    scene.add(obj);
    labels.set(a.id, { el, obj, a });
  }

  function setMode(mode) {
    for (const { el, obj, a } of labels.values()) {
      const show = a.modes.includes(mode);
      obj.visible = show;
      el.style.display = show ? '' : 'none';
      const interiorMode = a.view?.mode === mode && mode !== 'full';
      obj.position.set(...(interiorMode ? a.anchorIn : a.anchor));
    }
  }

  return {
    setMode,
    setActive(id) {
      for (const [k, v] of labels) v.el.classList.toggle('active', k === id);
      document.body.classList.toggle('hotspot-focus', !!id);
    },
  };
}
