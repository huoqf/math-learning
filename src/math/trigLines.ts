/**
 * src/math/trigLines.ts
 * 纯数学逻辑层：零 DOM、零 React、零副作用
 */

export interface Point2D {
  x: number;
  y: number;
}

export interface TrigLinesState {
  alphaDeg: number;
  alphaRad: number;
  normalizeDeg: number; // 规范到 [0, 360)
  quadrant:
    | 1
    | 2
    | 3
    | 4
    | "axis-x-pos"
    | "axis-x-neg"
    | "axis-y-pos"
    | "axis-y-neg"
    | "origin";
  pointP: Point2D;
  pointM: Point2D;
  pointA: Point2D;
  pointT: Point2D | null; // 当 cos α = 0 时为 null
  sinVal: number;
  cosVal: number;
  tanVal: number | null;
  isTanDefined: boolean;
  hasDegenerateSine: boolean; // sin α = 0 (MP 缩为点)
  hasDegenerateCosine: boolean; // cos α = 0 (OM 缩为点)
  hasDegenerateTangent: boolean; // tan α = 0 (AT 缩为点)
}

/**
 * 规范化角度到 [0, 360)
 */
export function normalizeAngleDeg(deg: number): number {
  let mod = deg % 360;
  if (mod < 0) mod += 360;
  return mod;
}

/**
 * 根据角度度数计算完整的三角函数线几何数学信息
 */
export function calculateTrigLines(alphaDeg: number): TrigLinesState {
  const alphaRad = (alphaDeg * Math.PI) / 180;
  const normalizeDeg = normalizeAngleDeg(alphaDeg);

  const cosVal = Math.cos(alphaRad);
  const sinVal = Math.sin(alphaRad);

  const pointP: Point2D = { x: cosVal, y: sinVal };
  const pointM: Point2D = { x: cosVal, y: 0 };
  const pointA: Point2D = { x: 1, y: 0 };

  // 判断正切线是否存在：即 cosVal 是否接近 0
  const isTanDefined = Math.abs(cosVal) > 1e-7;
  let tanVal: number | null = null;
  let pointT: Point2D | null = null;

  if (isTanDefined) {
    tanVal = Math.tan(alphaRad);
    pointT = { x: 1, y: tanVal };
  }

  // 判定象限与轴线
  let quadrant: TrigLinesState["quadrant"];
  const normRad = (normalizeDeg * Math.PI) / 180;

  if (Math.abs(sinVal) < 1e-7) {
    quadrant = cosVal > 0 ? "axis-x-pos" : "axis-x-neg";
  } else if (Math.abs(cosVal) < 1e-7) {
    quadrant = sinVal > 0 ? "axis-y-pos" : "axis-y-neg";
  } else if (normRad > 0 && normRad < Math.PI / 2) {
    quadrant = 1;
  } else if (normRad > Math.PI / 2 && normRad < Math.PI) {
    quadrant = 2;
  } else if (normRad > Math.PI && normRad < (3 * Math.PI) / 2) {
    quadrant = 3;
  } else {
    quadrant = 4;
  }

  return {
    alphaDeg,
    alphaRad,
    normalizeDeg,
    quadrant,
    pointP,
    pointM,
    pointA,
    pointT,
    sinVal,
    cosVal,
    tanVal,
    isTanDefined,
    hasDegenerateSine: Math.abs(sinVal) < 1e-7,
    hasDegenerateCosine: Math.abs(cosVal) < 1e-7,
    hasDegenerateTangent: Math.abs(sinVal) < 1e-7,
  };
}

/**
 * 拖拽单位圆上一点 (x, y) 求解对应角 alphaDeg
 */
export function pointToAngleDeg(
  x: number,
  y: number,
  currentAlphaDeg: number,
): number {
  const rad = Math.atan2(y, x);
  let deg = (rad * 180) / Math.PI;
  if (deg < 0) deg += 360;

  // 根据 currentAlphaDeg 保持圈数
  const circles = Math.floor(currentAlphaDeg / 360);
  let targetDeg = circles * 360 + deg;

  if (targetDeg - currentAlphaDeg > 180) {
    targetDeg -= 360;
  } else if (targetDeg - currentAlphaDeg < -180) {
    targetDeg += 360;
  }

  return Math.round(targetDeg);
}

/**
 * 第一象限三阶几何面积比较信息
 */
export interface ComparisonAreas {
  triangleOMP: number; // 1/2 * sin(x) * cos(x)
  sectorOAP: number; // 1/2 * x (rad)
  triangleOAT: number; // 1/2 * tan(x)
  xRad: number;
  sinX: number;
  tanX: number;
}

export function calculateComparisonAreas(alphaDeg: number): ComparisonAreas {
  // 规范到 (0, 90) 度
  const clampedDeg = Math.max(0.1, Math.min(89.9, normalizeAngleDeg(alphaDeg)));
  const xRad = (clampedDeg * Math.PI) / 180;
  const sinX = Math.sin(xRad);
  const cosX = Math.cos(xRad);
  const tanX = Math.tan(xRad);

  return {
    triangleOMP: 0.5 * sinX * cosX,
    sectorOAP: 0.5 * xRad,
    triangleOAT: 0.5 * tanX,
    xRad,
    sinX,
    tanX,
  };
}

/**
 * 不等式类型
 */
export type TrigInequalityKind =
  "sin_gt" | "sin_lt" | "cos_gt" | "cos_lt" | "tan_gt" | "tan_lt";

export interface ArcInterval {
  startRad: number;
  endRad: number;
  startDeg: number;
  endDeg: number;
}

export interface TrigInequalityResult {
  kind: TrigInequalityKind;
  threshold: number;
  intervals: ArcInterval[]; // [0, 2pi) 上的有效弧区间
  boundaryPoints: Point2D[];
  latexSolution: string;
  isSatisfied: boolean; // 当前动角 alpha 是否满足不等式
}

/**
 * 解一元三角不等式纯函数
 */
export function solveTrigInequality(
  kind: TrigInequalityKind,
  threshold: number,
  currentAlphaDeg: number,
): TrigInequalityResult {
  const normDeg = normalizeAngleDeg(currentAlphaDeg);
  const normRad = (normDeg * Math.PI) / 180;
  let intervals: ArcInterval[] = [];
  const boundaryPoints: Point2D[] = [];
  let isSatisfied = false;
  let latexSolution = "";

  if (kind === "sin_gt") {
    const c = Math.max(-1, Math.min(1, threshold));
    if (c >= 1) {
      latexSolution = "\\varnothing";
    } else if (c <= -1) {
      intervals = [
        { startRad: 0, endRad: 2 * Math.PI, startDeg: 0, endDeg: 360 },
      ];
      latexSolution =
        "x \\in \\mathbb{R} \\setminus \\{2k\\pi - \\frac{\\pi}{2}\\}";
    } else {
      const alpha0 = Math.asin(c); // [-pi/2, pi/2]
      const rad1 = alpha0 >= 0 ? alpha0 : 2 * Math.PI + alpha0;
      const rad2 = Math.PI - alpha0;
      const [startRad, endRad] = rad1 < rad2 ? [rad1, rad2] : [rad2, rad1];
      intervals = [
        {
          startRad,
          endRad,
          startDeg: (startRad * 180) / Math.PI,
          endDeg: (endRad * 180) / Math.PI,
        },
      ];
      boundaryPoints.push(
        { x: Math.cos(startRad), y: Math.sin(startRad) },
        { x: Math.cos(endRad), y: Math.sin(endRad) },
      );
      const s1 = (startRad / Math.PI).toFixed(2);
      const s2 = (endRad / Math.PI).toFixed(2);
      latexSolution = `x \\in \\left( 2k\\pi + ${s1}\\pi, \\; 2k\\pi + ${s2}\\pi \\right)`;
    }
    isSatisfied = Math.sin(normRad) > c;
  } else if (kind === "sin_lt") {
    const c = Math.max(-1, Math.min(1, threshold));
    if (c <= -1) {
      latexSolution = "\\varnothing";
    } else if (c >= 1) {
      intervals = [
        { startRad: 0, endRad: 2 * Math.PI, startDeg: 0, endDeg: 360 },
      ];
      latexSolution =
        "x \\in \\mathbb{R} \\setminus \\{2k\\pi + \\frac{\\pi}{2}\\}";
    } else {
      const alpha0 = Math.asin(c);
      const rad1 = alpha0 >= 0 ? alpha0 : 2 * Math.PI + alpha0;
      const rad2 = Math.PI - alpha0;
      const [rMin, rMax] = rad1 < rad2 ? [rad1, rad2] : [rad2, rad1];
      intervals = [
        {
          startRad: 0,
          endRad: rMin,
          startDeg: 0,
          endDeg: (rMin * 180) / Math.PI,
        },
        {
          startRad: rMax,
          endRad: 2 * Math.PI,
          startDeg: (rMax * 180) / Math.PI,
          endDeg: 360,
        },
      ];
      boundaryPoints.push(
        { x: Math.cos(rMin), y: Math.sin(rMin) },
        { x: Math.cos(rMax), y: Math.sin(rMax) },
      );
      const s1 = (rMax / Math.PI).toFixed(2);
      const s2 = ((rMin + 2 * Math.PI) / Math.PI).toFixed(2);
      latexSolution = `x \\in \\left( 2k\\pi + ${s1}\\pi, \\; 2k\\pi + ${s2}\\pi \\right)`;
    }
    isSatisfied = Math.sin(normRad) < c;
  } else if (kind === "cos_gt") {
    const c = Math.max(-1, Math.min(1, threshold));
    if (c >= 1) {
      latexSolution = "\\varnothing";
    } else if (c <= -1) {
      intervals = [
        { startRad: 0, endRad: 2 * Math.PI, startDeg: 0, endDeg: 360 },
      ];
      latexSolution = "x \\in \\mathbb{R} \\setminus \\{2k\\pi + \\pi\\}";
    } else {
      const alpha0 = Math.acos(c); // [0, pi]
      intervals = [
        {
          startRad: 0,
          endRad: alpha0,
          startDeg: 0,
          endDeg: (alpha0 * 180) / Math.PI,
        },
        {
          startRad: 2 * Math.PI - alpha0,
          endRad: 2 * Math.PI,
          startDeg: 360 - (alpha0 * 180) / Math.PI,
          endDeg: 360,
        },
      ];
      boundaryPoints.push(
        { x: Math.cos(alpha0), y: Math.sin(alpha0) },
        {
          x: Math.cos(2 * Math.PI - alpha0),
          y: Math.sin(2 * Math.PI - alpha0),
        },
      );
      const s1 = (alpha0 / Math.PI).toFixed(2);
      latexSolution = `x \\in \\left( 2k\\pi - ${s1}\\pi, \\; 2k\\pi + ${s1}\\pi \\right)`;
    }
    isSatisfied = Math.cos(normRad) > c;
  } else if (kind === "cos_lt") {
    const c = Math.max(-1, Math.min(1, threshold));
    if (c <= -1) {
      latexSolution = "\\varnothing";
    } else if (c >= 1) {
      intervals = [
        { startRad: 0, endRad: 2 * Math.PI, startDeg: 0, endDeg: 360 },
      ];
      latexSolution = "x \\in \\mathbb{R} \\setminus \\{2k\\pi\\}";
    } else {
      const alpha0 = Math.acos(c);
      intervals = [
        {
          startRad: alpha0,
          endRad: 2 * Math.PI - alpha0,
          startDeg: (alpha0 * 180) / Math.PI,
          endDeg: 360 - (alpha0 * 180) / Math.PI,
        },
      ];
      boundaryPoints.push(
        { x: Math.cos(alpha0), y: Math.sin(alpha0) },
        {
          x: Math.cos(2 * Math.PI - alpha0),
          y: Math.sin(2 * Math.PI - alpha0),
        },
      );
      const s1 = (alpha0 / Math.PI).toFixed(2);
      const s2 = ((2 * Math.PI - alpha0) / Math.PI).toFixed(2);
      latexSolution = `x \\in \\left( 2k\\pi + ${s1}\\pi, \\; 2k\\pi + ${s2}\\pi \\right)`;
    }
    isSatisfied = Math.cos(normRad) < c;
  } else if (kind === "tan_gt") {
    const k = threshold;
    const alpha0 = Math.atan(k); // (-pi/2, pi/2)
    const baseStart = alpha0 >= 0 ? alpha0 : Math.PI + alpha0;
    const baseEnd = Math.PI / 2;
    const secondStart =
      baseStart + Math.PI > 2 * Math.PI
        ? baseStart - Math.PI
        : baseStart + Math.PI;
    const secondEnd = (3 * Math.PI) / 2;

    intervals = [
      {
        startRad: baseStart,
        endRad: baseEnd,
        startDeg: (baseStart * 180) / Math.PI,
        endDeg: 90,
      },
      {
        startRad: secondStart,
        endRad: secondEnd,
        startDeg: (secondStart * 180) / Math.PI,
        endDeg: 270,
      },
    ];
    boundaryPoints.push(
      { x: Math.cos(baseStart), y: Math.sin(baseStart) },
      { x: Math.cos(secondStart), y: Math.sin(secondStart) },
    );
    const s1 = (alpha0 / Math.PI).toFixed(2);
    latexSolution = `x \\in \\left( k\\pi + ${s1}\\pi, \\; k\\pi + \\frac{\\pi}{2} \\right)`;
    isSatisfied = Math.abs(Math.cos(normRad)) > 1e-7 && Math.tan(normRad) > k;
  } else {
    // tan_lt
    const k = threshold;
    const alpha0 = Math.atan(k);
    const s1 = (alpha0 / Math.PI).toFixed(2);
    latexSolution = `x \\in \\left( k\\pi - \\frac{\\pi}{2}, \\; k\\pi + ${s1}\\pi \\right)`;
    isSatisfied = Math.abs(Math.cos(normRad)) > 1e-7 && Math.tan(normRad) < k;
  }

  return {
    kind,
    threshold,
    intervals,
    boundaryPoints,
    latexSolution,
    isSatisfied,
  };
}
