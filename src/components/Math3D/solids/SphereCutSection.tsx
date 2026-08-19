import { useMemo } from "react";
import { Line } from "@react-three/drei";
import * as THREE from "three";
import { MATH_COLORS } from "@/theme/math/colors";
import { FormulaLabel3D } from "@/components/Math3D/FormulaLabel3D";
import { Point3D } from "@/components/Math3D/Point3D";
import { CompoundLabel3D } from "@/components/Math3D/CompoundLabel3D";
import { calculateSphereCut, sphereProfile } from "@/math3d/rotationProfiles";
import { RotationSolid } from "./RotationSolid";

interface SphereCutSectionProps {
  radius: number; // 球半径 R
  cutDistance: number; // 球心距 d (-R ~ R)
  draggable?: boolean;
  onDragCutDistance?: (d: number) => void;
}

/**
 * 球截面小圆与垂径直角三角形教学组件
 *
 * 核心展示 Rt△OO'P:
 * - 直角边 1: 球心 O 到截面圆心 O' 的距离 d (参数橙色)
 * - 直角边 2: 截面圆心 O' 到截面圆周点 P 的半径 r_截 (参数绿色)
 * - 斜边: 球心 O 到圆周点 P 的球半径 R (参数红色)
 * 满足勾股定理 R^2 = r_截^2 + d^2
 */
export const SphereCutSection = ({
  radius,
  cutDistance,
  draggable = false,
  onDragCutDistance,
}: SphereCutSectionProps) => {
  const R = Math.max(0.5, radius);
  const cutInfo = useMemo(
    () => calculateSphereCut(R, cutDistance),
    [R, cutDistance],
  );

  const sphereProf = useMemo(() => sphereProfile(R), [R]);
  const cutZ = cutDistance; // 截面高度即球心距有向值
  const rCut = cutInfo.cutRadius;

  // 截面小圆圆周点
  const circlePoints = useMemo(() => {
    const pts: [number, number, number][] = [];
    const segments = 64;
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      pts.push([rCut * Math.cos(angle), cutZ, rCut * Math.sin(angle)]);
    }
    return pts;
  }, [rCut, cutZ]);

  // 直角三角形特征顶点（沿数学 x 轴即 Three.js +Z 轴方向展开）
  const O: [number, number, number] = [0, 0, 0];
  const OPrime: [number, number, number] = [0, cutZ, 0];
  const P: [number, number, number] = [0, cutZ, rCut];

  return (
    <group>
      {/* 标准球体主体（含视角跟随外轮廓圆与前实后虚赤道大圆） */}
      <RotationSolid
        profile={sphereProf}
        hasTopCap={false}
        hasBottomCap={false}
        opacity={0.15}
        showOutline={true}
      />

      {/* 截面小圆圆面 */}
      <mesh position={[0, cutZ, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[rCut, 48]} />
        <meshBasicMaterial
          color={MATH_COLORS.secondary}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 截面小圆边缘 */}
      <Line
        points={circlePoints}
        color={MATH_COLORS.secondary}
        lineWidth={2.5}
      />

      {/* 垂径直角三角形三边 */}
      {/* 1. 球心距 d (O -> O') */}
      <Line
        points={[O, OPrime]}
        color={MATH_COLORS.paramSecondary}
        lineWidth={3}
      />

      {/* 2. 截面圆半径 r_截 (O' -> P) */}
      <Line
        points={[OPrime, P]}
        color={MATH_COLORS.paramTertiary}
        lineWidth={3}
      />

      {/* 3. 球半径 R (O -> P) */}
      <Line points={[O, P]} color={MATH_COLORS.paramPrimary} lineWidth={3.5} />

      {/* 特征直角标记 */}
      {Math.abs(cutDistance) > 0.2 && rCut > 0.2 && (
        <Line
          points={[
            [0, cutZ, 0.15],
            [0, cutZ - Math.sign(cutDistance) * 0.15, 0.15],
            [0, cutZ - Math.sign(cutDistance) * 0.15, 0],
          ]}
          color={MATH_COLORS.label}
          lineWidth={1.5}
        />
      )}

      {/* 空间特征点标注 (高中数学标准斜体顶点 O, O', P 与实体几何点) */}
      <Point3D
        position={{ x: 0, y: 0, z: 0 }}
        colorKey="paramPrimary"
        radius={0.06}
      />
      <Point3D
        position={{ x: 0, y: 0, z: cutZ }}
        colorKey="paramSecondary"
        radius={0.06}
        draggable={draggable}
        constrain={(raw) => ({
          x: 0,
          y: 0,
          z: Math.max(-R * 0.9, Math.min(R * 0.9, raw.z)),
        })}
        onDrag={(next) => onDragCutDistance?.(Number(next.z.toFixed(2)))}
      />
      <Point3D
        position={{ x: rCut, y: 0, z: cutZ }}
        colorKey="paramTertiary"
        radius={0.06}
      />

      {/* 顶点名称标签 (高中数学斜体 O, O', P) */}
      <CompoundLabel3D
        position={{ x: 0, y: 0, z: 0 }}
        base="O"
        colorKey="paramPrimary"
        offset={[-0.18, -0.18, 0]}
      />
      <CompoundLabel3D
        position={{ x: 0, y: 0, z: cutZ }}
        base="O"
        subscript="'"
        colorKey="paramSecondary"
        offset={[-0.22, 0.12, 0]}
      />
      <CompoundLabel3D
        position={{ x: rCut, y: 0, z: cutZ }}
        base="P"
        colorKey="paramTertiary"
        offset={[0.16, 0.16, 0]}
      />

      {/* 空间公式尺寸标签 (红-橙-绿三位一体) */}
      <FormulaLabel3D
        position={{ x: 0, y: 0, z: cutZ / 2 }}
        tex={`\\color{#D97706}{d=${Math.abs(cutDistance).toFixed(1)}}`}
        offset={[-0.35, 0, 0]}
      />
      <FormulaLabel3D
        position={{ x: rCut / 2, y: 0, z: cutZ }}
        tex={`\\color{#059669}{r_{\\text{截}}=${rCut.toFixed(1)}}`}
        offset={[0, 0, 0.18]}
      />
      <FormulaLabel3D
        position={{
          x: rCut / 2,
          y: 0,
          z: cutZ / 2,
        }}
        tex={`\\color{#EF4444}{R=${R.toFixed(1)}}`}
        offset={[0.2, 0, -0.1]}
      />
    </group>
  );
};
