/**
 * 3D 向量纯函数层
 *
 * 所有业务代码使用此 Vec3 类型（x, y, z 且 z 竖直向上），
 * 仅在渲染边界处通过 coordinateConvention.ts 转换到 three.js 坐标系。
 */

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export const add = (a: Vec3, b: Vec3): Vec3 => ({
  x: a.x + b.x,
  y: a.y + b.y,
  z: a.z + b.z,
});

export const sub = (a: Vec3, b: Vec3): Vec3 => ({
  x: a.x - b.x,
  y: a.y - b.y,
  z: a.z - b.z,
});

export const scale = (a: Vec3, k: number): Vec3 => ({
  x: a.x * k,
  y: a.y * k,
  z: a.z * k,
});

export const dot = (a: Vec3, b: Vec3): number =>
  a.x * b.x + a.y * b.y + a.z * b.z;

export const cross = (a: Vec3, b: Vec3): Vec3 => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x,
});

export const norm = (a: Vec3): number => Math.sqrt(dot(a, a));

export const normalize = (a: Vec3): Vec3 => {
  const n = norm(a);
  return n < 1e-9 ? { x: 0, y: 0, z: 0 } : scale(a, 1 / n);
};

export const angleBetween = (a: Vec3, b: Vec3): number => {
  const na = norm(a);
  const nb = norm(b);
  if (na < 1e-9 || nb < 1e-9) return 0;
  const c = dot(a, b) / (na * nb);
  return Math.acos(Math.min(1, Math.max(-1, c)));
};

export const distance = (a: Vec3, b: Vec3): number => norm(sub(a, b));

export const lerp = (a: Vec3, b: Vec3, t: number): Vec3 => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
  z: a.z + (b.z - a.z) * t,
});
