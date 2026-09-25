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
  ConePyramidEquivalenceData,
} from "@/math3d/pyramidDerivation";

interface PyramidDerivationSceneProps {
  mode: "tripartition" | "yangma" | "coneEquivalence";
  tripartitionData: PrismTripartitionData;
  yangmaData: YangmaBienaoData;
  coneEquivalenceData: ConePyramidEquivalenceData;
  explode: number; // 0 ~ 1
  activePartId?: string | null;
  showVertices?: boolean;
}

/** 单个剖分子多面体网格与棱线组件（模式一与模式二） */
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
  const maxExplodeDistance = 1.8;
  const currentDisplacement: Vec3 = useMemo(() => {
    const dist = explode * maxExplodeDistance;
    return {
      x: part.explodeOffset.x * dist,
      y: part.explodeOffset.y * dist,
      z: part.explodeOffset.z * dist,
    };
  }, [part.explodeOffset, explode]);

  const displacedVertices: Vec3[] = useMemo(() => {
    return part.vertices.map((v) => ({
      x: v.x + currentDisplacement.x,
      y: v.y + currentDisplacement.y,
      z: v.z + currentDisplacement.z,
    }));
  }, [part.vertices, currentDisplacement]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions: number[] = [];

    part.faces.forEach((face) => {
      const idxs = face.indices;
      if (idxs.length === 3) {
        for (let i = 0; i < 3; i++) {
          const v = displacedVertices[idxs[i]];
          const [tx, ty, tz] = mathToThree(v);
          positions.push(tx, ty, tz);
        }
      } else if (idxs.length === 4) {
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

  const colorHex = MATH_COLORS[part.colorKey];
  const opacity = isDimmed ? 0.2 : isActive ? 0.8 : 0.65;
  const edgeLineWidth = isActive ? 3.5 : 2.2;

  const partCenter: Vec3 = useMemo(() => {
    return {
      x: part.centroid.x + currentDisplacement.x,
      y: part.centroid.y + currentDisplacement.y,
      z: part.centroid.z + currentDisplacement.z,
    };
  }, [part.centroid, currentDisplacement]);

  return (
    <group>
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

      {showVertices &&
        displacedVertices.map((p, idx) => (
          <Point3D
            key={`vert-${part.id}-${idx}`}
            position={p}
            colorKey={part.colorKey}
            radius={isActive ? 0.055 : 0.042}
          />
        ))}

      {/* 子体名称标注：仅在子体已分离（explode > 0.15）时显示，与顶点字母门互补不重叠 */}
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

/** 模式三：祖暅圆锥与正四棱锥等底等高 3D 伴随切片对比组件 */
function ConePyramidEquivalenceMesh({
  data,
}: {
  data: ConePyramidEquivalenceData;
}) {
  const {
    radius: r,
    height: h,
    heightCut: z,
    pyramidSide: a,
    coneCutRadius: rCut,
    pyramidCutSide: aCut,
  } = data;

  // 左右几何体在数学坐标系中的 Y 轴偏移量 (左负右正)
  const offset = Math.max(2.4, r * 1.5 + a / 2);
  const leftCenterY = -offset;
  const rightCenterY = offset;

  // 1. 圆锥几何体 (左侧)：顶点 (0, leftCenterY, h)，底面圆心 (0, leftCenterY, 0)
  // openEnded 必须为 false：祖暅原理比较的正是「同底面积」，底面圆盘缺失会看不出等高同底。
  const coneGeo = useMemo(() => {
    return new THREE.ConeGeometry(r, h, 48, 1, false);
  }, [r, h]);

  // 2. 正四棱锥几何体 (右侧)：数学坐标 apex={x:0,y:rightCenterY,z:h}，底面四点 {x:±half,y:rightCenterY±half,z:0}
  // mathToThree: [v.y, v.z, v.x]，即 Three.js [X=数学y, Y=数学z, Z=数学x]
  const pyramidGeo = useMemo(() => {
    const half = a / 2;
    // 以数学坐标构造后统一经 mathToThree 规则转换：[math.y, math.z, math.x]
    const vApex: [number, number, number] = [rightCenterY, h, 0]; // math{x:0, y:rightCenterY, z:h}
    const v0: [number, number, number] = [rightCenterY - half, 0, -half]; // math{x:-half, y:rightCenterY-half, z:0}
    const v1: [number, number, number] = [rightCenterY - half, 0, half]; // math{x:half,  y:rightCenterY-half, z:0}
    const v2: [number, number, number] = [rightCenterY + half, 0, half]; // math{x:half,  y:rightCenterY+half, z:0}
    const v3: [number, number, number] = [rightCenterY + half, 0, -half]; // math{x:-half, y:rightCenterY+half, z:0}

    const positions: number[] = [
      // 4 个侧面三角形
      ...v0,
      ...v1,
      ...vApex,
      ...v1,
      ...v2,
      ...vApex,
      ...v2,
      ...v3,
      ...vApex,
      ...v3,
      ...v0,
      ...vApex,
      // 底面 2 个三角形
      ...v0,
      ...v2,
      ...v1,
      ...v0,
      ...v3,
      ...v2,
    ];

    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    geo.computeVertexNormals();
    return geo;
  }, [a, h, rightCenterY]);

  // 正四棱锥侧棱与底面棱 (数学坐标)
  const halfA = a / 2;
  const pApex: Vec3 = { x: 0, y: rightCenterY, z: h };
  const p0: Vec3 = { x: -halfA, y: rightCenterY - halfA, z: 0 };
  const p1: Vec3 = { x: halfA, y: rightCenterY - halfA, z: 0 };
  const p2: Vec3 = { x: halfA, y: rightCenterY + halfA, z: 0 };
  const p3: Vec3 = { x: -halfA, y: rightCenterY + halfA, z: 0 };

  // 当前截面正方形四个顶点 (高度 z)
  const halfCut = aCut / 2;
  const c0: Vec3 = { x: -halfCut, y: rightCenterY - halfCut, z };
  const c1: Vec3 = { x: halfCut, y: rightCenterY - halfCut, z };
  const c2: Vec3 = { x: halfCut, y: rightCenterY + halfCut, z };
  const c3: Vec3 = { x: -halfCut, y: rightCenterY + halfCut, z };

  // 截面正方形几何体 (高度 z，朝向水平)
  const squareCutGeo = useMemo(() => {
    return new THREE.PlaneGeometry(aCut, aCut);
  }, [aCut]);

  // 截面圆几何体 (高度 z，朝向水平)
  const circleCutGeo = useMemo(() => {
    return new THREE.CircleGeometry(rCut, 48);
  }, [rCut]);

  // 全局贯穿水平截面辅助板 (体现祖暅等高横截刀)
  const slicePlaneGeo = useMemo(() => {
    const totalW = offset * 2 + Math.max(r, halfA) * 2 + 1.2;
    const totalD = Math.max(r, halfA) * 2 + 1.2;
    return new THREE.PlaneGeometry(totalW, totalD);
  }, [offset, r, halfA]);

  return (
    <group>
      {/* ── 1. 左侧：圆锥 (半透明外壳 + 轴线与母线轮廓) ── */}
      <group position={[leftCenterY, h / 2, 0]}>
        <mesh geometry={coneGeo}>
          <meshStandardMaterial
            color={MATH_COLORS.paramPrimary}
            transparent
            opacity={0.35}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* 圆锥中轴高线 (虚线) */}
      <Segment3D
        from={{ x: 0, y: leftCenterY, z: 0 }}
        to={{ x: 0, y: leftCenterY, z: h }}
        colorKey="paramPrimary"
        lineWidth={2}
        dashed
      />

      {/* 圆锥顶点特征点 */}
      <Point3D
        position={{ x: 0, y: leftCenterY, z: h }}
        colorKey="paramPrimary"
        radius={0.05}
      />
      <PointLabel3D
        position={{ x: 0, y: leftCenterY, z: h }}
        text="P₁ (圆锥顶)"
        colorKey="paramPrimary"
        fontSize={0.22}
        offset={[0, 0.12, 0.05]}
      />

      {/* 圆锥高度 z 处截面圆盘 */}
      <group position={[leftCenterY, z, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh geometry={circleCutGeo}>
          <meshBasicMaterial
            color={MATH_COLORS.paramPrimary}
            transparent
            opacity={0.8}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* 圆锥截面积读数标签 */}
      <PointLabel3D
        position={{ x: 0, y: leftCenterY, z: z + 0.12 }}
        text={`S₁ = ${data.coneCutArea.toFixed(2)}`}
        colorKey="paramPrimary"
        fontSize={0.23}
      />

      {/* ── 2. 右侧：正四棱锥 (半透明表面 + 几何边框) ── */}
      <mesh geometry={pyramidGeo}>
        <meshStandardMaterial
          color={MATH_COLORS.paramSecondary}
          transparent
          opacity={0.35}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* 正四棱锥边框棱线 */}
      <Segment3D from={p0} to={p1} colorKey="paramSecondary" lineWidth={2} />
      <Segment3D from={p1} to={p2} colorKey="paramSecondary" lineWidth={2} />
      <Segment3D from={p2} to={p3} colorKey="paramSecondary" lineWidth={2} />
      <Segment3D from={p3} to={p0} colorKey="paramSecondary" lineWidth={2} />
      <Segment3D from={p0} to={pApex} colorKey="paramSecondary" lineWidth={2} />
      <Segment3D from={p1} to={pApex} colorKey="paramSecondary" lineWidth={2} />
      <Segment3D from={p2} to={pApex} colorKey="paramSecondary" lineWidth={2} />
      <Segment3D from={p3} to={pApex} colorKey="paramSecondary" lineWidth={2} />

      {/* 正四棱锥中轴高线 (虚线) */}
      <Segment3D
        from={{ x: 0, y: rightCenterY, z: 0 }}
        to={pApex}
        colorKey="paramSecondary"
        lineWidth={2}
        dashed
      />

      {/* 正四棱锥顶点 */}
      <Point3D position={pApex} colorKey="paramSecondary" radius={0.05} />
      <PointLabel3D
        position={pApex}
        text="P₂ (棱锥顶)"
        colorKey="paramSecondary"
        fontSize={0.22}
        offset={[0, 0.12, 0.05]}
      />

      {/* 正四棱锥高度 z 处截面正方形 */}
      <group position={[rightCenterY, z, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh geometry={squareCutGeo}>
          <meshBasicMaterial
            color={MATH_COLORS.paramSecondary}
            transparent
            opacity={0.8}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* 截面正方形四边描边 (鲜明凸显) */}
      <Segment3D from={c0} to={c1} colorKey="highlight" lineWidth={2.5} />
      <Segment3D from={c1} to={c2} colorKey="highlight" lineWidth={2.5} />
      <Segment3D from={c2} to={c3} colorKey="highlight" lineWidth={2.5} />
      <Segment3D from={c3} to={c0} colorKey="highlight" lineWidth={2.5} />

      {/* 正四棱锥截面积读数标签 */}
      <PointLabel3D
        position={{ x: 0, y: rightCenterY, z: z + 0.12 }}
        text={`S₂ = ${data.pyramidCutArea.toFixed(2)}`}
        colorKey="paramSecondary"
        fontSize={0.23}
      />

      {/* ── 3. 全局贯穿水平等高切片辅助平面 (卡瓦列里/祖暅截切刀) ── */}
      <group position={[0, z, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh geometry={slicePlaneGeo}>
          <meshBasicMaterial
            color={MATH_COLORS.highlight}
            transparent
            opacity={0.12}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* 截面高度标示标尺 */}
      <PointLabel3D
        position={{ x: 0, y: 0, z: z + 0.08 }}
        text={`截面高度 z = ${z.toFixed(2)} (S₁ ≡ S₂)`}
        colorKey="highlight"
        fontSize={0.24}
        offset={[0, 0.1, 0]}
      />
    </group>
  );
}

export function PyramidDerivationScene({
  mode,
  tripartitionData,
  yangmaData,
  coneEquivalenceData,
  explode,
  activePartId,
  showVertices = true,
}: PyramidDerivationSceneProps) {
  const parts = useMemo(() => {
    return mode === "tripartition" ? tripartitionData.parts : yangmaData.parts;
  }, [mode, tripartitionData, yangmaData]);

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
    } else if (mode === "yangma") {
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
    return [];
  }, [mode, tripartitionData, yangmaData]);

  return (
    <>
      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        minDistance={3}
        maxDistance={20}
        maxPolarAngle={Math.PI / 2 + 0.15}
      />

      {/* 模式一与模式二：三棱柱三等分 / 刘徽阳马与鳖臑 */}
      {mode !== "coneEquivalence" && (
        <>
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

          {/* 顶点字母仅在子体基本合拢时显示（与子体名称门的 0.15 阈值互补、不同时出现）：
              此时字母仍严格锚定在原母体的真实顶点上；一旦爆炸分离，顶点归属子体且位置漂移，
              改用各子体自身的名称标注。 */}
          {explode <= 0.15 &&
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
      )}

      {/* 模式三：祖暅圆锥与正四棱锥等底等高伴随对比 */}
      {mode === "coneEquivalence" && (
        <ConePyramidEquivalenceMesh data={coneEquivalenceData} />
      )}
    </>
  );
}
