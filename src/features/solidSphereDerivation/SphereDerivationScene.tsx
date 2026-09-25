import { useMemo } from "react";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import { MATH_COLORS } from "@/theme";
import { FormulaLabel3D } from "@/components/Math3D/FormulaLabel3D";
import { Segment3D } from "@/components/Math3D/Segment3D";
import { Point3D } from "@/components/Math3D/Point3D";
import { RightTriangle3D } from "@/components/Math3D/RightTriangle3D";
import type { Vec3 } from "@/math3d/vector3";
import { calculateZuxuanSection } from "@/math3d/sphereDerivation";

interface SphereDerivationSceneProps {
  mode: "zuxuan" | "micropyramid";
  radius: number;
  heightCut: number;
  subdivisions: number;
  showAuxLines?: boolean;
  showSection?: boolean;
  fontScale?: number;
}

/** Three.js 局部空间点 (x向右, y向上, z向前) 转为数学 Vec3 (x向前, y向右, z向上) */
const toMathVec3 = (threeX: number, threeY: number, threeZ: number): Vec3 => ({
  x: threeZ,
  y: threeX,
  z: threeY,
});

export function SphereDerivationScene({
  mode,
  radius,
  heightCut,
  subdivisions,
  showAuxLines = true,
  showSection = true,
}: SphereDerivationSceneProps) {
  const R = Math.max(0.8, radius);
  const h = Math.max(0, Math.min(R, heightCut));

  // ─────────────────────────────────────────────────────────────
  // 模式一：祖暅原理双体等高切片对比 (半球 vs 挖锥圆柱)
  // ─────────────────────────────────────────────────────────────
  const zuxuan = useMemo(() => calculateZuxuanSection(R, h), [R, h]);
  // 适度居中间距，确保在标准视口下左右双体饱满居中
  const offsetDistance = R * 1.35;
  const leftX = -offsetDistance; // 半球中心 X
  const rightX = offsetDistance; // 挖锥圆柱中心 X

  // 1. 半球几何体网格
  const hemisphereGeo = useMemo(() => {
    return new THREE.SphereGeometry(R, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2);
  }, [R]);

  const hemisphereBaseGeo = useMemo(() => {
    return new THREE.CircleGeometry(R, 64);
  }, [R]);

  // 半球在高度 h 处的截面实心圆盘
  const hemisphereCutGeo = useMemo(() => {
    const rCut = zuxuan.hemisphereCutRadius;
    return new THREE.CircleGeometry(Math.max(0.001, rCut), 48);
  }, [zuxuan.hemisphereCutRadius]);

  // 2. 挖锥圆柱几何体网格
  const cylinderGeo = useMemo(() => {
    return new THREE.CylinderGeometry(R, R, R, 48, 1, true);
  }, [R]);

  // 内部挖空的倒圆锥面 (顶点在底面原点，顶底面在上)
  const invertedConeGeo = useMemo(() => {
    return new THREE.ConeGeometry(R, R, 48, 1, true);
  }, [R]);

  // 挖锥圆柱在高度 h 处的截面圆环
  const ringCutGeo = useMemo(() => {
    const innerR = Math.max(0.001, zuxuan.coneInnerRadius);
    const outerR = Math.max(innerR + 0.001, zuxuan.cylinderOuterRadius);
    return new THREE.RingGeometry(innerR, outerR, 48);
  }, [zuxuan.coneInnerRadius, zuxuan.cylinderOuterRadius]);

  // 3. 贯穿两几何体的公共水平截面切板 (Cut Plane)
  const cutPlaneWidth = rightX - leftX + 2 * R + 0.6;
  const cutPlaneDepth = 2 * R + 0.8;
  const cutPlaneGeo = useMemo(() => {
    return new THREE.PlaneGeometry(cutPlaneWidth, cutPlaneDepth);
  }, [cutPlaneWidth, cutPlaneDepth]);

  // 4. 底面公共基准板 (Ground Base)
  const groundBaseGeo = useMemo(() => {
    return new THREE.PlaneGeometry(cutPlaneWidth + 0.2, cutPlaneDepth + 0.2);
  }, [cutPlaneWidth, cutPlaneDepth]);

  // 底面圆与截面轮廓线缓存
  const hemisphereBasePoints = useMemo(() => {
    const arr = new Float32Array(65 * 3);
    for (let i = 0; i <= 64; i++) {
      const a = (i / 64) * Math.PI * 2;
      arr[i * 3] = R * Math.cos(a);
      arr[i * 3 + 1] = 0;
      arr[i * 3 + 2] = R * Math.sin(a);
    }
    return arr;
  }, [R]);

  const hemisphereCutPoints = useMemo(() => {
    const arr = new Float32Array(49 * 3);
    const rC = zuxuan.hemisphereCutRadius;
    for (let i = 0; i <= 48; i++) {
      const a = (i / 48) * Math.PI * 2;
      arr[i * 3] = rC * Math.cos(a);
      arr[i * 3 + 1] = 0;
      arr[i * 3 + 2] = rC * Math.sin(a);
    }
    return arr;
  }, [zuxuan.hemisphereCutRadius]);

  const ringInnerPoints = useMemo(() => {
    const arr = new Float32Array(49 * 3);
    const rIn = zuxuan.coneInnerRadius;
    for (let i = 0; i <= 48; i++) {
      const a = (i / 48) * Math.PI * 2;
      arr[i * 3] = rIn * Math.cos(a);
      arr[i * 3 + 1] = 0;
      arr[i * 3 + 2] = rIn * Math.sin(a);
    }
    return arr;
  }, [zuxuan.coneInnerRadius]);

  // ─────────────────────────────────────────────────────────────
  // 模式二：球面微小棱锥分割累加 (以平代曲、以锥积球)
  // ─────────────────────────────────────────────────────────────

  // 正面朝向主视角的抽样微棱锥网格，跨度随细分密度 N 动态联动 (严谨还原以平代曲精髓)
  const samplePyramid = useMemo(() => {
    // 视角中心选择极角 50°、经度 35°，处于斜前方最佳观赏位
    const phiCenter = (Math.PI * 50) / 180;
    const thetaCenter = (Math.PI * 35) / 180;

    // 经纬度网格步长随 N 真实细分
    const dPhi = Math.PI / Math.max(8, subdivisions);
    const dTheta = (Math.PI * 2) / Math.max(16, subdivisions * 2);

    const phi1 = phiCenter - dPhi / 2;
    const phi2 = phiCenter + dPhi / 2;
    const theta1 = thetaCenter - dTheta / 2;
    const theta2 = thetaCenter + dTheta / 2;

    const p1: [number, number, number] = [
      R * Math.sin(phi1) * Math.sin(theta1),
      R * Math.cos(phi1),
      R * Math.sin(phi1) * Math.cos(theta1),
    ];
    const p2: [number, number, number] = [
      R * Math.sin(phi1) * Math.sin(theta2),
      R * Math.cos(phi1),
      R * Math.sin(phi1) * Math.cos(theta2),
    ];
    const p3: [number, number, number] = [
      R * Math.sin(phi2) * Math.sin(theta2),
      R * Math.cos(phi2),
      R * Math.sin(phi2) * Math.cos(theta2),
    ];
    const p4: [number, number, number] = [
      R * Math.sin(phi2) * Math.sin(theta1),
      R * Math.cos(phi2),
      R * Math.sin(phi2) * Math.cos(theta1),
    ];

    const center: [number, number, number] = [
      (p1[0] + p2[0] + p3[0] + p4[0]) / 4,
      (p1[1] + p2[1] + p3[1] + p4[1]) / 4,
      (p1[2] + p2[2] + p3[2] + p4[2]) / 4,
    ];

    return {
      vertices: [p1, p2, p3, p4],
      center,
      dPhi,
      dTheta,
      phiCenter,
      thetaCenter,
    };
  }, [R, subdivisions]);

  // 微小棱锥沿法线适度微抽 (抽离 18%，清晰展示独立锥体)
  const popRatio = 0.18;
  const poppedCenter: [number, number, number] = useMemo(() => {
    const c = samplePyramid.center;
    return [
      c[0] * (1 + popRatio),
      c[1] * (1 + popRatio),
      c[2] * (1 + popRatio),
    ];
  }, [samplePyramid.center]);

  const poppedVertices = useMemo(() => {
    return samplePyramid.vertices.map(
      (v) =>
        [
          v[0] * (1 + popRatio),
          v[1] * (1 + popRatio),
          v[2] * (1 + popRatio),
        ] as [number, number, number],
    );
  }, [samplePyramid.vertices]);

  // 抽出的微棱锥几何表面 (拆分为 4 个侧面三角形与 1 个底面四边形，实现底侧分色)
  const pyramidSideGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const apex = [0, 0, 0];
    const [v0, v1, v2, v3] = poppedVertices;

    const positions = new Float32Array([
      // 侧面 1
      ...apex,
      ...v0,
      ...v1,
      // 侧面 2
      ...apex,
      ...v1,
      ...v2,
      // 侧面 3
      ...apex,
      ...v2,
      ...v3,
      // 侧面 4
      ...apex,
      ...v3,
      ...v0,
    ]);

    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.computeVertexNormals();
    return geo;
  }, [poppedVertices]);

  const pyramidBaseGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const [v0, v1, v2, v3] = poppedVertices;

    const positions = new Float32Array([
      ...v0,
      ...v1,
      ...v2,
      ...v0,
      ...v2,
      ...v3,
    ]);

    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.computeVertexNormals();
    return geo;
  }, [poppedVertices]);

  // 微棱锥底面多边形线框
  const microPyramidPoints = useMemo(() => {
    return new Float32Array(poppedVertices.flat());
  }, [poppedVertices]);

  // 球面底座印记线框 (未抽出前在球面上的网格)
  const baseImprintPoints = useMemo(() => {
    return new Float32Array(samplePyramid.vertices.flat());
  }, [samplePyramid.vertices]);

  // 相邻伴随微锥棱边 (展现“整球由微锥拼积”)
  const neighborPyramidEdges = useMemo(() => {
    const edges: Array<[[number, number, number], [number, number, number]]> =
      [];
    const phi1 = (Math.PI * 42) / 180;
    const phi2 = (Math.PI * 58) / 180;
    const phi3 = (Math.PI * 74) / 180;
    const theta1 = (Math.PI * 5) / 180;
    const theta2 = (Math.PI * 25) / 180;
    const theta3 = (Math.PI * 45) / 180;

    const samplePoints: Array<[number, number, number]> = [
      [
        R * Math.sin(phi1) * Math.sin(theta1),
        R * Math.cos(phi1),
        R * Math.sin(phi1) * Math.cos(theta1),
      ],
      [
        R * Math.sin(phi2) * Math.sin(theta1),
        R * Math.cos(phi2),
        R * Math.sin(phi2) * Math.cos(theta1),
      ],
      [
        R * Math.sin(phi3) * Math.sin(theta2),
        R * Math.cos(phi3),
        R * Math.sin(phi3) * Math.cos(theta2),
      ],
      [
        R * Math.sin(phi3) * Math.sin(theta3),
        R * Math.cos(phi3),
        R * Math.sin(phi3) * Math.cos(theta3),
      ],
    ];

    samplePoints.forEach((pt) => {
      edges.push([[0, 0, 0], pt]);
    });
    return edges;
  }, [R]);

  // 球体主特征大圆线条缓存 (赤道大圆、0度子午线大圆、90度子午线大圆)
  const equatorCirclePoints = useMemo(() => {
    const arr = new Float32Array(65 * 3);
    for (let i = 0; i <= 64; i++) {
      const a = (i / 64) * Math.PI * 2;
      arr[i * 3] = R * Math.cos(a);
      arr[i * 3 + 1] = 0;
      arr[i * 3 + 2] = R * Math.sin(a);
    }
    return arr;
  }, [R]);

  const meridianCirclePoints = useMemo(() => {
    const arr = new Float32Array(65 * 3);
    for (let i = 0; i <= 64; i++) {
      const a = (i / 64) * Math.PI * 2;
      arr[i * 3] = 0;
      arr[i * 3 + 1] = R * Math.cos(a);
      arr[i * 3 + 2] = R * Math.sin(a);
    }
    return arr;
  }, [R]);

  return (
    <group>
      {mode === "zuxuan" ? (
        <group>
          {/* ════════════════ 0. 公共水平基准板 (同底面 "同势" 前提) ════════════════ */}
          <mesh
            geometry={groundBaseGeo}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, -0.005, 0]}
          >
            <meshBasicMaterial
              color={MATH_COLORS.textMuted}
              transparent
              opacity={0.06}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* ════════════════ 1. 公共水平半透明截面切板 (Cut Plane) ════════════════ */}
          {showSection && h < R && (
            <group position={[0, h, 0]}>
              {/* 大长方形半透明切面玻璃板 */}
              <mesh geometry={cutPlaneGeo} rotation={[-Math.PI / 2, 0, 0]}>
                <meshStandardMaterial
                  color={MATH_COLORS.primary}
                  transparent
                  opacity={0.12}
                  roughness={0.1}
                  metalness={0.1}
                  side={THREE.DoubleSide}
                  depthWrite={false}
                />
              </mesh>

              {/* 切面切板边缘高亮发光线框 */}
              <lineLoop rotation={[-Math.PI / 2, 0, 0]}>
                <bufferGeometry>
                  <bufferAttribute
                    attach="attributes-position"
                    args={[
                      new Float32Array([
                        -cutPlaneWidth / 2,
                        -cutPlaneDepth / 2,
                        0,
                        cutPlaneWidth / 2,
                        -cutPlaneDepth / 2,
                        0,
                        cutPlaneWidth / 2,
                        cutPlaneDepth / 2,
                        0,
                        -cutPlaneWidth / 2,
                        cutPlaneDepth / 2,
                        0,
                      ]),
                      3,
                    ]}
                  />
                </bufferGeometry>
                <lineBasicMaterial
                  color={MATH_COLORS.primary}
                  linewidth={1.5}
                  transparent
                  opacity={0.4}
                />
              </lineLoop>

              {/* 切板前沿正中央提示胶囊 (居中不遮挡，杜绝边缘截断) */}
              <Html
                position={[0, 0, cutPlaneDepth / 2 - 0.15]}
                center
                distanceFactor={10}
              >
                <div className="px-3 py-0.5 rounded-full text-xs font-serif shadow-sm backdrop-blur-md border border-amber-300/80 bg-white/95 text-amber-800 dark:bg-neutral-900/90 dark:text-amber-300 dark:border-amber-700 whitespace-nowrap select-none">
                  等高截面：S₁(h) = S₂(h)
                </div>
              </Html>
            </group>
          )}

          {/* ════════════════ 2. 左侧：半球 ════════════════ */}
          <group position={[leftX, 0, 0]}>
            {/* 半球面半透明外壳 */}
            <mesh geometry={hemisphereGeo}>
              <meshStandardMaterial
                color={MATH_COLORS.primary}
                transparent
                opacity={0.25}
                roughness={0.3}
                metalness={0.1}
                side={THREE.DoubleSide}
                depthWrite={false}
              />
            </mesh>

            {/* 半球底面圆盘 */}
            <mesh geometry={hemisphereBaseGeo} rotation={[-Math.PI / 2, 0, 0]}>
              <meshStandardMaterial
                color={MATH_COLORS.primary}
                transparent
                opacity={0.15}
                side={THREE.DoubleSide}
              />
            </mesh>

            {/* 底面圆轮廓实线 */}
            <lineLoop>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  args={[hemisphereBasePoints, 3]}
                />
              </bufferGeometry>
              <lineBasicMaterial color={MATH_COLORS.primary} linewidth={2} />
            </lineLoop>

            {/* 高度 h 处的半球截面实心圆盘 */}
            {showSection && h < R && (
              <group position={[0, h, 0]}>
                <mesh
                  geometry={hemisphereCutGeo}
                  rotation={[-Math.PI / 2, 0, 0]}
                >
                  <meshStandardMaterial
                    color={MATH_COLORS.paramSecondary}
                    transparent
                    opacity={0.65}
                    roughness={0.2}
                    side={THREE.DoubleSide}
                  />
                </mesh>
                {/* 截面圆周金黄色高亮轮廓 */}
                <lineLoop>
                  <bufferGeometry>
                    <bufferAttribute
                      attach="attributes-position"
                      args={[hemisphereCutPoints, 3]}
                    />
                  </bufferGeometry>
                  <lineBasicMaterial
                    color={MATH_COLORS.paramSecondary}
                    linewidth={2.5}
                  />
                </lineLoop>
              </group>
            )}

            {/* 几何辅助线系统 */}
            {showAuxLines && (
              <>
                {/* 球心垂直轴线 O₁ -> O'₁ */}
                <Segment3D
                  from={toMathVec3(0, 0, 0)}
                  to={toMathVec3(0, R, 0)}
                  colorKey="textMuted"
                  lineWidth={1.5}
                  dashed
                />

                {/* 勾股定理特征三角形 O₁-O'₁-P₁ (直角顶点在 O'₁) */}
                {h < R && (
                  <>
                    <RightTriangle3D
                      rightVertex={toMathVec3(0, h, 0)}
                      vertexA={toMathVec3(0, 0, 0)}
                      vertexB={toMathVec3(zuxuan.hemisphereCutRadius, h, 0)}
                      fillMesh
                      opacity={0.18}
                      rightAngleRadius={0.14}
                      colorKeyA="paramSecondary"
                      colorKeyB="paramTertiary"
                      colorKeyHyp="paramPrimary"
                      lineWidth={3}
                    />
                  </>
                )}

                {/* 特征点 */}
                <Point3D
                  position={toMathVec3(0, 0, 0)}
                  colorKey="textMuted"
                  radius={0.045}
                />
                <Point3D
                  position={toMathVec3(0, h, 0)}
                  colorKey="paramSecondary"
                  radius={0.045}
                />
                <Point3D
                  position={toMathVec3(zuxuan.hemisphereCutRadius, h, 0)}
                  colorKey="paramTertiary"
                  radius={0.045}
                />

                {/* KaTeX 纯净数学标注 */}
                <FormulaLabel3D position={toMathVec3(0, -0.22, 0)} tex="O_1" />
                <FormulaLabel3D
                  position={toMathVec3(-0.16, h + 0.1, 0)}
                  tex="O'_1"
                />
                <FormulaLabel3D
                  position={toMathVec3(
                    zuxuan.hemisphereCutRadius + 0.18,
                    h + 0.1,
                    0,
                  )}
                  tex="P_1"
                />
              </>
            )}

            {/* 几何体顶部中文胶囊徽标 */}
            <Html position={[0, R + 0.35, 0]} center distanceFactor={10}>
              <div className="px-3 py-1 rounded-full text-xs font-semibold shadow-md backdrop-blur-md border border-blue-300/70 bg-white/95 text-blue-700 dark:bg-neutral-900/90 dark:text-blue-400 dark:border-neutral-700 whitespace-nowrap select-none">
                半球 (V₁)
              </div>
            </Html>
          </group>

          {/* ════════════════ 3. 右侧：挖锥圆柱 ════════════════ */}
          <group position={[rightX, 0, 0]}>
            {/* 外圆柱侧面半透明 */}
            <mesh geometry={cylinderGeo} position={[0, R / 2, 0]}>
              <meshStandardMaterial
                color={MATH_COLORS.secondary}
                transparent
                opacity={0.18}
                roughness={0.3}
                side={THREE.DoubleSide}
                depthWrite={false}
              />
            </mesh>

            {/* 内部挖空的倒圆锥面 (淡雅半透明，清楚呈现内部挖空构造) */}
            <mesh
              geometry={invertedConeGeo}
              position={[0, R / 2, 0]}
              rotation={[Math.PI, 0, 0]}
            >
              <meshStandardMaterial
                color={MATH_COLORS.textMuted}
                transparent
                opacity={0.12}
                roughness={0.4}
                side={THREE.DoubleSide}
                depthWrite={false}
              />
            </mesh>

            {/* 倒圆锥轴截面两条主轮廓母线 (教科书清爽素描线) */}
            <Segment3D
              from={toMathVec3(0, 0, 0)}
              to={toMathVec3(-R, R, 0)}
              colorKey="textMuted"
              lineWidth={1.6}
            />
            <Segment3D
              from={toMathVec3(0, 0, 0)}
              to={toMathVec3(R, R, 0)}
              colorKey="textMuted"
              lineWidth={1.6}
            />

            {/* 圆柱上底圆轮廓 */}
            <lineLoop position={[0, R, 0]}>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  args={[hemisphereBasePoints, 3]}
                />
              </bufferGeometry>
              <lineBasicMaterial
                color={MATH_COLORS.secondary}
                linewidth={1.5}
              />
            </lineLoop>

            {/* 圆柱下底圆轮廓 */}
            <lineLoop position={[0, 0, 0]}>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  args={[hemisphereBasePoints, 3]}
                />
              </bufferGeometry>
              <lineBasicMaterial color={MATH_COLORS.secondary} linewidth={2} />
            </lineLoop>

            {/* 高度 h 处的挖锥圆柱截面圆环 (等面积环形实体) */}
            {showSection && h < R && (
              <group position={[0, h, 0]}>
                <mesh geometry={ringCutGeo} rotation={[-Math.PI / 2, 0, 0]}>
                  <meshStandardMaterial
                    color={MATH_COLORS.paramSecondary}
                    transparent
                    opacity={0.65}
                    roughness={0.2}
                    side={THREE.DoubleSide}
                  />
                </mesh>
                {/* 截面外圆周轮廓线 */}
                <lineLoop>
                  <bufferGeometry>
                    <bufferAttribute
                      attach="attributes-position"
                      args={[hemisphereBasePoints, 3]}
                    />
                  </bufferGeometry>
                  <lineBasicMaterial
                    color={MATH_COLORS.paramSecondary}
                    linewidth={2.5}
                  />
                </lineLoop>
                {/* 截面内圆周轮廓线 */}
                {zuxuan.coneInnerRadius > 0.01 && (
                  <lineLoop>
                    <bufferGeometry>
                      <bufferAttribute
                        attach="attributes-position"
                        args={[ringInnerPoints, 3]}
                      />
                    </bufferGeometry>
                    <lineBasicMaterial
                      color={MATH_COLORS.paramSecondary}
                      linewidth={2.5}
                    />
                  </lineLoop>
                )}
              </group>
            )}

            {/* 辅助线段：外半径 R 与内半径 h (由等腰直角相似得 r_内 = h) */}
            {showAuxLines && (
              <>
                {/* 垂直轴线 */}
                <Segment3D
                  from={toMathVec3(0, 0, 0)}
                  to={toMathVec3(0, R, 0)}
                  colorKey="textMuted"
                  lineWidth={1.5}
                  dashed
                />
                {/* 截面中心 O'₂ 到外轮廓 Q₁ (外半径 R) */}
                <Segment3D
                  from={toMathVec3(0, h, 0)}
                  to={toMathVec3(R, h, 0)}
                  colorKey="paramPrimary"
                  lineWidth={3}
                />
                {/* 截面中心 O'₂ 到倒圆锥内轮廓 Q₂ (内半径 h) */}
                <Segment3D
                  from={toMathVec3(0, h, 0)}
                  to={toMathVec3(-zuxuan.coneInnerRadius, h, 0)}
                  colorKey="paramSecondary"
                  lineWidth={3}
                />
                {/* 倒圆锥截面母线 O₂ -> Q₂ (等腰直角斜边) */}
                {h > 0.05 && (
                  <Segment3D
                    from={toMathVec3(0, 0, 0)}
                    to={toMathVec3(-zuxuan.coneInnerRadius, h, 0)}
                    colorKey="paramTertiary"
                    lineWidth={2.2}
                  />
                )}

                <Point3D
                  position={toMathVec3(0, 0, 0)}
                  colorKey="textMuted"
                  radius={0.045}
                />
                <Point3D
                  position={toMathVec3(0, h, 0)}
                  colorKey="paramSecondary"
                  radius={0.045}
                />
                <Point3D
                  position={toMathVec3(R, h, 0)}
                  colorKey="paramPrimary"
                  radius={0.045}
                />
                <Point3D
                  position={toMathVec3(-zuxuan.coneInnerRadius, h, 0)}
                  colorKey="paramSecondary"
                  radius={0.045}
                />

                {/* KaTeX 纯净数学标注 */}
                <FormulaLabel3D position={toMathVec3(0, -0.22, 0)} tex="O_2" />
                <FormulaLabel3D
                  position={toMathVec3(0.16, h + 0.1, 0)}
                  tex="O'_2"
                />
                <FormulaLabel3D
                  position={toMathVec3(R + 0.18, h + 0.1, 0)}
                  tex="Q_1"
                />
                <FormulaLabel3D
                  position={toMathVec3(
                    -zuxuan.coneInnerRadius - 0.18,
                    h + 0.1,
                    0,
                  )}
                  tex="Q_2"
                />
              </>
            )}

            {/* 几何体顶部中文胶囊徽标 */}
            <Html position={[0, R + 0.35, 0]} center distanceFactor={10}>
              <div className="px-3 py-1 rounded-full text-xs font-semibold shadow-md backdrop-blur-md border border-amber-300/70 bg-white/95 text-amber-700 dark:bg-neutral-900/90 dark:text-amber-400 dark:border-neutral-700 whitespace-nowrap select-none">
                挖锥圆柱 (V₂ = V_柱 - V_锥)
              </div>
            </Html>
          </group>

          {/* ════════════════ 4. 跨体等高连线 (严格水平，体现高度相等) ════════════════ */}
          {showAuxLines && (
            <Segment3D
              from={toMathVec3(leftX + zuxuan.hemisphereCutRadius, h, 0)}
              to={toMathVec3(rightX - zuxuan.coneInnerRadius, h, 0)}
              colorKey="paramSecondary"
              lineWidth={1.8}
              dashed
              dashSize={0.16}
              gapSize={0.1}
            />
          )}
        </group>
      ) : (
        // ─────────────────────────────────────────────────────────────
        // 模式二：球面微小棱锥分割累加场景 (以平代曲、以锥积球)
        // ─────────────────────────────────────────────────────────────
        <group position={[0, 0, 0]}>
          {/* 1. 半透明水蓝色柔和球体表皮 (清晰呈现完整球体) */}
          <mesh>
            <sphereGeometry args={[R, 48, 32]} />
            <meshStandardMaterial
              color={MATH_COLORS.primary}
              transparent
              opacity={0.14}
              roughness={0.2}
              metalness={0.05}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>

          {/* 2. 球体经纬线规整细分网格 (随 N 动态变化) */}
          <mesh>
            <sphereGeometry
              args={[
                R,
                Math.max(12, subdivisions * 2),
                Math.max(8, subdivisions),
              ]}
            />
            <meshBasicMaterial
              color={MATH_COLORS.primary}
              transparent
              opacity={0.28}
              wireframe={true}
            />
          </mesh>

          {/* 3. 经典高中立体几何三大基准主轮廓大圆 */}
          {/* 水平赤道大圆 */}
          <lineLoop>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                args={[equatorCirclePoints, 3]}
              />
            </bufferGeometry>
            <lineBasicMaterial
              color={MATH_COLORS.primary}
              linewidth={1.8}
              transparent
              opacity={0.6}
            />
          </lineLoop>

          {/* 竖直子午线大圆 */}
          <lineLoop>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                args={[meridianCirclePoints, 3]}
              />
            </bufferGeometry>
            <lineBasicMaterial
              color={MATH_COLORS.primary}
              linewidth={1.8}
              transparent
              opacity={0.4}
            />
          </lineLoop>

          {/* 4. 相邻微锥伴随棱线 (直观体现“整球是由无数小锥体拼积而成”) */}
          {neighborPyramidEdges.map(([fromPt, toPt], idx) => (
            <Segment3D
              key={`neighbor-pyr-${idx}`}
              from={toMathVec3(fromPt[0], fromPt[1], fromPt[2])}
              to={toMathVec3(toPt[0], toPt[1], toPt[2])}
              colorKey="textMuted"
              lineWidth={1.2}
              dashed
              dashSize={0.08}
              gapSize={0.06}
            />
          ))}

          {/* 5. 球面上留下的底座印记 (虚线微多边形) */}
          <lineLoop>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                args={[baseImprintPoints, 3]}
              />
            </bufferGeometry>
            <lineBasicMaterial
              color={MATH_COLORS.paramPrimary}
              linewidth={1.5}
              transparent
              opacity={0.5}
            />
          </lineLoop>

          {/* 6. 球心特征点与标注 */}
          <Point3D
            position={toMathVec3(0, 0, 0)}
            colorKey="textMuted"
            radius={0.05}
          />
          <FormulaLabel3D position={toMathVec3(0, -0.22, 0)} tex="O" />

          {/* 7. 抽出的代表性微棱锥 (位于正前方，正对主视角) */}
          {/* 微棱锥侧面：暖红半透明 */}
          <mesh geometry={pyramidSideGeo}>
            <meshStandardMaterial
              color={MATH_COLORS.paramPrimary}
              transparent
              opacity={0.45}
              roughness={0.3}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* 微棱锥微底面 ΔSi：亮金黄高亮 */}
          <mesh geometry={pyramidBaseGeo}>
            <meshStandardMaterial
              color={MATH_COLORS.paramSecondary}
              transparent
              opacity={0.88}
              roughness={0.2}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* 微棱锥 4 条主侧棱 */}
          {poppedVertices.map((v, i) => (
            <Segment3D
              key={`pyr-edge-${i}`}
              from={toMathVec3(0, 0, 0)}
              to={toMathVec3(v[0], v[1], v[2])}
              colorKey="paramPrimary"
              lineWidth={2.8}
            />
          ))}

          {/* 微棱锥底面多边形轮廓金边 */}
          <lineLoop>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                args={[microPyramidPoints, 3]}
              />
            </bufferGeometry>
            <lineBasicMaterial
              color={MATH_COLORS.paramSecondary}
              linewidth={2.8}
            />
          </lineLoop>

          {showAuxLines && (
            <>
              {/* 球心到微底面中心的高线 R (微小锥体的高 hi ≈ R) */}
              <Segment3D
                from={toMathVec3(0, 0, 0)}
                to={toMathVec3(
                  poppedCenter[0],
                  poppedCenter[1],
                  poppedCenter[2],
                )}
                colorKey="paramPrimary"
                lineWidth={3}
                dashed
                dashSize={0.1}
                gapSize={0.06}
              />

              {/* KaTeX 标注：底面 ΔSi 与高线 R (纯净数学标注，无冗余长句遮挡) */}
              <FormulaLabel3D
                position={toMathVec3(
                  poppedCenter[0] * 1.08,
                  poppedCenter[1] * 1.08 + 0.12,
                  poppedCenter[2] * 1.08,
                )}
                tex="\Delta S_i"
              />
              <FormulaLabel3D
                position={toMathVec3(
                  poppedCenter[0] * 0.45 + 0.12,
                  poppedCenter[1] * 0.45,
                  poppedCenter[2] * 0.45,
                )}
                tex="R"
              />
            </>
          )}
        </group>
      )}
    </group>
  );
}
