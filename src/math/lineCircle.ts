/**
 * 直线与圆的位置关系及相交弦长 - 纯数学计算层
 *
 * 无 React/DOM 依赖，符合项目“铁律 6：数学层纯净”
 */

export interface Point2D {
  x: number;
  y: number;
}

export interface LineCircleParams {
  a: number; // 圆心 x
  b: number; // 圆心 y
  r: number; // 半径 (>0)
  k: number; // 直线斜率
  m: number; // 直线 y 截距 y = kx + m
  px?: number; // 圆外点 Px (切线模式)
  py?: number; // 圆外点 Py (切线模式)
  mx?: number; // 圆内定点 Mx (定点弦长极值分析)
  my?: number; // 圆内定点 My (定点弦长极值分析)
}

export interface BaseLineCircleResult {
  validity: "valid" | "invalid";
  errorMessage?: string;
  distance: number;
  foot: Point2D;
  relation: "intersect" | "tangent" | "disjoint";
  relationLabel: string;
  algebraic: {
    coeffA: number;
    coeffB: number;
    coeffC: number;
    delta: number;
    sumX: number;
    prodX: number;
  };
  intersections: Point2D[];
  chordLengthGeom: number;
  chordLengthAlg: number;
}

export interface LineCircleResult extends BaseLineCircleResult {
  center: Point2D;
  radius: number;
  lineEq: { A: number; B: number; C: number };
  midpoint: Point2D;
  kCH: number | null;
  pointP?: Point2D;
  distPC?: number;
  tangentLength?: number;
  tangentPoints?: Point2D[];
  secantLineEq?: { A: number; B: number; C: number; latex: string };
  pointM?: Point2D;
  distMC?: number;
  maxChordLength?: number;
  minChordLength?: number;
  isInsideCircle?: boolean;
}

/**
 * 基础子函数：计算一般式直线 Ax + By + C = 0 与圆 (x-a)^2 + (y-b)^2 = r^2 的交点与几何关系
 * 不包含 P 点切线计算，绝不会递归死循环！
 */
export function calculateBaseLineCircle(
  a: number,
  b: number,
  r: number,
  A: number,
  B: number,
  C: number,
): BaseLineCircleResult {
  if (r <= 0) {
    return {
      validity: "invalid",
      errorMessage: "圆半径必须大于 0",
      distance: 0,
      foot: { x: a, y: b },
      relation: "disjoint",
      relationLabel: "非法状态",
      algebraic: {
        coeffA: 1,
        coeffB: 0,
        coeffC: 0,
        delta: -1,
        sumX: 0,
        prodX: 0,
      },
      intersections: [],
      chordLengthGeom: 0,
      chordLengthAlg: 0,
    };
  }

  const denom = Math.hypot(A, B);
  if (denom < 1e-9) {
    return {
      validity: "invalid",
      errorMessage: "直线方程系数不能全为 0",
      distance: 0,
      foot: { x: a, y: b },
      relation: "disjoint",
      relationLabel: "非法状态",
      algebraic: {
        coeffA: 1,
        coeffB: 0,
        coeffC: 0,
        delta: -1,
        sumX: 0,
        prodX: 0,
      },
      intersections: [],
      chordLengthGeom: 0,
      chordLengthAlg: 0,
    };
  }

  // 1. 圆心到直线的距离 d = |A*a + B*b + C| / sqrt(A^2 + B^2)
  const distance = Math.abs(A * a + B * b + C) / denom;

  // 2. 垂足 H 坐标
  // Foot_x = a - A * (A*a + B*b + C) / (A^2 + B^2)
  // Foot_y = b - B * (A*a + B*b + C) / (A^2 + B^2)
  const factor = (A * a + B * b + C) / (A * A + B * B);
  const footX = a - A * factor;
  const footY = b - B * factor;
  const foot: Point2D = { x: footX, y: footY };

  // 3. 位置关系
  let relation: "intersect" | "tangent" | "disjoint";
  let relationLabel = "";
  const eps = 1e-3;
  if (distance < r - eps) {
    relation = "intersect";
    relationLabel = "相交 (2个公共点)";
  } else if (Math.abs(distance - r) <= eps) {
    relation = "tangent";
    relationLabel = "相切 (1个公共点)";
  } else {
    relation = "disjoint";
    relationLabel = "相离 (0个公共点)";
  }

  // 4. 交点求解
  const intersections: Point2D[] = [];
  let coeffA = 1;
  let coeffB = 0;
  let coeffC = 0;
  let delta = -1;
  let sumX = 0;
  let prodX = 0;

  if (relation === "tangent") {
    // 相切时交点严格唯一（即垂足切点 H），判别式 Delta = 0
    delta = 0;
    intersections.push(foot);
    if (Math.abs(B) > 1e-7) {
      const kLine = -A / B;
      const mLine = -C / B;
      coeffA = 1 + kLine * kLine;
      coeffB = 2 * (kLine * (mLine - b) - a);
      coeffC = a * a + (mLine - b) * (mLine - b) - r * r;
      sumX = 2 * foot.x;
      prodX = foot.x * foot.x;
    }
  } else if (Math.abs(B) > 1e-7) {
    // y = k_line * x + m_line  => k_line = -A/B, m_line = -C/B
    const kLine = -A / B;
    const mLine = -C / B;
    coeffA = 1 + kLine * kLine;
    coeffB = 2 * (kLine * (mLine - b) - a);
    coeffC = a * a + (mLine - b) * (mLine - b) - r * r;

    delta = coeffB * coeffB - 4 * coeffA * coeffC;
    sumX = -coeffB / coeffA;
    prodX = coeffC / coeffA;

    if (delta > 0) {
      const sqrtDelta = Math.sqrt(delta);
      const x1 = (-coeffB - sqrtDelta) / (2 * coeffA);
      const y1 = kLine * x1 + mLine;
      const x2 = (-coeffB + sqrtDelta) / (2 * coeffA);
      const y2 = kLine * x2 + mLine;

      intersections.push({ x: x1, y: y1 });
      if (Math.abs(x2 - x1) > 1e-4 || Math.abs(y2 - y1) > 1e-4) {
        intersections.push({ x: x2, y: y2 });
      }
    }
  } else {
    // B = 0  => x = -C/A
    const xConst = -C / A;
    const dySquare = r * r - (xConst - a) * (xConst - a);
    delta = dySquare * 4; // 标识
    if (dySquare > 0) {
      const safeDy = Math.sqrt(dySquare);
      const y1 = b + safeDy;
      const y2 = b - safeDy;
      intersections.push({ x: xConst, y: y1 });
      if (safeDy > 1e-4) {
        intersections.push({ x: xConst, y: y2 });
      }
    }
  }

  // 5. 弦长计算
  let chordLengthGeom = 0;
  let chordLengthAlg = 0;
  if (relation === "intersect") {
    chordLengthGeom = 2 * Math.sqrt(Math.max(0, r * r - distance * distance));
    chordLengthAlg = chordLengthGeom; // 几何与代数弦长值相等
  }

  return {
    validity: "valid",
    distance,
    foot,
    relation,
    relationLabel,
    algebraic: {
      coeffA,
      coeffB,
      coeffC,
      delta,
      sumX,
      prodX,
    },
    intersections,
    chordLengthGeom,
    chordLengthAlg,
  };
}

/**
 * 主计算函数：计算直线与圆的位置关系、弦长、以及从 P 点引切线的切点与切点弦
 */
export function calculateLineCircle(
  params: LineCircleParams,
): LineCircleResult {
  const { a, b, r, k, m, px, py, mx, my } = params;

  // 1. 直线方程 kx - y + m = 0  => A=k, B=-1, C=m
  const A = k;
  const B = -1;
  const C = m;

  // 2. 调用基础几何计算器
  const baseRes = calculateBaseLineCircle(a, b, r, A, B, C);

  // 3. 弦中点与垂径定理
  const midpoint = baseRes.foot;
  const dx = baseRes.foot.x - a;
  const dy = baseRes.foot.y - b;
  const kCH = Math.abs(dx) > 1e-7 ? dy / dx : null;

  // 4. 切线与切线长 (模式3，仅当显式传入 px, py 且在圆外时才计算)
  let pointP: Point2D | undefined;
  let distPC: number | undefined;
  let tangentLength: number | undefined;
  let tangentPoints: Point2D[] | undefined;
  let secantLineEq:
    { A: number; B: number; C: number; latex: string } | undefined;

  if (px !== undefined && py !== undefined) {
    pointP = { x: px, y: py };
    distPC = Math.hypot(px - a, py - b);

    if (distPC > r + 1e-6) {
      tangentLength = Math.sqrt(distPC * distPC - r * r);

      // 切点弦方程: (px - a)(x - a) + (py - b)(y - b) = r^2
      // => (px - a)x + (py - b)y + [- (px - a)*a - (py - b)*b - r^2] = 0
      const secA = px - a;
      const secB = py - b;
      const secC = -secA * a - secB * b - r * r;

      secantLineEq = {
        A: secA,
        B: secB,
        C: secC,
        latex: `(${formatNumber(px - a)})(x - ${formatNumber(a)}) + (${formatNumber(py - b)})(y - ${formatNumber(b)}) = ${formatNumber(r * r)}`,
      };

      // 直接调用 calculateBaseLineCircle 计算切点弦与圆的交点（切点），绝不递归 calculateLineCircle！
      const subRes = calculateBaseLineCircle(a, b, r, secA, secB, secC);
      tangentPoints = subRes.intersections;
    }
  }

  // 5. 定点弦长最值分析 (模式2/相交弦长)
  let pointM: Point2D | undefined;
  let distMC: number | undefined;
  let maxChordLength: number | undefined;
  let minChordLength: number | undefined;
  let isInsideCircle: boolean | undefined;

  if (mx !== undefined && my !== undefined) {
    pointM = { x: mx, y: my };
    distMC = Math.hypot(mx - a, my - b);
    isInsideCircle = distMC < r - 1e-6;
    maxChordLength = 2 * r; // 直径
    if (distMC < r) {
      minChordLength = 2 * Math.sqrt(Math.max(0, r * r - distMC * distMC)); // 垂直弦
    } else {
      minChordLength = 0;
    }
  }

  return {
    ...baseRes,
    center: { x: a, y: b },
    radius: r,
    lineEq: { A, B, C },
    midpoint,
    kCH,
    pointP,
    distPC,
    tangentLength,
    tangentPoints,
    secantLineEq,
    pointM,
    distMC,
    maxChordLength,
    minChordLength,
    isInsideCircle,
  };
}

function formatNumber(n: number): string {
  const rounded = Math.round(n * 100) / 100;
  return rounded.toString();
}
