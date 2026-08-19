import { useMemo } from "react";
import * as THREE from "three";
import { Line } from "@react-three/drei";
import { mathToThree } from "@/math3d/coordinateConvention";
import { MATH_COLORS } from "@/theme/math/colors";
import type { Vec3 } from "@/math3d/vector3";

export interface Segment3DProps {
  from: Vec3;
  to: Vec3;
  colorKey?: keyof typeof MATH_COLORS;
  lineWidth?: number;
  dashed?: boolean;
  opacity?: number;
  dashScale?: number;
  dashSize?: number;
  gapSize?: number;
}

/**
 * 3D 几何线段组件 (无箭头，用于多面体棱、折痕、辅助线等标准立体几何元素)
 */
export const Segment3D = ({
  from,
  to,
  colorKey = "line",
  lineWidth = 2,
  dashed = false,
  opacity = 1,
  dashScale = 6,
  dashSize = 0.25,
  gapSize = 0.18,
}: Segment3DProps) => {
  const points = useMemo(() => {
    const p1 = new THREE.Vector3(...mathToThree(from));
    const p2 = new THREE.Vector3(...mathToThree(to));
    return [p1, p2];
  }, [from, to]);

  const colorHex = MATH_COLORS[colorKey] ?? MATH_COLORS.line;

  return (
    <Line
      points={points}
      color={colorHex}
      lineWidth={lineWidth}
      dashed={dashed}
      dashScale={dashScale}
      dashSize={dashSize}
      gapSize={gapSize}
      transparent={opacity < 1}
      opacity={opacity}
    />
  );
};
