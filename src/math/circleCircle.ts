import { formatGeneralEquationLatex } from "@/math/lineEquation";

export type CirclePositionRelation =
  | "disjoint" // 外离 (d > r1 + r2)
  | "outer_tangent" // 外切 (d = r1 + r2)
  | "intersect" // 相交 (|r1 - r2| < d < r1 + r2)
  | "inner_tangent" // 内切 (d = |r1 - r2| > 0)
  | "contain" // 内含 (d < |r1 - r2|)
  | "concentric"; // 同心 (d = 0)

export interface CircleParams {
  x1: number;
  y1: number;
  r1: number;
  x2: number;
  y2: number;
  r2: number;
}

export interface Point2D {
  x: number;
  y: number;
}

export interface LineEquationCoeffs {
  A: number;
  B: number;
  C: number; // Ax + By + C = 0
  latex: string;
}

export interface TangentLineResult {
  type: "outer" | "inner";
  line: LineEquationCoeffs;
  tPoint1: Point2D;
  tPoint2: Point2D;
}

export interface CircleCircleResult {
  d: number; // 圆心距
  sumR: number; // r1 + r2
  diffR: number; // |r1 - r2|
  relation: CirclePositionRelation;
  relationText: string;
  intersections: Point2D[];
  commonChord: {
    line: LineEquationCoeffs;
    lineType: "chord" | "tangent" | "radical_axis"; // 相交为公共弦，相切为公切线，不相交为根轴
    length: number | null; // 相交时为公共弦长，其他为 null
    midpoint: Point2D | null; // 弦中点 / 垂足 M
    distToO1: number | null; // O1 到公共弦距离（弦心距 d1）
    distToO2: number | null; // O2 到公共弦距离（弦心距 d2）
  } | null;
  tangents: TangentLineResult[];
  tangentCount: number;
  outerTangentLength: number | null; // 外公切线长
  innerTangentLength: number | null; // 内公切线长
}

const EPS = 1e-4;

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b > 1e-6) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a;
}

/**
 * 将一般式直线系数 Ax + By + C = 0 规整为高中数学最简整数比（首项系数正定）
 */
export function simplifyGeneralLine(
  A: number,
  B: number,
  C: number,
): LineEquationCoeffs {
  if (Math.abs(A) < 1e-6 && Math.abs(B) < 1e-6) {
    return { A: 0, B: 0, C, latex: "0 = 0" };
  }

  // 尝试将 0.1, 0.25, 0.5 等步长参数缩放为整数
  let scale = 1;
  for (const m of [1, 2, 4, 5, 10, 20, 100]) {
    const aInt = Math.round(A * m);
    const bInt = Math.round(B * m);
    const cInt = Math.round(C * m);
    if (
      Math.abs(A * m - aInt) < 1e-4 &&
      Math.abs(B * m - bInt) < 1e-4 &&
      Math.abs(C * m - cInt) < 1e-4
    ) {
      scale = m;
      break;
    }
  }

  let aInt = Math.round(A * scale);
  let bInt = Math.round(B * scale);
  let cInt = Math.round(C * scale);

  // 首项系数正规化：A > 0；若 A = 0 则 B > 0
  if (aInt < 0 || (aInt === 0 && bInt < 0)) {
    aInt = -aInt;
    bInt = -bInt;
    cInt = -cInt;
  }

  const g = gcd(gcd(aInt, bInt), cInt) || 1;
  const finalA = Math.round(aInt / g);
  const finalB = Math.round(bInt / g);
  const finalC = Math.round(cInt / g);

  const latex = formatGeneralEquationLatex(finalA, finalB, finalC);
  return { A: finalA, B: finalB, C: finalC, latex };
}

/**
 * 求解两圆几何关系与相关量
 */
export function calculateCircleCircle(
  params: CircleParams,
): CircleCircleResult {
  const { x1, y1, r1, x2, y2, r2 } = params;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const d = Math.hypot(dx, dy);

  const sumR = r1 + r2;
  const diffR = Math.abs(r1 - r2);

  // 1. 判断位置关系
  let relation: CirclePositionRelation;
  let relationText = "";

  if (d < EPS) {
    relation = "concentric";
    relationText = Math.abs(r1 - r2) < EPS ? "两圆重合" : "同心圆 (内含)";
  } else if (d > sumR + EPS) {
    relation = "disjoint";
    relationText = "外离 (4条公切线)";
  } else if (Math.abs(d - sumR) <= EPS) {
    relation = "outer_tangent";
    relationText = "外切 (3条公切线)";
  } else if (d > diffR + EPS && d < sumR - EPS) {
    relation = "intersect";
    relationText = "相交 (2条公切线，存在公共弦)";
  } else if (Math.abs(d - diffR) <= EPS) {
    relation = "inner_tangent";
    relationText = "内切 (1条公切线)";
  } else {
    relation = "contain";
    relationText = "内含 (0条公切线)";
  }

  // 2. 作差所得方程 C1 - C2 = 0
  // C1: (x-x1)^2 + (y-y1)^2 - r1^2 = x^2+y^2 - 2x1 x - 2y1 y + (x1^2+y1^2-r1^2) = 0
  // C2: (x-x2)^2 + (y-y2)^2 - r2^2 = x^2+y^2 - 2x2 x - 2y2 y + (x2^2+y2^2-r2^2) = 0
  // C1 - C2 = 0 <=> 2(x2-x1)x + 2(y2-y1)y + (x1^2+y1^2-r1^2 - (x2^2+y2^2-r2^2)) = 0
  let commonChord: CircleCircleResult["commonChord"] = null;
  const intersections: Point2D[] = [];

  if (d >= EPS) {
    const rawA = 2 * (x2 - x1);
    const rawB = 2 * (y2 - y1);
    const rawC = x1 * x1 + y1 * y1 - r1 * r1 - (x2 * x2 + y2 * y2 - r2 * r2);

    const line = simplifyGeneralLine(rawA, rawB, rawC);

    // 投影距离 a = (r1^2 - r2^2 + d^2) / (2d)
    const aDist = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
    const h2 = r1 * r1 - aDist * aDist;

    // 圆心 O1 到 O2 的单位方向向量
    const ux = dx / d;
    const uy = dy / d;

    // 垂直方向向量 (与连心线垂直)
    const vx = -uy;
    const vy = ux;

    // 垂足 / 弦中点 M
    const midX = x1 + aDist * ux;
    const midY = y1 + aDist * uy;
    const midpoint: Point2D = { x: midX, y: midY };

    let chordLen: number | null = null;
    const distToO1 = Math.abs(aDist);
    const distToO2 = Math.abs(d - aDist);

    if (h2 > EPS) {
      // 存在两个相异交点
      const h = Math.sqrt(h2);
      chordLen = 2 * h;
      intersections.push(
        { x: midX + h * vx, y: midY + h * vy },
        { x: midX - h * vx, y: midY - h * vy },
      );
    } else if (Math.abs(h2) <= EPS) {
      // 相切 (单个交点/切点)
      chordLen = 0;
      intersections.push({ x: midX, y: midY });
    }

    const lineType: "chord" | "tangent" | "radical_axis" =
      relation === "intersect"
        ? "chord"
        : relation === "outer_tangent" || relation === "inner_tangent"
          ? "tangent"
          : "radical_axis";

    commonChord = {
      line,
      lineType,
      length: relation === "intersect" ? chordLen : null,
      midpoint: relation === "intersect" ? midpoint : null,
      distToO1: relation === "intersect" ? distToO1 : null,
      distToO2: relation === "intersect" ? distToO2 : null,
    };
  }

  // 3. 求解公切线 (Tangent Lines)
  const tangents: TangentLineResult[] = [];

  if (d >= EPS) {
    // 3.1 外公切线 (当 d >= |r1 - r2| 时存在)
    if (d >= diffR - EPS) {
      const baseAngle = Math.atan2(dy, dx);
      if (Math.abs(r1 - r2) < EPS) {
        // 等半径：外公切线平行于圆心连线，垂直距离为 r1
        const vx = -dy / d;
        const vy = dx / d;

        const p1A = { x: x1 + r1 * vx, y: y1 + r1 * vy };
        const p2A = { x: x2 + r1 * vx, y: y2 + r1 * vy };
        tangents.push({
          type: "outer",
          line: twoPointsToLine(p1A, p2A),
          tPoint1: p1A,
          tPoint2: p2A,
        });

        const p1B = { x: x1 - r1 * vx, y: y1 - r1 * vy };
        const p2B = { x: x2 - r1 * vx, y: y2 - r1 * vy };
        tangents.push({
          type: "outer",
          line: twoPointsToLine(p1B, p2B),
          tPoint1: p1B,
          tPoint2: p2B,
        });
      } else if (Math.abs(d - diffR) <= EPS) {
        // 内切：恰有 1 条外公切线（过内切点）
        const sign = r1 > r2 ? 1 : -1;
        const theta = baseAngle;
        const tPoint: Point2D = {
          x: x1 + sign * r1 * Math.cos(theta),
          y: y1 + sign * r1 * Math.sin(theta),
        };
        const vx = -dy / d;
        const vy = dx / d;
        const otherP = { x: tPoint.x + vx, y: tPoint.y + vy };
        tangents.push({
          type: "outer",
          line: twoPointsToLine(tPoint, otherP),
          tPoint1: tPoint,
          tPoint2: tPoint,
        });
      } else {
        const alpha = Math.asin(Math.min(1, Math.max(-1, (r1 - r2) / d)));

        [-1, 1].forEach((sign) => {
          const theta = baseAngle + sign * (Math.PI / 2 - alpha);
          const t1: Point2D = {
            x: x1 + r1 * Math.cos(theta),
            y: y1 + r1 * Math.sin(theta),
          };
          const t2: Point2D = {
            x: x2 + r2 * Math.cos(theta),
            y: y2 + r2 * Math.sin(theta),
          };
          tangents.push({
            type: "outer",
            line: twoPointsToLine(t1, t2),
            tPoint1: t1,
            tPoint2: t2,
          });
        });
      }
    }

    // 3.2 内公切线 (当 d >= r1 + r2 时存在)
    if (d >= sumR - EPS) {
      if (Math.abs(d - sumR) <= EPS) {
        // 外切：恰有 1 条内公切线
        const tPoint: Point2D = {
          x: x1 + (r1 / d) * dx,
          y: y1 + (r1 / d) * dy,
        };
        const vx = -dy / d;
        const vy = dx / d;
        const otherP = { x: tPoint.x + vx, y: tPoint.y + vy };
        tangents.push({
          type: "inner",
          line: twoPointsToLine(tPoint, otherP),
          tPoint1: tPoint,
          tPoint2: tPoint,
        });
      } else {
        // 外离：有 2 条内公切线
        const alpha = Math.asin(Math.min(1, Math.max(-1, (r1 + r2) / d)));
        const baseAngle = Math.atan2(dy, dx);

        [-1, 1].forEach((sign) => {
          const theta1 = baseAngle + sign * (Math.PI / 2 - alpha);
          const theta2 = theta1 + Math.PI;
          const t1: Point2D = {
            x: x1 + r1 * Math.cos(theta1),
            y: y1 + r1 * Math.sin(theta1),
          };
          const t2: Point2D = {
            x: x2 + r2 * Math.cos(theta2),
            y: y2 + r2 * Math.sin(theta2),
          };
          tangents.push({
            type: "inner",
            line: twoPointsToLine(t1, t2),
            tPoint1: t1,
            tPoint2: t2,
          });
        });
      }
    }

    // 3.3 计算公切线长
    const outerTanSq = d * d - diffR * diffR;
    const outerTangentLength =
      d >= diffR - EPS && outerTanSq >= 0 ? Math.sqrt(outerTanSq) : null;

    const innerTanSq = d * d - sumR * sumR;
    const innerTangentLength =
      d >= sumR - EPS && innerTanSq >= 0 ? Math.sqrt(innerTanSq) : null;

    return {
      d,
      sumR,
      diffR,
      relation,
      relationText,
      intersections,
      commonChord,
      tangents,
      tangentCount: tangents.length,
      outerTangentLength,
      innerTangentLength,
    };
  }

  return {
    d,
    sumR,
    diffR,
    relation,
    relationText,
    intersections,
    commonChord: null,
    tangents: [],
    tangentCount: 0,
    outerTangentLength: null,
    innerTangentLength: null,
  };
}

function twoPointsToLine(p1: Point2D, p2: Point2D): LineEquationCoeffs {
  const A = p2.y - p1.y;
  const B = p1.x - p2.x;
  const C = p2.x * p1.y - p1.x * p2.y;
  return simplifyGeneralLine(A, B, C);
}
