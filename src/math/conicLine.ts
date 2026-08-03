/**
 * 直线与圆锥曲线位置关系及弦长纯数学计算模块
 * 零副作用，包含椭圆、双曲线、抛物线与直线的联立求解、判别式、韦达定理、弦长及点差法
 */

export type ConicType = "ellipse" | "hyperbola" | "parabola";
export type StudyMode = "general" | "focus" | "midpoint";

export interface Point2D {
  x: number;
  y: number;
}

export interface ConicLineParams {
  conicType: ConicType;
  studyMode: StudyMode;
  // 椭圆/双曲线/抛物线参数
  a: number; // 椭圆/双曲线长半轴 (> 0)
  b: number; // 椭圆/双曲线短半轴/虚半轴 (> 0)
  p: number; // 抛物线焦准距 (> 0)
  // 直线参数: y = k * x + m
  k: number;
  m: number;
  // 在过焦点模式下：直线倾斜角 theta (弧度)
  theta?: number;
  // 在中点弦模式下：目标中点 (x0, y0)
  midpointX?: number;
  midpointY?: number;
}

export interface IntersectionResult {
  conicType: ConicType;
  studyMode: StudyMode;
  // 位置关系状态
  status: "secant" | "tangent" | "disjoint" | "degenerated_parallel";
  intersectionCount: number;
  intersections: Point2D[];
  // 二次方程与判别式信息
  quadCoeff: number; // A (Ax^2 + Bx + C = 0 中的 A)
  delta: number; // 判别式 B^2 - 4AC
  // 韦达定理
  xSum: number | null; // x1 + x2
  xProd: number | null; // x1 * x2
  ySum: number | null; // y1 + y2
  yProd: number | null; // y1 * y2
  // 弦长与中点
  chordLength: number | null; // |AB|
  midpoint: Point2D | null; // M((x1+x2)/2, (y1+y2)/2)
  // 面积
  triangleArea: number | null; // S_△OAB
  // 点差法斜率积
  slopeAB: number; // k_AB
  slopeOM: number | null; // k_OM
  pointDiffSlopeProduct: number | null; // k_AB * k_OM
  // 焦点坐标
  focusF1: Point2D;
  focusF2: Point2D | null;
  // 是否为焦点弦
  isFocusChord: boolean;
  // 关键说明/几何指标
  description: string;
}

/**
 * 求解直线与圆锥曲线的交点与几何特征
 */
export function solveConicLineIntersection(
  params: ConicLineParams,
): IntersectionResult {
  const { conicType, studyMode, a = 3, b = 2, p = 2 } = params;

  // 1. 确定焦点坐标
  let focusF1: Point2D = { x: 0, y: 0 };
  let focusF2: Point2D | null = null;
  if (conicType === "ellipse") {
    const c = Math.sqrt(Math.max(0, a * a - b * b));
    focusF1 = { x: c, y: 0 };
    focusF2 = { x: -c, y: 0 };
  } else if (conicType === "hyperbola") {
    const c = Math.sqrt(a * a + b * b);
    focusF1 = { x: c, y: 0 };
    focusF2 = { x: -c, y: 0 };
  } else {
    // 抛物线 y^2 = 2px, 焦点 (p/2, 0)
    focusF1 = { x: p / 2, y: 0 };
    focusF2 = null;
  }

  // 2. 根据探究模式计算或修正直线参数 k, m
  let k = params.k;
  let m = params.m;

  if (studyMode === "focus") {
    // 过右焦点 F1(xF, 0)
    const xF = focusF1.x;
    const theta = params.theta ?? Math.PI / 4;
    // 如果 theta 接近 PI/2 (垂直线)
    if (Math.abs(Math.cos(theta)) < 1e-4) {
      k = 99999;
    } else {
      k = Math.tan(theta);
    }
    // y - 0 = k (x - xF) => y = kx - k * xF => m = -k * xF
    m = -k * xF;
  } else if (studyMode === "midpoint") {
    // 根据中点 M(x0, y0) 及点差法计算应有的斜率 k
    const x0 = params.midpointX ?? 1;
    const y0 = params.midpointY ?? 1;
    if (conicType === "ellipse") {
      // k_AB * k_OM = -b^2/a^2 => k_AB = - (b^2 * x0) / (a^2 * y0)
      if (Math.abs(y0) > 1e-5) {
        k = -(b * b * x0) / (a * a * y0);
      }
    } else if (conicType === "hyperbola") {
      // k_AB * k_OM = b^2/a^2 => k_AB = (b^2 * x0) / (a^2 * y0)
      if (Math.abs(y0) > 1e-5) {
        k = (b * b * x0) / (a * a * y0);
      }
    } else {
      // 抛物线 k_AB * y0 = p => k_AB = p / y0
      if (Math.abs(y0) > 1e-5) {
        k = p / y0;
      }
    }
    // 直线过 M(x0, y0): y0 = k * x0 + m => m = y0 - k * x0
    m = y0 - k * x0;
  }

  // 判断是否为过焦点弦
  const xF = focusF1.x;
  const isFocusChord = Math.abs(k * xF + m) < 1e-3;

  // 3. 分圆锥曲线类型推导联立方程并求解
  let quadCoeff = 0; // A
  let linearCoeff = 0; // B
  let constTerm = 0; // C
  let delta = 0;
  let status: IntersectionResult["status"] = "disjoint";
  let intersections: Point2D[] = [];
  let xSum: number | null = null;
  let xProd: number | null = null;
  let ySum: number | null = null;
  let yProd: number | null = null;
  let chordLength: number | null = null;
  let midpoint: Point2D | null = null;
  let triangleArea: number | null = null;
  let slopeOM: number | null = null;
  let pointDiffSlopeProduct: number | null = null;
  let description = "";

  if (conicType === "ellipse") {
    // 椭圆 b^2 x^2 + a^2 y^2 = a^2 b^2, 代入 y = kx + m
    // (b^2 + a^2 k^2) x^2 + 2 a^2 k m x + a^2 (m^2 - b^2) = 0
    quadCoeff = b * b + a * a * k * k;
    linearCoeff = 2 * a * a * k * m;
    constTerm = a * a * (m * m - b * b);
    delta = linearCoeff * linearCoeff - 4 * quadCoeff * constTerm;

    if (delta > 1e-6) {
      status = "secant";
      const x1 = (-linearCoeff + Math.sqrt(delta)) / (2 * quadCoeff);
      const x2 = (-linearCoeff - Math.sqrt(delta)) / (2 * quadCoeff);
      const y1 = k * x1 + m;
      const y2 = k * x2 + m;
      intersections = [
        { x: x1, y: y1 },
        { x: x2, y: y2 },
      ];
      xSum = -linearCoeff / quadCoeff;
      xProd = constTerm / quadCoeff;
      ySum = y1 + y2;
      yProd = y1 * y2;
      chordLength = Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
      midpoint = { x: (x1 + x2) / 2, y: (y1 + y2) / 2 };
      description = `直线与椭圆相交于两点，弦长 |AB| = ${chordLength.toFixed(3)}`;
    } else if (Math.abs(delta) <= 1e-6) {
      status = "tangent";
      const x0 = -linearCoeff / (2 * quadCoeff);
      const y0 = k * x0 + m;
      intersections = [{ x: x0, y: y0 }];
      xSum = 2 * x0;
      xProd = x0 * x0;
      ySum = 2 * y0;
      yProd = y0 * y0;
      chordLength = 0;
      midpoint = { x: x0, y: y0 };
      description = `直线与椭圆相切于点 (${x0.toFixed(2)}, ${y0.toFixed(2)})`;
    } else {
      status = "disjoint";
      intersections = [];
      description = "直线与椭圆相离（无实数解）";
    }
  } else if (conicType === "hyperbola") {
    // 双曲线 b^2 x^2 - a^2 y^2 = a^2 b^2, 代入 y = kx + m
    // (b^2 - a^2 k^2) x^2 - 2 a^2 k m x - a^2 (m^2 + b^2) = 0
    quadCoeff = b * b - a * a * k * k;
    linearCoeff = -2 * a * a * k * m;
    constTerm = -a * a * (m * m + b * b);

    // 检查二次项系数是否归零（平行于渐近线 k = ±b/a）
    if (Math.abs(quadCoeff) < 1e-5) {
      status = "degenerated_parallel";
      // 一元一次方程 linearCoeff * x + constTerm = 0
      if (Math.abs(linearCoeff) > 1e-5) {
        const x0 = -constTerm / linearCoeff;
        const y0 = k * x0 + m;
        intersections = [{ x: x0, y: y0 }];
        description =
          "直线平行于双曲线渐近线！方程退化为一元一次方程，有且仅有1个交点（非相切）";
      } else {
        intersections = [];
        description = "直线为渐近线本身，无交点";
      }
    } else {
      delta = linearCoeff * linearCoeff - 4 * quadCoeff * constTerm;
      if (delta > 1e-6) {
        status = "secant";
        const x1 = (-linearCoeff + Math.sqrt(delta)) / (2 * quadCoeff);
        const x2 = (-linearCoeff - Math.sqrt(delta)) / (2 * quadCoeff);
        const y1 = k * x1 + m;
        const y2 = k * x2 + m;
        intersections = [
          { x: x1, y: y1 },
          { x: x2, y: y2 },
        ];
        xSum = -linearCoeff / quadCoeff;
        xProd = constTerm / quadCoeff;
        ySum = y1 + y2;
        yProd = y1 * y2;
        chordLength = Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
        midpoint = { x: (x1 + x2) / 2, y: (y1 + y2) / 2 };
        description = `直线与双曲线相交于两点，弦长 |AB| = ${chordLength.toFixed(3)}`;
      } else if (Math.abs(delta) <= 1e-6) {
        status = "tangent";
        const x0 = -linearCoeff / (2 * quadCoeff);
        const y0 = k * x0 + m;
        intersections = [{ x: x0, y: y0 }];
        chordLength = 0;
        midpoint = { x: x0, y: y0 };
        description = `直线与双曲线相切于点 (${x0.toFixed(2)}, ${y0.toFixed(2)})`;
      } else {
        status = "disjoint";
        intersections = [];
        description = "直线与双曲线相离（无实根）";
      }
    }
  } else {
    // 抛物线 y^2 = 2px
    // 若 k == 0 (直线平行于对称轴 y = m):
    if (Math.abs(k) < 1e-5) {
      status = "degenerated_parallel";
      const x0 = (m * m) / (2 * p);
      const y0 = m;
      intersections = [{ x: x0, y: y0 }];
      description = "直线平行于抛物线对称轴 (k=0)！有且仅有1个交点（非相切）";
    } else {
      // 代入 x = (y - m) / k => y^2 - (2p/k) y + 2pm/k = 0
      const A_y = 1;
      const B_y = -(2 * p) / k;
      const C_y = (2 * p * m) / k;
      delta = B_y * B_y - 4 * A_y * C_y; // (4p/k^2) * (p - 2km)

      quadCoeff = 1;
      if (delta > 1e-6) {
        status = "secant";
        const y1 = (-B_y + Math.sqrt(delta)) / 2;
        const y2 = (-B_y - Math.sqrt(delta)) / 2;
        const x1 = (y1 - m) / k;
        const x2 = (y2 - m) / k;
        intersections = [
          { x: x1, y: y1 },
          { x: x2, y: y2 },
        ];
        ySum = -B_y;
        yProd = C_y;
        xSum = x1 + x2;
        xProd = x1 * x2;
        chordLength = Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
        midpoint = { x: (x1 + x2) / 2, y: (y1 + y2) / 2 };
        description = `直线与抛物线相交于两点，弦长 |AB| = ${chordLength.toFixed(3)}`;
      } else if (Math.abs(delta) <= 1e-6) {
        status = "tangent";
        const y0 = -B_y / 2;
        const x0 = (y0 - m) / k;
        intersections = [{ x: x0, y: y0 }];
        chordLength = 0;
        midpoint = { x: x0, y: y0 };
        description = `直线与抛物线相切于点 (${x0.toFixed(2)}, ${y0.toFixed(2)})`;
      } else {
        status = "disjoint";
        intersections = [];
        description = "直线与抛物线相离";
      }
    }
  }

  // 4. 计算原点三角形面积 S_△OAB = 0.5 * |x1*y2 - x2*y1|
  if (intersections.length === 2) {
    const [{ x: x1, y: y1 }, { x: x2, y: y2 }] = intersections;
    triangleArea = 0.5 * Math.abs(x1 * y2 - x2 * y1);
  }

  // 5. 计算点差法斜率关系 (k_AB 和 k_OM)
  if (midpoint && Math.abs(midpoint.x) > 1e-5) {
    slopeOM = midpoint.y / midpoint.x;
    pointDiffSlopeProduct = k * slopeOM;
  }

  return {
    conicType,
    studyMode,
    status,
    intersectionCount: intersections.length,
    intersections,
    quadCoeff,
    delta,
    xSum,
    xProd,
    ySum,
    yProd,
    chordLength,
    midpoint,
    triangleArea,
    slopeAB: k,
    slopeOM,
    pointDiffSlopeProduct,
    focusF1,
    focusF2,
    isFocusChord,
    description,
  };
}
