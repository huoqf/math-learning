import { useMemo } from "react";
import * as THREE from "three";
import { Line } from "@react-three/drei";
import type { Vec3 } from "@/math3d/vector3";
import { add, scale, cross, normalize } from "@/math3d/vector3";
import type { Plane } from "@/math3d/plane";
import { mathToThree } from "@/math3d/coordinateConvention";
import { MATH_COLORS, MATH3D_COLORS } from "@/theme/math/colors";

interface ConstructionLineProp {
  from: Vec3;
  to: Vec3;
  color?: string;
  dashed?: boolean;
}

interface ConstructionPointProp {
  position: Vec3;
  label?: string;
  color?: string;
}

interface SectionPlane3DProps {
  /** 求交算法算出的截面闭合曲线点（数学坐标） */
  sectionPoints: Vec3[];
  plane: Plane;
  /** 半透明平面的可视化范围半径 */
  planeExtent?: number;
  color?: string;
  showPlaneQuad?: boolean;
  /** 作图辅助线段 */
  constructionLines?: ConstructionLineProp[];
  /** 作图辅助顶点 */
  constructionPoints?: ConstructionPointProp[];
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
  color = MATH3D_COLORS.sectionFill,
  showPlaneQuad = true,
  constructionLines = [],
  constructionPoints = [],
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

  const quadData = useMemo(() => {
    if (!showPlaneQuad) return { geo: null, outline: [] };
    const { u, v } = buildPlaneBasis(plane.normal);
    const c =
      sectionPoints.length >= 3
        ? scale(
            sectionPoints.reduce((acc, p) => add(acc, p), { x: 0, y: 0, z: 0 }),
            1 / sectionPoints.length,
          )
        : plane.point;
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
    const outline = [a, b, c2, d, a];
    return { geo, outline };
  }, [plane, planeExtent, showPlaneQuad, sectionPoints]);

  return (
    <group>
      {/* 延伸辅助平面 (冰紫天蓝半透明) */}
      {quadData.geo && (
        <mesh geometry={quadData.geo} renderOrder={4}>
          <meshBasicMaterial
            color={MATH3D_COLORS.sectionPlane}
            transparent
            opacity={0.22}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* 延伸辅助平面的四周轮廓边界线 (使切割面边界清晰可见) */}
      {quadData.outline.length > 0 && (
        <Line
          points={quadData.outline}
          color="#818CF8"
          lineWidth={1.5}
          dashed
          dashSize={0.2}
          gapSize={0.1}
          renderOrder={5}
        />
      )}

      {/* 截面多边形 (高饱和琥珀金填充) */}
      {fillGeometry && (
        <mesh geometry={fillGeometry} renderOrder={6}>
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.55}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* 平面与多面体表面相交形成的闭合交线轮廓 */}
      {outlinePoints.length > 0 && (
        <Line
          points={outlinePoints}
          color={MATH3D_COLORS.sectionOutline}
          lineWidth={3.0}
          depthTest={false}
          renderOrder={100}
        />
      )}

      {/* 作图辅助延长线/虚线 */}
      {constructionLines.map((line, idx) => {
        const pts = [vec3ToThree(line.from), vec3ToThree(line.to)];
        return (
          <Line
            key={`const-line-${idx}`}
            points={pts}
            color={line.color ?? MATH_COLORS.highlight}
            lineWidth={1.5}
            dashed={line.dashed}
            dashSize={0.2}
            gapSize={0.1}
            renderOrder={8}
          />
        );
      })}

      {/* 作图辅助关键点 */}
      {constructionPoints.map((pt, idx) => {
        const threePos = vec3ToThree(pt.position);
        return (
          <mesh key={`const-pt-${idx}`} position={threePos} renderOrder={9}>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshBasicMaterial color={pt.color ?? MATH_COLORS.highlight} />
          </mesh>
        );
      })}
    </group>
  );
}
