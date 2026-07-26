import { CircumSphere } from "./CircumSphere";
import { InSphere } from "./InSphere";
import type { Vec3 } from "@/math3d/vector3";

interface SphereBySphereTypeProps {
  sphereType: "circum" | "inscribed";
  center: Vec3;
  radius: number;
}

/**
 * 球体渲染的唯一入口。
 * ⚠️ 设计约束：此组件的 props 里禁止出现 `shape` 字段。
 * 球该不该显示、显示哪种，只取决于 sphereType，
 * 与用户选择的几何体（cuboid/cone/...）无关。
 *
 * radius 合法性防御：NaN/≤0 时跳过渲染并在开发环境报警，
 * 防止极端参数下公式算出非法值导致诡异渲染。
 */
export function SphereBySphereType({
  sphereType,
  center,
  radius,
}: SphereBySphereTypeProps) {
  if (!Number.isFinite(radius) || radius <= 0) {
    if (import.meta.env.DEV) {
      console.warn(
        `[SphereBySphereType] radius 非法 (${radius})，球体已跳过渲染`,
      );
    }
    return null;
  }
  return sphereType === "circum" ? (
    <CircumSphere center={center} radius={radius} />
  ) : (
    <InSphere center={center} radius={radius} />
  );
}
