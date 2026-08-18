/**
 * 解三角形核心数学模型与几何计算
 * 纯函数逻辑，无 React / DOM 依赖
 */

export interface Point2D {
  x: number;
  y: number;
}

export interface TriangleSolveResult {
  /** 顶点 A, B, C 的坐标 */
  points: { A: Point2D; B: Point2D; C: Point2D };
  /** 三边长 a (对BC), b (对AC), c (对AB) */
  sides: { a: number; b: number; c: number };
  /** 三内角 A, B, C (弧度) */
  anglesRad: { A: number; B: number; C: number };
  /** 三内角 A, B, C (角度) */
  anglesDeg: { A: number; B: number; C: number };
  /** 正弦比值 a/sinA = b/sinB = c/sinC */
  sineRatios: { ratioA: number; ratioB: number; ratioC: number };
  /** 面积 S */
  area: number;
  /** 外接圆半径 R 与外心 O */
  circumcircle: { radius: number; center: Point2D };
  /** 外接圆直径推导点 A' (过 B 且经过外心 O 的直径另一端点) */
  diameterPointA: Point2D;
  /** 内切圆半径 r 与内心 I */
  incircle: { radius: number; center: Point2D };
  /** 顶点 A 向 BC 所作高 FootD 坐标与高长度 ha */
  altitudeA: { foot: Point2D; length: number };
  /** 投影定理数值: c*cosB 与 b*cosC 以及垂足划分在 BC 上的分段 */
  projections: { cCosB: number; bCosC: number; footOnBC: Point2D };
}

export interface SSASolveResult {
  /** 解的个数: 0 | 1 | 2 */
  solutionCount: 0 | 1 | 2;
  /** 临界高 h = b * sin(A) */
  h: number;
  /** 顶点 A, C 坐标 */
  A: Point2D;
  C: Point2D;
  /** 顶点 B 的可能解坐标数组 (B1, B2) */
  solutions: Point2D[];
  /** 解对应的边角详情 */
  details: Array<{
    a: number;
    b: number;
    c: number;
    angleA: number;
    angleB: number;
    angleC: number;
  }>;
}

/**
 * 根据已知两边 b, c 和夹角 A(度数) 解三角形并构建坐标
 */
export function solveTriangleFromSAS(
  b: number,
  c: number,
  angleADeg: number,
): TriangleSolveResult {
  const radA = (angleADeg * Math.PI) / 180;

  // 余弦定理求第三边 a
  const aSq = b * b + c * c - 2 * b * c * Math.cos(radA);
  const a = Math.sqrt(Math.max(1e-6, aSq));

  // 余弦定理求内角 B, C
  const cosB = Math.max(-1, Math.min(1, (a * a + c * c - b * b) / (2 * a * c)));
  const radB = Math.acos(cosB);

  const cosC = Math.max(-1, Math.min(1, (a * a + b * b - c * c) / (2 * a * b)));
  const radC = Math.acos(cosC);

  const degA = angleADeg;
  const degB = (radB * 180) / Math.PI;
  const degC = (radC * 180) / Math.PI;

  // 面积 S = 0.5 * b * c * sinA
  const sinA = Math.sin(radA);
  const area = 0.5 * b * c * sinA;

  // 正弦比值 2R
  const ratioA = sinA > 1e-6 ? a / sinA : 0;
  const ratioB = Math.sin(radB) > 1e-6 ? b / Math.sin(radB) : 0;
  const ratioC = Math.sin(radC) > 1e-6 ? c / Math.sin(radC) : 0;

  // 外接圆半径 R = a / (2 sinA)
  const R = ratioA / 2;

  // 内切圆半径 r = S / p (p = (a+b+c)/2)
  const p = (a + b + c) / 2;
  const r = area / p;

  // ── 标准高中数学几何系：以底边 BC 为水平基准，顶点 A 在上方 ──
  // 1. 底边 BC 水平居中: B 在左 (-a/2, 0), C 在右 (a/2, 0)
  const rawBx = -a / 2;
  const rawBy = 0;
  const rawCx = a / 2;
  const rawCy = 0;

  // 2. 顶点 A (通过角 B 与边 c 确定):
  // A.x = B.x + c * cos(B) = -a/2 + c * cosB
  // A.y = c * sin(B) = ha (高线长)
  const ha = (2 * area) / a;
  const rawAx = rawBx + c * Math.cos(radB);
  const rawAy = ha;

  // 3. 计算形心 G 并平移至坐标系中心 (0, 0)
  const centroidX = (rawAx + rawBx + rawCx) / 3;
  const centroidY = (rawAy + rawBy + rawCy) / 3;

  const A: Point2D = { x: rawAx - centroidX, y: rawAy - centroidY };
  const B: Point2D = { x: rawBx - centroidX, y: rawBy - centroidY };
  const C: Point2D = { x: rawCx - centroidX, y: rawCy - centroidY };

  // 4. 外心 O 坐标计算 (到 B, C 距离相等，且到 B 距离为 R)
  // O.x = (B.x + C.x) / 2 = -centroidX
  // O.y = B.y + R * cos(A)
  const circumcenter: Point2D = {
    x: (B.x + C.x) / 2,
    y: B.y + R * Math.cos(radA),
  };

  // 外接圆直径辅助点 A': 过 C 点且经过外心 O 的直径对径点 (C' = 2*O - C)，满足 C-C' 为直径
  // 在 Rt△BC C' 中，∠C'BC = 90°，由同弧所对圆周角相等有 ∠C C' B = ∠A，故 sin A = sin C' = a / (2R)
  const diameterPointA: Point2D = {
    x: 2 * circumcenter.x - C.x,
    y: 2 * circumcenter.y - C.y,
  };

  // 5. 内心 I 坐标计算 (三顶点受边长加权平均)
  const incenterX = (a * A.x + b * B.x + c * C.x) / (a + b + c);
  const incenterY = (a * A.y + b * B.y + c * C.y) / (a + b + c);
  const incenter: Point2D = { x: incenterX, y: incenterY };

  // 6. 顶点 A 向水平底边 BC 所引垂线 FootD (垂直竖直向下)
  const footD: Point2D = {
    x: A.x,
    y: B.y,
  };

  // 投影定理分量: 底边分段 BD = c*cosB, DC = b*cosC
  const cCosB = c * Math.cos(radB);
  const bCosC = b * Math.cos(radC);

  return {
    points: { A, B, C },
    sides: { a, b, c },
    anglesRad: { A: radA, B: radB, C: radC },
    anglesDeg: { A: degA, B: degB, C: degC },
    sineRatios: { ratioA, ratioB, ratioC },
    area,
    circumcircle: { radius: R, center: circumcenter },
    diameterPointA,
    incircle: { radius: r, center: incenter },
    altitudeA: { foot: footD, length: ha },
    projections: { cCosB, bCosC, footOnBC: footD },
  };
}

/**
 * SSA 探究模式：已知对角 A(deg)、已知边 b、已知对边 a
 */
export function solveSSA(
  a: number,
  b: number,
  angleADeg: number,
): SSASolveResult {
  const radA = (angleADeg * Math.PI) / 180;
  const sinA = Math.sin(radA);
  const h = b * sinA;

  const C: Point2D = { x: 0, y: 0 };
  const A: Point2D = { x: -b, y: 0 };

  const solutions: Point2D[] = [];
  const details: SSASolveResult["details"] = [];

  const diff = a * a - h * h;

  let solutionCount: 0 | 1 | 2 = 0;

  if (diff < -1e-5) {
    solutionCount = 0;
  } else if (Math.abs(diff) <= 1e-5) {
    const t = b * Math.cos(radA);
    if (t > 1e-6) {
      solutionCount = 1;
      const B1 = { x: -b + t * Math.cos(radA), y: t * sinA };
      solutions.push(B1);

      const angleB = Math.PI / 2;
      const angleC = Math.PI / 2 - radA;
      details.push({
        a,
        b,
        c: t,
        angleA: radA,
        angleB,
        angleC,
      });
    }
  } else {
    const sqrtDiff = Math.sqrt(diff);
    const cosA = Math.cos(radA);
    const t1 = b * cosA + sqrtDiff;
    const t2 = b * cosA - sqrtDiff;

    const validTs = [t1, t2].filter((t) => t > 1e-6);

    if (validTs.length === 2) {
      solutionCount = 2;
      for (const t of validTs) {
        const B = { x: -b + t * Math.cos(radA), y: t * sinA };
        solutions.push(B);

        const cVal = t;
        const radB_calc = Math.acos(
          Math.max(
            -1,
            Math.min(1, (cVal * cVal + a * a - b * b) / (2 * cVal * a)),
          ),
        );
        const radC_calc = Math.PI - radA - radB_calc;
        details.push({
          a,
          b,
          c: cVal,
          angleA: radA,
          angleB: radB_calc,
          angleC: radC_calc,
        });
      }
    } else if (validTs.length === 1) {
      solutionCount = 1;
      const t = validTs[0];
      const B = { x: -b + t * Math.cos(radA), y: t * sinA };
      solutions.push(B);

      const cVal = t;
      const radB_calc = Math.acos(
        Math.max(
          -1,
          Math.min(1, (cVal * cVal + a * a - b * b) / (2 * cVal * a)),
        ),
      );
      const radC_calc = Math.PI - radA - radB_calc;
      details.push({
        a,
        b,
        c: cVal,
        angleA: radA,
        angleB: radB_calc,
        angleC: radC_calc,
      });
    }
  }

  return {
    solutionCount,
    h,
    A,
    C,
    solutions,
    details,
  };
}

export interface BisectorMedianResult {
  base: TriangleSolveResult;
  /** 内角平分线交点 D 坐标 */
  pointD: Point2D;
  /** 底边中点 M 坐标 */
  pointM: Point2D;
  /** 角平分线长 ta */
  bisectorLength: number;
  /** 中线长 ma */
  medianLength: number;
  /** 边 BD 长度 */
  sideBD: number;
  /** 边 DC 长度 */
  sideDC: number;
  /** 分三角形 ABD 面积 */
  areaABD: number;
  /** 分三角形 ACD 面积 */
  areaACD: number;
  /** 向量基底分解系数: AD = lambda * AB + mu * AC */
  vectorWeights: { lambda: number; mu: number };
}

export function solveBisectorAndMedian(
  b: number,
  c: number,
  angleADeg: number,
): BisectorMedianResult {
  const base = solveTriangleFromSAS(b, c, angleADeg);
  const { points, sides, area, anglesRad } = base;
  const { B, C } = points;
  const { a } = sides;

  // 角平分线交点 D: 由 BD / DC = c / b 分点公式 => D = (b * B + c * C) / (b + c)
  const sumBC = b + c;
  const lambda = b / sumBC;
  const mu = c / sumBC;

  const pointD: Point2D = {
    x: (b * B.x + c * C.x) / sumBC,
    y: (b * B.y + c * C.y) / sumBC,
  };

  // 底边中点 M
  const pointM: Point2D = {
    x: (B.x + C.x) / 2,
    y: (B.y + C.y) / 2,
  };

  // 角平分线长 ta = 2bc cos(A/2) / (b + c)
  const radA = anglesRad.A;
  const bisectorLength = (2 * b * c * Math.cos(radA / 2)) / sumBC;

  // 中线长 ma = 0.5 * sqrt(2b^2 + 2c^2 - a^2)
  const medianLength =
    0.5 * Math.sqrt(Math.max(0, 2 * b * b + 2 * c * c - a * a));

  const sideBD = (c / sumBC) * a;
  const sideDC = (b / sumBC) * a;

  const areaABD = (c / sumBC) * area;
  const areaACD = (b / sumBC) * area;

  return {
    base,
    pointD,
    pointM,
    bisectorLength,
    medianLength,
    sideBD,
    sideDC,
    areaABD,
    areaACD,
    vectorWeights: { lambda, mu },
  };
}
