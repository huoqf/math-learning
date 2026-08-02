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
  /** 内切圆半径 r 与内心 I */
  incircle: { radius: number; center: Point2D };
  /** 顶点 A 向 BC 所作高 FootD 坐标与高长度 ha */
  altitudeA: { foot: Point2D; length: number };
  /** 投影定理数值: c*cosB 与 b*cosC */
  projections: { cCosB: number; bCosC: number };
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
  angleADeg: number
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

  // 设置基本坐标
  const rawA: Point2D = { x: 0, y: 0 };
  const rawC: Point2D = { x: b, y: 0 };
  const rawB: Point2D = { x: c * Math.cos(radA), y: c * Math.sin(radA) };

  // 计算形心并平移，使形心居于 (0,0)
  const centroidX = (rawA.x + rawB.x + rawC.x) / 3;
  const centroidY = (rawA.y + rawB.y + rawC.y) / 3;

  const A: Point2D = { x: rawA.x - centroidX, y: rawA.y - centroidY };
  const B: Point2D = { x: rawB.x - centroidX, y: rawB.y - centroidY };
  const C: Point2D = { x: rawC.x - centroidX, y: rawC.y - centroidY };

  // 外心 O 坐标计算
  const oxRaw = b / 2;
  const oyRaw = sinA > 1e-6 ? (c * c - 2 * c * oxRaw * Math.cos(radA)) / (2 * c * sinA) : 0;
  const circumcenter: Point2D = {
    x: oxRaw - centroidX,
    y: oyRaw - centroidY,
  };

  // 内心 I 坐标计算
  const incenterX = (a * A.x + b * B.x + c * C.x) / (a + b + c);
  const incenterY = (a * A.y + b * B.y + c * C.y) / (a + b + c);
  const incenter: Point2D = { x: incenterX, y: incenterY };

  // 顶点 A 向 BC 边的高 FootD
  const bcDx = C.x - B.x;
  const bcDy = C.y - B.y;
  const bcLenSq = bcDx * bcDx + bcDy * bcDy;
  const tA = bcLenSq > 1e-6 ? ((A.x - B.x) * bcDx + (A.y - B.y) * bcDy) / bcLenSq : 0;
  const footD: Point2D = {
    x: B.x + tA * bcDx,
    y: B.y + tA * bcDy,
  };
  const ha = (2 * area) / a;

  // 投影定理分量
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
    incircle: { radius: r, center: incenter },
    altitudeA: { foot: footD, length: ha },
    projections: { cCosB, bCosC },
  };
}

/**
 * SSA 探究模式：已知对角 A(deg)、已知边 b、已知对边 a
 */
export function solveSSA(
  a: number,
  b: number,
  angleADeg: number
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
          Math.max(-1, Math.min(1, (cVal * cVal + a * a - b * b) / (2 * cVal * a)))
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
        Math.max(-1, Math.min(1, (cVal * cVal + a * a - b * b) / (2 * cVal * a)))
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
