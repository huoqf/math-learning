import { useMemo } from "react";
import { Line } from "@react-three/drei";
import * as THREE from "three";
import { RotationSolid } from "./RotationSolid";
import { MATH_COLORS } from "@/theme/math/colors";
import { FormulaLabel3D } from "@/components/Math3D/FormulaLabel3D";
import { CompoundLabel3D } from "@/components/Math3D/CompoundLabel3D";
import { Point3D } from "@/components/Math3D/Point3D";
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
 * 支持轴截面剖开高亮与符合高考规范的三位一体几何特征标注。
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
  r2 = 0.8,
  height = 3,
}: RotationSweepProps) => {
  const angleRad = (sweepAngleDeg / 180) * Math.PI;
  const isComplete = sweepAngleDeg >= 359.5;

  // 母线闭合路径（定义在数学 x 轴即 Three.js +Z 轴纵切面上）
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

  // 完整的轴截面双侧 Shape (数学 x 轴纵截面)
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
  const isCone = hasBottomCap && !hasTopCap;
  const isFrustum =
    hasBottomCap && hasTopCap && Math.abs(r1 - r2) > 0.05 && r2 > 0.05;

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

  // 母线长度
  const busbarLength = useMemo(() => {
    if (isSphere) return 0;
    if (isCone) return Math.sqrt(r1 * r1 + height * height);
    if (isFrustum) return Math.sqrt(Math.pow(r1 - r2, 2) + height * height);
    return height; // cylinder
  }, [isSphere, isCone, isFrustum, r1, r2, height]);

  return (
    <group>
      {/* 旋转轴：自适应几何体高度 */}
      <Line
        points={[
          [0, axisBottom, 0],
          [0, axisTop, 0],
        ]}
        color={MATH_COLORS.axis3D_Z}
        lineWidth={1.6}
        dashed
        dashSize={0.12}
        gapSize={0.08}
      />

      {/* 旋转轴名称标注直线 l */}
      <FormulaLabel3D
        position={{ x: 0, y: 0, z: axisTop + 0.15 }}
        tex="l"
        offset={[0.1, 0, 0.1]}
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
              opacity={0.35}
              side={THREE.DoubleSide}
            />
          </mesh>
          <Line
            points={axialBorder.map(([_, y, z]) => [z, y, 0])}
            color={MATH_COLORS.accent}
            lineWidth={2.8}
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
                opacity={0.45}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
          <Line
            points={closedLoop}
            color={MATH_COLORS.highlight}
            lineWidth={2.5}
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

      {/* 几何顶点与高中课本特征标注 */}
      <group>
        {isSphere ? (
          <>
            {/* 球心 O */}
            <Point3D
              position={{ x: 0, y: 0, z: 0 }}
              colorKey="paramPrimary"
              radius={0.05}
            />
            <CompoundLabel3D
              position={{ x: 0, y: 0, z: 0 }}
              base="O"
              offset={[-0.2, -0.2, 0]}
            />

            {/* 动态随母线扫掠的赤道半径点 A */}
            <group
              rotation={[0, isComplete || showAxialSection ? 0 : angleRad, 0]}
            >
              <Point3D
                position={{ x: profile[1]?.r ?? r1, y: 0, z: 0 }}
                colorKey="paramPrimary"
                radius={0.045}
              />
              <CompoundLabel3D
                position={{ x: profile[1]?.r ?? r1, y: 0, z: 0 }}
                base="A"
                offset={[0.18, 0, 0]}
              />
            </group>

            {/* 轴截面模式下半径标注 */}
            {showLabels && (
              <>
                <Line
                  points={[
                    [0, 0, 0],
                    [0, 0, profile[1]?.r ?? r1],
                  ]}
                  color={MATH_COLORS.paramPrimary}
                  lineWidth={3}
                />
                <FormulaLabel3D
                  position={{ x: (profile[1]?.r ?? r1) / 2, y: 0, z: 0 }}
                  tex={`\\color{${MATH_COLORS.paramPrimary}}{R=${(profile[1]?.r ?? r1).toFixed(1)}}`}
                  offset={[0, 0, 0.18]}
                />
              </>
            )}
          </>
        ) : isCone ? (
          <>
            {/* 锥体顶点 S 与 底面圆心 O */}
            <Point3D
              position={{ x: 0, y: 0, z: profile[2]?.z ?? height }}
              colorKey="paramSecondary"
              radius={0.05}
            />
            <CompoundLabel3D
              position={{ x: 0, y: 0, z: profile[2]?.z ?? height }}
              base="S"
              offset={[0, 0, 0.22]}
            />

            <Point3D
              position={{ x: 0, y: 0, z: profile[0]?.z ?? 0 }}
              colorKey="secondary"
              radius={0.05}
            />
            <CompoundLabel3D
              position={{ x: 0, y: 0, z: profile[0]?.z ?? 0 }}
              base="O"
              offset={[-0.22, -0.22, 0]}
            />

            {/* 动态随母线扫掠的底面母线端点 A */}
            <group
              rotation={[0, isComplete || showAxialSection ? 0 : angleRad, 0]}
            >
              <Point3D
                position={{
                  x: profile[1]?.r ?? r1,
                  y: 0,
                  z: profile[1]?.z ?? 0,
                }}
                colorKey="paramPrimary"
                radius={0.045}
              />
              <CompoundLabel3D
                position={{
                  x: profile[1]?.r ?? r1,
                  y: 0,
                  z: profile[1]?.z ?? 0,
                }}
                base="A"
                offset={[0.22, 0, 0]}
              />
            </group>

            {showAxialSection && (
              <>
                <Point3D
                  position={{
                    x: -(profile[1]?.r ?? r1),
                    y: 0,
                    z: profile[1]?.z ?? 0,
                  }}
                  colorKey="paramPrimary"
                  radius={0.045}
                />
                <CompoundLabel3D
                  position={{
                    x: -(profile[1]?.r ?? r1),
                    y: 0,
                    z: profile[1]?.z ?? 0,
                  }}
                  base="B"
                  offset={[-0.25, 0, 0]}
                />
              </>
            )}

            {/* 尺寸标注 */}
            {showLabels && (
              <>
                {/* 底面半径 r */}
                <Line
                  points={[
                    [0, 0, 0],
                    [0, 0, profile[1]?.r ?? r1],
                  ]}
                  color={MATH_COLORS.paramPrimary}
                  lineWidth={2.5}
                />
                <FormulaLabel3D
                  position={{
                    x: (profile[1]?.r ?? r1) / 2,
                    y: 0,
                    z: profile[0]?.z ?? 0,
                  }}
                  tex={`\\color{${MATH_COLORS.paramPrimary}}{r=${(profile[1]?.r ?? r1).toFixed(1)}}`}
                  offset={[0, 0, -0.2]}
                />
                {/* 高 h */}
                <FormulaLabel3D
                  position={{ x: 0, y: 0, z: (profile[2]?.z ?? height) / 2 }}
                  tex={`\\color{${MATH_COLORS.paramTertiary}}{h=${(profile[2]?.z ?? height).toFixed(1)}}`}
                  offset={[-0.32, 0, 0]}
                />
                {/* 母线 l */}
                <FormulaLabel3D
                  position={{
                    x: (profile[1]?.r ?? r1) / 2,
                    y: 0,
                    z: (profile[2]?.z ?? height) / 2,
                  }}
                  tex={`\\color{${MATH_COLORS.paramSecondary}}{l=${busbarLength.toFixed(1)}}`}
                  offset={[0.22, 0, 0.1]}
                />
              </>
            )}
          </>
        ) : isFrustum ? (
          <>
            {/* 圆台上底面圆心 O1, 下底面圆心 O */}
            <Point3D
              position={{ x: 0, y: 0, z: profile[3]?.z ?? height }}
              colorKey="paramSecondary"
              radius={0.05}
            />
            <CompoundLabel3D
              position={{ x: 0, y: 0, z: profile[3]?.z ?? height }}
              base="O"
              subscript="1"
              offset={[-0.22, 0, 0.22]}
            />

            <Point3D
              position={{ x: 0, y: 0, z: profile[0]?.z ?? 0 }}
              colorKey="secondary"
              radius={0.05}
            />
            <CompoundLabel3D
              position={{ x: 0, y: 0, z: profile[0]?.z ?? 0 }}
              base="O"
              offset={[-0.22, -0.22, 0]}
            />

            {/* 动态随母线扫掠的母线端点 A1, A */}
            <group
              rotation={[0, isComplete || showAxialSection ? 0 : angleRad, 0]}
            >
              <Point3D
                position={{
                  x: profile[2]?.r ?? r2,
                  y: 0,
                  z: profile[2]?.z ?? height,
                }}
                colorKey="paramSecondary"
                radius={0.045}
              />
              <CompoundLabel3D
                position={{
                  x: profile[2]?.r ?? r2,
                  y: 0,
                  z: profile[2]?.z ?? height,
                }}
                base="A"
                subscript="1"
                offset={[0.22, 0, 0.18]}
              />

              <Point3D
                position={{
                  x: profile[1]?.r ?? r1,
                  y: 0,
                  z: profile[1]?.z ?? 0,
                }}
                colorKey="paramPrimary"
                radius={0.045}
              />
              <CompoundLabel3D
                position={{
                  x: profile[1]?.r ?? r1,
                  y: 0,
                  z: profile[1]?.z ?? 0,
                }}
                base="A"
                offset={[0.22, 0, -0.12]}
              />
            </group>

            {showAxialSection && (
              <>
                <Point3D
                  position={{
                    x: -(profile[2]?.r ?? r2),
                    y: 0,
                    z: profile[2]?.z ?? height,
                  }}
                  colorKey="paramSecondary"
                  radius={0.045}
                />
                <CompoundLabel3D
                  position={{
                    x: -(profile[2]?.r ?? r2),
                    y: 0,
                    z: profile[2]?.z ?? height,
                  }}
                  base="B"
                  subscript="1"
                  offset={[-0.28, 0, 0.18]}
                />

                <Point3D
                  position={{
                    x: -(profile[1]?.r ?? r1),
                    y: 0,
                    z: profile[1]?.z ?? 0,
                  }}
                  colorKey="paramPrimary"
                  radius={0.045}
                />
                <CompoundLabel3D
                  position={{
                    x: -(profile[1]?.r ?? r1),
                    y: 0,
                    z: profile[1]?.z ?? 0,
                  }}
                  base="B"
                  offset={[-0.25, 0, -0.12]}
                />
              </>
            )}

            {/* 尺寸标注 */}
            {showLabels && (
              <>
                <Line
                  points={[
                    [0, 0, 0],
                    [0, 0, profile[1]?.r ?? r1],
                  ]}
                  color={MATH_COLORS.paramPrimary}
                  lineWidth={2.5}
                />
                <FormulaLabel3D
                  position={{
                    x: (profile[1]?.r ?? r1) / 2,
                    y: 0,
                    z: profile[0]?.z ?? 0,
                  }}
                  tex={`\\color{${MATH_COLORS.paramPrimary}}{r_1=${(profile[1]?.r ?? r1).toFixed(1)}}`}
                  offset={[0, 0, -0.2]}
                />
                <Line
                  points={[
                    [0, profile[3]?.z ?? height, 0],
                    [0, profile[3]?.z ?? height, profile[2]?.r ?? r2],
                  ]}
                  color={MATH_COLORS.paramSecondary}
                  lineWidth={2.5}
                />
                <FormulaLabel3D
                  position={{
                    x: (profile[2]?.r ?? r2) / 2,
                    y: 0,
                    z: profile[3]?.z ?? height,
                  }}
                  tex={`\\color{${MATH_COLORS.paramSecondary}}{r_2=${(profile[2]?.r ?? r2).toFixed(1)}}`}
                  offset={[0, 0, 0.2]}
                />
                <FormulaLabel3D
                  position={{ x: 0, y: 0, z: (profile[3]?.z ?? height) / 2 }}
                  tex={`\\color{${MATH_COLORS.paramTertiary}}{h=${(profile[3]?.z ?? height).toFixed(1)}}`}
                  offset={[-0.32, 0, 0]}
                />
              </>
            )}
          </>
        ) : (
          /* 圆柱 Cylinder：矩形 OO1A1A 绕 OO1 旋转 */
          <>
            {/* 上底圆心 O1, 下底圆心 O (定点) */}
            <Point3D
              position={{ x: 0, y: 0, z: profile[3]?.z ?? height }}
              colorKey="paramSecondary"
              radius={0.05}
            />
            <CompoundLabel3D
              position={{ x: 0, y: 0, z: profile[3]?.z ?? height }}
              base="O"
              subscript="1"
              offset={[-0.22, 0, 0.22]}
            />

            <Point3D
              position={{ x: 0, y: 0, z: profile[0]?.z ?? 0 }}
              colorKey="secondary"
              radius={0.05}
            />
            <CompoundLabel3D
              position={{ x: 0, y: 0, z: profile[0]?.z ?? 0 }}
              base="O"
              offset={[-0.22, -0.22, 0]}
            />

            {/* 动态随母线矩形旋转的旋转母线端点 A1 (上底圆周), A (下底圆周) */}
            <group
              rotation={[0, isComplete || showAxialSection ? 0 : angleRad, 0]}
            >
              <Point3D
                position={{
                  x: profile[2]?.r ?? r1,
                  y: 0,
                  z: profile[2]?.z ?? height,
                }}
                colorKey="paramPrimary"
                radius={0.045}
              />
              <CompoundLabel3D
                position={{
                  x: profile[2]?.r ?? r1,
                  y: 0,
                  z: profile[2]?.z ?? height,
                }}
                base="A"
                subscript="1"
                offset={[0.22, 0, 0.18]}
              />

              <Point3D
                position={{
                  x: profile[1]?.r ?? r1,
                  y: 0,
                  z: profile[1]?.z ?? 0,
                }}
                colorKey="paramPrimary"
                radius={0.045}
              />
              <CompoundLabel3D
                position={{
                  x: profile[1]?.r ?? r1,
                  y: 0,
                  z: profile[1]?.z ?? 0,
                }}
                base="A"
                offset={[0.22, 0, -0.12]}
              />
            </group>

            {showAxialSection && (
              <>
                {/* 轴截面左侧母线端点 B1 (上底), B (下底) */}
                <Point3D
                  position={{
                    x: -(profile[2]?.r ?? r1),
                    y: 0,
                    z: profile[2]?.z ?? height,
                  }}
                  colorKey="paramPrimary"
                  radius={0.045}
                />
                <CompoundLabel3D
                  position={{
                    x: -(profile[2]?.r ?? r1),
                    y: 0,
                    z: profile[2]?.z ?? height,
                  }}
                  base="B"
                  subscript="1"
                  offset={[-0.28, 0, 0.18]}
                />

                <Point3D
                  position={{
                    x: -(profile[1]?.r ?? r1),
                    y: 0,
                    z: profile[1]?.z ?? 0,
                  }}
                  colorKey="paramPrimary"
                  radius={0.045}
                />
                <CompoundLabel3D
                  position={{
                    x: -(profile[1]?.r ?? r1),
                    y: 0,
                    z: profile[1]?.z ?? 0,
                  }}
                  base="B"
                  offset={[-0.25, 0, -0.12]}
                />
              </>
            )}

            {/* 尺寸标注 */}
            {showLabels && (
              <>
                <Line
                  points={[
                    [0, 0, 0],
                    [0, 0, profile[1]?.r ?? r1],
                  ]}
                  color={MATH_COLORS.paramPrimary}
                  lineWidth={2.5}
                />
                <FormulaLabel3D
                  position={{
                    x: (profile[1]?.r ?? r1) / 2,
                    y: 0,
                    z: profile[0]?.z ?? 0,
                  }}
                  tex={`\\color{${MATH_COLORS.paramPrimary}}{r=${(profile[1]?.r ?? r1).toFixed(1)}}`}
                  offset={[0, 0, -0.2]}
                />
                <FormulaLabel3D
                  position={{ x: 0, y: 0, z: (profile[3]?.z ?? height) / 2 }}
                  tex={`\\color{${MATH_COLORS.paramTertiary}}{h=${(profile[3]?.z ?? height).toFixed(1)}}`}
                  offset={[-0.32, 0, 0]}
                />
                <FormulaLabel3D
                  position={{
                    x: profile[1]?.r ?? r1,
                    y: 0,
                    z: (profile[3]?.z ?? height) / 2,
                  }}
                  tex={`\\color{${MATH_COLORS.paramSecondary}}{l=${(profile[3]?.z ?? height).toFixed(1)}}`}
                  offset={[0.25, 0, 0]}
                />
              </>
            )}
          </>
        )}
      </group>
    </group>
  );
};
