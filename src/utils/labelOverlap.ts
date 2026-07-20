/**
 * 标注避让工具 — 轻量级碰撞检测
 *
 * 当多个标注（顶点、交点、零点等）在设计坐标系中距离过近时，
 * 自动计算偏移量使它们不重叠。
 *
 * 策略：检测碰撞方向，选择空间更大的轴推开。
 * - 水平重叠为主 → 左右推开
 * - 垂直重叠为主 → 上下推开
 *
 * 用法：在 Scene 组件的 useMemo 中调用，将返回的 offset 应用到标注位置。
 */

export interface LabelBox {
  /** 标注中心 x（设计坐标） */
  x: number;
  /** 标注顶部 y（设计坐标） */
  y: number;
  /** 标注估算宽度（px） */
  width: number;
  /** 标注估算高度（px） */
  height: number;
}

export interface LabelOffset {
  dx: number;
  dy: number;
}

interface Bounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

function getBounds(
  label: LabelBox,
  offset: LabelOffset,
  minGap: number,
): Bounds {
  return {
    left: label.x + offset.dx - label.width / 2 - minGap,
    right: label.x + offset.dx + label.width / 2 + minGap,
    top: label.y + offset.dy - minGap,
    bottom: label.y + offset.dy + label.height + minGap,
  };
}

function overlaps(a: Bounds, b: Bounds): boolean {
  return (
    a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
  );
}

/**
 * 计算标注避让偏移量
 *
 * @param labels - 标注 bounding box 数组
 * @param minGap - 标注间最小间距（px），默认 4
 * @returns 每个标注应应用的 {dx, dy} 偏移量
 *
 * @example
 * ```tsx
 * const labels = points.map(p => ({
 *   x: mathToDesign(p.x, p.y, scale).x,
 *   y: mathToDesign(p.x, p.y, scale).y - 12,
 *   width: 40, height: 14,
 * }))
 * const offsets = avoidLabelOverlap(labels)
 *
 * // 渲染时应用偏移
 * <text x={pt.x + offsets[i].dx} y={pt.y + offsets[i].dy}>...</text>
 * ```
 */
export function avoidLabelOverlap(
  labels: LabelBox[],
  minGap: number = 4,
): LabelOffset[] {
  const n = labels.length;
  if (n === 0) return [];

  const offsets: LabelOffset[] = labels.map(() => ({ dx: 0, dy: 0 }));

  // 多轮迭代，直到无碰撞或达到上限
  const maxIterations = n * 2;
  for (let iter = 0; iter < maxIterations; iter++) {
    let hasCollision = false;

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const a = getBounds(labels[i], offsets[i], minGap);
        const b = getBounds(labels[j], offsets[j], minGap);

        if (!overlaps(a, b)) continue;

        hasCollision = true;

        // 计算各方向的穿透深度
        const overlapX = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const overlapY = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);

        // 选择穿透较小的轴推开（空间更大的方向）
        if (overlapX < overlapY) {
          // 水平推开：将 j 向右推
          const pushRight = a.right - b.left + minGap;
          offsets[j].dx += pushRight;
        } else {
          // 垂直推开：将 j 向下推
          const pushDown = a.bottom - b.top + minGap;
          offsets[j].dy += pushDown;
        }
      }
    }

    if (!hasCollision) break;
  }

  return offsets;
}
