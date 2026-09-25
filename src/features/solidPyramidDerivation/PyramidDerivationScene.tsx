import { useMemo } from "react";
import * as THREE from "three";
import { OrbitControls } from "@react-three/drei";
import { Segment3D } from "@/components/Math3D/Segment3D";
import { Point3D } from "@/components/Math3D/Point3D";
import { PointLabel3D } from "@/components/Math3D/PointLabel3D";
import { mathToThree } from "@/math3d/coordinateConvention";
import { MATH_COLORS } from "@/theme";
import type { Vec3 } from "@/math3d/vector3";
import type {
  PolyhedronPart,
  PrismTripartitionData,
  YangmaBienaoData,
} from "@/math3d/pyramidDerivation";

interface PyramidDerivationSceneProps {
  mode: "tripartition" | "yangma";
  tripartitionData: PrismTripartitionData;
  yangmaData: YangmaBienaoData;
  explode: number; // 0 ~ 1
  activePartId?: string | null;
  showVertices?: boolean;
}

/** 单个剖分子多面体网格与棱线组件 */
function PartPolyhedronMesh({
  part,
  explode,
  isActive,
  isDimmed,
  showVertices = true,
}: {
  part: PolyhedronPart;
  explode: number;
  isActive: boolean;
  isDimmed: boolean;
  showVertices?: boolean;
}) {
  // 爆炸平移距离倍率 (最大位移 1.8)
  const maxExplodeDistance = 1.8;
  const currentDisplacement: Vec3 = useMemo(() => {
    const dist = explode * maxExplodeDistance;
    return {
      x: part.explodeOffset.x * dist,
      y: part.explodeOffset.y * dist,
      z: part.explodeOffset.z * dist,
    };
  }, [part.explodeOffset, explode]);

  // 位移后的三维顶点 (数学坐标)
  const displacedVertices: Vec3[] = useMemo(() => {
    return part.vertices.map((v) => ({
      x: v.x + currentDisplacement.x,
      y: v.y + currentDisplacement.y,
      z: v.z + currentDisplacement.z,
    }));
  }, [part.vertices, currentDisplacement]);

  // 构建 Three.js 三角化网格
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions: number[] = [];

    // 遍历多边形面并三角化
    part.faces.forEach((face) => {
      const idxs = face.indices;
      if (idxs.length === 3) {
        // 三角形面
        for (let i = 0; i < 3; i++) {
          const v = displacedVertices[idxs[i]];
          const [tx, ty, tz] = mathToThree(v);
          positions.push(tx, ty, tz);
        }
      } else if (idxs.length === 4) {
        // 四边形面切分为两个三角形 [0, 1, 2] 与 [0, 2, 3]
        const triangles = [
          [idxs[0], idxs[1], idxs[2]],
          [idxs[0], idxs[2], idxs[3]],
        ];
        triangles.forEach((tri) => {
          for (let i = 0; i < 3; i++) {
            const v = displacedVertices[tri[i]];
            const [tx, ty, tz] = mathToThree(v);
            positions.push(tx, ty, tz);
          }
        });
      }
    });

    geo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    geo.computeVertexNormals();
    return geo;
  }, [part.faces, displacedVertices]);

  // 提取几何体的所有独特棱（无重复线段）
  const edges = useMemo(() => {
    const edgeSet = new Set<string>();
    const result: [Vec3, Vec3][] = [];

    part.faces.forEach((face) => {
      const idxs = face.indices;
      const n = idxs.length;
      for (let i = 0; i < n; i++) {
        const u = idxs[i];
        const v = idxs[(i + 1) % n];
        const key = u < v ? `${u}-${v}` : `${v}-${u}`;
        if (!edgeSet.has(key)) {
          edgeSet.add(key);
          result.push([displacedVertices[u], displacedVertices[v]]);
        }
      }
    });

    return result;
  }, [part.faces, displacedVertices]);

  // 配色与透明度决策
  const colorHex = MATH_COLORS[part.colorKey];
  const opacity = isDimmed ? 0.2 : isActive ? 0.8 : 0.65;
  const edgeLineWidth = isActive ? 3.5 : 2.2;

  // 几何体重心位置（用于文字标示）
  const partCenter: Vec3 = useMemo(() => {
    return {
      x: part.centroid.x + currentDisplacement.x,
      y: part.centroid.y + currentDisplacement.y,
      z: part.centroid.z + currentDisplacement.z,
    };
  }, [part.centroid, currentDisplacement]);

  return (
    <group>
      {/* 几何体半透明着色面 */}
      <mesh geometry={geometry}>
        <meshStandardMaterial
          color={colorHex}
          transparent
          opacity={opacity}
          side={THREE.DoubleSide}
          depthWrite={false}
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>

      {/* 几何体棱线 (使用标准 Segment3D 纯几何线段) */}
      {edges.map(([p1, p2], idx) => (
        <Segment3D
          key={`edge-${part.id}-${idx}`}
          from={p1}
          to={p2}
          colorKey={part.colorKey}
          lineWidth={edgeLineWidth}
          opacity={isDimmed ? 0.3 : 1}
        />
      ))}

      {/* 几何体顶点 (使用标准 Point3D) */}
      {showVertices &&
        displacedVertices.map((p, idx) => (
          <Point3D
            key={`vert-${part.id}-${idx}`}
            position={p}
            colorKey={part.colorKey}
            radius={isActive ? 0.055 : 0.042}
          />
        ))}

      {/* 几何体中心标识标签 */}
      {explode > 0.15 && (
        <PointLabel3D
          position={partCenter}
          text={
            part.id.includes("yangma")
              ? "阳马"
              : part.id.includes("bienao")
                ? "鳖臑"
                : part.chineseName.split(" ")[0]
          }
          colorKey={part.colorKey}
          fontSize={0.24}
          offset={[0, 0.12, 0]}
        />
      )}
    </group>
  );
}

export function PyramidDerivationScene({
  mode,
  tripartitionData,
  yangmaData,
  explode,
  activePartId,
  showVertices = true,
}: PyramidDerivationSceneProps) {
  const parts = useMemo(() => {
    return mode === "tripartition" ? tripartitionData.parts : yangmaData.parts;
  }, [mode, tripartitionData, yangmaData]);

  // 场景全局母体基准点坐标（未位移时，供关键顶点标注如 A, B, C, A₁, B₁, C₁）
  const baseLabels = useMemo(() => {
    if (mode === "tripartition") {
      const { a, b, h } = tripartitionData;
      return [
        { name: "A", pos: { x: 0, y: 0, z: 0 } },
        { name: "B", pos: { x: a, y: 0, z: 0 } },
        { name: "C", pos: { x: 0, y: b, z: 0 } },
        { name: "A₁", pos: { x: 0, y: 0, z: h } },
        { name: "B₁", pos: { x: a, y: 0, z: h } },
        { name: "C₁", pos: { x: 0, y: b, z: h } },
      ];
    } else {
      const { a, b, c } = yangmaData;
      return [
        { name: "O", pos: { x: 0, y: 0, z: 0 } },
        { name: "A", pos: { x: a, y: 0, z: 0 } },
        { name: "B", pos: { x: 0, y: b, z: 0 } },
        { name: "O₁", pos: { x: 0, y: 0, z: c } },
        { name: "A₁", pos: { x: a, y: 0, z: c } },
        { name: "B₁", pos: { x: 0, y: b, z: c } },
      ];
    }
  }, [mode, tripartitionData, yangmaData]);

  return (
    <>
      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        minDistance={3}
        maxDistance={18}
        maxPolarAngle={Math.PI / 2 + 0.15}
      />

      {/* 渲染所有分割几何体部件 */}
      {parts.map((part) => {
        const isActive = activePartId === part.id;
        const isDimmed = !!activePartId && !isActive;
        return (
          <PartPolyhedronMesh
            key={part.id}
            part={part}
            explode={explode}
            isActive={isActive}
            isDimmed={isDimmed}
            showVertices={showVertices}
          />
        );
      })}

      {/* 当爆炸进度接近闭合时，显示母体基准顶点字母 */}
      {explode < 0.25 &&
        baseLabels.map((lbl) => (
          <PointLabel3D
            key={`lbl-base-${lbl.name}`}
            position={lbl.pos}
            text={lbl.name}
            colorKey="label"
            fontSize={0.24}
            offset={[0.1, 0.1, 0.05]}
          />
        ))}
    </>
  );
}
