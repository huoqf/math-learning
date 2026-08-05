/**
 * src/features/inequalityBasic/math/inequalityBasic.ts
 * 纯数学计算层（零副作用、无 React/DOM/window 依赖）
 */

export interface MeansResult {
  am: number; // 算术平均数 Arithmetic Mean (a+b)/2
  gm: number; // 几何平均数 Geometric Mean sqrt(ab)
  hm: number; // 调和平均数 Harmonic Mean 2ab/(a+b)
  qm: number; // 平方平均数 Quadratic Mean sqrt((a^2+b^2)/2)
  isEqual: boolean;
  diffAmGm: number;
}

export interface SemicircleGeometry {
  radius: number; // R = AM
  center: { x: number; y: number }; // (0, 0)
  pointA: { x: number; y: number }; // 直径左端点 (-R, 0)
  pointB: { x: number; y: number }; // 直径右端点 (R, 0)
  pointP: { x: number; y: number }; // 切分点 ((a-b)/2, 0)
  pointC: { x: number; y: number }; // 垂线与半圆交点 ((a-b)/2, GM)
  pointD: { x: number; y: number }; // P到OC垂线段垂足
  pointM: { x: number; y: number }; // 半圆弧最高点 (0, R)
  segmentAPLen: number; // a
  segmentPBLen: number; // b
  segmentPCLen: number; // GM = sqrt(ab)
  segmentOCLen: number; // AM = (a+b)/2
  segmentCDLen: number; // HM = 2ab/(a+b)
  segmentQMLen: number; // QM
}

export interface SquareProofGeometry {
  totalSide: number; // a + b
  rectWidth: number; // a
  rectHeight: number; // b
  innerSide: number; // |a - b|
  totalArea: number; // (a+b)^2
  fourRectsArea: number; // 4ab
  innerSquareArea: number; // (a-b)^2
}

export interface NikeExtremaGeometry {
  k: number;
  minX: number; // sqrt(k)
  minY: number; // 2*sqrt(k)
  currentX: number;
  currentY: number;
  currentSum: number; // x + k/x
  isAtMin: boolean;
}

/**
 * 计算四大均值及差异
 */
export function calcMeans(a: number, b: number): MeansResult {
  const safeA = Math.max(0.0001, a);
  const safeB = Math.max(0.0001, b);

  const am = (safeA + safeB) / 2;
  const gm = Math.sqrt(safeA * safeB);
  const hm = (2 * safeA * safeB) / (safeA + safeB);
  const qm = Math.sqrt((safeA * safeA + safeB * safeB) / 2);

  const isEqual = Math.abs(safeA - safeB) < 1e-4;
  const diffAmGm = am - gm;

  return { am, gm, hm, qm, isEqual, diffAmGm };
}

/**
 * 计算半圆均值证明几何图解数据
 * 以圆心为原点 (0,0)，直径位于 x 轴，半圆位于 y >= 0 区域
 */
export function getSemicircleGeometry(
  a: number,
  b: number,
): SemicircleGeometry {
  const safeA = Math.max(0.1, a);
  const safeB = Math.max(0.1, b);
  const { am, gm, hm, qm } = calcMeans(safeA, safeB);

  const R = am;
  const center = { x: 0, y: 0 };
  const pointA = { x: -R, y: 0 };
  const pointB = { x: R, y: 0 };

  // AP = safeA, 故 xP = -R + safeA = (safeA - safeB) / 2
  const px = (safeA - safeB) / 2;
  const pointP = { x: px, y: 0 };

  // 交点 C 在半圆上，yC = sqrt(R^2 - px^2) = GM
  const pointC = { x: px, y: gm };

  // 半圆最高点 M (0, R)
  const pointM = { x: 0, y: R };

  // P 到 OC 垂线段垂足 D：
  // 向量 OC = (px, gm)，模长为 R
  // 向量 OP = (px, 0)
  // OP 在 OC 上的投影点 D 坐标为 ( (OP·OC)/R^2 ) * OC
  const dotProd = px * px;
  const t = dotProd / (R * R);
  const pointD = { x: t * px, y: t * gm };

  return {
    radius: R,
    center,
    pointA,
    pointB,
    pointP,
    pointC,
    pointD,
    pointM,
    segmentAPLen: safeA,
    segmentPBLen: safeB,
    segmentPCLen: gm,
    segmentOCLen: am,
    segmentCDLen: hm,
    segmentQMLen: qm,
  };
}

/**
 * 赵爽弦图 / 矩形与正方形面积比较几何数据
 */
export function getSquareProofGeometry(
  a: number,
  b: number,
): SquareProofGeometry {
  const safeA = Math.max(0.1, a);
  const safeB = Math.max(0.1, b);

  const totalSide = safeA + safeB;
  const innerSide = Math.abs(safeA - safeB);
  const totalArea = totalSide * totalSide;
  const fourRectsArea = 4 * safeA * safeB;
  const innerSquareArea = innerSide * innerSide;

  return {
    totalSide,
    rectWidth: safeA,
    rectHeight: safeB,
    innerSide,
    totalArea,
    fourRectsArea,
    innerSquareArea,
  };
}

/**
 * 对勾函数最值计算数据
 */
export function getNikeExtremaGeometry(
  k: number,
  currentX: number,
): NikeExtremaGeometry {
  const safeK = Math.max(0.1, k);
  const minX = Math.sqrt(safeK);
  const minY = 2 * minX;

  const x = Math.max(0.1, currentX);
  const currentY = x + safeK / x;

  const isAtMin = Math.abs(x - minX) < 1e-2;

  return {
    k: safeK,
    minX,
    minY,
    currentX: x,
    currentY,
    currentSum: currentY,
    isAtMin,
  };
}
