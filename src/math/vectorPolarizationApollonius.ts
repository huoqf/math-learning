/**
 * src/math/vectorPolarizationApollonius.ts
 * 向量极化恒等式与阿波罗尼斯圆纯数学计算层
 * 纯函数，零 React/DOM/window 依赖
 */

export interface Vector2D {
  x: number;
  y: number;
}

/** 极化恒等式计算结果 */
export interface PolarizationIdentityResult {
  pointA: Vector2D;
  pointB: Vector2D;
  pointC: Vector2D;
  pointM: Vector2D;
  vecAB: Vector2D;
  vecAC: Vector2D;
  vecAM: Vector2D;
  vecBM: Vector2D;
  lenAM: number;
  lenBM: number;
  lenBC: number;
  dotProductCoord: number; // 坐标点积 x1*x2 + y1*y2
  dotProductPolar: number; // 极化恒等式 |AM|^2 - |BM|^2
  isValid: boolean;
}

/** 阿波罗尼斯圆计算结果 */
export interface ApolloniusCircleResult {
  pointA: Vector2D;
  pointB: Vector2D;
  pointD: Vector2D; // 内分点 AD:DB = λ
  pointE: Vector2D; // 外分点 AE:EB = λ
  centerO: Vector2D; // 圆心
  radiusR: number; // 半径
  isDegenerate: boolean; // λ = 1 时退化为中垂线
  pointP: Vector2D; // 动点 P
  distPA: number;
  distPB: number;
  ratioP: number;
  vecPA: Vector2D;
  vecPB: Vector2D;
  dotProductP: number;
  isValid: boolean;
}

/** 综合模型计算结果 (阿圆上的极化恒等式最值) */
export interface CombinedModelResult extends ApolloniusCircleResult {
  pointM: Vector2D; // AB 中点
  lenMB: number; // |MB| (定值)
  lenPM: number; // |PM| (动态)
  dotProductViaPolar: number; // |PM|^2 - |MB|^2
  minDotProduct: number; // 最微数量积 (PM_min^2 - MB^2)
  maxDotProduct: number; // 最大数量积 (PM_max^2 - MB^2)
  minPoint: Vector2D; // 取得最小值时的 P 点位置 (靠近 M 侧)
  maxPoint: Vector2D; // 取得最大值时的 P 点位置 (远离 M 侧)
}

/**
 * 求解向量极化恒等式
 * @param ax 动点 A 的 x 坐标
 * @param ay 动点 A 的 y 坐标
 * @param bcLength 底边 BC 的长度
 */
export function calcPolarizationIdentity(
  ax: number,
  ay: number,
  bcLength: number,
): PolarizationIdentityResult {
  const safeBc = Math.max(0.1, bcLength);
  const c = safeBc / 2;

  const pointB: Vector2D = { x: -c, y: 0 };
  const pointC: Vector2D = { x: c, y: 0 };
  const pointM: Vector2D = { x: 0, y: 0 };
  const pointA: Vector2D = { x: ax, y: ay };

  const vecAB: Vector2D = { x: pointB.x - pointA.x, y: pointB.y - pointA.y };
  const vecAC: Vector2D = { x: pointC.x - pointA.x, y: pointC.y - pointA.y };
  const vecAM: Vector2D = { x: pointM.x - pointA.x, y: pointM.y - pointA.y };
  const vecBM: Vector2D = { x: pointM.x - pointB.x, y: pointM.y - pointB.y };

  const lenAM = Math.hypot(vecAM.x, vecAM.y);
  const lenBM = c;
  const lenBC = safeBc;

  // 坐标点积 AB · AC
  const dotProductCoord = vecAB.x * vecAC.x + vecAB.y * vecAC.y;
  // 极化恒等式 |AM|^2 - |BM|^2
  const dotProductPolar = lenAM * lenAM - lenBM * lenBM;

  return {
    pointA,
    pointB,
    pointC,
    pointM,
    vecAB,
    vecAC,
    vecAM,
    vecBM,
    lenAM,
    lenBM,
    lenBC,
    dotProductCoord,
    dotProductPolar,
    isValid: true,
  };
}

/**
 * 求解阿波罗尼斯圆及其轨迹动点
 * @param bcLength 定点 A, B 间距离 d
 * @param lambda 距离比 λ = |PA|/|PB|
 * @param angleDeg 动点 P 在圆上的参数角度 (度数 0-360)
 */
export function calcApolloniusCircle(
  bcLength: number,
  lambda: number,
  angleDeg: number,
): ApolloniusCircleResult {
  const safeD = Math.max(0.1, bcLength);
  const c = safeD / 2;
  const pointA: Vector2D = { x: -c, y: 0 };
  const pointB: Vector2D = { x: c, y: 0 };

  const isDegenerate = Math.abs(lambda - 1.0) < 1e-4;

  let pointD: Vector2D;
  let pointE: Vector2D;
  let centerO: Vector2D;
  let radiusR: number;

  if (isDegenerate) {
    // 退化为中垂线 x = 0
    pointD = { x: 0, y: 0 };
    pointE = { x: 0, y: 0 };
    centerO = { x: 0, y: 0 };
    radiusR = Infinity;
  } else {
    // 内分点 AD / DB = λ => D.x = (-c + λ * c) / (1 + λ) = c * (λ - 1) / (λ + 1)
    const xD = (c * (lambda - 1)) / (lambda + 1);
    pointD = { x: xD, y: 0 };

    // 外分点 AE / EB = λ => E.x = (-c - λ * (-c...))
    // 向量形式: E - A = λ (E - B) => E(1 - λ) = A - λ B = (-c - λ c, 0)
    // E.x = c * (1 + λ) / (λ - 1)
    const xE = (c * (1 + lambda)) / (lambda - 1);
    pointE = { x: xE, y: 0 };

    // 圆心为 DE 中点
    const xCenter = (xD + xE) / 2; // 也即 c * (λ^2 + 1) / (λ^2 - 1)
    centerO = { x: xCenter, y: 0 };

    // 半径为 |xD - xE| / 2
    radiusR = Math.abs(xE - xD) / 2; // 也即 2c λ / |λ^2 - 1|
  }

  // 计算动点 P 坐标
  let pointP: Vector2D;
  if (isDegenerate) {
    // 在中垂线上: P.x = 0, P.y 根据角度映射为 (-6 到 6)
    const rad = (angleDeg * Math.PI) / 180;
    const yVal = Math.tan(rad) * 3;
    pointP = { x: 0, y: Number.isFinite(yVal) ? yVal : 0 };
  } else {
    const rad = (angleDeg * Math.PI) / 180;
    pointP = {
      x: centerO.x + radiusR * Math.cos(rad),
      y: centerO.y + radiusR * Math.sin(rad),
    };
  }

  const distPA = Math.hypot(pointP.x - pointA.x, pointP.y - pointA.y);
  const distPB = Math.hypot(pointP.x - pointB.x, pointP.y - pointB.y);
  const ratioP = distPB > 1e-6 ? distPA / distPB : lambda;

  const vecPA: Vector2D = { x: pointA.x - pointP.x, y: pointA.y - pointP.y };
  const vecPB: Vector2D = { x: pointB.x - pointP.x, y: pointB.y - pointP.y };
  const dotProductP = vecPA.x * vecPB.x + vecPA.y * vecPB.y;

  return {
    pointA,
    pointB,
    pointD,
    pointE,
    centerO,
    radiusR,
    isDegenerate,
    pointP,
    distPA,
    distPB,
    ratioP,
    vecPA,
    vecPB,
    dotProductP,
    isValid: true,
  };
}

/**
 * 求解阿波罗尼斯圆 × 极化恒等式综合压轴模型
 */
export function calcCombinedModel(
  bcLength: number,
  lambda: number,
  angleDeg: number,
): CombinedModelResult {
  const baseCircle = calcApolloniusCircle(bcLength, lambda, angleDeg);
  const pointM: Vector2D = { x: 0, y: 0 }; // AB 中点为原点
  const lenMB = Math.abs(baseCircle.pointB.x);

  const vecPM: Vector2D = {
    x: pointM.x - baseCircle.pointP.x,
    y: pointM.y - baseCircle.pointP.y,
  };
  const lenPM = Math.hypot(vecPM.x, vecPM.y);

  // 极化恒等式验证: PA · PB = |PM|^2 - |MB|^2
  const dotProductViaPolar = lenPM * lenPM - lenMB * lenMB;

  let minDotProduct: number;
  let maxDotProduct: number;
  let minPoint: Vector2D;
  let maxPoint: Vector2D;

  if (baseCircle.isDegenerate) {
    // 退化为中垂线，P 在 (0, y)
    // PM_min = |0 - 0| = 0 (当 P 为 M 时)
    minDotProduct = 0 - lenMB * lenMB;
    maxDotProduct = Infinity;
    minPoint = { x: 0, y: 0 };
    maxPoint = { x: 0, y: Infinity };
  } else {
    // 圆心到 M 的距离
    const distOM = Math.abs(baseCircle.centerO.x);

    // M 到阿圆最短距离点与最长距离点
    const minDistPM = Math.abs(distOM - baseCircle.radiusR);
    const maxDistPM = distOM + baseCircle.radiusR;

    minDotProduct = minDistPM * minDistPM - lenMB * lenMB;
    maxDotProduct = maxDistPM * maxDistPM - lenMB * lenMB;

    // 定位极值点
    if (baseCircle.centerO.x > 0) {
      minPoint =
        baseCircle.pointD.x < baseCircle.pointE.x
          ? baseCircle.pointD
          : baseCircle.pointE;
      maxPoint =
        baseCircle.pointD.x > baseCircle.pointE.x
          ? baseCircle.pointD
          : baseCircle.pointE;
    } else {
      minPoint =
        baseCircle.pointD.x > baseCircle.pointE.x
          ? baseCircle.pointD
          : baseCircle.pointE;
      maxPoint =
        baseCircle.pointD.x < baseCircle.pointE.x
          ? baseCircle.pointD
          : baseCircle.pointE;
    }
  }

  return {
    ...baseCircle,
    pointM,
    lenMB,
    lenPM,
    dotProductViaPolar,
    minDotProduct,
    maxDotProduct,
    minPoint,
    maxPoint,
  };
}
