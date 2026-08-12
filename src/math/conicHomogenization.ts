/**
 * src/math/conicHomogenization.ts
 * 非对称齐次化数学求解纯函数库
 * 包含：平移变换、联立齐次化二次方程系数推导、斜率和与斜率积理论值与实测值校验
 */

export type CurveType = "ellipse" | "hyperbola";
export type StudyMode = "origin" | "shift" | "asymmetric";

export interface Point2D {
  x: number;
  y: number;
}

export interface HomogenizationResult {
  /** 曲线类型 */
  curveType: CurveType;
  /** 模式 */
  studyMode: StudyMode;
  /** 半轴 a */
  a: number;
  /** 半轴 b */
  b: number;
  /** 定点 P 坐标 */
  P: Point2D;
  /** 割线与曲线交点 A */
  A: Point2D | null;
  /** 割线与曲线交点 B */
  B: Point2D | null;
  /** 联立交点判别式 Delta */
  delta: number;
  /** 是否有 2 个不同交点 */
  isValidIntersections: boolean;

  /** 齐次化方程 C'*k^2 + B'*k + A' = 0 的系数 */
  homoA: number; // A' (常数项齐次化后 x'^2 系数)
  homoB: number; // B' (x'y' 系数)
  homoC: number; // C' (y'^2 系数)

  /** 韦达定理理论斜率和 (k1 + k2) */
  theoreticalSum: number | null;
  /** 韦达定理理论斜率积 (k1 * k2) */
  theoreticalProduct: number | null;

  /** 实际交点斜率 k1 (k_PA) */
  measuredK1: number | null;
  /** 实际交点斜率 k2 (k_PB) */
  measuredK2: number | null;
  /** 实际斜率和 */
  measuredSum: number | null;
  /** 实际斜率积 */
  measuredProduct: number | null;

  /** 非对称加权斜率和 (λ k1 + μ k2) */
  asymmetricWeightedSum: number | null;
  /** 直线必过定点 Q (用于模式3定点探索) */
  fixedPointQ: Point2D | null;

  /** 直线方程描述文本 */
  lineEqLatex: string;
  /** 齐次二次方程 LaTeX */
  homoEqLatex: string;
}

/**
 * 求解圆锥曲线与齐次化全量数学结果
 */
export function computeConicHomogenization(params: {
  curveType: CurveType;
  studyMode: StudyMode;
  a: number;
  b: number;
  P: Point2D;
  lineA: number; // 直线在平移/原点坐标系中的 A 系数 (Ax + By = 1)
  lineB: number; // 直线在平移/原点坐标系中的 B 系数
  lambda?: number; // 非对称权重 λ
  mu?: number; // 非对称权重 μ
}): HomogenizationResult {
  const {
    curveType,
    studyMode,
    a,
    b,
    P,
    lineA,
    lineB,
    lambda = 1,
    mu = 1,
  } = params;

  // 1. 曲线符号 (椭圆: x^2/a^2 + y^2/b^2 = 1, 双曲线: x^2/a^2 - y^2/b^2 = 1)
  const signY = curveType === "ellipse" ? 1 : -1;

  // 2. 根据模式计算定点 P 和直线方程
  // 模式1: 定点 P 为原点 (0,0), 直线 l: lineA * x + lineB * y = 1
  // 模式2: 定点 P 为顶点 (-a, 0) 或自定义定点，平移坐标系 X = x - P.x, Y = y - P.y, 直线 l: lineA * X + lineB * Y = 1
  // 模式3: 非对称斜率和/积求定点，已知直线 l: lineA * X + lineB * Y = 1
  const pX = studyMode === "origin" ? 0 : P.x;
  const pY = studyMode === "origin" ? 0 : P.y;

  // 计算原坐标系下直线的常规形式 Ax + By + C = 0
  // 在平移坐标系中 lineA * (x - pX) + lineB * (y - pY) = 1 => lineA*x + lineB*y - (lineA*pX + lineB*pY + 1) = 0
  const stdA = lineA;
  const stdB = lineB;
  const stdC = -(lineA * pX + lineB * pY + 1);

  // 3. 求解直线与曲线的交点 A, B (在原坐标系中)
  // 代入曲线方程: x^2/a^2 + signY * y^2/b^2 = 1
  let pointA: Point2D | null = null;
  let pointB: Point2D | null = null;
  let delta = -1;

  if (Math.abs(stdB) > 1e-7) {
    // y = (-stdA*x - stdC)/stdB
    // x^2/a^2 + signY * ((-stdA*x - stdC)/stdB)^2 / b^2 = 1
    // (1/a^2 + signY * stdA^2 / (b^2 * stdB^2)) x^2 + (2 * signY * stdA * stdC / (b^2 * stdB^2)) x + (signY * stdC^2 / (b^2 * stdB^2) - 1) = 0
    const coeffX2 = 1 / (a * a) + (signY * stdA * stdA) / (b * b * stdB * stdB);
    const coeffX1 = (2 * signY * stdA * stdC) / (b * b * stdB * stdB);
    const coeffX0 = (signY * stdC * stdC) / (b * b * stdB * stdB) - 1;

    delta = coeffX1 * coeffX1 - 4 * coeffX2 * coeffX0;

    if (delta > 1e-7) {
      const x1 = (-coeffX1 - Math.sqrt(delta)) / (2 * coeffX2);
      const x2 = (-coeffX1 + Math.sqrt(delta)) / (2 * coeffX2);
      const y1 = (-stdA * x1 - stdC) / stdB;
      const y2 = (-stdA * x2 - stdC) / stdB;
      pointA = { x: x1, y: y1 };
      pointB = { x: x2, y: y2 };
    }
  } else if (Math.abs(stdA) > 1e-7) {
    // x = -stdC / stdA
    const xFix = -stdC / stdA;
    // (xFix)^2/a^2 + signY * y^2/b^2 = 1 => signY * y^2/b^2 = 1 - xFix^2/a^2
    const ySq = (1 - (xFix * xFix) / (a * a)) * (signY * b * b);
    if (ySq > 1e-7) {
      delta = ySq;
      const y1 = -Math.sqrt(ySq);
      const y2 = Math.sqrt(ySq);
      pointA = { x: xFix, y: y1 };
      pointB = { x: xFix, y: y2 };
    }
  }

  const isValidIntersections = pointA !== null && pointB !== null;

  // 4. 计算齐次化方程 C'*k^2 + B'*k + A' = 0
  // 在平移坐标系 (X, Y) 中，点 P 为 (0,0)
  // 曲线在平移坐标系下：
  // (X + pX)^2 / a^2 + signY * (Y + pY)^2 / b^2 = 1
  // X^2/a^2 + 2 pX X / a^2 + pX^2/a^2 + signY (Y^2/b^2 + 2 pY Y / b^2 + pY^2/b^2) = 1
  const cTerm = (pX * pX) / (a * a) + (signY * pY * pY) / (b * b) - 1;

  // 一次项: (2 pX / a^2) X + (2 signY pY / b^2) Y
  const L_X = (2 * pX) / (a * a);
  const L_Y = (2 * signY * pY) / (b * b);

  // 齐次化系数
  const homoA = 1 / (a * a) + L_X * lineA + cTerm * lineA * lineA;
  const homoB = L_X * lineB + L_Y * lineA + 2 * cTerm * lineA * lineB;
  const homoC = signY / (b * b) + L_Y * lineB + cTerm * lineB * lineB;

  // 5. 韦达定理理论求解斜率和/积
  let theoreticalSum: number | null = null;
  let theoreticalProduct: number | null = null;
  if (Math.abs(homoC) > 1e-7) {
    theoreticalSum = -homoB / homoC;
    theoreticalProduct = homoA / homoC;
  }

  // 6. 实际交点斜率测量
  let measuredK1: number | null = null;
  let measuredK2: number | null = null;
  let measuredSum: number | null = null;
  let measuredProduct: number | null = null;
  let asymmetricWeightedSum: number | null = null;

  if (isValidIntersections && pointA && pointB) {
    const dXa = pointA.x - pX;
    const dYa = pointA.y - pY;
    const dXb = pointB.x - pX;
    const dYb = pointB.y - pY;

    if (Math.abs(dXa) > 1e-7 && Math.abs(dXb) > 1e-7) {
      measuredK1 = dYa / dXa;
      measuredK2 = dYb / dXb;
      measuredSum = measuredK1 + measuredK2;
      measuredProduct = measuredK1 * measuredK2;
      asymmetricWeightedSum = lambda * measuredK1 + mu * measuredK2;
    }
  }

  // 7. 计算模式3中的必过定点 Q
  let fixedPointQ: Point2D | null = null;
  if (studyMode === "asymmetric") {
    if (Math.abs(lineB) < 1e-5 && Math.abs(lineA) > 1e-5) {
      fixedPointQ = { x: pX + 1 / lineA, y: pY };
    } else {
      fixedPointQ = { x: pX + 1 / (lineA || 0.1), y: pY };
    }
  }

  // 8. 构造方程 LaTeX
  const lineEqLatex =
    studyMode === "origin"
      ? `${formatCoeff(lineA)}x ${formatSign(lineB)}${formatCoeff(Math.abs(lineB))}y = 1`
      : `${formatCoeff(lineA)}(x ${formatSign(-pX)}${Math.abs(pX)}) ${formatSign(lineB)}${formatCoeff(Math.abs(lineB))}(y ${formatSign(-pY)}${Math.abs(pY)}) = 1`;

  const homoEqLatex = `${formatCoeff(homoC)} k^2 ${formatSign(homoB)}${formatCoeff(Math.abs(homoB))} k ${formatSign(homoA)}${formatCoeff(Math.abs(homoA))} = 0`;

  return {
    curveType,
    studyMode,
    a,
    b,
    P: { x: pX, y: pY },
    A: pointA,
    B: pointB,
    delta,
    isValidIntersections,
    homoA,
    homoB,
    homoC,
    theoreticalSum,
    theoreticalProduct,
    measuredK1,
    measuredK2,
    measuredSum,
    measuredProduct,
    asymmetricWeightedSum,
    fixedPointQ,
    lineEqLatex,
    homoEqLatex,
  };
}

function formatCoeff(num: number): string {
  const val = Math.abs(num);
  if (Math.abs(val - 1) < 1e-5) return "";
  return val.toFixed(2);
}

function formatSign(num: number): string {
  return num >= 0 ? "+ " : "- ";
}
