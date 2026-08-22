import { useMemo } from "react";
import * as THREE from "three";
import { MATH_COLORS } from "@/theme/math/colors";
import { mathToThree } from "@/math3d/coordinateConvention";
import type { Vec3 } from "@/math3d/vector3";
import { RotationOutline } from "./RotationOutline";
import { DepthPrepassMesh } from "./DepthPrepassMesh";
import type { ProfilePoint } from "@/math3d/rotationProfiles";

export interface RotationSolidProps {
  /** 几何体基准锚点（底面中心，数学坐标系 Vec3） */
  position?: Vec3;
  profile: ProfilePoint[];
  colorKey?: keyof typeof MATH_COLORS;
  outlineColorKey?: keyof typeof MATH_COLORS;
  opacity?: number;
  segments?: number;
  thetaStart?: number;
  thetaLength?: number;
  showOutline?: boolean;
  /** 该端是否存在真实平面端面（圆柱/圆锥/圆台=true，球=false） */
  hasTopCap?: boolean;
  hasBottomCap?: boolean;
  depthTest?: boolean;
}

/**
 * 静态旋转体通用基础组件（支持全扫 / 部分扫、任意空间位置）
 *
 * 教材式外观：深度预写入 + 柔和着色实体 + 视角跟随的轮廓线（含端面圆前实后虚拆分）。
 * 基于 THREE.LatheGeometry，默认绕 Y 轴旋转（对应数学 z 轴竖直）。
 */
export const RotationSolid = ({
  position,
  profile,
  colorKey = "primary",
  outlineColorKey,
  opacity = 0.28,
  segments = 48,
  thetaStart = 0,
  thetaLength = Math.PI * 2,
  showOutline = true,
  hasTopCap = true,
  hasBottomCap = true,
  depthTest = true,
}: RotationSolidProps) => {
  const pos3 = useMemo(
    () => (position ? mathToThree(position) : undefined),
    [position],
  );

  const geometry = useMemo(() => {
    const pts = profile.map((p) => new THREE.Vector2(p.r, p.z));
    return new THREE.LatheGeometry(pts, segments, thetaStart, thetaLength);
  }, [profile, segments, thetaStart, thetaLength]);

  const color = MATH_COLORS[colorKey] ?? MATH_COLORS.primary;
  const outlineColor = outlineColorKey
    ? MATH_COLORS[outlineColorKey]
    : !hasTopCap && !hasBottomCap
      ? color
      : MATH_COLORS.line;

  const fullSweep = thetaLength >= Math.PI * 2 - 1e-3;

  return (
    <group position={pos3} renderOrder={5}>
      {/* 深度预写入：只写深度不写颜色，让半透明主体能正确遮挡后方线条 */}
      {depthTest && <DepthPrepassMesh geometry={geometry} />}

      {/* 半透明实体 */}
      <mesh geometry={geometry}>
        <meshStandardMaterial
          color={color}
          transparent
          opacity={opacity}
          roughness={0.55}
          metalness={0}
          side={THREE.DoubleSide}
          depthWrite={false}
          depthTest={depthTest}
        />
      </mesh>

      {/* 视角跟随的轮廓线：两条侧棱实线 + 端面圆前实后虚拆分 */}
      {showOutline && fullSweep && (
        <RotationOutline
          profile={profile}
          color={outlineColor}
          segments={segments}
          hasTopCap={hasTopCap}
          hasBottomCap={hasBottomCap}
        />
      )}
    </group>
  );
};
