/**
 * 正切函数 y = A * tan(omega * x + phi) + C 的纯数学计算逻辑
 * 满足铁律 6：零副作用、零 DOM / React / window 依赖
 */

export interface TangentPoint {
  x: number;
  y: number;
}

export interface SymmetryCenter {
  x: number;
  y: number;
  k: number;
  type: "zero" | "asymptoteIntersection";
}

export interface TangentLineData {
  theta: number;
  pX: number;
  pY: number;
  tX: number;
  tY: number;
  tanValue: number;
  isValid: boolean;
  isBackward: boolean; // 是否是终边反向延长线交于 x=1
}

/**
 * 安全计算正切函数值
 * @param x 数学坐标 x
 * @param A 振幅伸缩
 * @param omega 频率/周期因子 (omega != 0)
 * @param phi 初相
 * @param C 垂直偏移
 */
export function calculateTangentValue(
  x: number,
  A: number,
  omega: number,
  phi: number,
  C: number,
): { y: number; isValid: boolean } {
  if (Math.abs(omega) < 1e-9) {
    return { y: C, isValid: false };
  }

  const angle = omega * x + phi;
  const cosVal = Math.cos(angle);

  // 接近渐近线 cos(angle) -> 0
  if (Math.abs(cosVal) < 1e-4) {
    return { y: NaN, isValid: false };
  }

  const tanVal = Math.tan(angle);
  const y = A * tanVal + C;

  return {
    y,
    isValid: Number.isFinite(y) && !Number.isNaN(y),
  };
}

/**
 * 计算单位圆与正切线几何关系（支持四象限与反向延长线）
 */
export function calculateUnitCircleTangent(
  theta: number,
  center: { x: number; y: number },
  r: number,
): TangentLineData {
  const cosT = Math.cos(theta);
  const sinT = Math.sin(theta);
  const isCosNearZero = Math.abs(cosT) < 1e-4;

  const pX = center.x + r * cosT;
  const pY = center.y + r * sinT;

  if (isCosNearZero) {
    return {
      theta,
      pX,
      pY,
      tX: center.x + r,
      tY: sinT > 0 ? Infinity : -Infinity,
      tanValue: sinT > 0 ? Infinity : -Infinity,
      isValid: false,
      isBackward: false,
    };
  }

  const tanValue = sinT / cosT;
  const tX = center.x + r;
  const tY = center.y + r * tanValue;
  // 当 cosT < 0 (第二、三象限) 时，为终边反向延长线相交
  const isBackward = cosT < 0;

  return {
    theta,
    pX,
    pY,
    tX,
    tY,
    tanValue,
    isValid: true,
    isBackward,
  };
}

/**
 * 获取在 [xMin, xMax] 范围内的所有垂直渐近线 x 坐标
 * 方程：omega * x + phi = k * pi + pi/2  =>  x = (k * pi + pi/2 - phi) / omega
 */
export function getTangentAsymptotes(
  xMin: number,
  xMax: number,
  omega: number,
  phi: number,
): { x: number; k: number }[] {
  if (Math.abs(omega) < 1e-9) return [];

  const asymptotes: { x: number; k: number }[] = [];
  const targetMin = Math.min(xMin * omega, xMax * omega);
  const targetMax = Math.max(xMin * omega, xMax * omega);

  const kMin = Math.floor((targetMin + phi - Math.PI / 2) / Math.PI) - 2;
  const kMax = Math.ceil((targetMax + phi - Math.PI / 2) / Math.PI) + 2;

  for (let k = kMin; k <= kMax; k++) {
    const x = (k * Math.PI + Math.PI / 2 - phi) / omega;
    if (x >= xMin - 0.1 && x <= xMax + 0.1) {
      asymptotes.push({ x, k });
    }
  }

  return asymptotes.sort((a, b) => a.x - b.x);
}

/**
 * 获取在 [xMin, xMax] 范围内的所有对称中心
 * 正切函数的对称中心为 ( (k * pi / 2 - phi) / omega, C )
 */
export function getTangentSymmetryCenters(
  xMin: number,
  xMax: number,
  omega: number,
  phi: number,
  C: number,
): SymmetryCenter[] {
  if (Math.abs(omega) < 1e-9) return [];

  const centers: SymmetryCenter[] = [];
  const targetMin = Math.min(xMin * omega, xMax * omega);
  const targetMax = Math.max(xMin * omega, xMax * omega);

  const kMin = Math.floor((targetMin + phi) / (Math.PI / 2)) - 2;
  const kMax = Math.ceil((targetMax + phi) / (Math.PI / 2)) + 2;

  for (let k = kMin; k <= kMax; k++) {
    const x = (k * (Math.PI / 2) - phi) / omega;
    if (x >= xMin && x <= xMax) {
      centers.push({
        x,
        y: C,
        k,
        type: k % 2 === 0 ? "zero" : "asymptoteIntersection",
      });
    }
  }

  return centers;
}

/**
 * 按周期分段采样生成流畅的正切曲线点集（防止跨渐近线连线）
 */
export function generateTangentSegments(
  xMin: number,
  xMax: number,
  A: number,
  omega: number,
  phi: number,
  C: number,
  yMin: number = -10,
  yMax: number = 10,
  samplesPerPeriod: number = 100,
): TangentPoint[][] {
  if (Math.abs(omega) < 1e-9) return [];

  // 只把**严格落在视口内**的渐近线作为分段边界；
  // 视口两端 (xMin / xMax) 本身也必须成为边界，
  // 否则当所有渐近线都在视口之外时 (|ω| 很小时，渐近线间距 T = π/|ω| 远大于视口宽度)
  // 会一段都构造不出来 → 中屏「一条曲线都没有，只剩坐标轴」。
  const innerAsymptotes = getTangentAsymptotes(xMin, xMax, omega, phi)
    .map((a) => a.x)
    .filter((x) => x > xMin + 1e-6 && x < xMax - 1e-6)
    .sort((a, b) => a - b);

  const bounds = [xMin, ...innerAsymptotes, xMax];
  const segments: TangentPoint[][] = [];

  // 按相邻边界划分开区间 (bounds[i], bounds[i+1])，每段内部必无渐近线
  for (let i = 0; i < bounds.length - 1; i++) {
    const startX = bounds[i] + 0.001;
    const endX = bounds[i + 1] - 0.001;

    if (endX <= startX) continue;

    const segment: TangentPoint[] = [];
    const step = (endX - startX) / samplesPerPeriod;

    for (let j = 0; j <= samplesPerPeriod; j++) {
      const x = startX + j * step;
      const { y, isValid } = calculateTangentValue(x, A, omega, phi, C);

      if (isValid && y >= yMin * 2 && y <= yMax * 2) {
        segment.push({ x, y });
      }
    }

    if (segment.length > 1) {
      segments.push(segment);
    }
  }

  return segments;
}

/**
 * 取「跨越 x = 0 的那一对相邻渐近线」，用于中屏周期标尺 Δx = T = π/|ω|。
 *
 * 相邻渐近线的间距恒等于 π/|ω| = T；而旧实现用 `find` 各取左右第一条渐近线
 * **并不保证二者相邻** —— 例如 ω = 2 时会取到 -3.927 与 0.785，跨度 4.712 = 3T，
 * 标尺却写「Δx = T = 1.57」。故必须先定位跨越原点的相邻对。
 */
export function pickAdjacentAsymptotePair(
  asymptotes: { x: number; k: number }[],
): [{ x: number; k: number }, { x: number; k: number }] | null {
  if (asymptotes.length < 2) return null;

  for (let i = 0; i < asymptotes.length - 1; i++) {
    if (asymptotes[i].x < 0 && asymptotes[i + 1].x > 0) {
      return [asymptotes[i], asymptotes[i + 1]];
    }
  }

  // 退化：x = 0 本身是一条渐近线（φ = ±π/2 时），退取最靠近原点的相邻一对
  const idx = Math.max(0, Math.floor((asymptotes.length - 1) / 2));
  return [asymptotes[idx], asymptotes[idx + 1]];
}

/**
 * 检测目标区间 [xStart, xEnd] 内是否存在正切渐近线（用于高考真题探究）
 */
export function checkIntervalAsymptoteFree(
  xStart: number,
  xEnd: number,
  omega: number,
  phi: number,
): {
  hasAsymptote: boolean;
  firstAsymptote?: number;
  maxAllowedOmega?: number;
} {
  if (Math.abs(omega) < 1e-9) {
    return { hasAsymptote: false };
  }

  // 求解落在 [xStart, xEnd] 内的所有渐近线
  const asymptotes = getTangentAsymptotes(xStart, xEnd, omega, phi);
  const hasAsymptote = asymptotes.length > 0;
  const firstAsymptote = asymptotes.length > 0 ? asymptotes[0].x : undefined;

  // 对于常见高考题型：f(x) = tan(omega * x) 在 [0, xEnd] 单调，则第一条正渐近线 x = pi / (2 * omega) > xEnd => omega < pi / (2 * xEnd)
  const maxAllowedOmega = xEnd > 0 ? Math.PI / (2 * xEnd) : undefined;

  return {
    hasAsymptote,
    firstAsymptote,
    maxAllowedOmega,
  };
}
