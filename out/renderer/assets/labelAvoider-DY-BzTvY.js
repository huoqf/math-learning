function overlaps(a, b) {
  return !(a.x + a.w < b.x || b.x + b.w < a.x || a.y + a.h < b.y || b.y + b.h < a.y);
}
function estimateW(text, fontScale) {
  let w = 8;
  for (const ch of text) {
    if (ch.charCodeAt(0) > 127) {
      w += 10;
    } else if (/\d/.test(ch)) {
      w += 5.5;
    } else {
      w += 6.5;
    }
  }
  return w * fontScale(1);
}
function clampRect(rect, bounds) {
  return {
    x: Math.max(0, Math.min(rect.x, bounds.width - rect.w)),
    y: Math.max(0, Math.min(rect.y, bounds.height - rect.h)),
    w: rect.w,
    h: rect.h
  };
}
function avoidLabels(entries, options) {
  const {
    maxAttempts = 5,
    stepY = 16,
    fontScale = (n) => n,
    bounds
  } = options ?? {};
  const labelH = fontScale(12);
  const placed = [];
  const sorted = [...entries].sort(
    (a, b) => (b.priority ?? 0) - (a.priority ?? 0)
  );
  for (const e of sorted) {
    const w = estimateW(e.text, fontScale);
    const xOff = e.anchor === "start" ? 0 : e.anchor === "end" ? -w : -w / 2;
    let dy = e.dy;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      let rect = {
        x: e.x + xOff,
        y: e.y + dy - labelH,
        w,
        h: labelH
      };
      if (bounds) {
        rect = clampRect(rect, bounds);
      }
      const hit = placed.some((p) => overlaps(p.rect, rect));
      if (!hit) {
        placed.push({ ...e, rect, finalDy: dy });
        break;
      }
      dy -= stepY;
    }
  }
  return placed;
}
function avoidLabelOffsets(entries, options) {
  const placed = avoidLabels(entries, options);
  const result = [];
  for (const e of entries) {
    const p = placed.find((pl) => pl.key === e.key);
    result.push({
      dx: 0,
      dy: p ? p.finalDy - e.dy : 0
    });
  }
  return result;
}
export {
  avoidLabels as a,
  avoidLabelOffsets as b
};
