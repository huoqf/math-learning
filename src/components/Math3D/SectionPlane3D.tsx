import { useMemo } from "react";
import * as THREE from "three";
import { Line } from "@react-three/drei";
import type { Vec3 } from "@/math3d/vector3";
import { add, scale, cross, normalize } from "@/math3d/vector3";
import type { Plane } from "@/math3d/plane";
import { mathToThree } from "@/math3d/coordinateConvention";
import { MATH_COLORS } from "@/theme/math/colors";

interface SectionPlane3DProps {
  /** 求交算法算出的截面闭合曲线点（数学坐标） */
  sectionPoints: Vec3[];
  plane: Plane;
  /** 半透明平面的可视化范围半径 */
  planeExtent?: number;
  color?: string;
  showPlaneQuad?: boolean;
}

function buildPlaneBasis(normal: Vec3) {
  const n = normalize(normal);
  const helper: Vec3 =
    Math.abs(n.z) < 0.9 ? { x: 0, y: 0, z: 1 } : { x: 1, y: 0, z: 0 };
  const u = normalize(cross(helper, n));
  const v = normalize(cross(n, u));
  return { u, v };
}

function vec3ToThree(v: Vec3): THREE.Vector3 {
  const [x, y, z] = mathToThree(v);
  return new THREE.Vector3(x, y, z);
}

/**
 * 截面可视化组件
 *
 * 渲染三层：半透明平面 quad → 截面填充 → 截面轮廓线。
 * sectionPoints 必须共面且按环绕顺序排列（由 sectionIntersection.ts 保证），
 * 凸多边形三角扇填充即可正确覆盖，无需通用多边形三角剖分。
 */
export function SectionPlane3D({
  sectionPoints,
  plane,
  planeExtent = 3,
  color = MATH_COLORS.accent,
  showPlaneQuad = true,
}: SectionPlane3DProps) {
  const threePoints = useMemo(
    () => sectionPoints.map(vec3ToThree),
    [sectionPoints],
  );

  const fillGeometry = useMemo(() => {
    if (threePoints.length < 3) return null;
    const centroid = threePoints
      .reduce((acc, p) => acc.add(p.clone()), new THREE.Vector3())
      .multiplyScalar(1 / threePoints.length);

    const positions: number[] = [];
    for (let i = 0; i < threePoints.length; i++) {
      const a = threePoints[i];
      const b = threePoints[(i + 1) % threePoints.length];
      positions.push(
        centroid.x,
        centroid.y,
        centroid.z,
        a.x,
        a.y,
        a.z,
        b.x,
        b.y,
        b.z,
      );
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    geo.computeVertexNormals();
    return geo;
  }, [threePoints]);

  const outlinePoints = useMemo(
    () => (threePoints.length > 0 ? [...threePoints, threePoints[0]] : []),
    [threePoints],
  );

  const quadGeometry = useMemo(() => {
    if (!showPlaneQuad) return null;
    const { u, v } = buildPlaneBasis(plane.normal);
    const c = plane.point;
    const corners = [
      add(add(c, scale(u, -planeExtent)), scale(v, -planeExtent)),
      add(add(c, scale(u, planeExtent)), scale(v, -planeExtent)),
      add(add(c, scale(u, planeExtent)), scale(v, planeExtent)),
      add(add(c, scale(u, -planeExtent)), scale(v, planeExtent)),
    ].map(vec3ToThree);

    const [a, b, c2, d] = corners;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(
        [
          a.x,
          a.y,
          a.z,
          b.x,
          b.y,
          b.z,
          c2.x,
          c2.y,
          c2.z,
          a.x,
          a.y,
          a.z,
          c2.x,
          c2.y,
          c2.z,
          d.x,
          d.y,
          d.z,
        ],
        3,
      ),
    );
    return geo;
  }, [plane, planeExtent, showPlaneQuad]);

  return (
    <group>
      {quadGeometry && (
        <mesh geometry={quadGeometry} renderOrder={4}>
          <meshBasicMaterial
            color="#7fa8d9"
            transparent
            opacity={0.15}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}

      {fillGeometry && (
        <mesh geometry={fillGeometry} renderOrder={6}>
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.45}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}

      {outlinePoints.length > 0 && (
        <Line
          points={outlinePoints}
          color={color}
          lineWidth={2.5}
          renderOrder={7}
        />
      )}
    </group>
  );
}
