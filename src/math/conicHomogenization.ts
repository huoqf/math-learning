/**
 * src/math/conicHomogenization.ts
 * 齐次化与非对称斜率关系数学求解纯函数库
 * 包含：坐标平移变换、联立齐次化二次方程系数推导、韦达定理理论值与实测值校验、退化分析
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
  /** 探究模式 */
  studyMode: StudyMode;
  /** 半实轴 a */
  a: number;
  /** 半虚轴/短半轴 b */
  b: number;
  /** 齐次化定点/平移原点 P 坐标 */
  P: Point2D;
  /** 割线与曲线交点 A */
  A: Point2D | null;
  /** 割线与曲线交点 B */
  B: Point2D | null;
  /** 联立交点判别式 Delta (标准方程下) */
  delta: number;
  /** 是否有 2 个不同实交点 */
  isValidIntersections: boolean;

  /** 齐次化方程 C'*k^2 + B'*k + A' = 0 的系数 (以 P 为原点，k = Y/X) */
  homoA: number; // A' (X^2 系数)
  homoB: number; // B' (XY 系数)
  homoC: number; // C' (Y^2 系数)

  /** 韦达定理理论斜率和 (k1 + k2 = -B'/C') */
  theoreticalSum: number | null;
  /** 韦达定理理论斜率积 (k1 * k2 = A'/C') */
  theoreticalProduct: number | null;

  /** 实际交点斜率 k1 (k_PA) */
  measuredK1: number | null;
  /** 实际交点斜率 k2 (k_PB) */
  measuredK2: number | null;
  /** 实际斜率和 */
  measuredSum: number | null;
  /** 实际斜率积 */
  measuredProduct: number | null;

  /** 非对称加权斜率和 (λ k1 + μ k2) 实测值 */
  asymmetricWeightedSum: number | null;

  /** 直线方程描述 LaTeX (原坐标系与平移坐标系) */
  lineEqLatex: string;
  /** 齐次二次方程 LaTeX */
  homoEqLatex: string;

  /** 退化原因/状态说明 */
  degenerationReason?:
    | "delta_non_positive"
    | "coeff_c_zero"
    | "line_through_p"
    | "slope_undefined";
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
  lineA: number; // 割线在平移/原点坐标系中的 A 系数: A*X + B*Y = 1
  lineB: number; // 割线在平移/原点坐标系中的 B 系数
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

  // 2. 定点 P 坐标确定
  const pX = studyMode === "origin" ? 0 : P.x;
  const pY = studyMode === "origin" ? 0 : P.y;

  // 割线在平移坐标系中为: lineA * (x - pX) + lineB * (y - pY) = 1
  // 展开为标准一般式: stdA * x + stdB * y + stdC = 0
  const stdA = lineA;
  const stdB = lineB;
  const stdC = -(lineA * pX + lineB * pY + 1);

  // 3. 求解割线与曲线的交点 A, B
  let pointA: Point2D | null = null;
  let pointB: Point2D | null = null;
  let delta = -1;
  let degenerationReason: HomogenizationResult["degenerationReason"] =
    undefined;

  if (Math.abs(stdB) > 1e-7) {
    // y = (-stdA*x - stdC)/stdB
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
    } else {
      degenerationReason = "delta_non_positive";
    }
  } else if (Math.abs(stdA) > 1e-7) {
    // x = -stdC / stdA (铅垂线)
    const xFix = -stdC / stdA;
    const ySq = (1 - (xFix * xFix) / (a * a)) * (signY * b * b);
    if (ySq > 1e-7) {
      delta = ySq;
      pointA = { x: xFix, y: -Math.sqrt(ySq) };
      pointB = { x: xFix, y: Math.sqrt(ySq) };
    } else {
      degenerationReason = "delta_non_positive";
    }
  } else {
    degenerationReason = "slope_undefined";
  }

  const isValidIntersections = pointA !== null && pointB !== null;

  // 4. 齐次化方程推导 (以 P(pX, pY) 为原点进行平移 X = x - pX, Y = y - pY)
  // 原方程: (X + pX)^2/a^2 + signY * (Y + pY)^2/b^2 = 1
  // 展开: X^2/a^2 + (2pX/a^2)X + pX^2/a^2 + signY*(Y^2/b^2 + 2pY/b^2 Y + pY^2/b^2) = 1
  // 常数项 cTerm = pX^2/a^2 + signY*pY^2/b^2 - 1
  const cTerm = (pX * pX) / (a * a) + (signY * pY * pY) / (b * b) - 1;
  const L_X = (2 * pX) / (a * a);
  const L_Y = (2 * signY * pY) / (b * b);

  // 利用割线 1 = lineA*X + lineB*Y 将一次项升为二次，常数项升为二次：
  // X^2/a^2 + signY*Y^2/b^2 + (L_X*X + L_Y*Y)(lineA*X + lineB*Y) + cTerm*(lineA*X + lineB*Y)^2 = 0
  const homoA = 1 / (a * a) + L_X * lineA + cTerm * lineA * lineA;
  const homoB = L_X * lineB + L_Y * lineA + 2 * cTerm * lineA * lineB;
  const homoC = signY / (b * b) + L_Y * lineB + cTerm * lineB * lineB;

  // 5. 韦达定理理论求解斜率和与积 (k = Y/X, C'*k^2 + B'*k + A' = 0)
  let theoreticalSum: number | null = null;
  let theoreticalProduct: number | null = null;

  if (Math.abs(homoC) > 1e-6) {
    theoreticalSum = -homoB / homoC;
    theoreticalProduct = homoA / homoC;
  } else {
    degenerationReason = degenerationReason ?? "coeff_c_zero";
  }

  // 6. 实际交点斜率测量与非对称计算
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

    if (Math.abs(dXa) > 1e-6 && Math.abs(dXb) > 1e-6) {
      measuredK1 = dYa / dXa;
      measuredK2 = dYb / dXb;
      measuredSum = measuredK1 + measuredK2;
      measuredProduct = measuredK1 * measuredK2;
      asymmetricWeightedSum = lambda * measuredK1 + mu * measuredK2;
    }
  }

  // 7. 方程 LaTeX 排版
  const lineEqLatex =
    studyMode === "origin"
      ? `${formatCoeff(lineA)}x ${formatSign(lineB)}${formatCoeff(Math.abs(lineB))}y = 1`
      : `${formatCoeff(lineA)}(x ${formatSign(-pX)}${Math.abs(pX).toFixed(1)}) ${formatSign(lineB)}${formatCoeff(Math.abs(lineB))}(y ${formatSign(-pY)}${Math.abs(pY).toFixed(1)}) = 1`;

  const homoEqLatex = `${homoC.toFixed(2)} k^2 ${formatSign(homoB)}${Math.abs(homoB).toFixed(2)} k ${formatSign(homoA)}${Math.abs(homoA).toFixed(2)} = 0`;

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
    lineEqLatex,
    homoEqLatex,
    degenerationReason,
  };
}

function formatCoeff(num: number): string {
  const val = Math.abs(num);
  if (Math.abs(val - 1) < 1e-4) return "";
  return val.toFixed(2);
}

function formatSign(num: number): string {
  return num >= 0 ? "+ " : "- ";
}
