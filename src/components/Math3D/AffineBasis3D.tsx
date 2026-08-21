import React from "react";
import { Vector3DArrow } from "./Vector3DArrow";
import { Point3D } from "./Point3D";
import { PointLabel3D } from "./PointLabel3D";
import { FormulaLabel3D } from "./FormulaLabel3D";
import { MATH_COLORS } from "@/theme/math/colors";
import type { Vec3 } from "@/math3d/vector3";

export interface AffineBasis3DProps {
  /** 原点 (默认 (0,0,0)) */
  origin?: Vec3;
  /** 第一基向量 (默认 (2,0,0)) */
  vecA: Vec3;
  /** 第二基向量 (默认 (0.6,2,0)) */
  vecB: Vec3;
  /** 第三基向量 (默认 (0,0.5,2)) */
  vecC: Vec3;
  /** 原点名称 (默认 "O") */
  originLabel?: string;
  /** 第一向量公式标签 (默认 "\\vec{a}") */
  labelA?: string;
  /** 第二向量公式标签 (默认 "\\vec{b}") */
  labelB?: string;
  /** 第三向量公式标签 (默认 "\\vec{c}") */
  labelC?: string;
  /** 第一端点字母 (默认 "A") */
  pointLabelA?: string;
  /** 第二端点字母 (默认 "B") */
  pointLabelB?: string;
  /** 第三端点字母 (默认 "C") */
  pointLabelC?: string;
  /** 是否渲染端点圆点 (默认 true) */
  showPoints?: boolean;
}

/**
 * 3D 空间仿射基底与向量组复合教学组件
 *
 * 适用于空间向量基本定理、基底分解、斜六面体骨架等场景。
 * 遵循高考数学与铁律规范：纯仿射向量系统，零笛卡尔坐标穿刺与地砖污染。
 *
 * @example
 * ```tsx
 * <AffineBasis3D
 *   vecA={{ x: 2, y: 0, z: 0 }}
 *   vecB={{ x: 0.6, y: 2, z: 0 }}
 *   vecC={{ x: 0, y: 0.5, z: 2 }}
 * />
 * ```
 */
export const AffineBasis3D: React.FC<AffineBasis3DProps> = ({
  origin = { x: 0, y: 0, z: 0 },
  vecA,
  vecB,
  vecC,
  originLabel = "O",
  labelA = "\\vec{a}",
  labelB = "\\vec{b}",
  labelC = "\\vec{c}",
  pointLabelA = "A",
  pointLabelB = "B",
  pointLabelC = "C",
  showPoints = true,
}) => {
  const pointA = React.useMemo<Vec3>(
    () => ({
      x: origin.x + vecA.x,
      y: origin.y + vecA.y,
      z: origin.z + vecA.z,
    }),
    [origin, vecA],
  );

  const pointB = React.useMemo<Vec3>(
    () => ({
      x: origin.x + vecB.x,
      y: origin.y + vecB.y,
      z: origin.z + vecB.z,
    }),
    [origin, vecB],
  );

  const pointC = React.useMemo<Vec3>(
    () => ({
      x: origin.x + vecC.x,
      y: origin.y + vecC.y,
      z: origin.z + vecC.z,
    }),
    [origin, vecC],
  );

  return (
    <group>
      {/* 1. 原点 */}
      <Point3D position={origin} colorKey="primary" />
      <PointLabel3D
        position={origin}
        text={originLabel}
        offset={[-0.14, -0.14, 0]}
      />

      {/* 2. 第一基向量 a (鲜红) */}
      <Vector3DArrow from={origin} to={pointA} colorKey="paramPrimary" />
      <FormulaLabel3D
        position={{
          x: (origin.x + pointA.x) * 0.5,
          y: (origin.y + pointA.y) * 0.5 - 0.22,
          z: (origin.z + pointA.z) * 0.5,
        }}
        tex={`\\color{${MATH_COLORS.paramPrimary}}{${labelA}}`}
      />
      {showPoints && <Point3D position={pointA} colorKey="paramPrimary" />}
      {pointLabelA && (
        <PointLabel3D
          position={pointA}
          text={pointLabelA}
          offset={[0.14, -0.14, 0]}
        />
      )}

      {/* 3. 第二基向量 b (暖橙) */}
      <Vector3DArrow from={origin} to={pointB} colorKey="paramSecondary" />
      <FormulaLabel3D
        position={{
          x: (origin.x + pointB.x) * 0.5 - 0.22,
          y: (origin.y + pointB.y) * 0.5 + 0.12,
          z: (origin.z + pointB.z) * 0.5,
        }}
        tex={`\\color{${MATH_COLORS.paramSecondary}}{${labelB}}`}
      />
      {showPoints && <Point3D position={pointB} colorKey="paramSecondary" />}
      {pointLabelB && (
        <PointLabel3D
          position={pointB}
          text={pointLabelB}
          offset={[-0.14, 0.14, 0]}
        />
      )}

      {/* 4. 第三基向量 c (翠绿) */}
      <Vector3DArrow from={origin} to={pointC} colorKey="paramTertiary" />
      <FormulaLabel3D
        position={{
          x: (origin.x + pointC.x) * 0.5 - 0.22,
          y: (origin.y + pointC.y) * 0.5,
          z: (origin.z + pointC.z) * 0.5 + 0.14,
        }}
        tex={`\\color{${MATH_COLORS.paramTertiary}}{${labelC}}`}
      />
      {showPoints && <Point3D position={pointC} colorKey="paramTertiary" />}
      {pointLabelC && (
        <PointLabel3D
          position={pointC}
          text={pointLabelC}
          offset={[0, 0.08, 0.16]}
        />
      )}
    </group>
  );
};
