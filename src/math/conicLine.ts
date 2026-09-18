/**
 * 直线与圆锥曲线位置关系及弦长纯数学计算模块
 * 零副作用，包含椭圆、双曲线、抛物线与直线的联立求解、判别式、韦达定理、弦长及点差法
 */

export type ConicType = "ellipse" | "hyperbola" | "parabola";
export type StudyMode = "general" | "focus" | "midpoint" | "polePolar";

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
  // 在极点极线/切点弦模式下：外部极点 P(poleX, poleY)
  poleX?: number;
  poleY?: number;
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
  // 点差法不变量
  slopeAB: number; // k_AB
  slopeOM: number | null; // k_OM
  // 点差法不变量实测值：椭圆/双曲线为 k_AB * k_OM；抛物线为 k_AB * y_0
  pointDiffSlopeProduct: number | null;
  // 点差法不变量理论定值：椭圆 -b^2/a^2，双曲线 b^2/a^2，抛物线 p
  pointDiffTheoretical: number | null;
  // 焦点坐标
  focusF1: Point2D;
  focusF2: Point2D | null;
  // 是否为焦点弦
  isFocusChord: boolean;
  // 焦半径关系式 (过焦点模式专属)
  focalRadii: [number, number] | null;
  // 焦半径关系式实测值：焦点在弦内取倒数和 1/r1+1/r2；两端点位于焦点同侧取倒数差 |1/r1-1/r2|
  focalRadiusRelation: number | null;
  focalRadiusRelationKind: "sum" | "difference" | null;
  // 理论定值: 抛物线 2/p, 椭圆/双曲线 2a/b^2（两种构型共用同一常数）
  theoreticalFocalRadiusRelation: number | null;
  // 直线形式与铅垂标志
  isVertical: boolean;
  verticalX: number | null;
  // 点差法中点有效性 (点是否在曲线内部)
  isMidpointValid: boolean;
  /**
   * 极点极线模式专属：极点 P 是否落在曲线「内部」（即自 P 引不出任何真实切线）。
   *
   * 判据由「过 P(x₀, y₀) 的直线与曲线相切的切点方程有实根」反解得到，三类曲线各不相同：
   *  - 椭圆 x²/a² + y²/b² = 1：x₀²/a² + y₀²/b² < 1 时引不出实切线；
   *  - 双曲线 x²/a² − y²/b² = 1：x₀²/a² − y₀²/b² > 1 时引不出实切线（注意不等式方向与椭圆相反）；
   *  - 抛物线 y² = 2px：y₀² < 2px₀ 时引不出实切线（与中点弦存在性同域）。
   *
   * 该字段只在 `studyMode === "polePolar"` 下有数学意义，其余模式恒为 false。
   * 与 `status === "disjoint"` 在非退化点处互为印证（切点弦与曲线相离 ⟺ 极点无实切线）。
   */
  isPoleInside: boolean;
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

  // 2. 根据探究模式计算或修正直线参数 k, m 与垂直标记
  let k = params.k;
  let m = params.m;
  let isVertical = false;
  let verticalX: number | null = null;
  let isMidpointValid = true;
  let isPoleInside = false;

  if (studyMode === "focus") {
    // 过右焦点 F1(xF, 0)
    const xF = focusF1.x;
    const theta = params.theta ?? Math.PI / 4;
    // 如果 theta 接近 PI/2 (垂直线/通径)
    if (Math.abs(Math.cos(theta)) < 1e-4) {
      isVertical = true;
      verticalX = xF;
      k = 0; // 标记，避免 Infinity
      m = 0;
    } else {
      k = Math.tan(theta);
      // y - 0 = k (x - xF) => y = kx - k * xF => m = -k * xF
      m = -k * xF;
    }
  } else if (studyMode === "midpoint") {
    // 根据中点 M(x0, y0) 及点差法计算应有的斜率 k
    const x0 = params.midpointX ?? 1;
    const y0 = params.midpointY ?? 1;
    if (conicType === "ellipse") {
      isMidpointValid = (x0 * x0) / (a * a) + (y0 * y0) / (b * b) < 1;
      // k_AB * k_OM = -b^2/a^2 => k_AB = - (b^2 * x0) / (a^2 * y0)
      if (Math.abs(y0) > 1e-5) {
        k = -(b * b * x0) / (a * a * y0);
      }
    } else if (conicType === "hyperbola") {
      // 双曲线中点弦存在条件：位于两支之间 (x0^2/a^2 - y0^2/b^2 < 0) 或特定区域
      if (Math.abs(y0) > 1e-5) {
        k = (b * b * x0) / (a * a * y0);
      }
      isMidpointValid = (x0 * x0) / (a * a) - (y0 * y0) / (b * b) < 0;
    } else {
      // 抛物线 y^2 = 2px, 内部点满足 y0^2 < 2px0
      isMidpointValid = y0 * y0 < 2 * p * x0;
      if (Math.abs(y0) > 1e-5) {
        k = p / y0;
      }
    }
    // 直线过 M(x0, y0): y0 = k * x0 + m => m = y0 - k * x0
    m = y0 - k * x0;
  } else if (studyMode === "polePolar") {
    // 极点 P(x0, y0) 引出的极线（切点弦）
    const x0 = params.poleX ?? 4;
    const y0 = params.poleY ?? 3;
    const safeY0 = Math.abs(y0) < 1e-4 ? (y0 >= 0 ? 0.01 : -0.01) : y0;

    if (conicType === "ellipse") {
      k = -(b * b * x0) / (a * a * safeY0);
      m = (b * b) / safeY0;
    } else if (conicType === "hyperbola") {
      k = (b * b * x0) / (a * a * safeY0);
      m = -(b * b) / safeY0;
    } else {
      k = p / safeY0;
      m = (p * x0) / safeY0;
    }

    // 极点是否落在曲线内部：等价于「自 P 引不出任何真实切线」。
    // 由「过 P 且与曲线相切的切点方程须有实根」反解得下列判据（三类曲线不等式方向不同）。
    // 边界（恰好落在曲线上）不属于内部——此时恰有 1 条切线，故用 epsilon 排除。
    const EG = 1e-9;
    if (conicType === "ellipse") {
      isPoleInside = (x0 * x0) / (a * a) + (y0 * y0) / (b * b) < 1 - EG;
    } else if (conicType === "hyperbola") {
      isPoleInside = (x0 * x0) / (a * a) - (y0 * y0) / (b * b) > 1 + EG;
    } else {
      isPoleInside = y0 * y0 < 2 * p * x0 - EG;
    }
  }

  // 判断是否为过焦点弦
  const xF = focusF1.x;
  const isFocusChord = isVertical
    ? Math.abs(verticalX! - xF) < 1e-3
    : Math.abs(k * xF + m) < 1e-3;

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
  let pointDiffTheoretical: number | null = null;
  let focalRadii: [number, number] | null = null;
  let focalRadiusRelation: number | null = null;
  let focalRadiusRelationKind: "sum" | "difference" | null = null;
  let theoreticalFocalRadiusRelation: number | null = null;
  let description = "";

  if (isVertical && verticalX !== null) {
    // 铅垂线 x = verticalX 的闭式解析解（消除数值大数灾难）
    const x0 = verticalX;
    if (conicType === "ellipse") {
      const discriminant = 1 - (x0 * x0) / (a * a);
      if (discriminant > 1e-6) {
        status = "secant";
        const yVal = b * Math.sqrt(discriminant);
        intersections = [
          { x: x0, y: yVal },
          { x: x0, y: -yVal },
        ];
        chordLength = 2 * yVal;
        midpoint = { x: x0, y: 0 };
        quadCoeff = a * a;
        linearCoeff = 0;
        constTerm = -b * b * (a * a - x0 * x0);
        delta = 4 * a * a * b * b * (a * a - x0 * x0);
        xSum = 2 * x0;
        xProd = x0 * x0;
        ySum = 0;
        yProd = -yVal * yVal;
        description = `直线为垂直焦点弦（通径），弦长 |AB| = 2b²/a = ${chordLength.toFixed(3)}`;
      } else if (Math.abs(discriminant) <= 1e-6) {
        status = "tangent";
        intersections = [{ x: x0, y: 0 }];
        chordLength = 0;
        midpoint = { x: x0, y: 0 };
        description = `铅垂线与椭圆相切于顶点 (${x0.toFixed(2)}, 0.00)`;
      } else {
        status = "disjoint";
        intersections = [];
        description = "铅垂线与椭圆相离";
      }
    } else if (conicType === "hyperbola") {
      const discriminant = (x0 * x0) / (a * a) - 1;
      if (discriminant > 1e-6) {
        status = "secant";
        const yVal = b * Math.sqrt(discriminant);
        intersections = [
          { x: x0, y: yVal },
          { x: x0, y: -yVal },
        ];
        chordLength = 2 * yVal;
        midpoint = { x: x0, y: 0 };
        description = `直线为垂直焦点弦（通径），弦长 |AB| = 2b²/a = ${chordLength.toFixed(3)}`;
      } else {
        status = "disjoint";
        intersections = [];
        description = "铅垂线落在两支之间，与双曲线无交点";
      }
    } else {
      // 抛物线 y^2 = 2px, x = x0
      if (x0 > 1e-5) {
        status = "secant";
        const yVal = Math.sqrt(2 * p * x0);
        intersections = [
          { x: x0, y: yVal },
          { x: x0, y: -yVal },
        ];
        chordLength = 2 * yVal;
        midpoint = { x: x0, y: 0 };
        description = `直线为抛物线通径（垂直焦点弦），弦长 |AB| = 2p = ${chordLength.toFixed(3)}`;
      } else if (Math.abs(x0) <= 1e-5) {
        status = "tangent";
        intersections = [{ x: 0, y: 0 }];
        chordLength = 0;
        midpoint = { x: 0, y: 0 };
        description = "铅垂线为抛物线顶点切线 (y轴)";
      } else {
        status = "disjoint";
        intersections = [];
        description = "铅垂线在抛物线背后，无交点";
      }
    }
  } else if (conicType === "ellipse") {
    // 椭圆 b^2 x^2 + a^2 y^2 = a^2 b^2, 代入 y = kx + m
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
    quadCoeff = b * b - a * a * k * k;
    linearCoeff = -2 * a * a * k * m;
    constTerm = -a * a * (m * m + b * b);

    // 检查二次项系数是否归零（平行于渐近线 k = ±b/a）
    if (Math.abs(quadCoeff) < 1e-5) {
      status = "degenerated_parallel";
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
    if (Math.abs(k) < 1e-5) {
      status = "degenerated_parallel";
      const x0 = (m * m) / (2 * p);
      const y0 = m;
      intersections = [{ x: x0, y: y0 }];
      description = "直线平行于抛物线对称轴 (k=0)！有且仅有1个交点（非相切）";
    } else {
      const A_y = 1;
      const B_y = -(2 * p) / k;
      const C_y = (2 * p * m) / k;
      delta = B_y * B_y - 4 * A_y * C_y;

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

  // 5. 计算点差法不变量
  //    椭圆/双曲线：k_AB · k_OM（理论值 ∓b²/a²）；抛物线：k_AB · y_0（理论值 p）
  if (midpoint) {
    if (Math.abs(midpoint.x) > 1e-5) {
      slopeOM = midpoint.y / midpoint.x;
    }
    if (conicType === "parabola") {
      pointDiffSlopeProduct = k * midpoint.y;
      pointDiffTheoretical = p;
    } else if (slopeOM !== null) {
      pointDiffSlopeProduct = k * slopeOM;
      pointDiffTheoretical =
        conicType === "ellipse" ? -(b * b) / (a * a) : (b * b) / (a * a);
    }
  }

  // 6. 计算焦半径关系式 (过焦点弦专属)
  //    几何判据：两端点相对焦点的方位。点积为正 ⇒ 两端点位于焦点同侧（焦点不在弦内）；
  //    点积为负 ⇒ 焦点落在弦 AB 内部。
  //    椭圆（焦点在内部区域）与抛物线恒为“焦点在弦内” ⇒ 倒数和；
  //    双曲线两种构型都可能出现 ⇒ 焦点在弦内取倒数和、焦点在弦外取倒数差。
  //    两种构型共用同一理论常数：椭圆/双曲线 2a/b²，抛物线 2/p。
  if (intersections.length === 2 && isFocusChord) {
    const [pA, pB] = intersections;
    const r1 = Math.sqrt((pA.x - focusF1.x) ** 2 + (pA.y - focusF1.y) ** 2);
    const r2 = Math.sqrt((pB.x - focusF1.x) ** 2 + (pB.y - focusF1.y) ** 2);
    focalRadii = [r1, r2];
    const focusInsideChord =
      (pA.x - focusF1.x) * (pB.x - focusF1.x) +
        (pA.y - focusF1.y) * (pB.y - focusF1.y) <
      0;
    if (r1 > 1e-5 && r2 > 1e-5) {
      if (focusInsideChord) {
        focalRadiusRelationKind = "sum";
        focalRadiusRelation = 1 / r1 + 1 / r2;
      } else {
        focalRadiusRelationKind = "difference";
        focalRadiusRelation = Math.abs(1 / r1 - 1 / r2);
      }
    }
    theoreticalFocalRadiusRelation =
      conicType === "parabola" ? 2 / p : (2 * a) / (b * b);
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
    pointDiffTheoretical,
    focusF1,
    focusF2,
    isFocusChord,
    focalRadii,
    focalRadiusRelation,
    focalRadiusRelationKind,
    theoreticalFocalRadiusRelation,
    isVertical,
    verticalX,
    isMidpointValid,
    isPoleInside,
    description,
  };
}
