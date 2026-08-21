import React from "react";
import { Segment3D } from "./Segment3D";
import { AngleArc3D } from "./AngleArc3D";
import { FormulaLabel3D } from "./FormulaLabel3D";
import { Polygon3DFace } from "./Polygon3DFace";
import { MATH_COLORS } from "@/theme/math/colors";
import type { Vec3 } from "@/math3d/vector3";

export interface RightTriangle3DProps {
  /** 直角顶点 (Rt∠C) */
  rightVertex: Vec3;
  /** 直角边端点 1 (A) */
  vertexA: Vec3;
  /** 直角边端点 2 (B) */
  vertexB: Vec3;
  /** 直角边 1 颜色 Token */
  colorKeyA?: keyof typeof MATH_COLORS;
  /** 直角边 2 颜色 Token */
  colorKeyB?: keyof typeof MATH_COLORS;
  /** 斜边颜色 Token */
  colorKeyHyp?: keyof typeof MATH_COLORS;
  /** 直角边 1 公式标注 (如 "d" 或 "h/2") */
  labelA?: string;
  /** 直角边 2 公式标注 (如 "r") */
  labelB?: string;
  /** 斜边公式标注 (如 "R" 或 "l") */
  labelHyp?: string;
  /** 直角标记符号大小 (默认 0.3) */
  rightAngleRadius?: number;
  /** 是否填充半透明三角形面片 (默认 false) */
  fillMesh?: boolean;
  /** 填充面片透明度 (默认 0.18) */
  opacity?: number;
  /** 线宽 (默认 2.5) */
  lineWidth?: number;
  /** 是否虚线 */
  dashed?: boolean;
}

/**
 * 3D 空间直角三角形教学复合组件
 *
 * 用于外接球勾股计算 (R^2 = r^2 + d^2)、三垂线定理平面角、线面角射影直角三角形等。
 * 一站式集成：直角边、斜边、直角方框标志及边长 LaTeX 公式标注。
 *
 * @example
 * ```tsx
 * <RightTriangle3D
 *   rightVertex={O1}
 *   vertexA={O}
 *   vertexB={A}
 *   labelA="d"
 *   labelB="r"
 *   labelHyp="R"
 * />
 * ```
 */
export const RightTriangle3D: React.FC<RightTriangle3DProps> = ({
  rightVertex,
  vertexA,
  vertexB,
  colorKeyA = "paramSecondary",
  colorKeyB = "paramTertiary",
  colorKeyHyp = "paramPrimary",
  labelA,
  labelB,
  labelHyp,
  rightAngleRadius = 0.3,
  fillMesh = false,
  opacity = 0.18,
  lineWidth = 2.5,
  dashed = false,
}) => {
  const dirA = React.useMemo<Vec3>(
    () => ({
      x: vertexA.x - rightVertex.x,
      y: vertexA.y - rightVertex.y,
      z: vertexA.z - rightVertex.z,
    }),
    [rightVertex, vertexA],
  );

  const dirB = React.useMemo<Vec3>(
    () => ({
      x: vertexB.x - rightVertex.x,
      y: vertexB.y - rightVertex.y,
      z: vertexB.z - rightVertex.z,
    }),
    [rightVertex, vertexB],
  );

  // 中点计算用于公式标签定位
  const midA = React.useMemo<Vec3>(
    () => ({
      x: (rightVertex.x + vertexA.x) * 0.5,
      y: (rightVertex.y + vertexA.y) * 0.5,
      z: (rightVertex.z + vertexA.z) * 0.5,
    }),
    [rightVertex, vertexA],
  );

  const midB = React.useMemo<Vec3>(
    () => ({
      x: (rightVertex.x + vertexB.x) * 0.5,
      y: (rightVertex.y + vertexB.y) * 0.5,
      z: (rightVertex.z + vertexB.z) * 0.5,
    }),
    [rightVertex, vertexB],
  );

  const midHyp = React.useMemo<Vec3>(
    () => ({
      x: (vertexA.x + vertexB.x) * 0.5,
      y: (vertexA.y + vertexB.y) * 0.5,
      z: (vertexA.z + vertexB.z) * 0.5,
    }),
    [vertexA, vertexB],
  );

  return (
    <group>
      {/* 1. 可选半透明三角形填充面片 */}
      {fillMesh && (
        <Polygon3DFace
          points={[rightVertex, vertexA, vertexB]}
          colorKey={colorKeyHyp}
          opacity={opacity}
        />
      )}

      {/* 2. 直角边 1 */}
      <Segment3D
        from={rightVertex}
        to={vertexA}
        colorKey={colorKeyA}
        lineWidth={lineWidth}
        dashed={dashed}
      />
      {labelA && (
        <FormulaLabel3D
          position={midA}
          tex={`\\color{${MATH_COLORS[colorKeyA] ?? MATH_COLORS.label}}{${labelA}}`}
          offset={[0, 0, 0.1]}
        />
      )}

      {/* 3. 直角边 2 */}
      <Segment3D
        from={rightVertex}
        to={vertexB}
        colorKey={colorKeyB}
        lineWidth={lineWidth}
        dashed={dashed}
      />
      {labelB && (
        <FormulaLabel3D
          position={midB}
          tex={`\\color{${MATH_COLORS[colorKeyB] ?? MATH_COLORS.label}}{${labelB}}`}
          offset={[0, 0, 0.1]}
        />
      )}

      {/* 4. 斜边 */}
      <Segment3D
        from={vertexA}
        to={vertexB}
        colorKey={colorKeyHyp}
        lineWidth={lineWidth + 0.5}
      />
      {labelHyp && (
        <FormulaLabel3D
          position={midHyp}
          tex={`\\color{${MATH_COLORS[colorKeyHyp] ?? MATH_COLORS.label}}{${labelHyp}}`}
          offset={[0.1, 0.1, 0.1]}
        />
      )}

      {/* 5. 直角方框标记 */}
      <AngleArc3D
        vertex={rightVertex}
        dirA={dirA}
        dirB={dirB}
        radius={rightAngleRadius}
        isRight
        colorKey={colorKeyA}
      />
    </group>
  );
};
