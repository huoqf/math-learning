/**
 * @file surfaceRelation.ts
 * 面面平行与垂直纯数学计算模块（遵循无副作用纯函数规范）
 */

import type { Vec3 } from "./vector3";

/**
 * 计算面面平行判定中相交直线与旋转状态
 * 当 isIntersect = true 时，两条直线 a, b 在平面 alpha 内相交于 P(0,0,0)
 * 当 isIntersect = false 时，两条直线 a, b 在平面 alpha 内平行，且 alpha 平面可绕直线 a 旋转 angleDeg 形成相交反例
 */
export function calculateParallelJudgeState(
  isIntersect: boolean,
  tiltAngleDeg: number = 0,
  zHeight: number = 2,
) {
  const rad = (tiltAngleDeg * Math.PI) / 180;

  // 下平面 beta 在 z = 0 处，法向量 (0, 0, 1)
  const betaNormal: Vec3 = { x: 0, y: 0, z: 1 };

  // 直线 a: 沿 X 轴方向 (y=0)
  const lineAStart: Vec3 = {
    x: -2.5,
    y: 0,
    z: isIntersect ? zHeight : zHeight,
  };
  const lineAEnd: Vec3 = { x: 2.5, y: 0, z: isIntersect ? zHeight : zHeight };

  let lineBStart: Vec3;
  let lineBEnd: Vec3;
  let alphaNormal: Vec3;
  let isAlphaParallelToBeta: boolean;

  if (isIntersect) {
    // a 与 b 相交于 (0, 0, zHeight)，夹角 60°
    const angleB = Math.PI / 3;
    const cosB = Math.cos(angleB);
    const sinB = Math.sin(angleB);
    lineBStart = { x: -2.5 * cosB, y: -2.5 * sinB, z: zHeight };
    lineBEnd = { x: 2.5 * cosB, y: 2.5 * sinB, z: zHeight };
    alphaNormal = { x: 0, y: 0, z: 1 };
    isAlphaParallelToBeta = true;
  } else {
    // a 与 b 平行 (b 在 y = 1.6 处)
    // 若 tiltAngleDeg != 0，则整个平面 alpha 绕直线 a 发生倾斜
    lineBStart = {
      x: -2.5,
      y: 1.6 * Math.cos(rad),
      z: zHeight + 1.6 * Math.sin(rad),
    };
    lineBEnd = {
      x: 2.5,
      y: 1.6 * Math.cos(rad),
      z: zHeight + 1.6 * Math.sin(rad),
    };
    // alpha 法向量旋转
    alphaNormal = { x: 0, y: -Math.sin(rad), z: Math.cos(rad) };
    isAlphaParallelToBeta = Math.abs(tiltAngleDeg) < 1e-3;
  }

  return {
    betaNormal,
    alphaNormal,
    lineAStart,
    lineAEnd,
    lineBStart,
    lineBEnd,
    isAlphaParallelToBeta,
  };
}

/**
 * 计算面面平行性质定理：第三截面 gamma 与平行平面 alpha, beta 的交线
 * @param zHeight 平面 alpha 的高度 (beta 在 z=0)
 * @param gammaTiltDeg 截面 gamma 的倾斜角 (与 z 轴的倾角)
 * @param gammaAzimuthDeg 截面 gamma 的方位角
 */
export function calculateParallelIntersectionLines(
  zHeight: number,
  gammaTiltDeg: number,
  gammaAzimuthDeg: number,
) {
  const tiltRad = (gammaTiltDeg * Math.PI) / 180;
  const azimuthRad = (gammaAzimuthDeg * Math.PI) / 180;

  // 截面 gamma 的法向量
  const nGamma: Vec3 = {
    x: Math.sin(tiltRad) * Math.cos(azimuthRad),
    y: Math.sin(tiltRad) * Math.sin(azimuthRad),
    z: Math.cos(tiltRad),
  };

  // 交线方向向量 = nGamma × (0,0,1) = (nGamma.y, -nGamma.x, 0)
  const dirX = nGamma.y;
  const dirY = -nGamma.x;
  const len = Math.sqrt(dirX * dirX + dirY * dirY);

  const uX = len > 1e-4 ? dirX / len : 1;
  const uY = len > 1e-4 ? dirY / len : 0;

  const lineLen = 2.6;

  // beta (z=0) 上的交线 a (中心在 (0,0,0))
  const lineAStart: Vec3 = { x: -uX * lineLen, y: -uY * lineLen, z: 0 };
  const lineAEnd: Vec3 = { x: uX * lineLen, y: uY * lineLen, z: 0 };

  // alpha (z=zHeight) 上的交线 b
  let offsetX = 0;
  let offsetY = 0;
  if (Math.sin(tiltRad) > 1e-3) {
    const shift = (zHeight * Math.cos(tiltRad)) / Math.sin(tiltRad);
    offsetX = -shift * Math.cos(azimuthRad);
    offsetY = -shift * Math.sin(azimuthRad);
  }

  const lineBStart: Vec3 = {
    x: offsetX - uX * lineLen,
    y: offsetY - uY * lineLen,
    z: zHeight,
  };
  const lineBEnd: Vec3 = {
    x: offsetX + uX * lineLen,
    y: offsetY + uY * lineLen,
    z: zHeight,
  };

  return {
    nGamma,
    lineAStart,
    lineAEnd,
    lineBStart,
    lineBEnd,
    lineDir: { x: uX, y: uY, z: 0 },
    distance: Math.abs(zHeight),
  };
}

/**
 * 计算面面垂直判定：垂线生垂面族
 * @param planeRotDeg 平面 beta 绕垂线 l 的旋转角
 */
export function calculatePerpJudgeFamily(planeRotDeg: number) {
  const rotRad = (planeRotDeg * Math.PI) / 180;
  // 垂线 l 垂直于底面 alpha (z=0)，l 沿 z 轴方向
  const lineLStart: Vec3 = { x: 0, y: 0, z: -1 };
  const lineLEnd: Vec3 = { x: 0, y: 0, z: 3 };

  // 平面 beta 经过 l，其面内横向方向向量为 (cos rotRad, sin rotRad, 0)
  const uAxis: Vec3 = { x: Math.cos(rotRad), y: Math.sin(rotRad), z: 0 };
  const vAxis: Vec3 = { x: 0, y: 0, z: 1 }; // 沿垂线方向

  // beta 的法向量 (-sin rotRad, cos rotRad, 0)
  const betaNormal: Vec3 = { x: -Math.sin(rotRad), y: Math.cos(rotRad), z: 0 };
  const alphaNormal: Vec3 = { x: 0, y: 0, z: 1 };

  return {
    lineLStart,
    lineLEnd,
    uAxis,
    vAxis,
    betaNormal,
    alphaNormal,
    dotProduct: 0,
    isPerpendicular: true,
  };
}

/**
 * 计算面面垂直性质：面内直线与交线夹角判定
 * @param thetaDeg 直线 a 与交线 l 的夹角 (90° 时垂直交线，推出 a ⊥ 底面)
 * @param lineLen 直线长度
 */
export function calculatePerpPropState(
  thetaDeg: number,
  lineLen: number = 2.4,
) {
  const rad = (thetaDeg * Math.PI) / 180;

  // 交线 l 沿 Y 轴 (x=0, z=0)
  const lineLStart: Vec3 = { x: 0, y: -2.8, z: 0 };
  const lineLEnd: Vec3 = { x: 0, y: 2.8, z: 0 };

  // 平面 beta 为 yz 平面 (x=0)，底面 alpha 为 xy 平面 (z=0)
  const aDir: Vec3 = {
    x: 0,
    y: Math.cos(rad),
    z: Math.sin(rad),
  };

  const lineAStart: Vec3 = { x: 0, y: 0, z: 0 };
  const lineAEnd: Vec3 = { x: 0, y: aDir.y * lineLen, z: aDir.z * lineLen };

  // 直线 a 与底面 alpha (z=0) 的线面角 = arcsin(|z_dir|)
  const sinAngle = Math.abs(aDir.z);
  const linePlaneAngleDeg = (Math.asin(sinAngle) * 180) / Math.PI;

  const isPerpToAlpha = Math.abs(thetaDeg - 90) < 1e-2;

  return {
    lineLStart,
    lineLEnd,
    lineAStart,
    lineAEnd,
    linePlaneAngleDeg,
    isPerpToAlpha,
    aDir,
  };
}

/**
 * 高考四棱锥面面垂直模型几何解算
 */
export function calculatePyramidPerpModel(
  a: number = 3.6,
  b: number = 2.8,
  h: number = 3.2,
  posO: number = 0.5,
) {
  const A: Vec3 = { x: 0, y: 0, z: 0 };
  const B: Vec3 = { x: a, y: 0, z: 0 };
  const C: Vec3 = { x: a, y: b, z: 0 };
  const D: Vec3 = { x: 0, y: b, z: 0 };

  const O: Vec3 = { x: 0, y: b * posO, z: 0 };
  const P: Vec3 = { x: 0, y: b * posO, z: h };

  return {
    A,
    B,
    C,
    D,
    O,
    P,
    height: h,
    isOFoot: Math.abs(P.y - O.y) < 1e-4,
  };
}
