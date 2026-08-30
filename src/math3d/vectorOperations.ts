import {
  type Vec3,
  add,
  sub,
  dot,
  norm,
  scale,
  normalize,
  angleBetween,
} from "./vector3";

export interface VectorCoordOperationResult {
  vecA: Vec3;
  vecB: Vec3;
  sum: Vec3;
  diff: Vec3;
  dotProduct: number;
  normA: number;
  normB: number;
  cosTheta: number;
  angleDeg: number;
  projBOnA: Vec3;
  projScalar: number;
  isPerp: boolean;
  isParallel: boolean;
}

/**
 * 空间向量坐标运算、数量积与正交投影解算器
 */
export function calculateVectorOperations(
  vecA: Vec3,
  vecB: Vec3,
): VectorCoordOperationResult {
  const sumVec = add(vecA, vecB);
  const diffVec = sub(vecA, vecB);
  const dotProd = dot(vecA, vecB);
  const lenA = norm(vecA);
  const lenB = norm(vecB);

  let cosT = 0;
  let angDeg = 0;
  let projB = { x: 0, y: 0, z: 0 };
  let pScalar = 0;

  if (lenA > 1e-6 && lenB > 1e-6) {
    cosT = Math.max(-1, Math.min(1, dotProd / (lenA * lenB)));
    angDeg = (angleBetween(vecA, vecB) * 180) / Math.PI;
    pScalar = dotProd / lenA;
    projB = scale(normalize(vecA), pScalar);
  }

  const isPerpendicular =
    Math.abs(dotProd) < 1e-5 && lenA > 1e-5 && lenB > 1e-5;
  const isPar =
    lenA > 1e-5 &&
    lenB > 1e-5 &&
    (Math.abs(cosT - 1) < 1e-4 || Math.abs(cosT + 1) < 1e-4);

  return {
    vecA,
    vecB,
    sum: sumVec,
    diff: diffVec,
    dotProduct: dotProd,
    normA: lenA,
    normB: lenB,
    cosTheta: cosT,
    angleDeg: angDeg,
    projBOnA: projB,
    projScalar: pScalar,
    isPerp: isPerpendicular,
    isParallel: isPar,
  };
}
