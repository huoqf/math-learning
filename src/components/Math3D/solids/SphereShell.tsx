import { Line } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import { mathToThree } from "@/math3d/coordinateConvention";
import { MATH_COLORS } from "@/theme/math/colors";
import type { Vec3 } from "@/math3d/vector3";

interface SphereShellProps {
  center: Vec3;
  radius: number;
  colorKey: keyof typeof MATH_COLORS;
  opacity?: number;
  showGreatCircles?: boolean;
}

function sampleCircle(
  center: [number, number, number],
  radius: number,
  plane: "xy" | "xz" | "yz",
  segments = 64,
): [number, number, number][] {
  const [cx, cy, cz] = center;
  const pts: [number, number, number][] = [];
  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * Math.PI * 2;
    const c = radius * Math.cos(t);
    const s = radius * Math.sin(t);
    if (plane === "xy") pts.push([cx + c, cy + s, cz]);
    if (plane === "xz") pts.push([cx + c, cy, cz + s]);
    if (plane === "yz") pts.push([cx, cy + c, cz + s]);
  }
  return pts;
}

/**
 * 球体渲染基础组件：半透明球壳 + 3 条正交大圆辅助线。
 * CircumSphere / InSphere 共用此实现，仅颜色/透明度不同。
 */
export const SphereShell = ({
  center,
  radius,
  colorKey,
  opacity = 0.16,
  showGreatCircles = true,
}: SphereShellProps) => {
  const pos = mathToThree(center);
  const color = MATH_COLORS[colorKey];
  const [px, py, pz] = pos;

  const circles = useMemo(
    () =>
      showGreatCircles
        ? (["xy", "xz", "yz"] as const).map((p) => sampleCircle(pos, radius, p))
        : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [px, py, pz, radius, showGreatCircles],
  );

  return (
    <group renderOrder={10}>
      <mesh position={pos}>
        <sphereGeometry args={[radius, 48, 32]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={opacity}
          roughness={0.4}
          metalness={0}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      {circles.map((pts, i) => (
        <Line
          key={i}
          points={pts}
          color={color}
          lineWidth={1.2}
          transparent
          opacity={0.55}
        />
      ))}
    </group>
  );
};
