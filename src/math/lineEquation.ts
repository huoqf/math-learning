/**
 * src/math/lineEquation.ts
 * 直线方程与距离计算纯函数层（零副作用、无 DOM/React 依赖）
 */

export interface GeneralLineCoeffs {
  A: number;
  B: number;
  C: number;
  isValid: boolean;
}

export interface Point2D {
  x: number;
  y: number;
}

export interface LineSegment {
  p1: Point2D;
  p2: Point2D;
}

export interface Bounds2D {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

export interface PointToLineResult {
  distance: number;
  foot: Point2D; // 垂足 Q
  isValid: boolean;
}

export type LineRelationType = "intersect" | "parallel" | "coincident";

export interface TwoLinesRelationResult {
  type: LineRelationType;
  intersection: Point2D | null;
  isPerpendicular: boolean;
  angleRad: number; // 两直线夹角（[0, pi/2] 弧度）
  angleDeg: number; // 角度
  distance: number | null; // 若平行，两条平行线间的距离
  isValid: boolean;
}

/**
 * 规范化一般式系数，消除比例缩放带来的不确定性，使 A^2 + B^2 归一化或保留标准形式
 */
export function normalizeLineCoeffs(
  A: number,
  B: number,
  C: number,
): GeneralLineCoeffs {
  if (Math.abs(A) < 1e-9 && Math.abs(B) < 1e-9) {
    return { A: 0, B: 0, C, isValid: false };
  }
  return { A, B, C, isValid: true };
}

/**
 * 将五种方程形式统一转换为一般式 Ax + By + C = 0
 */
export function convertFormToGeneral(
  form: "pointSlope" | "slopeIntercept" | "twoPoint" | "intercept" | "general",
  params: {
    k?: number;
    x0?: number;
    y0?: number;
    b?: number;
    x1?: number;
    y1?: number;
    x2?: number;
    y2?: number;
    a?: number;
    A?: number;
    B?: number;
    C?: number;
  },
): GeneralLineCoeffs {
  switch (form) {
    case "pointSlope": {
      const k = params.k ?? 1;
      const x0 = params.x0 ?? 0;
      const y0 = params.y0 ?? 0;
      // y - y0 = k(x - x0) => k x - y + (y0 - k x0) = 0
      return normalizeLineCoeffs(k, -1, y0 - k * x0);
    }
    case "slopeIntercept": {
      const k = params.k ?? 1;
      const b = params.b ?? 0;
      // y = k x + b => k x - y + b = 0
      return normalizeLineCoeffs(k, -1, b);
    }
    case "twoPoint": {
      const x1 = params.x1 ?? -2;
      const y1 = params.y1 ?? -1;
      const x2 = params.x2 ?? 2;
      const y2 = params.y2 ?? 3;
      // (y2 - y1)x - (x2 - x1)y + (x1 y2 - x2 y1) = 0
      const A = y2 - y1;
      const B = -(x2 - x1);
      const C = x1 * y2 - x2 * y1;
      return normalizeLineCoeffs(A, B, C);
    }
    case "intercept": {
      const a = params.a ?? 3;
      const b = params.b ?? 2;
      // x/a + y/b = 1 => b x + a y - a b = 0
      if (Math.abs(a) < 1e-9 || Math.abs(b) < 1e-9) {
        return { A: 0, B: 0, C: 0, isValid: false };
      }
      return normalizeLineCoeffs(b, a, -a * b);
    }
    case "general":
    default: {
      const A = params.A ?? 1;
      const B = params.B ?? -1;
      const C = params.C ?? 0;
      return normalizeLineCoeffs(A, B, C);
    }
  }
}

/**
 * 根据坐标系边界求解直线 Ax + By + C = 0 在视口内的剪裁端点
 */
export function getLineSegmentInBounds(
  A: number,
  B: number,
  C: number,
  bounds: Bounds2D,
): LineSegment | null {
  if (Math.abs(A) < 1e-9 && Math.abs(B) < 1e-9) return null;

  const points: Point2D[] = [];
  const eps = 1e-7;

  // 1. 与 x = xMin 相交
  if (Math.abs(B) > 1e-9) {
    const y = (-C - A * bounds.xMin) / B;
    if (y >= bounds.yMin - eps && y <= bounds.yMax + eps) {
      points.push({ x: bounds.xMin, y });
    }
  }

  // 2. 与 x = xMax 相交
  if (Math.abs(B) > 1e-9) {
    const y = (-C - A * bounds.xMax) / B;
    if (y >= bounds.yMin - eps && y <= bounds.yMax + eps) {
      points.push({ x: bounds.xMax, y });
    }
  }

  // 3. 与 y = yMin 相交
  if (Math.abs(A) > 1e-9) {
    const x = (-C - B * bounds.yMin) / A;
    if (x >= bounds.xMin - eps && x <= bounds.xMax + eps) {
      points.push({ x, y: bounds.yMin });
    }
  }

  // 4. 与 y = yMax 相交
  if (Math.abs(A) > 1e-9) {
    const x = (-C - B * bounds.yMax) / A;
    if (x >= bounds.xMin - eps && x <= bounds.xMax + eps) {
      points.push({ x, y: bounds.yMax });
    }
  }

  // 去重（顶点可能重复计算）
  const uniquePoints: Point2D[] = [];
  for (const pt of points) {
    const isDuplicate = uniquePoints.some(
      (u) => Math.hypot(u.x - pt.x, u.y - pt.y) < 1e-5,
    );
    if (!isDuplicate) {
      uniquePoints.push(pt);
    }
  }

  if (uniquePoints.length >= 2) {
    return { p1: uniquePoints[0], p2: uniquePoints[1] };
  }

  return null;
}

/**
 * 计算点 P(x0, y0) 到直线 Ax + By + C = 0 的距离及垂足 Q(xH, yH)
 */
export function calcPointToLineDistance(
  x0: number,
  y0: number,
  A: number,
  B: number,
  C: number,
): PointToLineResult {
  const denomSq = A * A + B * B;
  if (denomSq < 1e-12) {
    return { distance: 0, foot: { x: x0, y: y0 }, isValid: false };
  }

  const distance = Math.abs(A * x0 + B * y0 + C) / Math.sqrt(denomSq);

  // 垂足坐标公式
  const xH = (B * B * x0 - A * B * y0 - A * C) / denomSq;
  const yH = (A * A * y0 - A * B * x0 - B * C) / denomSq;

  return {
    distance,
    foot: { x: xH, y: yH },
    isValid: true,
  };
}

/**
 * 计算两条直线 L1: A1 x + B1 y + C1 = 0 与 L2: A2 x + B2 y + C2 = 0 的位置关系
 */
export function calcTwoLinesRelation(
  A1: number,
  B1: number,
  C1: number,
  A2: number,
  B2: number,
  C2: number,
): TwoLinesRelationResult {
  const norm1 = Math.hypot(A1, B1);
  const norm2 = Math.hypot(A2, B2);

  if (norm1 < 1e-9 || norm2 < 1e-9) {
    return {
      type: "intersect",
      intersection: null,
      isPerpendicular: false,
      angleRad: 0,
      angleDeg: 0,
      distance: null,
      isValid: false,
    };
  }

  const D = A1 * B2 - A2 * B1; // 交叉积

  // 判断垂直：A1 A2 + B1 B2 = 0
  const dot = A1 * A2 + B1 * B2;
  const isPerpendicular = Math.abs(dot) < 1e-7;

  // 夹角 cos theta = |A1 A2 + B1 B2| / (norm1 * norm2)
  const cosVal = Math.min(1, Math.max(0, Math.abs(dot) / (norm1 * norm2)));
  const angleRad = Math.acos(cosVal);
  const angleDeg = (angleRad * 180) / Math.PI;

  // 平行/重合判断：|D| 非常小
  if (Math.abs(D) < 1e-7) {
    // 检查 C1 与 C2 是否成比例
    // 归一化对比 C
    const scaledC2 = C2 * (A1 !== 0 ? A1 / A2 : B1 / B2);
    const isCoincident = Math.abs(C1 - scaledC2) < 1e-5;

    if (isCoincident) {
      return {
        type: "coincident",
        intersection: null,
        isPerpendicular: false,
        angleRad: 0,
        angleDeg: 0,
        distance: 0,
        isValid: true,
      };
    } else {
      // 平行线距离：d = |C1 - C2'| / sqrt(A^2 + B^2)，此处公式需要同比例化系数
      // 将 L2 系数乘上 factor 使得 (A2', B2') 尽量贴近 (A1, B1)
      const factor = (A1 * A2 + B1 * B2) / (A2 * A2 + B2 * B2);
      const A2_adj = A2 * factor;
      const B2_adj = B2 * factor;
      const C2_adj = C2 * factor;
      const avgA = (A1 + A2_adj) / 2;
      const avgB = (B1 + B2_adj) / 2;
      const dist = Math.abs(C1 - C2_adj) / Math.hypot(avgA, avgB);

      return {
        type: "parallel",
        intersection: null,
        isPerpendicular: false,
        angleRad: 0,
        angleDeg: 0,
        distance: dist,
        isValid: true,
      };
    }
  }

  // 相交，求交点
  const xInt = (B1 * C2 - B2 * C1) / D;
  const yInt = (C1 * A2 - C2 * A1) / D;

  return {
    type: "intersect",
    intersection: { x: xInt, y: yInt },
    isPerpendicular,
    angleRad,
    angleDeg,
    distance: null,
    isValid: true,
  };
}

/**
 * 计算直线的斜率、倾斜角、x/y截距
 */
export function getLineProperties(A: number, B: number, C: number) {
  if (Math.abs(A) < 1e-9 && Math.abs(B) < 1e-9) {
    return {
      slope: null,
      inclinationDeg: 0,
      inclinationRad: 0,
      xIntercept: null,
      yIntercept: null,
      isValid: false,
    };
  }

  let slope: number | null = null;
  let inclinationRad = 0;
  let inclinationDeg = 0;

  if (Math.abs(B) < 1e-9) {
    // 垂直于 x 轴，斜率不存在
    slope = null;
    inclinationRad = Math.PI / 2;
    inclinationDeg = 90;
  } else {
    slope = -A / B;
    if (slope >= 0) {
      inclinationRad = Math.atan(slope);
    } else {
      inclinationRad = Math.atan(slope) + Math.PI;
    }
    inclinationDeg = (inclinationRad * 180) / Math.PI;
  }

  const xIntercept = Math.abs(A) > 1e-9 ? -C / A : null;
  const yIntercept = Math.abs(B) > 1e-9 ? -C / B : null;

  return {
    slope,
    inclinationDeg,
    inclinationRad,
    xIntercept,
    yIntercept,
    isValid: true,
  };
}

/**
 * 格式化一般式方程 Ax + By + C = 0 的标准 LaTeX
 */
export function formatGeneralEquationLatex(
  A: number,
  B: number,
  C: number,
  colors?: { cA?: string; cB?: string; cC?: string },
): string {
  const parts: string[] = [];

  // A*x 项
  if (Math.abs(A) > 1e-9) {
    const aAbs = Math.abs(A);
    const aStr = aAbs === 1 ? "" : aAbs.toFixed(1);
    const sign = A < 0 ? "-" : "";
    const term = `${sign}${aStr}x`;
    parts.push(colors?.cA ? `\\color{${colors.cA}}{${term}}` : term);
  }

  // B*y 项
  if (Math.abs(B) > 1e-9) {
    const bAbs = Math.abs(B);
    const bStr = bAbs === 1 ? "" : bAbs.toFixed(1);
    const sign = parts.length > 0 ? (B > 0 ? "+ " : "- ") : B < 0 ? "-" : "";
    const term = `${sign}${bStr}y`;
    parts.push(colors?.cB ? `\\color{${colors.cB}}{${term}}` : term);
  }

  // C 项
  if (Math.abs(C) > 1e-9 || parts.length === 0) {
    const cAbs = Math.abs(C);
    const sign = parts.length > 0 ? (C > 0 ? "+ " : "- ") : C < 0 ? "-" : "";
    const term = `${sign}${cAbs.toFixed(1)}`;
    parts.push(colors?.cC ? `\\color{${colors.cC}}{${term}}` : term);
  }

  return `${parts.join(" ")} = 0`;
}
