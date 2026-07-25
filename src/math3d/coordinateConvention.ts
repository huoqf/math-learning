/**
 * 坐标系约定转换
 *
 * 高中教材空间直角坐标系：z 轴竖直向上
 * three.js 场景默认：y 轴竖直向上
 *
 * 约束：
 * - 任何 3D 组件 props 一律使用数学坐标 Vec3
 * - mathToThree 仅允许出现在组件内部渲染的最后一步
 * - 禁止在业务 Animation.tsx 层直接操作 three.js 坐标
 */

import type { Vec3 } from "./vector3";

/** 数学坐标(z向上) -> three.js 场景坐标(y向上) */
export const mathToThree = (v: Vec3): [number, number, number] => [
  v.x,
  v.z,
  v.y,
];

/** three.js 场景坐标 -> 数学坐标 */
export const threeToMath = (x: number, y: number, z: number): Vec3 => ({
  x,
  y: z,
  z: y,
});
