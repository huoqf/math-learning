/**
 * src/features/trigLines/math/trigLines.ts
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
  quadrant: 1 | 2 | 3 | 4 | "axis-x-pos" | "axis-x-neg" | "axis-y-pos" | "axis-y-neg" | "origin";
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
export function pointToAngleDeg(x: number, y: number, currentAlphaDeg: number): number {
  let rad = Math.atan2(y, x);
  let deg = (rad * 180) / Math.PI;
  if (deg < 0) deg += 360;

  // 根据 currentAlphaDeg 保持圈数（例如在 360~720 范围内时，避免突变成 0~360）
  const circles = Math.floor(currentAlphaDeg / 360);
  let targetDeg = circles * 360 + deg;

  // 使其尽量贴近 currentAlphaDeg
  if (targetDeg - currentAlphaDeg > 180) {
    targetDeg -= 360;
  } else if (targetDeg - currentAlphaDeg < -180) {
    targetDeg += 360;
  }

  return Math.round(targetDeg);
}
