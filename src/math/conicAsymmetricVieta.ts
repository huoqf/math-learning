/**
 * src/math/conicAsymmetricVieta.ts
 * 解析几何高阶核心：非对称韦达和积互化、隐圆轨迹与对称最短折线（Zero Side-effects）
 */

export type ConicAsymStudyMode =
  "asymVieta" | "hiddenCircle" | "symmetryShortest";

export type HiddenCircleType = "diameter" | "fixedAngle" | "distSumSq";

export interface AsymVietaResult {
  a: number;
  b: number;
  x0: number;
  m: number;
  ptA: { x: number; y: number };
  ptB: { x: number; y: number };
  ptP: { x: number; y: number };
  ptQ: { x: number; y: number };
  ptT: { x: number; y: number };
  fixedLineX: number;
  ySum: number;
  yProd: number;
  /** 和积互化比值 m*y1*y2 / (y1+y2) = (a^2 - x0^2)/(2*x0) */
  vietaRatioConst: number;
  validity: "ok" | "invalid_x0";
}

export interface HiddenCircleResult {
  circleType: HiddenCircleType;
  ptA: { x: number; y: number };
  ptB: { x: number; y: number };
  center: { x: number; y: number };
  radius: number;
  ptP: { x: number; y: number };
  /** 定弦定角圆上方同侧合法圆弧的方位角区间 [minPhi, maxPhi]（弧度） */
  validArcRange?: [number, number];
  /** 当前测度（如点积、圆周角角度、平方和） */
  measureValue: number;
  targetValue: number;
  validity: "ok" | "degenerate";
}

export interface SymmetryShortestResult {
  ptA: { x: number; y: number };
  ptB: { x: number; y: number };
  ptAPrime: { x: number; y: number };
  ptP: { x: number; y: number };
  ptOptP: { x: number; y: number };
  isSameSide: boolean;
  currentSum: number;
  minSum: number;
  lineK: number;
  lineB: number;
}

/** 椭圆非对称韦达：过 M(x0, 0) 的直线 x = m*y + x0 交椭圆，求 PA 与 QB 交点 T */
export function calcAsymVieta(
  aRaw: number,
  bRaw: number,
  x0Raw: number,
  m: number,
): AsymVietaResult {
  const a = Math.max(2.0, aRaw);
  const b = Math.max(1.0, Math.min(a - 0.3, bRaw));
  const x0 =
    Math.abs(x0Raw) < 0.3
      ? 1.5
      : Math.sign(x0Raw) * Math.min(a - 0.3, Math.abs(x0Raw));

  const ptP = { x: -a, y: 0 };
  const ptQ = { x: a, y: 0 };

  if (Math.abs(x0) >= a - 1e-4) {
    return {
      a,
      b,
      x0,
      m,
      ptA: { x: 0, y: b },
      ptB: { x: 0, y: -b },
      ptP,
      ptQ,
      ptT: { x: a * 2, y: 0 },
      fixedLineX: (a * a) / x0,
      ySum: 0,
      yProd: 0,
      vietaRatioConst: 0,
      validity: "invalid_x0",
    };
  }

  // (b^2 * m^2 + a^2) y^2 + 2 b^2 m x0 y + b^2(x0^2 - a^2) = 0
  const A = b * b * m * m + a * a;
  const B = 2 * b * b * m * x0;
  const C = b * b * (x0 * x0 - a * a);
  const disc = Math.max(0, B * B - 4 * A * C);
  const sqrtDisc = Math.sqrt(disc);

  // 取 y1 > 0, y2 < 0 对应上、下两点
  const y1 = (-B + sqrtDisc) / (2 * A);
  const y2 = (-B - sqrtDisc) / (2 * A);
  const x1 = m * y1 + x0;
  const x2 = m * y2 + x0;

  const fixedLineX = (a * a) / x0;
  // 直线 PA 过 (-a, 0) 和 (x1, y1): y = [y1/(x1+a)](x+a)
  const kPA = y1 / (x1 + a);
  const yT = kPA * (fixedLineX + a);

  return {
    a,
    b,
    x0,
    m,
    ptA: { x: x1, y: y1 },
    ptB: { x: x2, y: y2 },
    ptP,
    ptQ,
    ptT: { x: fixedLineX, y: yT },
    fixedLineX,
    ySum: -B / A,
    yProd: C / A,
    vietaRatioConst: (a * a - x0 * x0) / (2 * x0),
    validity: "ok",
  };
}

/** 隐圆三大高频构型 */
export function calcHiddenCircle(
  circleType: HiddenCircleType,
  halfSpanRaw: number,
  paramRaw: number,
  angleDeg: number,
): HiddenCircleResult {
  const halfSpan = Math.max(1.0, Math.min(3.0, halfSpanRaw));
  const ptA = { x: -halfSpan, y: 0 };
  const ptB = { x: halfSpan, y: 0 };
  const rad = (angleDeg * Math.PI) / 180;

  if (circleType === "diameter") {
    const center = { x: 0, y: 0 };
    const radius = halfSpan;
    const ptP = {
      x: center.x + radius * Math.cos(rad),
      y: center.y + radius * Math.sin(rad),
    };
    const dot =
      (ptP.x - ptA.x) * (ptP.x - ptB.x) + (ptP.y - ptA.y) * (ptP.y - ptB.y);
    return {
      circleType,
      ptA,
      ptB,
      center,
      radius,
      ptP,
      measureValue: dot,
      targetValue: 0,
      validity: "ok",
    };
  }

  if (circleType === "fixedAngle") {
    const thetaDeg = Math.max(30, Math.min(135, paramRaw));
    const thetaRad = (thetaDeg * Math.PI) / 180;
    const radius = halfSpan / Math.sin(thetaRad);
    const centerY = halfSpan / Math.tan(thetaRad);
    const center = { x: 0, y: centerY };
    // 弦 AB 端点相对圆心 O 的极角分别为 θ - π/2 与 3π/2 - θ，须严限 P 落在同侧上方圆弧内（防钝角越界至补角弧）
    const arcMinPhi = thetaRad - Math.PI / 2;
    const arcMaxPhi = (3 * Math.PI) / 2 - thetaRad;
    const minPhi = Math.max(0.15, arcMinPhi + 0.12);
    const maxPhi = Math.min(Math.PI - 0.15, arcMaxPhi - 0.12);
    const safePhi = Math.max(minPhi, Math.min(maxPhi, rad));
    const ptP = {
      x: center.x + radius * Math.cos(safePhi),
      y: center.y + radius * Math.sin(safePhi),
    };
    const vAx = ptA.x - ptP.x;
    const vAy = ptA.y - ptP.y;
    const vBx = ptB.x - ptP.x;
    const vBy = ptB.y - ptP.y;
    const normA = Math.hypot(vAx, vAy);
    const normB = Math.hypot(vBx, vBy);
    const cosAng =
      normA > 1e-6 && normB > 1e-6
        ? Math.max(-1, Math.min(1, (vAx * vBx + vAy * vBy) / (normA * normB)))
        : 1;
    const actualDeg = (Math.acos(cosAng) * 180) / Math.PI;
    return {
      circleType,
      ptA,
      ptB,
      center,
      radius,
      ptP,
      validArcRange: [arcMinPhi + 0.02, arcMaxPhi - 0.02],
      measureValue: actualDeg,
      targetValue: thetaDeg,
      validity: "ok",
    };
  }

  // distSumSq: PA^2 + PB^2 = k => 2*PO^2 + 2*halfSpan^2 = k => R = sqrt(k/2 - halfSpan^2)
  const minK = 2 * halfSpan * halfSpan + 1.0;
  const k = Math.max(minK, paramRaw);
  const radius = Math.sqrt(Math.max(0.1, k / 2 - halfSpan * halfSpan));
  const center = { x: 0, y: 0 };
  const ptP = {
    x: radius * Math.cos(rad),
    y: radius * Math.sin(rad),
  };
  const sqSum =
    (ptP.x - ptA.x) ** 2 +
    (ptP.y - ptA.y) ** 2 +
    (ptP.x - ptB.x) ** 2 +
    (ptP.y - ptB.y) ** 2;

  return {
    circleType,
    ptA,
    ptB,
    center,
    radius,
    ptP,
    measureValue: sqSum,
    targetValue: k,
    validity: radius > 0.05 ? "ok" : "degenerate",
  };
}

/** 将军饮马与点线对称最短路径（直线 y = k*x + b，自动判别同侧反射或异侧直连） */
export function calcSymmetryShortest(
  lineK: number,
  lineB: number,
  pXRaw: number,
): SymmetryShortestResult {
  const ptA = { x: -2.5, y: 2.2 };
  const ptB = { x: 2.5, y: 1.8 };

  const sA = ptA.y - (lineK * ptA.x + lineB);
  const sB = ptB.y - (lineK * ptB.x + lineB);
  const isSameSide = sA * sB > 1e-6;

  // 点 (x0, y0) 关于 lineK*x - y + lineB = 0 的对称点
  const denom = lineK * lineK + 1;
  const factor = (2 * (lineK * ptA.x - ptA.y + lineB)) / denom;
  const ptAPrime = {
    x: ptA.x - lineK * factor,
    y: ptA.y + factor,
  };

  let ptOptP: { x: number; y: number };
  let minSum: number;
  if (isSameSide) {
    // 同侧：A'B 与直线 y = lineK*x + lineB 的交点即最优 P*
    const dx = ptB.x - ptAPrime.x;
    const dy = ptB.y - ptAPrime.y;
    const tOpt =
      Math.abs(dy - lineK * dx) > 1e-6
        ? (lineK * ptAPrime.x - ptAPrime.y + lineB) / (dy - lineK * dx)
        : 0.5;
    ptOptP = {
      x: ptAPrime.x + tOpt * dx,
      y: ptAPrime.y + tOpt * dy,
    };
    minSum = Math.hypot(ptB.x - ptAPrime.x, ptB.y - ptAPrime.y);
  } else {
    // 异侧或点在轴上：两点之间线段最短，直连 AB 与直线交点即为 P*
    const sDiff = sA - sB;
    const tOpt = Math.abs(sDiff) > 1e-8 ? sA / sDiff : 0.5;
    ptOptP = {
      x: ptA.x + tOpt * (ptB.x - ptA.x),
      y: ptA.y + tOpt * (ptB.y - ptA.y),
    };
    minSum = Math.hypot(ptB.x - ptA.x, ptB.y - ptA.y);
  }

  const pX = Math.max(-4.5, Math.min(4.5, pXRaw));
  const ptP = { x: pX, y: lineK * pX + lineB };
  const currentSum =
    Math.hypot(ptP.x - ptA.x, ptP.y - ptA.y) +
    Math.hypot(ptP.x - ptB.x, ptP.y - ptB.y);

  return {
    ptA,
    ptB,
    ptAPrime,
    ptP,
    ptOptP,
    isSameSide,
    currentSum,
    minSum,
    lineK,
    lineB,
  };
}
