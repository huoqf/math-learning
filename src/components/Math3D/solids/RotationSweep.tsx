import { useMemo } from "react";
import { Line } from "@react-three/drei";
import * as THREE from "three";
import { RotationSolid } from "./RotationSolid";
import { MATH_COLORS } from "@/theme/math/colors";
import { FormulaLabel3D } from "@/components/Math3D/FormulaLabel3D";
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
  /** 是否高亮显示轴截面（降维分析模式） */
  showAxialSection?: boolean;
  /** 是否显示 3D 尺寸标注 (r, h, l 等) */
  showLabels?: boolean;
  r1?: number;
  r2?: number;
  height?: number;
}

/**
 * 旋转生成动画核心教学组件
 *
 * 展示母线（矩形/三角形/梯形/半圆）绕轴逐步扫过形成立体图形的过程。
 * 支持轴截面剖开高亮与三位一体尺寸标注。
 */
export const RotationSweep = ({
  profile,
  sweepAngleDeg,
  axisHeight = 4,
  colorKey = "primary",
  hasTopCap = true,
  hasBottomCap = true,
  showAxialSection = false,
  showLabels = false,
  r1 = 1.5,
  height = 3,
}: RotationSweepProps) => {
  const angleRad = (sweepAngleDeg / 180) * Math.PI;
  const isComplete = sweepAngleDeg >= 359.5;

  // 母线闭合路径（定义在数学 x 轴即 Three.js +Z 轴构成的纵切面上）
  const closedLoop = useMemo<[number, number, number][]>(
    () => [
      ...profile.map((p) => [0, p.z, p.r] as [number, number, number]),
      [0, profile[0].z, profile[0].r],
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

  // 完整的轴截面双侧 Shape (数学 x 轴方向对称切面)
  const axialShape = useMemo(() => {
    if (!showAxialSection) return null;
    const shape = new THREE.Shape();
    // 右半边 (r >= 0)
    profile.forEach((p, i) =>
      i === 0 ? shape.moveTo(p.r, p.z) : shape.lineTo(p.r, p.z),
    );
    // 左半边镜像 (r <= 0, 逆序)
    for (let i = profile.length - 1; i >= 0; i--) {
      shape.lineTo(-profile[i].r, profile[i].z);
    }
    shape.closePath();
    return shape;
  }, [profile, showAxialSection]);

  const axialBorder = useMemo<[number, number, number][]>(() => {
    if (!showAxialSection) return [];
    const pts: [number, number, number][] = [];
    profile.forEach((p) => pts.push([0, p.z, p.r]));
    for (let i = profile.length - 1; i >= 0; i--) {
      pts.push([0, profile[i].z, -profile[i].r]);
    }
    pts.push([0, profile[0].z, profile[0].r]);
    return pts;
  }, [profile, showAxialSection]);

  const isSphere = !hasTopCap && !hasBottomCap;

  const zMin = useMemo(
    () => profile.reduce((min, p) => Math.min(min, p.z), 0),
    [profile],
  );
  const zMax = useMemo(
    () => profile.reduce((max, p) => Math.max(max, p.z), 0),
    [profile],
  );

  const axisBottom = Math.min(-0.3, zMin - 0.3);
  const axisTop = Math.max(axisHeight + 0.3, zMax + 0.3);

  return (
    <group>
      {/* 旋转轴：自适应几何体高度 */}
      <Line
        points={[
          [0, axisBottom, 0],
          [0, axisTop, 0],
        ]}
        color={MATH_COLORS.axis3D_Z}
        lineWidth={1.5}
        dashed
        dashSize={0.1}
        gapSize={0.08}
      />

      {/* 已扫过部分 (LatheGeometry 默认由 +Z 轴数学 x 向 +X 轴数学 y 顺滑旋转) */}
      {sweepAngleDeg > 0 && (
        <RotationSolid
          profile={profile}
          thetaLength={Math.min(angleRad, Math.PI * 2)}
          colorKey={colorKey}
          opacity={isComplete ? (showAxialSection ? 0.18 : 0.28) : 0.15}
          showOutline={isComplete}
          hasTopCap={hasTopCap}
          hasBottomCap={hasBottomCap}
        />
      )}

      {/* 轴截面模式：高亮显示过轴的完整截面 (数学 x 轴纵截面) */}
      {showAxialSection && axialShape && (
        <group rotation={[0, Math.PI / 2, 0]}>
          <mesh>
            <shapeGeometry args={[axialShape]} />
            <meshBasicMaterial
              color={MATH_COLORS.accent}
              transparent
              opacity={0.4}
              side={THREE.DoubleSide}
            />
          </mesh>
          <Line
            points={axialBorder.map(([_, y, z]) => [z, y, 0])}
            color={MATH_COLORS.accent}
            lineWidth={3}
          />
        </group>
      )}

      {/* 扫掠进行中：母线随角度从数学 +x 轴顺滑扫向数学 +y 轴 */}
      {!isComplete && !showAxialSection && (
        <group rotation={[0, angleRad, 0]}>
          <group rotation={[0, Math.PI / 2, 0]}>
            <mesh>
              <shapeGeometry args={[profileShape]} />
              <meshBasicMaterial
                color={MATH_COLORS.highlight}
                transparent
                opacity={0.5}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
          <Line
            points={closedLoop}
            color={MATH_COLORS.highlight}
            lineWidth={2}
          />
        </group>
      )}

      {/* 扫掠完成：定格在起始角度，转为虚线淡化保留 */}
      {isComplete && !showAxialSection && (
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

      {/* 空间尺寸标注 */}
      {showLabels && (
        <group>
          {isSphere ? (
            <>
              {/* 球心与半径标注 (沿数学 x 轴方向) */}
              <Line
                points={[
                  [0, 0, 0],
                  [0, 0, r1],
                ]}
                color={MATH_COLORS.paramPrimary}
                lineWidth={3}
              />
              <FormulaLabel3D position={{ x: 0, y: 0, z: 0 }} tex="O" />
              <FormulaLabel3D
                position={{ x: r1 / 2, y: 0, z: 0 }}
                tex={`\\color{#EF4444}{R=${r1.toFixed(1)}}`}
              />
            </>
          ) : (
            <>
              {/* 底面半径标注 (沿数学 x 轴) */}
              <Line
                points={[
                  [0, 0, 0],
                  [0, 0, r1],
                ]}
                color={MATH_COLORS.paramPrimary}
                lineWidth={2.5}
              />
              <FormulaLabel3D
                position={{ x: r1 / 2, y: 0, z: 0 }}
                tex={`\\color{#EF4444}{r_1=${r1.toFixed(1)}}`}
              />

              {/* 高标注 (沿数学 z 轴) */}
              <FormulaLabel3D
                position={{ x: 0, y: 0, z: height / 2 }}
                tex={`\\color{#059669}{h=${height.toFixed(1)}}`}
              />

              {/* 上底半径标注 (仅在圆台等顶部有实际非零平面的几何体上展示) */}
              {profile[2]?.r > 0.05 && Math.abs(profile[2]?.r - r1) > 0.05 && (
                <>
                  <Line
                    points={[
                      [0, height, 0],
                      [0, height, profile[2].r],
                    ]}
                    color={MATH_COLORS.paramSecondary}
                    lineWidth={2.5}
                  />
                  <FormulaLabel3D
                    position={{ x: profile[2].r / 2, y: 0, z: height }}
                    tex={`\\color{#D97706}{r_2=${profile[2].r.toFixed(1)}}`}
                  />
                </>
              )}
            </>
          )}
        </group>
      )}
    </group>
  );
};
