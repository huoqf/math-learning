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
  C: number
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
 * 获取在 [xMin, xMax] 范围内的所有垂直渐近线 x 坐标
 * 方程：omega * x + phi = k * pi + pi/2  =>  x = (k * pi + pi/2 - phi) / omega
 */
export function getTangentAsymptotes(
  xMin: number,
  xMax: number,
  omega: number,
  phi: number
): { x: number; k: number }[] {
  if (Math.abs(omega) < 1e-9) return [];

  const asymptotes: { x: number; k: number }[] = [];
  // 反解 k 的大约范围
  // xMin <= (k*pi + pi/2 - phi) / omega <= xMax
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

  return asymptotes;
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
  C: number
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
  samplesPerPeriod: number = 100
): TangentPoint[][] {
  if (Math.abs(omega) < 1e-9) return [];

  const asymptotes = getTangentAsymptotes(xMin - 2, xMax + 2, omega, phi)
    .map((a) => a.x)
    .sort((a, b) => a - b);

  const segments: TangentPoint[][] = [];

  // 根据渐近线划分开区间 (asymptote[i], asymptote[i+1])
  for (let i = 0; i < asymptotes.length - 1; i++) {
    const startX = asymptotes[i] + 0.001;
    const endX = asymptotes[i + 1] - 0.001;

    // 剪枝不在视口内的区间
    if (endX < xMin || startX > xMax) continue;

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
