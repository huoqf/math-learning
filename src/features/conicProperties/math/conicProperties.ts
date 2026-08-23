export type ConicType = "ellipse" | "hyperbola";

export interface Point2D {
  x: number;
  y: number;
}

export interface ConicMathResult {
  conicType: ConicType;
  a: number;
  b: number;
  c: number;
  e: number;
  foci: { F1: Point2D; F2: Point2D };
  vertices: { A1: Point2D; A2: Point2D; B1: Point2D; B2: Point2D };
  directrices: { leftX: number; rightX: number };
  latusRectum: {
    length: number;
    points: { top: Point2D; bottom: Point2D };
  };
  asymptotes?: { slope: number; angleRad: number };
  pointP: Point2D;
  focusTriangle: {
    r1: number;
    r2: number;
    angleRad: number; // 顶角 \theta (rad)
    angleDeg: number;
    areaGeom: number; // S = c * |y_P|
    areaTheoretical: number; // S = b^2 * tan(\theta/2) 或 b^2 / tan(\theta/2)
    maxAngleRad: number; // 椭圆最大顶角
    incircle: {
      incenter: Point2D;
      inradius: number;
      tangentBase: Point2D;
    };
  };
}

/**
 * 纯解算代码：计算椭圆或双曲线的全套几何性质与焦点三角形
 */
export function calculateConicProperties(
  conicType: ConicType,
  a: number,
  b: number,
  t: number,
): ConicMathResult {
  const safeA = Math.max(0.5, a);
  let safeB = Math.max(0.2, b);

  if (conicType === "ellipse" && safeB >= safeA) {
    safeB = safeA - 0.01; // 保持 a > b
  }

  // 1. 半焦距 c & 离心率 e
  const c =
    conicType === "ellipse"
      ? Math.sqrt(Math.max(0, safeA * safeA - safeB * safeB))
      : Math.sqrt(safeA * safeA + safeB * safeB);

  const e = c / safeA;

  // 2. 焦点与顶点
  const F1: Point2D = { x: -c, y: 0 };
  const F2: Point2D = { x: c, y: 0 };
  const A1: Point2D = { x: -safeA, y: 0 };
  const A2: Point2D = { x: safeA, y: 0 };
  const B1: Point2D = { x: 0, y: -safeB };
  const B2: Point2D = { x: 0, y: safeB };

  // 3. 准线方程 x = +/- a^2 / c
  const dirX = (safeA * safeA) / c;
  const directrices = { leftX: -dirX, rightX: dirX };

  // 4. 通径：过焦点 F2 垂直于 x 轴的弦长 L = 2 b^2 / a
  const lrLength = (2 * safeB * safeB) / safeA;
  const latusRectum = {
    length: lrLength,
    points: {
      top: { x: c, y: lrLength / 2 },
      bottom: { x: c, y: -lrLength / 2 },
    },
  };

  // 5. 渐近线 (仅双曲线)
  let asymptotes;
  if (conicType === "hyperbola") {
    const slope = safeB / safeA;
    asymptotes = {
      slope,
      angleRad: Math.atan(slope) * 2,
    };
  }

  // 6. 动点 P 坐标解算
  let px: number;
  let py: number;

  if (conicType === "ellipse") {
    px = safeA * Math.cos(t);
    py = safeB * Math.sin(t);
  } else {
    // 双曲线右支参数方程 x = a sec(t), y = b tan(t)，限制 t \in (-1.35, 1.35) 避免溢出
    const safeT = Math.max(-1.35, Math.min(1.35, t));
    px = safeA / Math.cos(safeT);
    py = safeB * Math.tan(safeT);
  }

  const pointP: Point2D = { x: px, y: py };

  // 7. 焦点三角形 \triangle PF_1F_2 解算
  const vecPF1 = { x: F1.x - px, y: F1.y - py };
  const vecPF2 = { x: F2.x - px, y: F2.y - py };

  const r1 = Math.hypot(vecPF1.x, vecPF1.y);
  const r2 = Math.hypot(vecPF2.x, vecPF2.y);

  const dot = vecPF1.x * vecPF2.x + vecPF1.y * vecPF2.y;
  const cosTheta = Math.max(-1, Math.min(1, dot / (r1 * r2)));
  const angleRad = Math.acos(cosTheta);
  const angleDeg = (angleRad * 180) / Math.PI;

  const areaGeom = c * Math.abs(py);

  const halfTheta = angleRad / 2;
  const tanHalf = Math.tan(halfTheta);

  let areaTheoretical: number;
  if (conicType === "ellipse") {
    areaTheoretical = safeB * safeB * tanHalf;
  } else {
    areaTheoretical = tanHalf > 1e-4 ? (safeB * safeB) / tanHalf : 0;
  }

  // 椭圆短轴端点处顶角最大值 \tan(\theta_{max}/2) = c / b
  const maxAngleRad =
    conicType === "ellipse" ? 2 * Math.atan(c / safeB) : Math.PI;

  // 8. 焦点三角形内切圆解算 (Incircle)
  const sideA = r2; // F2P 对面为 F1
  const sideB = r1; // F1P 对面为 F2
  const sideC = 2 * c; // F1F2 对面为 P
  const perimeter = sideA + sideB + sideC;

  const incenter: Point2D = {
    x: (sideA * F1.x + sideB * F2.x + sideC * px) / (perimeter || 1),
    y: (sideA * F1.y + sideB * F2.y + sideC * py) / (perimeter || 1),
  };

  const inradius = areaGeom / (perimeter / 2 || 1);

  // 底边切点坐标 (落在 x 轴上)
  // 对椭圆：切点坐标 x = e^2 * x_P
  const tangentBaseX = conicType === "ellipse" ? e * e * px : incenter.x;
  const tangentBase: Point2D = { x: tangentBaseX, y: 0 };

  return {
    conicType,
    a: safeA,
    b: safeB,
    c,
    e,
    foci: { F1, F2 },
    vertices: { A1, A2, B1, B2 },
    directrices,
    latusRectum,
    asymptotes,
    pointP,
    focusTriangle: {
      r1,
      r2,
      angleRad,
      angleDeg,
      areaGeom,
      areaTheoretical,
      maxAngleRad,
      incircle: {
        incenter,
        inradius,
        tangentBase,
      },
    },
  };
}

/**
 * 根据给定的离心率 e 和 a，自动算出对应的 b (用于离心率模式下参数换算)
 */
export function deriveBFromEccentricity(
  conicType: ConicType,
  a: number,
  e: number,
): number {
  const safeA = Math.max(0.5, a);
  if (conicType === "ellipse") {
    const safeE = Math.min(0.99, Math.max(0.01, e));
    return safeA * Math.sqrt(1 - safeE * safeE);
  } else {
    const safeE = Math.max(1.01, e);
    return safeA * Math.sqrt(safeE * safeE - 1);
  }
}
