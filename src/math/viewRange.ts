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

export interface FitSteppedViewRangeOptions {
  /** 基准横向视口（保底下限），默认 [-6, 6] */
  defaultXRange?: [number, number];
  /** 基准纵向视口（保底下限），默认 [-4.5, 4.5] */
  defaultYRange?: [number, number];
  /** 触发扩张前，允许贴近默认视口边界的最小安全内边距，默认 0.25 */
  innerSafety?: number;
  /** 扩张后的边缘留白，默认 0.5 */
  minPadding?: number;
  /** 阶梯档位倍率（相对于基准半跨度），默认 [1.5, 2, 3, 4, 6, 8, 12, 16] */
  stepMultipliers?: readonly number[];
  /** 最大允许扩张倍率（防渐近线奇异点把画布缩废），默认不限制 */
  maxExpandFactor?: number;
  /** 结果保留小数位，默认 1 */
  precision?: number;
}

const DEFAULT_STEP_MULTIPLIERS = [1.5, 2, 3, 4, 6, 8, 12, 16] as const;

function expandAxisBySteps(
  baseRange: [number, number],
  minVal: number,
  maxVal: number,
  minPadding: number,
  multipliers: readonly number[],
  maxExpandFactor: number,
  precision: number,
): { range: [number, number]; expanded: boolean } {
  const [baseLo, baseHi] = baseRange;
  const span = baseHi - baseLo;
  if (span <= 0) return { range: [...baseRange], expanded: false };

  const needLo = minVal < baseLo ? minVal - minPadding : baseLo;
  const needHi = maxVal > baseHi ? maxVal + minPadding : baseHi;

  if (needLo >= baseLo - 1e-9 && needHi <= baseHi + 1e-9) {
    return { range: [...baseRange], expanded: false };
  }

  const maxSpan = Number.isFinite(maxExpandFactor)
    ? span * Math.max(1, maxExpandFactor)
    : Infinity;

  // 按预设阶梯倍率逐档尝试，保证小步滑动时整段区间共用同一档位、零逐帧跳变
  for (const m of multipliers) {
    if (m <= 1) continue;
    if (span * m > maxSpan + 1e-9) break;
    const extra = ((m - 1) * span) / 2;
    const candLo = needLo < baseLo ? baseLo - extra : baseLo;
    const candHi = needHi > baseHi ? baseHi + extra : baseHi;
    if (candLo <= needLo + 1e-9 && candHi >= needHi - 1e-9) {
      return {
        range: [round(candLo, precision), round(candHi, precision)],
        expanded: true,
      };
    }
  }

  // 若仍超出所有预设档位且受 maxExpandFactor 上限约束，则钳位到最大允许扩幅；
  // 若无上限，则按整数倍基准跨度对齐（依然维持分档稳态而非连续小数）。
  if (Number.isFinite(maxExpandFactor)) {
    const clampedM = Math.max(1, maxExpandFactor);
    const extra = ((clampedM - 1) * span) / 2;
    const candLo = needLo < baseLo ? baseLo - extra : baseLo;
    const candHi = needHi > baseHi ? baseHi + extra : baseHi;
    const expanded = candLo < baseLo - 1e-9 || candHi > baseHi + 1e-9;
    return {
      range: [round(candLo, precision), round(candHi, precision)],
      expanded,
    };
  }

  const extraLo =
    needLo < baseLo ? Math.ceil((baseLo - needLo) / span) * span : 0;
  const extraHi =
    needHi > baseHi ? Math.ceil((needHi - baseHi) / span) * span : 0;
  return {
    range: [
      round(baseLo - extraLo, precision),
      round(baseHi + extraHi, precision),
    ],
    expanded: extraLo > 0 || extraHi > 0,
  };
}

/**
 * 稳态分级视口（用于函数/解析几何等 B 类页面）：
 * 1. 点集均落在基准视口内时，严格锁定基准 range，零跳变；
 * 2. 越界时按阶梯档位外扩，防止拖动滑块时每 0.1 步进引发连续缩放抖动；
 * 3. 可通过 maxExpandFactor 限制最大缩幅，杜绝渐近线/高次边界把主画面缩成竖线。
 */
export function fitSteppedViewRange(
  points: readonly Point2Like[],
  options: FitSteppedViewRangeOptions = {},
): ViewRange {
  const {
    defaultXRange = DEFAULT_X,
    defaultYRange = DEFAULT_Y,
    innerSafety = 0,
    minPadding = 0.5,
    stepMultipliers = DEFAULT_STEP_MULTIPLIERS,
    maxExpandFactor = Infinity,
    precision = 1,
  } = options;

  const valid = points.filter(
    (p) => Number.isFinite(p.x) && Number.isFinite(p.y),
  );
  const droppedCount = points.length - valid.length;

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

  const allInsideBase =
    minX >= defaultXRange[0] + innerSafety &&
    maxX <= defaultXRange[1] - innerSafety &&
    minY >= defaultYRange[0] + innerSafety &&
    maxY <= defaultYRange[1] - innerSafety;

  if (allInsideBase) {
    return {
      xRange: [...defaultXRange],
      yRange: [...defaultYRange],
      droppedCount,
      expanded: false,
    };
  }

  const xRes = expandAxisBySteps(
    defaultXRange,
    minX,
    maxX,
    minPadding,
    stepMultipliers,
    maxExpandFactor,
    precision,
  );
  const yRes = expandAxisBySteps(
    defaultYRange,
    minY,
    maxY,
    minPadding,
    stepMultipliers,
    maxExpandFactor,
    precision,
  );

  return {
    xRange: xRes.range,
    yRange: yRes.range,
    droppedCount,
    expanded: xRes.expanded || yRes.expanded,
  };
}
