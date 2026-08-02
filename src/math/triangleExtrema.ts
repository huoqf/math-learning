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
  // 极值与范围指标
  extrema: {
    perimeter: number;
    maxPerimeter: number;
    area: number;
    maxArea: number;
    sideSum: number; // b + c
    maxSideSum: number;
    dotProduct: number; // \vec{AB} \cdot \vec{AC}
    minDotProduct?: number;
    maxDotProduct?: number;
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
 * 1. 角化边模式 (angle-transform)：已知 A 和 a，变化内角 B
 */
export function solveAngleTransform(
  angleADeg: number,
  sideA: number,
  angleBDeg: number
): TriangleExtremaState {
  const angleCDeg = 180 - angleADeg - angleBDeg;

  if (angleADeg <= 0 || angleADeg >= 180 || angleBDeg <= 0 || angleCDeg <= 0 || sideA <= 0) {
    return createInvalidState("内角和必须为 180° 且各内角大于 0°");
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

  // 最值条件（当 B = (180 - A) / 2 即等腰三角形时）
  const maxSideSum = sideA / Math.sin(radA / 2);
  const maxPerimeter = sideA + maxSideSum;
  const maxArea = (sideA * sideA) / (4 * Math.tan(radA / 2));

  // 向量数量积 \vec{AB} \cdot \vec{AC}
  const vecAB = { x: B.x - A.x, y: B.y - A.y };
  const vecAC = { x: C.x - A.x, y: C.y - A.y };
  const dotProduct = vecAB.x * vecAC.x + vecAB.y * vecAC.y;

  return {
    isValid: true,
    vertices: { A, B, C },
    sides: { a: sideA, b: sideB, c: sideC },
    angles: { A: angleADeg, B: angleBDeg, C: angleCDeg },
    circumcircle: { center: circumCenter, radius: R },
    extrema: {
      perimeter,
      maxPerimeter,
      area,
      maxArea,
      sideSum,
      maxSideSum,
      dotProduct,
    },
  };
}

/**
 * 2. 均值不等式模式 (side-ineq)：已知 A, a，调整边 b
 */
export function solveSideIneq(
  angleADeg: number,
  sideA: number,
  sideB: number
): TriangleExtremaState {
  if (angleADeg <= 0 || angleADeg >= 180 || sideA <= 0 || sideB <= 0) {
    return createInvalidState("参数必须为正数");
  }

  const radA = degToRad(angleADeg);
  const cosA = Math.cos(radA);

  // 由余弦定理 c^2 - (2b cosA) c + (b^2 - a^2) = 0
  const delta = 4 * sideB * sideB * cosA * cosA - 4 * (sideB * sideB - sideA * sideA);

  if (delta < 0) {
    return createInvalidState(`边 b = ${sideB.toFixed(1)} 过大，超出构成三角形极限`);
  }

  const c1 = (2 * sideB * cosA + Math.sqrt(delta)) / 2;
  const c2 = (2 * sideB * cosA - Math.sqrt(delta)) / 2;

  // 优先取正解
  let sideC = c1 > 0 ? c1 : c2;
  if (sideC <= 0) {
    return createInvalidState("无法生成有效的第三边 c");
  }

  // 计算角 B
  const cosB = (sideA * sideA + sideC * sideC - sideB * sideB) / (2 * sideA * sideC);
  const clampedCosB = Math.max(-1, Math.min(1, cosB));
  const angleBDeg = radToDeg(Math.acos(clampedCosB));

  return solveAngleTransform(angleADeg, sideA, angleBDeg);
}

/**
 * 3. 阿波罗尼斯圆模式 (apollonius)：底边 BC=a 固定，c/b = k，改变顶点 A 上的极角 theta
 */
export function solveApollonius(
  sideA: number,
  ratioK: number,
  thetaDeg: number
): TriangleExtremaState {
  if (sideA <= 0 || ratioK <= 0 || ratioK === 1) {
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

  if (Math.abs(Ay) < 1e-4) {
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

  const R_circum = a / (2 * Math.sin(degToRad(angleADeg)));
  const cy = a / (2 * Math.tan(degToRad(angleADeg)));

  const perimeter = a + sideB + sideC;
  const area = 0.5 * a * A.y;

  // 最值
  const maxArea = 0.5 * a * R_A;
  const maxPerimeter = a + (Math.abs(x0 - B.x) + R_A) + (Math.abs(x0 - C.x) + R_A);

  const vecAB = { x: B.x - A.x, y: B.y - A.y };
  const vecAC = { x: C.x - A.x, y: C.y - A.y };
  const dotProduct = vecAB.x * vecAC.x + vecAB.y * vecAC.y;

  return {
    isValid: true,
    vertices: { A, B, C },
    sides: { a, b: sideB, c: sideC },
    angles: { A: angleADeg, B: angleBDeg, C: angleCDeg },
    circumcircle: { center: { x: 0, y: cy }, radius: R_circum },
    extrema: {
      perimeter,
      maxPerimeter,
      area,
      maxArea,
      sideSum: sideB + sideC,
      maxSideSum: maxPerimeter - a,
      dotProduct,
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
  thetaDeg: number
): TriangleExtremaState {
  if (sideA <= 0 || medianM <= 0) {
    return createInvalidState("边长和中线必须大于 0");
  }

  const a = sideA;
  const m = medianM;

  const radTheta = degToRad(thetaDeg);
  const Ax = m * Math.cos(radTheta);
  const Ay = m * Math.sin(radTheta);

  if (Math.abs(Ay) < 1e-4) {
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

  const R_circum = a / (2 * Math.sin(degToRad(angleADeg)));
  const cy = a / (2 * Math.tan(degToRad(angleADeg)));

  const perimeter = a + sideB + sideC;
  const area = 0.5 * a * A.y;
  const maxArea = 0.5 * a * m;

  // 极化恒等式: \vec{AB} \cdot \vec{AC} = |\vec{AM}|^2 - |\vec{BM}|^2 = m^2 - (a/2)^2
  const constantDotProduct = m * m - (a / 2) * (a / 2);

  return {
    isValid: true,
    vertices: { A, B, C },
    sides: { a, b: sideB, c: sideC },
    angles: { A: angleADeg, B: angleBDeg, C: angleCDeg },
    circumcircle: { center: { x: 0, y: cy }, radius: R_circum },
    extrema: {
      perimeter,
      maxPerimeter: a + 2 * Math.hypot(a / 2, m),
      area,
      maxArea,
      sideSum: sideB + sideC,
      maxSideSum: 2 * Math.hypot(a / 2, m),
      dotProduct: constantDotProduct,
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
      dotProduct: 0,
    },
  };
}
