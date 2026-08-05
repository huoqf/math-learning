export interface LabelItem {
  key: string;
  x: number;
  y: number;
  text: string;
  anchor?: "start" | "middle" | "end";
  finalDy?: number;
}

/**
 * 极小间距标签简单纵向偏移避让算子
 */
export function avoidLabelOverlap<T extends LabelItem>(
  items: T[],
  minDist = 16,
): (T & { finalDy: number })[] {
  const result = items.map((item) => ({ ...item, finalDy: 0 }));

  for (let i = 0; i < result.length; i++) {
    for (let j = i + 1; j < result.length; j++) {
      const a = result[i];
      const b = result[j];
      const dx = Math.abs(a.x - b.x);
      const dy = Math.abs(a.y + a.finalDy - (b.y + b.finalDy));

      if (dx < minDist * 2 && dy < minDist) {
        if (a.y <= b.y) {
          a.finalDy -= minDist / 2;
          b.finalDy += minDist / 2;
        } else {
          a.finalDy += minDist / 2;
          b.finalDy -= minDist / 2;
        }
      }
    }
  }

  return result;
}
