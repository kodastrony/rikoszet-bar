// Minimalny silnik animacji oparty o requestAnimationFrame głównej pętli.
export const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

const active = new Set();

export function tween({ dur = 1000, ease = easeInOutCubic, update, done }) {
  const tw = { start: performance.now(), dur, ease, update, done, cancelled: false };
  active.add(tw);
  return () => { tw.cancelled = true; active.delete(tw); };
}

export function updateTweens(now) {
  for (const tw of [...active]) {
    if (tw.cancelled) continue;
    const t = Math.min(1, (now - tw.start) / tw.dur);
    tw.update(tw.ease(t), t);
    if (t >= 1) {
      active.delete(tw);
      tw.done?.();
    }
  }
}
