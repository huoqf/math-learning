import { useMemo } from "react";
import * as THREE from "three";
import { MATH_COLORS } from "@/theme";
import { PointLabel3D } from "@/components/Math3D/PointLabel3D";
import { CompoundLabel3D } from "@/components/Math3D/CompoundLabel3D";
import { Segment3D } from "@/components/Math3D/Segment3D";
import { Point3D } from "@/components/Math3D/Point3D";
import { RightTriangle3D } from "@/components/Math3D/RightTriangle3D";
import type { Vec3 } from "@/math3d/vector3";
import {
  calculateZuxuanSection,
  calculateSphereMicroPyramids,
} from "@/math3d/sphereDerivation";

interface SphereDerivationSceneProps {
  mode: "zuxuan" | "micropyramid";
  radius: number;
  heightCut: number;
  subdivisions: number;
  showAuxLines?: boolean;
  showSection?: boolean;
  fontScale?: number;
}

/** Three.js 场景空间局部点 (x向右, y向上, z向前) 转为数学 Vec3 (x向前, y向右, z向上) */
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
  fontScale = 1,
}: SphereDerivationSceneProps) {
  const R = Math.max(0.8, radius);
  const h = Math.max(0, Math.min(R, heightCut));

  // ─────────────────────────────────────────────────────────────
  // 模式一：祖暅原理双体等高切片对比
  // ─────────────────────────────────────────────────────────────
  const zuxuan = useMemo(() => calculateZuxuanSection(R, h), [R, h]);
  const offsetDistance = R * 1.55;
  const leftX = -offsetDistance; // 半球中心世界 X
  const rightX = offsetDistance; // 挖锥圆柱中心世界 X

  // 1. 半球几何体数据 (y >= 0)
  const hemisphereGeo = useMemo(() => {
    return new THREE.SphereGeometry(R, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2);
  }, [R]);

  // 半球底面圆
  const hemisphereBaseGeo = useMemo(() => {
    return new THREE.CircleGeometry(R, 64);
  }, [R]);

  // 半球在高度 h 处的截面实心圆几何体
  const hemisphereCutGeo = useMemo(() => {
    const rCut = zuxuan.hemisphereCutRadius;
    return new THREE.CircleGeometry(Math.max(0.001, rCut), 48);
  }, [zuxuan.hemisphereCutRadius]);

  // 2. 挖锥圆柱外壳与内部倒圆锥
  const cylinderGeo = useMemo(() => {
    return new THREE.CylinderGeometry(R, R, R, 48, 1, true);
  }, [R]);

  // 内部挖空的倒圆锥几何体 (顶点在原点，底面在顶端高 R 处，半径 R)
  const invertedConeGeo = useMemo(() => {
    return new THREE.ConeGeometry(R, R, 48, 1, true);
  }, [R]);

  // 挖锥圆柱在高度 h 处的截面圆环几何体
  const ringCutGeo = useMemo(() => {
    const innerR = Math.max(0.001, zuxuan.coneInnerRadius);
    const outerR = Math.max(innerR + 0.001, zuxuan.cylinderOuterRadius);
    return new THREE.RingGeometry(innerR, outerR, 48);
  }, [zuxuan.coneInnerRadius, zuxuan.cylinderOuterRadius]);

  // 内部倒圆锥局部线框母线 (局部坐标：从 [0,0,0] 到 [topX, R, topZ])
  const coneGeneratrixLines = useMemo(() => {
    const lines: [number, number, number][][] = [];
    const count = 16;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const topX = R * Math.cos(angle);
      const topZ = R * Math.sin(angle);
      lines.push([
        [0, 0, 0],
        [topX, R, topZ],
      ]);
    }
    return lines;
  }, [R]);

  // ─────────────────────────────────────────────────────────────
  // 模式二：球面微小棱锥分割累加
  // ─────────────────────────────────────────────────────────────
  const microData = useMemo(
    () => calculateSphereMicroPyramids(R, subdivisions),
    [R, subdivisions],
  );

  const sample = microData.samplePyramid;
  const sampleBaseCenter = sample.center;
  // 采样小棱锥沿法向轻微抽出浮起 (形成抽离拆解教学视觉)
  const popRatio = 0.12;
  const poppedCenter: [number, number, number] = [
    sampleBaseCenter[0] * (1 + popRatio),
    sampleBaseCenter[1] * (1 + popRatio),
    sampleBaseCenter[2] * (1 + popRatio),
  ];

  const poppedVertices = useMemo(() => {
    return sample.baseVertices.map(
      (v) =>
        [
          v[0] * (1 + popRatio),
          v[1] * (1 + popRatio),
          v[2] * (1 + popRatio),
        ] as [number, number, number],
    );
  }, [sample.baseVertices, popRatio]);

  const pyramidFaceGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const apex = [0, 0, 0];
    const [v0, v1, v2, v3] = poppedVertices;

    const positions = new Float32Array([
      ...apex,
      ...v0,
      ...v1,
      ...apex,
      ...v1,
      ...v2,
      ...apex,
      ...v2,
      ...v3,
      ...apex,
      ...v3,
      ...v0,
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

  // 底面圆与圆环线数据 (局部坐标)
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

  const microPyramidPoints = useMemo(() => {
    return new Float32Array(poppedVertices.flat());
  }, [poppedVertices]);

  return (
    <group>
      {mode === "zuxuan" ? (
        <group>
          {/* ════════════════ 左侧：半球 (局部中心为 0) ════════════════ */}
          <group position={[leftX, 0, 0]}>
            {/* 半球面半透明外壳 */}
            <mesh geometry={hemisphereGeo}>
              <meshStandardMaterial
                color={MATH_COLORS.primary}
                transparent
                opacity={0.32}
                roughness={0.25}
                metalness={0.1}
                side={THREE.DoubleSide}
              />
            </mesh>

            {/* 半球底面圆 (y=0) */}
            <mesh
              geometry={hemisphereBaseGeo}
              rotation={[-Math.PI / 2, 0, 0]}
              position={[0, 0, 0]}
            >
              <meshBasicMaterial
                color={MATH_COLORS.paramPrimary}
                transparent
                opacity={0.12}
                side={THREE.DoubleSide}
              />
            </mesh>

            {/* 底面圆轮廓线 */}
            <lineLoop>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  args={[hemisphereBasePoints, 3]}
                />
              </bufferGeometry>
              <lineBasicMaterial
                color={MATH_COLORS.paramPrimary}
                linewidth={1.5}
              />
            </lineLoop>

            {/* 高度 h 处的半球截面实心圆 */}
            {showSection && h < R && (
              <group position={[0, h, 0]}>
                <mesh
                  geometry={hemisphereCutGeo}
                  rotation={[-Math.PI / 2, 0, 0]}
                >
                  <meshStandardMaterial
                    color={MATH_COLORS.accent}
                    transparent
                    opacity={0.75}
                    side={THREE.DoubleSide}
                  />
                </mesh>
                <lineLoop>
                  <bufferGeometry>
                    <bufferAttribute
                      attach="attributes-position"
                      args={[hemisphereCutPoints, 3]}
                    />
                  </bufferGeometry>
                  <lineBasicMaterial
                    color={MATH_COLORS.highlight}
                    linewidth={2}
                  />
                </lineLoop>
              </group>
            )}

            {/* 半球辅助高线与勾股直角三角形 (局部坐标全部以 0 为原点) */}
            {showAuxLines && (
              <>
                {/* 勾股直角三角形 Rt△O₁O'₁P₁ */}
                {h > 0.15 && zuxuan.hemisphereCutRadius > 0.15 ? (
                  <RightTriangle3D
                    vertexA={toMathVec3(0, 0, 0)}
                    rightVertex={toMathVec3(0, h, 0)}
                    vertexB={toMathVec3(zuxuan.hemisphereCutRadius, h, 0)}
                    colorKeyA="paramSecondary"
                    colorKeyB="paramTertiary"
                    colorKeyHyp="paramPrimary"
                    labelA="h"
                    labelB="r_1"
                    labelHyp="R"
                    rightAngleRadius={Math.min(
                      0.2,
                      h * 0.35,
                      zuxuan.hemisphereCutRadius * 0.35,
                    )}
                    fillMesh={true}
                    opacity={0.18}
                  />
                ) : (
                  <>
                    <Segment3D
                      from={toMathVec3(0, 0, 0)}
                      to={toMathVec3(0, h, 0)}
                      colorKey="paramSecondary"
                      lineWidth={3}
                    />
                    <Segment3D
                      from={toMathVec3(0, h, 0)}
                      to={toMathVec3(zuxuan.hemisphereCutRadius, h, 0)}
                      colorKey="paramTertiary"
                      lineWidth={3}
                    />
                    <Segment3D
                      from={toMathVec3(0, 0, 0)}
                      to={toMathVec3(zuxuan.hemisphereCutRadius, h, 0)}
                      colorKey="paramPrimary"
                      lineWidth={3.5}
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

                {/* 点标签 */}
                <PointLabel3D
                  position={toMathVec3(0, -0.2, 0)}
                  text="O_1"
                  colorKey="textMuted"
                  fontSize={0.21 * fontScale}
                />
                <PointLabel3D
                  position={toMathVec3(-0.15, h + 0.1, 0)}
                  text="O'_1"
                  colorKey="paramSecondary"
                  fontSize={0.21 * fontScale}
                />
                <PointLabel3D
                  position={toMathVec3(
                    zuxuan.hemisphereCutRadius + 0.15,
                    h + 0.1,
                    0,
                  )}
                  text="P_1"
                  colorKey="paramTertiary"
                  fontSize={0.21 * fontScale}
                />
              </>
            )}

            {/* 顶部标题指示 */}
            <CompoundLabel3D
              position={toMathVec3(0, R + 0.35, 0)}
              base="半球"
              subscript="V₁"
              colorKey="primary"
              fontSize={0.26 * fontScale}
            />
          </group>

          {/* ════════════════ 右侧：挖锥圆柱 (局部中心为 0) ════════════════ */}
          <group position={[rightX, 0, 0]}>
            {/* 外圆柱侧面半透明 */}
            <mesh geometry={cylinderGeo} position={[0, R / 2, 0]}>
              <meshStandardMaterial
                color={MATH_COLORS.secondary}
                transparent
                opacity={0.22}
                roughness={0.3}
                side={THREE.DoubleSide}
              />
            </mesh>

            {/* 内部挖空的倒圆锥半透明曲面 (顶点在原点，顶底面在上) */}
            <mesh
              geometry={invertedConeGeo}
              position={[0, R / 2, 0]}
              rotation={[Math.PI, 0, 0]}
            >
              <meshStandardMaterial
                color={MATH_COLORS.paramTertiary}
                transparent
                opacity={0.16}
                roughness={0.35}
                side={THREE.DoubleSide}
              />
            </mesh>

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
              <lineBasicMaterial
                color={MATH_COLORS.secondary}
                linewidth={1.5}
              />
            </lineLoop>

            {/* 倒圆锥特征母线虚线 (局部坐标由原点到顶面圆周) */}
            {coneGeneratrixLines.map(([start, end], idx) => (
              <Segment3D
                key={`cone-line-${idx}`}
                from={toMathVec3(start[0], start[1], start[2])}
                to={toMathVec3(end[0], end[1], end[2])}
                colorKey="paramTertiary"
                lineWidth={1.2}
                dashed
                dashSize={0.08}
                gapSize={0.05}
              />
            ))}

            {/* 高度 h 处的圆环截面 */}
            {showSection && h < R && (
              <group position={[0, h, 0]}>
                <mesh geometry={ringCutGeo} rotation={[-Math.PI / 2, 0, 0]}>
                  <meshStandardMaterial
                    color={MATH_COLORS.accent}
                    transparent
                    opacity={0.75}
                    side={THREE.DoubleSide}
                  />
                </mesh>
                <lineLoop>
                  <bufferGeometry>
                    <bufferAttribute
                      attach="attributes-position"
                      args={[hemisphereBasePoints, 3]}
                    />
                  </bufferGeometry>
                  <lineBasicMaterial
                    color={MATH_COLORS.highlight}
                    linewidth={2}
                  />
                </lineLoop>
                {zuxuan.coneInnerRadius > 0.05 && (
                  <lineLoop>
                    <bufferGeometry>
                      <bufferAttribute
                        attach="attributes-position"
                        args={[ringInnerPoints, 3]}
                      />
                    </bufferGeometry>
                    <lineBasicMaterial
                      color={MATH_COLORS.paramSecondary}
                      linewidth={2}
                    />
                  </lineLoop>
                )}
              </group>
            )}

            {/* 辅助线段：外半径 R 与内半径 h (局部坐标) */}
            {showAuxLines && (
              <>
                <Segment3D
                  from={toMathVec3(0, 0, 0)}
                  to={toMathVec3(0, R, 0)}
                  colorKey="textMuted"
                  lineWidth={1.5}
                  dashed
                />
                <Segment3D
                  from={toMathVec3(0, h, 0)}
                  to={toMathVec3(R, h, 0)}
                  colorKey="paramPrimary"
                  lineWidth={3}
                />
                <Segment3D
                  from={toMathVec3(0, h, 0)}
                  to={toMathVec3(-zuxuan.coneInnerRadius, h, 0)}
                  colorKey="paramSecondary"
                  lineWidth={3}
                />

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

                <PointLabel3D
                  position={toMathVec3(0, -0.2, 0)}
                  text="O_2"
                  colorKey="textMuted"
                  fontSize={0.21 * fontScale}
                />
                <PointLabel3D
                  position={toMathVec3(0.15, h + 0.1, 0)}
                  text="O'_2"
                  colorKey="paramSecondary"
                  fontSize={0.21 * fontScale}
                />
                <PointLabel3D
                  position={toMathVec3(R + 0.15, h + 0.1, 0)}
                  text="Q_1"
                  colorKey="paramPrimary"
                  fontSize={0.21 * fontScale}
                />
                <PointLabel3D
                  position={toMathVec3(
                    -zuxuan.coneInnerRadius - 0.15,
                    h + 0.1,
                    0,
                  )}
                  text="Q_2"
                  colorKey="paramSecondary"
                  fontSize={0.21 * fontScale}
                />
              </>
            )}

            <CompoundLabel3D
              position={toMathVec3(0, R + 0.35, 0)}
              base="挖锥柱体"
              subscript="V₂"
              colorKey="secondary"
              fontSize={0.26 * fontScale}
            />
          </group>

          {/* ════════════════ 跨体等高连线（全局世界坐标） ════════════════ */}
          {showAuxLines && (
            <Segment3D
              from={toMathVec3(leftX + zuxuan.hemisphereCutRadius, h, 0)}
              to={toMathVec3(rightX - zuxuan.coneInnerRadius, h, 0)}
              colorKey="paramSecondary"
              lineWidth={1.5}
              dashed
              dashSize={0.15}
              gapSize={0.1}
            />
          )}
        </group>
      ) : (
        // ─────────────────────────────────────────────────────────────
        // 模式二：球面微小棱锥分割累加场景 (以平代曲、以锥积球)
        // ─────────────────────────────────────────────────────────────
        <group position={[0, 0, 0]}>
          <mesh>
            <sphereGeometry args={[R, subdivisions * 2, subdivisions]} />
            <meshStandardMaterial
              color={MATH_COLORS.primary}
              transparent
              opacity={0.18}
              wireframe={true}
              roughness={0.4}
            />
          </mesh>

          <Point3D
            position={toMathVec3(0, 0, 0)}
            colorKey="textMuted"
            radius={0.05}
          />
          <PointLabel3D
            position={toMathVec3(0, -0.25, 0)}
            text="O"
            colorKey="textMuted"
            fontSize={0.22 * fontScale}
          />

          {/* 抽出的代表性微棱锥 */}
          <mesh geometry={pyramidFaceGeo}>
            <meshStandardMaterial
              color={MATH_COLORS.highlight}
              transparent
              opacity={0.85}
              roughness={0.2}
              side={THREE.DoubleSide}
            />
          </mesh>

          {poppedVertices.map((v, i) => (
            <Segment3D
              key={`pyr-edge-${i}`}
              from={toMathVec3(0, 0, 0)}
              to={toMathVec3(v[0], v[1], v[2])}
              colorKey="paramPrimary"
              lineWidth={2.5}
            />
          ))}

          {/* 微棱锥底面多边形轮廓 */}
          <lineLoop>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                args={[microPyramidPoints, 3]}
              />
            </bufferGeometry>
            <lineBasicMaterial
              color={MATH_COLORS.paramPrimary}
              linewidth={2.5}
            />
          </lineLoop>

          {showAuxLines && (
            <>
              {/* 球心到微底面中心的高线 R */}
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
              <PointLabel3D
                position={toMathVec3(
                  poppedCenter[0] * 1.15,
                  poppedCenter[1] * 1.15,
                  poppedCenter[2] * 1.15,
                )}
                text="ΔS_i"
                colorKey="highlight"
                fontSize={0.22 * fontScale}
              />
              <CompoundLabel3D
                position={toMathVec3(
                  poppedCenter[0] * 0.5,
                  poppedCenter[1] * 0.5,
                  poppedCenter[2] * 0.5,
                )}
                base="高"
                subscript="R"
                colorKey="paramPrimary"
                fontSize={0.22 * fontScale}
              />
            </>
          )}
        </group>
      )}
    </group>
  );
}
