import { useMemo } from "react";
import { Line } from "@react-three/drei";
import * as THREE from "three";
import { RotationSolid } from "./RotationSolid";
import { MATH_COLORS } from "@/theme/math/colors";
import type { ProfilePoint } from "@/math3d/rotationProfiles";

interface RotationSweepProps {
  profile: ProfilePoint[];
  /** 扫描角度（度），0~360，由 paramMeta 滑块驱动 */
  sweepAngleDeg: number;
  axisHeight?: number;
  colorKey?: keyof typeof MATH_COLORS;
  /** 该端是否存在真实平面端面（圆柱/圆锥/圆台=true，球=false） */
  hasTopCap?: boolean;
  hasBottomCap?: boolean;
}

/**
 * 旋转生成动画核心教学组件
 *
 * 展示母线（矩形/三角形/梯形/半圆）绕轴逐步扫过形成立体图形的过程。
 * 扫掠完成后保留生成图形轮廓（虚线淡化），帮助学生建立"平面→旋转→立体"的心智映射。
 */
export const RotationSweep = ({
  profile,
  sweepAngleDeg,
  axisHeight = 4,
  colorKey = "primary",
  hasTopCap = true,
  hasBottomCap = true,
}: RotationSweepProps) => {
  const angleRad = (sweepAngleDeg / 180) * Math.PI;
  const isComplete = sweepAngleDeg >= 359.5;

  // 母线闭合路径（用于 Line 描边）
  const closedLoop = useMemo<[number, number, number][]>(
    () => [
      ...profile.map((p) => [p.r, p.z, 0] as [number, number, number]),
      [profile[0].r, profile[0].z, 0],
    ],
    [profile],
  );

  // 母线填充 Shape（用于 mesh 实心渲染）
  const profileShape = useMemo(() => {
    const shape = new THREE.Shape();
    profile.forEach((p, i) =>
      i === 0 ? shape.moveTo(p.r, p.z) : shape.lineTo(p.r, p.z),
    );
    shape.lineTo(profile[0].r, profile[0].z);
    return shape;
  }, [profile]);

  return (
    <group>
      {/* 旋转轴：教材惯例竖直虚线 */}
      <Line
        points={[
          [0, -0.3, 0],
          [0, axisHeight + 0.3, 0],
        ]}
        color={MATH_COLORS.axis3D_Z}
        lineWidth={1}
        dashed
        dashSize={0.1}
        gapSize={0.08}
      />

      {/* 已扫过部分 */}
      {sweepAngleDeg > 0 && (
        <RotationSolid
          profile={profile}
          thetaLength={Math.min(angleRad, Math.PI * 2)}
          colorKey={colorKey}
          opacity={isComplete ? 0.28 : 0.15}
          showOutline={isComplete}
          hasTopCap={hasTopCap}
          hasBottomCap={hasBottomCap}
        />
      )}

      {/* 扫掠进行中：母线随角度旋转，半透明填充 + 描边，强调"正在生成" */}
      {!isComplete && (
        <group rotation={[0, angleRad, 0]}>
          <mesh>
            <shapeGeometry args={[profileShape]} />
            <meshBasicMaterial
              color={MATH_COLORS.highlight}
              transparent
              opacity={0.5}
              side={THREE.DoubleSide}
            />
          </mesh>
          <Line
            points={closedLoop}
            color={MATH_COLORS.highlight}
            lineWidth={2}
          />
        </group>
      )}

      {/* 扫掠完成：定格在起始角度，转为虚线淡化保留 —— 帮助学生理解"旋转生成" */}
      {isComplete && (
        <Line
          points={closedLoop}
          color={MATH_COLORS.label}
          lineWidth={1.5}
          dashed
          dashSize={0.06}
          gapSize={0.05}
          transparent
          opacity={0.35}
          depthTest={false}
          renderOrder={20}
        />
      )}
    </group>
  );
};
