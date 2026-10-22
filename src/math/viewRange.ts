/**
 * 视口自适应拟合（纯函数层 · 零 React / 零 DOM）
 *
 * ── 为什么需要 ──
 * `useSceneScale` 只做「给定 range → 算像素比例」，range 一旦写死，参数走到定义域边界
 * 就会出现「关键点出框」：`/quadratic` 的 `xRange[-6,6] / yRange[-4.5,4.5]` 在
 * `a=2,b=4,c=−4` 时顶点 (−1,−6) 直接掉出画布。全库 9 页有同类问题。
 *
 * ── 为什么不改 useSceneScale ──
 * 它服务全站 80+ 交互组件的基准变换。若在内部隐式 autoFit，外层的 CoordinateGrid、
 * FunctionGraph、IntervalShadow 无法同步感知动态 range，网格与曲线比例会撕裂。
 * 因此本模块只做一件事：由调用方把「必须可见的关键点」交进来，算出 { xRange, yRange }，
 * 再**单向派发**给 useSceneScale 与各绘图组件。数据流向单一，无隐式状态。
 *
 * ── 三条防坑设计 ──
 * 1. 基准视口保底（Floor Clamp）：结果取「默认范围 ∪ 数据范围+padding」。参数正常时
 *    绝不反向收缩——否则 ax² 的顶点一靠近原点，视口就缩到 [-0.3,0.3]，刻度密到失真。
 * 2. 非数防御：严格过滤 `Number.isFinite`。对勾函数在 a/b 趋零时会出现 ±Infinity 或 NaN，
 *    这类点必须剔除而不是让整个视口变成 NaN；点全被剔除时平滑回退默认范围。
 * 3. 边缘安全距离：padding 取 `max(minPadding, 跨度 × paddingRatio)`，保证极值点、
 *    焦点不紧贴边框，也不与图例/刻度重叠。
 */

export interface Point2Like {
  x: number;
  y: number;
}

export interface FitViewRangeOptions {
  /** 基准横向视口（保底下限），默认 [-6, 6] */
  defaultXRange?: [number, number];
  /** 基准纵向视口（保底下限），默认 [-4.5, 4.5] */
  defaultYRange?: [number, number];
  /** padding 占数据跨度的比例，默认 0.15 */
  paddingRatio?: number;
  /** 每侧最小 padding（数学单位），默认 0.5：点集只有一个点时也不会贴着边框 */
  minPadding?: number;
  /** 结果保留小数位，默认 1（与既有 calcAdaptiveTrigXRange 一致） */
  precision?: number;
}

export interface ViewRange {
  xRange: [number, number];
  yRange: [number, number];
  /** 因非有限值被剔除的点数，供调用方提示与测试断言 */
  droppedCount: number;
  /** 是否因数据超出基准视口而扩张（false = 仍用基准范围） */
  expanded: boolean;
}

const DEFAULT_X: [number, number] = [-6, 6];
const DEFAULT_Y: [number, number] = [-4.5, 4.5];

const round = (v: number, digits: number): number => {
  const f = 10 ** digits;
  return Math.round(v * f) / f;
};

/**
 * 由关键点集合拟合视口范围。
 *
 * @param points 必须完整落在画布内的教学关键点（顶点、交点、切点、圆心、焦点、极值点…）。
 *               调用方负责挑选「哪些点必须可见」，这是教学判断，不可由本函数代劳。
 */
export function fitViewRange(
  points: readonly Point2Like[],
  options: FitViewRangeOptions = {},
): ViewRange {
  const {
    defaultXRange = DEFAULT_X,
    defaultYRange = DEFAULT_Y,
    paddingRatio = 0.15,
    minPadding = 0.5,
    precision = 1,
  } = options;

  const valid = points.filter(
    (p) => Number.isFinite(p.x) && Number.isFinite(p.y),
  );
  const droppedCount = points.length - valid.length;

  // 无可信点 ⇒ 原样回退基准视口，绝不让 NaN 污染坐标系
  if (valid.length === 0) {
    return {
      xRange: [...defaultXRange],
      yRange: [...defaultYRange],
      droppedCount,
      expanded: false,
    };
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of valid) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }

  const padX = Math.max(minPadding, (maxX - minX) * paddingRatio);
  const padY = Math.max(minPadding, (maxY - minY) * paddingRatio);

  // Floor Clamp：与基准范围取并集，参数回到正常区间时不会反向收缩
  const loX = Math.min(defaultXRange[0], minX - padX);
  const hiX = Math.max(defaultXRange[1], maxX + padX);
  const loY = Math.min(defaultYRange[0], minY - padY);
  const hiY = Math.max(defaultYRange[1], maxY + padY);

  const expanded =
    loX < defaultXRange[0] - 1e-9 ||
    hiX > defaultXRange[1] + 1e-9 ||
    loY < defaultYRange[0] - 1e-9 ||
    hiY > defaultYRange[1] + 1e-9;

  return {
    xRange: [round(loX, precision), round(hiX, precision)],
    yRange: [round(loY, precision), round(hiY, precision)],
    droppedCount,
    expanded,
  };
}

/** 点是否落在给定 range 内（含边界容差），供门禁测试与「出框」提示共用 */
export function isPointInsideRange(
  p: Point2Like,
  range: ViewRange,
  tolerance = 1e-6,
): boolean {
  if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) return false;
  return (
    p.x >= range.xRange[0] - tolerance &&
    p.x <= range.xRange[1] + tolerance &&
    p.y >= range.yRange[0] - tolerance &&
    p.y <= range.yRange[1] + tolerance
  );
}
