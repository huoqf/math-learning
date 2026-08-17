/**
 * 解三角形边角变换与最值范围纯数学计算引擎
 * 零副作用，纯函数实现
 */

export interface Point2D {
  x: number;
  y: number;
}

export interface TriangleExtremaState {
  isValid: boolean;
  warning?: string;
  isAcute?: boolean; // 当前三角形是否为锐角三角形
  // 顶点坐标
  vertices: {
    A: Point2D;
    B: Point2D;
    C: Point2D;
  };
  // 三边长
  sides: {
    a: number;
    b: number;
    c: number;
  };
  // 三内角（角度）
  angles: {
    A: number;
    B: number;
    C: number;
  };
  // 外接圆信息
  circumcircle: {
    center: Point2D;
    radius: number;
  };
  // 内切圆与特征线
  inscribed?: {
    incenter: Point2D;
    inradius: number;
    bisectorA: number; // 角 A 平分线长
    medianA: number; // 中线长
  };
  // 极值与范围指标
  extrema: {
    perimeter: number;
    maxPerimeter: number;
    minPerimeter?: number;
    area: number;
    maxArea: number;
    minArea?: number;
    sideSum: number; // b + c
    maxSideSum: number;
    minSideSum?: number;
    sideProduct: number; // b * c
    maxSideProduct: number;
    dotProduct: number; // \vec{AB} \cdot \vec{AC}
    minDotProduct?: number;
    maxDotProduct?: number;
    projectionSum: number; // b*cosC + c*cosB = a
  };
  // 锐角三角形约束范围 (角度 deg)
  acuteRange?: {
    isPossible: boolean;
    minAngleB: number;
    maxAngleB: number;
    maxPerimeter: number;
    minPerimeter: number;
    maxArea: number;
    minArea: number;
  };
  // 阿波罗尼斯圆参数（仅 apollonius 模式有效）
  apolloniusCircle?: {
    center: Point2D;
    radius: number;
    ratioK: number;
  };
  // 极化恒等式数据
  polarization?: {
    medianLength: number;
    constantDotProduct: number;
  };
}

/**
 * 度转弧度
 */
export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * 弧度转度
 */
export function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

/**
 * 计算锐角三角形约束下的角 B 范围与最值范围
 */
export function calcAcuteConstraints(angleADeg: number, sideA: number) {
  if (angleADeg >= 90 || angleADeg <= 0) {
    return {
      isPossible: false,
      minAngleB: 0,
      maxAngleB: 0,
      maxPerimeter: 0,
      minPerimeter: 0,
      maxArea: 0,
      minArea: 0,
    };
  }

  // 锐角条件：0 < B < 90, 0 < C = 180 - A - B < 90 => 90 - A < B < 90
  const minAngleB = Math.max(0.1, 90 - angleADeg);
  const maxAngleB = 90;

  const radA = degToRad(angleADeg);
  const R = sideA / (2 * Math.sin(radA));

  // 等腰对称点 B = (180 - A) / 2 一定在 (90 - A, 90) 区间内（因为 90 - A < 90 - A/2 < 90）
  const maxSideSum = sideA / Math.sin(radA / 2);
  const maxPerimeter = sideA + maxSideSum;
  const maxArea = (sideA * sideA) / (4 * Math.tan(radA / 2));

  // 端点处的下界（开区间极限点，B = 90 - A 或 B = 90，此时 C = 90 或 B = 90 直角临界）
  const radB_edge = degToRad(90 - angleADeg);
  const radC_edge = degToRad(90);
  const minSideSum = 2 * R * (Math.sin(radB_edge) + Math.sin(radC_edge));
  const minPerimeter = sideA + minSideSum;
  const minArea =
    0.5 *
    (2 * R * Math.sin(radB_edge)) *
    (2 * R * Math.sin(radC_edge)) *
    Math.sin(radA);

  return {
    isPossible: true,
    minAngleB,
    maxAngleB,
    maxPerimeter,
    minPerimeter,
    maxArea,
    minArea,
  };
}

/**
 * 1. 角化边模式 (angle-transform)：已知 A 和 a，变化内角 B
 */
export function solveAngleTransform(
  angleADeg: number,
  sideA: number,
  angleBDeg: number,
  isAcuteOnly = false,
): TriangleExtremaState {
  const angleCDeg = 180 - angleADeg - angleBDeg;

  if (
    angleADeg <= 0 ||
    angleADeg >= 180 ||
    angleBDeg <= 0 ||
    angleCDeg <= 0 ||
    sideA <= 0
  ) {
    return createInvalidState("内角和必须为 180° 且各内角大于 0°");
  }

  const isAcute = angleADeg < 90 && angleBDeg < 90 && angleCDeg < 90;

  if (isAcuteOnly && !isAcute) {
    if (angleADeg >= 90) {
      return createInvalidState(
        `角 A = ${angleADeg}° 为钝角/直角，无法构成锐角三角形`,
      );
    }
  }

  const radA = degToRad(angleADeg);
  const radB = degToRad(angleBDeg);
  const radC = degToRad(angleCDeg);

  // 正弦定理
  const R = sideA / (2 * Math.sin(radA));
  const sideB = 2 * R * Math.sin(radB);
  const sideC = 2 * R * Math.sin(radC);

  // 坐标布局：B 在 (-a/2, 0)，C 在 (a/2, 0)
  const B: Point2D = { x: -sideA / 2, y: 0 };
  const C: Point2D = { x: sideA / 2, y: 0 };

  // 顶点 A 坐标
  const Ax = -sideA / 2 + sideC * Math.cos(radB);
  const Ay = sideC * Math.sin(radB);
  const A: Point2D = { x: Ax, y: Ay };

  // 外接圆心
  const cy = Math.abs(Math.tan(radA)) < 1e-6 ? 0 : sideA / (2 * Math.tan(radA));
  const circumCenter: Point2D = { x: 0, y: cy };

  // 实时与最值计算
  const perimeter = sideA + sideB + sideC;
  const area = 0.5 * sideA * Ay;
  const sideSum = sideB + sideC;
  const sideProduct = sideB * sideC;

  // 全局最值条件（当 B = (180 - A) / 2 即等腰三角形时）
  const maxSideSum = sideA / Math.sin(radA / 2);
  const maxPerimeter = sideA + maxSideSum;
  const maxArea = (sideA * sideA) / (4 * Math.tan(radA / 2));
  const maxSideProduct =
    (sideA * sideA) / (4 * Math.sin(radA / 2) * Math.sin(radA / 2));

  // 向量数量积 \vec{AB} \cdot \vec{AC}
  const vecAB = { x: B.x - A.x, y: B.y - A.y };
  const vecAC = { x: C.x - A.x, y: C.y - A.y };
  const dotProduct = vecAB.x * vecAC.x + vecAB.y * vecAC.y;

  // 内切圆与特征线
  const inradius = (2 * area) / perimeter;
  const incenterX = (sideA * A.x + sideB * B.x + sideC * C.x) / perimeter;
  const incenterY = (sideA * A.y + sideB * B.y + sideC * C.y) / perimeter;
  const bisectorA = (2 * sideB * sideC * Math.cos(radA / 2)) / (sideB + sideC);
  const medianA =
    0.5 *
    Math.sqrt(
      Math.max(0, 2 * sideB * sideB + 2 * sideC * sideC - sideA * sideA),
    );

  // 射影定理验证值
  const projectionSum = sideB * Math.cos(radC) + sideC * Math.cos(radB);

  // 锐角约束分析
  const acuteRange = calcAcuteConstraints(angleADeg, sideA);

  return {
    isValid: true,
    isAcute,
    vertices: { A, B, C },
    sides: { a: sideA, b: sideB, c: sideC },
    angles: { A: angleADeg, B: angleBDeg, C: angleCDeg },
    circumcircle: {
      center: circumCenter,
      radius: R,
    },
    inscribed: {
      incenter: { x: incenterX, y: incenterY },
      inradius,
      bisectorA,
      medianA,
    },
    extrema: {
      perimeter,
      maxPerimeter: isAcuteOnly ? acuteRange.maxPerimeter : maxPerimeter,
      minPerimeter: isAcuteOnly ? acuteRange.minPerimeter : sideA * 2,
      area,
      maxArea: isAcuteOnly ? acuteRange.maxArea : maxArea,
      minArea: isAcuteOnly ? acuteRange.minArea : 0,
      sideSum,
      maxSideSum: isAcuteOnly ? acuteRange.maxPerimeter - sideA : maxSideSum,
      minSideSum: isAcuteOnly ? acuteRange.minPerimeter - sideA : sideA,
      sideProduct,
      maxSideProduct,
      dotProduct,
      projectionSum,
    },
    acuteRange,
  };
}

/**
 * 2. 均值不等式模式 (side-ineq)：已知 A, a，调整边 b
 */
export function solveSideIneq(
  angleADeg: number,
  sideA: number,
  sideB: number,
  isAcuteOnly = false,
): TriangleExtremaState {
  if (angleADeg <= 0 || angleADeg >= 180 || sideA <= 0 || sideB <= 0) {
    return createInvalidState("参数必须为正数");
  }

  const radA = degToRad(angleADeg);
  const cosA = Math.cos(radA);

  // 由余弦定理 c^2 - (2b cosA) c + (b^2 - a^2) = 0
  const delta =
    4 * sideB * sideB * cosA * cosA - 4 * (sideB * sideB - sideA * sideA);

  if (delta < 0) {
    return createInvalidState(
      `边 b = ${sideB.toFixed(1)} 过大，超出构成三角形极限`,
    );
  }

  const c1 = (2 * sideB * cosA + Math.sqrt(delta)) / 2;
  const c2 = (2 * sideB * cosA - Math.sqrt(delta)) / 2;

  // 优先取正解
  let sideC = c1 > 0 ? c1 : c2;
  if (sideC <= 0) {
    return createInvalidState("无法生成有效的第三边 c");
  }

  // 计算角 B
  const cosB =
    (sideA * sideA + sideC * sideC - sideB * sideB) / (2 * sideA * sideC);
  const clampedCosB = Math.max(-1, Math.min(1, cosB));
  const angleBDeg = radToDeg(Math.acos(clampedCosB));

  return solveAngleTransform(angleADeg, sideA, angleBDeg, isAcuteOnly);
}

/**
 * 3. 阿波罗尼斯圆模式 (apollonius)：底边 BC=a 固定，c/b = k，改变顶点 A 上的极角 theta
 */
export function solveApollonius(
  sideA: number,
  ratioK: number,
  thetaDeg: number,
): TriangleExtremaState {
  if (sideA <= 0 || ratioK <= 0 || Math.abs(ratioK - 1) < 1e-3) {
    return createInvalidState("比值 k 不能等于 1 (k=1 为中垂线退化情形)");
  }

  const k = ratioK;
  const a = sideA;

  // 阿氏圆方程 (x - x0)^2 + y^2 = R^2
  const x0 = ((k * k + 1) / (2 * (k * k - 1))) * a;
  const R_A = (k / Math.abs(k * k - 1)) * a;

  const radTheta = degToRad(thetaDeg);
  const Ax = x0 + R_A * Math.cos(radTheta);
  const Ay = R_A * Math.sin(radTheta);

  if (Math.abs(Ay) < 1e-3) {
    return createInvalidState("顶点 A 处于底边直线上（三点共线退化）");
  }

  const B: Point2D = { x: -a / 2, y: 0 };
  const C: Point2D = { x: a / 2, y: 0 };
  const A: Point2D = { x: Ax, y: Math.abs(Ay) }; // 取上方半圆

  // 计算三边长
  const sideC = Math.hypot(A.x - B.x, A.y - B.y);
  const sideB = Math.hypot(A.x - C.x, A.y - C.y);

  // 余弦定理求角 A
  const cosA = (sideB * sideB + sideC * sideC - a * a) / (2 * sideB * sideC);
  const angleADeg = radToDeg(Math.acos(Math.max(-1, Math.min(1, cosA))));

  const cosB = (a * a + sideC * sideC - sideB * sideB) / (2 * a * sideC);
  const angleBDeg = radToDeg(Math.acos(Math.max(-1, Math.min(1, cosB))));
  const angleCDeg = 180 - angleADeg - angleBDeg;

  const isAcute = angleADeg < 90 && angleBDeg < 90 && angleCDeg < 90;

  const radA = degToRad(angleADeg);
  const R_circum = a / (2 * Math.sin(radA));
  const cy = a / (2 * Math.tan(radA));

  const perimeter = a + sideB + sideC;
  const area = 0.5 * a * A.y;

  // 最值
  const maxArea = 0.5 * a * R_A;
  const maxPerimeter =
    a + (Math.abs(x0 - B.x) + R_A) + (Math.abs(x0 - C.x) + R_A);

  const vecAB = { x: B.x - A.x, y: B.y - A.y };
  const vecAC = { x: C.x - A.x, y: C.y - A.y };
  const dotProduct = vecAB.x * vecAC.x + vecAB.y * vecAC.y;

  const inradius = (2 * area) / perimeter;
  const incenterX = (a * A.x + sideB * B.x + sideC * C.x) / perimeter;
  const incenterY = (a * A.y + sideB * B.y + sideC * C.y) / perimeter;
  const bisectorA = (2 * sideB * sideC * Math.cos(radA / 2)) / (sideB + sideC);
  const medianA =
    0.5 * Math.sqrt(Math.max(0, 2 * sideB * sideB + 2 * sideC * sideC - a * a));

  return {
    isValid: true,
    isAcute,
    vertices: { A, B, C },
    sides: { a, b: sideB, c: sideC },
    angles: { A: angleADeg, B: angleBDeg, C: angleCDeg },
    circumcircle: { center: { x: 0, y: cy }, radius: R_circum },
    inscribed: {
      incenter: { x: incenterX, y: incenterY },
      inradius,
      bisectorA,
      medianA,
    },
    extrema: {
      perimeter,
      maxPerimeter,
      area,
      maxArea,
      sideSum: sideB + sideC,
      maxSideSum: maxPerimeter - a,
      sideProduct: sideB * sideC,
      maxSideProduct: (maxArea * 2) / Math.sin(radA),
      dotProduct,
      projectionSum:
        sideB * Math.cos(degToRad(angleCDeg)) +
        sideC * Math.cos(degToRad(angleBDeg)),
    },
    apolloniusCircle: {
      center: { x: x0, y: 0 },
      radius: R_A,
      ratioK: k,
    },
  };
}

/**
 * 4. 向量极化恒等式模式 (polarization)：底边 a 固定，中线长 m_a 固定，改变极角 theta
 */
export function solvePolarization(
  sideA: number,
  medianM: number,
  thetaDeg: number,
): TriangleExtremaState {
  if (sideA <= 0 || medianM <= 0) {
    return createInvalidState("边长和中线必须大于 0");
  }

  const a = sideA;
  const m = medianM;

  const radTheta = degToRad(thetaDeg);
  const Ax = m * Math.cos(radTheta);
  const Ay = m * Math.sin(radTheta);

  if (Math.abs(Ay) < 1e-3) {
    return createInvalidState("顶点 A 在底边上退化为线段");
  }

  const B: Point2D = { x: -a / 2, y: 0 };
  const C: Point2D = { x: a / 2, y: 0 };
  const A: Point2D = { x: Ax, y: Math.abs(Ay) };

  const sideC = Math.hypot(A.x - B.x, A.y - B.y);
  const sideB = Math.hypot(A.x - C.x, A.y - C.y);

  const cosA = (sideB * sideB + sideC * sideC - a * a) / (2 * sideB * sideC);
  const angleADeg = radToDeg(Math.acos(Math.max(-1, Math.min(1, cosA))));

  const cosB = (a * a + sideC * sideC - sideB * sideB) / (2 * a * sideC);
  const angleBDeg = radToDeg(Math.acos(Math.max(-1, Math.min(1, cosB))));
  const angleCDeg = 180 - angleADeg - angleBDeg;

  const isAcute = angleADeg < 90 && angleBDeg < 90 && angleCDeg < 90;

  const radA = degToRad(angleADeg);
  const R_circum = a / (2 * Math.sin(radA));
  const cy = a / (2 * Math.tan(radA));

  const perimeter = a + sideB + sideC;
  const area = 0.5 * a * A.y;
  const maxArea = 0.5 * a * m;

  // 极化恒等式: \vec{AB} \cdot \vec{AC} = |\vec{AM}|^2 - |\vec{BM}|^2 = m^2 - (a/2)^2
  const constantDotProduct = m * m - (a / 2) * (a / 2);

  const inradius = (2 * area) / perimeter;
  const incenterX = (a * A.x + sideB * B.x + sideC * C.x) / perimeter;
  const incenterY = (a * A.y + sideB * B.y + sideC * C.y) / perimeter;
  const bisectorA = (2 * sideB * sideC * Math.cos(radA / 2)) / (sideB + sideC);

  return {
    isValid: true,
    isAcute,
    vertices: { A, B, C },
    sides: { a, b: sideB, c: sideC },
    angles: { A: angleADeg, B: angleBDeg, C: angleCDeg },
    circumcircle: { center: { x: 0, y: cy }, radius: R_circum },
    inscribed: {
      incenter: { x: incenterX, y: incenterY },
      inradius,
      bisectorA,
      medianA: m,
    },
    extrema: {
      perimeter,
      maxPerimeter: a + 2 * Math.hypot(a / 2, m),
      area,
      maxArea,
      sideSum: sideB + sideC,
      maxSideSum: 2 * Math.hypot(a / 2, m),
      sideProduct: sideB * sideC,
      maxSideProduct: (maxArea * 2) / Math.sin(radA),
      dotProduct: constantDotProduct,
      projectionSum:
        sideB * Math.cos(degToRad(angleCDeg)) +
        sideC * Math.cos(degToRad(angleBDeg)),
    },
    polarization: {
      medianLength: m,
      constantDotProduct,
    },
  };
}

/**
 * 无效解兜底工厂函数
 */
function createInvalidState(warning: string): TriangleExtremaState {
  return {
    isValid: false,
    warning,
    vertices: {
      A: { x: 0, y: 3 },
      B: { x: -3, y: 0 },
      C: { x: 3, y: 0 },
    },
    sides: { a: 6, b: 5, c: 5 },
    angles: { A: 60, B: 60, C: 60 },
    circumcircle: { center: { x: 0, y: 1.732 }, radius: 3.464 },
    extrema: {
      perimeter: 16,
      maxPerimeter: 18,
      area: 9,
      maxArea: 10,
      sideSum: 10,
      maxSideSum: 12,
      sideProduct: 25,
      maxSideProduct: 36,
      dotProduct: 0,
      projectionSum: 6,
    },
  };
}
