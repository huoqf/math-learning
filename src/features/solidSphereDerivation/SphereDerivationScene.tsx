import { useMemo } from "react";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import { FormulaLabel3D } from "@/components/Math3D/FormulaLabel3D";
import { Segment3D } from "@/components/Math3D/Segment3D";
import { Point3D } from "@/components/Math3D/Point3D";
import { RightTriangle3D } from "@/components/Math3D/RightTriangle3D";
import type { Vec3 } from "@/math3d/vector3";
import {
  calculateZuxuanSection,
  calculateSphereMicroPyramids,
} from "@/math3d/sphereDerivation";
import { mathToThree } from "@/math3d/coordinateConvention";
import {
  pickColor,
  pickColorKey,
  type SphereDerivationMode,
} from "./scenePalette";

/** 模式一的两个探究阶段：先证「等高截面恒等」，再算「柱锥体积相减」 */
export type ZuxuanStep = "slice" | "subtract";

interface SphereDerivationSceneProps {
  mode: SphereDerivationMode;
  radius: number;
  heightCut: number;
  subdivisions: number;
  showAuxLines?: boolean;
  showSection?: boolean;
  /** 模式一的探究阶段；`subtract` 档隐藏「截面比较」装置，转为「体积相减」视图 */
  zuxuanStep?: ZuxuanStep;
  /** 模式二微棱锥抽离比例 (0: 原位嵌于球内, 1: 完全抽出特写) */
  popRatio?: number;
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
  zuxuanStep = "slice",
  popRatio = 0.8,
}: SphereDerivationSceneProps) {
  const R = Math.max(0.8, radius);
  const h = Math.max(0, Math.min(R, heightCut));

  // 模式一第二档：不再比较截面，转为「挖锥圆柱 = 圆柱 − 圆锥」的实体相减视图。
  // 此时与 h 相关的截面/量线一律收起，避免留下一条停在某个冻结高度上的无意义标注。
  const isSubtract = mode === "zuxuan" && zuxuanStep === "subtract";

  // 图例与画布的唯一配色来源（见 ./scenePalette.ts）。
  // muted / radius 两键在两张模式表里都存在，故可直接由 mode 取键；其余按分支取字面量。
  const mutedKey = pickColorKey(mode, "muted");
  const radiusKey = pickColorKey(mode, "radius");

  // ─────────────────────────────────────────────────────────────
  // 模式一：祖暅原理双体等高切片对比 (半球 vs 挖锥圆柱)
  // ─────────────────────────────────────────────────────────────
  const zuxuan = useMemo(() => calculateZuxuanSection(R, h), [R, h]);
  // 与右屏「h ≤ 10⁻³ 时锥尖/截面退化」的警示同源的退化判据：
  // h = 0 时 O'₁ 与 O₁ 重合，勾股特征三角形是零面积退化的，不应再渲染直角方框。
  const isDegenerateBase = h <= 1e-3;
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

  /**
   * 球面微锥分割数据：**唯一事实源**（纯数学层）。
   *
   * 中屏不再自建抽样。历史缺陷：中屏按 φ≈50°/θ≈35° 自算一格、数学层按 ⌊N/3⌋,⌊N/4⌋
   * 另算一格 ⇒ 中屏画出的那个微锥与右屏报的"采样微锥"不是同一个网格单元
   * （底面面积相差 8.76% ~ 20.88%），而门禁与真渲染契约测试全程都看不出来。
   * 现在采样单元的选取规则、4 个球面顶点、真实几何高全部由本层提供。
   */
  const micro = useMemo(
    () => calculateSphereMicroPyramids(R, subdivisions),
    [R, subdivisions],
  );

  /** 经纬网格段数：与数学层同一套网格，中屏线框据此渲染（也顺带跟随数学层的密度上限） */
  const grid = useMemo(
    () => ({
      latSteps: micro.samplePyramid.cell.latSteps,
      lonSteps: micro.samplePyramid.cell.lonSteps,
    }),
    [micro],
  );

  /**
   * 采样单元的 4 个球面顶点（three 局部坐标）。
   * 数学层给出数学坐标，此处只做**渲染前最后一步**约定换算（见 coordinateConvention）。
   */
  const sampleVertices = useMemo(
    () =>
      micro.samplePyramid.cell.vertices.map((v) =>
        mathToThree({ x: v[0], y: v[1], z: v[2] }),
      ) as [
        [number, number, number],
        [number, number, number],
        [number, number, number],
        [number, number, number],
      ],
    [micro],
  );

  /**
   * 微棱锥「抽离」= 沿底面法向**整体平移**（锥顶与底面同步位移）。
   *
   * 历史缺陷：原先实现为「各顶点径向 ×1.18」，锥顶 O 不动、底面外扩，
   * 于是锥体被拉高到 1.17R，画面却把这条高线标注为 R ——
   * 而同帧「O→球面」的邻锥棱线恰为 R，学生对尺即见矛盾。
   * 平移式抽离保持抽出体与真实微锥**全等**，其高恒等于球心到弦面的距离，
   * 即数学层给出的 `samplePyramid.height`（密度 n=16 时约 0.992R，n 增大时趋于 R），
   * 与右屏「采样微锥高（随细分加密趋于 R）」显示的读数逐位一致。
   */
  const safePopRatio = Math.max(0, Math.min(1, popRatio));
  const popDistance = R * 0.45 * safePopRatio;
  /** 采样单元质心（three 局部坐标，由数学层质心换算而来） */
  const sampleCenter = useMemo(
    () =>
      mathToThree({
        x: micro.samplePyramid.center[0],
        y: micro.samplePyramid.center[1],
        z: micro.samplePyramid.center[2],
      }),
    [micro],
  );
  const popNormal = useMemo<[number, number, number]>(() => {
    const len =
      Math.hypot(sampleCenter[0], sampleCenter[1], sampleCenter[2]) || 1;
    return [
      sampleCenter[0] / len,
      sampleCenter[1] / len,
      sampleCenter[2] / len,
    ];
  }, [sampleCenter]);
  /** 抽离位移向量（three 局部坐标） */
  const popOffset = useMemo<[number, number, number]>(
    () => [
      popNormal[0] * popDistance,
      popNormal[1] * popDistance,
      popNormal[2] * popDistance,
    ],
    [popNormal, popDistance],
  );
  /** 抽离后的锥顶 (原为球心 O，随体平移后与 O 分离 ⇒ 抽出的锥体完整可辨认) */
  const poppedApex = popOffset;
  const poppedCenter = useMemo<[number, number, number]>(
    () => [
      sampleCenter[0] + popOffset[0],
      sampleCenter[1] + popOffset[1],
      sampleCenter[2] + popOffset[2],
    ],
    [sampleCenter, popOffset],
  );
  const poppedVertices = useMemo(
    () =>
      sampleVertices.map(
        (v) =>
          [v[0] + popOffset[0], v[1] + popOffset[1], v[2] + popOffset[2]] as [
            number,
            number,
            number,
          ],
      ),
    [sampleVertices, popOffset],
  );

  /**
   * 高线标注自适应侧向切向偏移：沿底面梯形下底边方向（严格垂直于高线轴），
   * 确保高线标注永远位于微锥侧翼，与正上方的底面标注 ΔSᵢ 严格正交分置，
   * 彻底根除抽离比例 λ≈0.8 时的屏幕空间重叠（N4-b）。
   */
  const labelSideOffset = useMemo<[number, number, number]>(() => {
    const [v0, v1] = sampleVertices;
    const dx = v1[0] - v0[0];
    const dy = v1[1] - v0[1];
    const dz = v1[2] - v0[2];
    const len = Math.hypot(dx, dy, dz) || 1;
    return [(dx / len) * 0.22, (dy / len) * 0.22, (dz / len) * 0.22];
  }, [sampleVertices]);

  // 抽出的微棱锥几何表面 (拆分为 4 个侧面三角形与 1 个底面四边形，实现底侧分色)
  const pyramidSideGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const apex = [...poppedApex];
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
  }, [poppedVertices, poppedApex]);

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

  // 球面底座印记线框 (抽出前原位的那一格网格，顶点直接取自数学层采样单元)
  const baseImprintPoints = useMemo(() => {
    return new Float32Array(sampleVertices.flat());
  }, [sampleVertices]);

  /**
   * 原位骨架：球心到该网格单元 4 个顶点的侧棱。
   * 既指向「抽走的那一个微锥原来长在这里」，又是与相邻微锥**共用**的棱
   * （网格顶点按定义被 4 个单元共享）⇒ 天然体现「整球由无数微锥拼积而成」，
   * 且严格网格对齐、随密度 n 联动。
   * 历史实现用 42°/58°/74° 等固定角度的 4 条任意半径，与网格无关、也不随 n 变化，属装饰线。
   */
  const imprintEdges = useMemo(
    () =>
      sampleVertices.map(
        (v) =>
          [[0, 0, 0], v] as [
            [number, number, number],
            [number, number, number],
          ],
      ),
    [sampleVertices],
  );

  // 球体主特征大圆线条缓存 (赤道大圆、竖直子午线大圆)
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
              color={pickColor("zuxuan", "muted")}
              transparent
              opacity={0.06}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* ════════════════ 1. 公共水平半透明截面切板 (Cut Plane) ════════════════ */}
          {showSection && h < R && !isSubtract && (
            <group position={[0, h, 0]}>
              {/* 大长方形半透明切面玻璃板 */}
              <mesh geometry={cutPlaneGeo} rotation={[-Math.PI / 2, 0, 0]}>
                <meshStandardMaterial
                  color={pickColor("zuxuan", "sectionPlane")}
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
                  color={pickColor("zuxuan", "sectionPlane")}
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

          {/* 第二档：截面比较装置已全部收起，用一条等式交代本档在算什么 */}
          {isSubtract && (
            <Html
              position={[0, R + 0.35, cutPlaneDepth / 2 - 0.15]}
              center
              distanceFactor={10}
            >
              <div className="px-3 py-1 rounded-full text-xs font-semibold shadow-md backdrop-blur-md border border-red-300/70 bg-white/95 text-red-700 dark:bg-neutral-900/90 dark:text-red-400 dark:border-red-800 whitespace-nowrap select-none">
                {"V"}
                <sub>挖</sub>
                {" = V"}
                <sub>柱</sub>
                {" − V"}
                <sub>锥</sub>
                {" = "}
                {"2/3·πR³ = V"}
                <sub>半球</sub>
              </div>
            </Html>
          )}

          {/* ════════════════ 2. 左侧：半球 ════════════════ */}
          <group position={[leftX, 0, 0]}>
            {/* 半球面半透明外壳 */}
            <mesh geometry={hemisphereGeo}>
              <meshStandardMaterial
                color={pickColor("zuxuan", "hemisphereBody")}
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
                color={pickColor("zuxuan", "hemisphereBody")}
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
              <lineBasicMaterial
                color={pickColor("zuxuan", "hemisphereBody")}
                linewidth={2}
              />
            </lineLoop>

            {/* 高度 h 处的半球截面实心圆盘 */}
            {showSection && h < R && !isSubtract && (
              <group position={[0, h, 0]}>
                <mesh
                  geometry={hemisphereCutGeo}
                  rotation={[-Math.PI / 2, 0, 0]}
                >
                  <meshStandardMaterial
                    color={pickColor("zuxuan", "equalSection")}
                    transparent
                    opacity={0.65}
                    roughness={0.2}
                    side={THREE.DoubleSide}
                  />
                </mesh>
                {/* 截面圆周高亮轮廓 */}
                <lineLoop>
                  <bufferGeometry>
                    <bufferAttribute
                      attach="attributes-position"
                      args={[hemisphereCutPoints, 3]}
                    />
                  </bufferGeometry>
                  <lineBasicMaterial
                    color={pickColor("zuxuan", "equalSectionOutline")}
                    linewidth={2.5}
                  />
                </lineLoop>
              </group>
            )}

            {/* 几何辅助线系统 */}
            {showAuxLines && !isSubtract && (
              <>
                {/* 球心垂直轴线 O₁ -> O'₁ */}
                <Segment3D
                  from={toMathVec3(0, 0, 0)}
                  to={toMathVec3(0, R, 0)}
                  colorKey={mutedKey}
                  lineWidth={1.5}
                  dashed
                />

                {/* 勾股定理特征三角形 O₁-O'₁-P₁ (直角顶点在 O'₁)。
                    h = 0 时 O'₁ 与 O₁ 重合、三角形零面积退化，与右屏同源的 h ≤ 10⁻³ 判据一并收起 */}
                {!isDegenerateBase && (
                  <RightTriangle3D
                    rightVertex={toMathVec3(0, h, 0)}
                    vertexA={toMathVec3(0, 0, 0)}
                    vertexB={toMathVec3(zuxuan.hemisphereCutRadius, h, 0)}
                    fillMesh
                    opacity={0.18}
                    rightAngleRadius={0.14}
                    colorKeyA={pickColorKey("zuxuan", "height")}
                    colorKeyB={pickColorKey("zuxuan", "cutRadius")}
                    colorKeyHyp={radiusKey}
                    lineWidth={3}
                  />
                )}

                {/* 特征点 */}
                <Point3D
                  position={toMathVec3(0, 0, 0)}
                  colorKey={mutedKey}
                  radius={0.045}
                />
                <Point3D
                  position={toMathVec3(0, h, 0)}
                  colorKey={pickColorKey("zuxuan", "height")}
                  radius={0.045}
                />
                <Point3D
                  position={toMathVec3(zuxuan.hemisphereCutRadius, h, 0)}
                  colorKey={pickColorKey("zuxuan", "cutRadius")}
                  radius={0.045}
                />

                {/* KaTeX 纯净数学标注 (显式清零组件内置偏移，使下列坐标即所见位置) */}
                <FormulaLabel3D
                  position={toMathVec3(0.04, -0.3, 0)}
                  offset={[0, 0, 0]}
                  tex="O_1"
                />
                <FormulaLabel3D
                  position={toMathVec3(-0.2, h + 0.12, 0)}
                  offset={[0, 0, 0]}
                  tex="O'_1"
                />
                <FormulaLabel3D
                  position={toMathVec3(
                    zuxuan.hemisphereCutRadius + 0.2,
                    h + 0.12,
                    0,
                  )}
                  offset={[0, 0, 0]}
                  tex="P_1"
                />
              </>
            )}

            {/* 几何体顶部中文胶囊徽标 */}
            <Html position={[0, R + 0.35, 0]} center distanceFactor={10}>
              <div className="px-3 py-1 rounded-full text-xs font-semibold shadow-md backdrop-blur-md border border-blue-300/70 bg-white/95 text-blue-700 dark:bg-neutral-900/90 dark:text-blue-400 dark:border-neutral-700 whitespace-nowrap select-none">
                {"半球 (V"}
                <sub>半球</sub>
                {")"}
              </div>
            </Html>
          </group>

          {/* ════════════════ 3. 右侧：挖锥圆柱 ════════════════ */}
          <group position={[rightX, 0, 0]}>
            {/* 外圆柱侧面半透明 */}
            <mesh geometry={cylinderGeo} position={[0, R / 2, 0]}>
              <meshStandardMaterial
                color={pickColor("zuxuan", "cylinderBody")}
                transparent
                opacity={0.18}
                roughness={0.3}
                side={THREE.DoubleSide}
                depthWrite={false}
              />
            </mesh>

            {/* 内部挖空的倒圆锥面：
                第一档（截面比较）淡雅半透明，只交代「内部被挖空」这一构造；
                第二档（体积相减）换警示色并显著提升不透明度，让「要扣掉的那一块」成为视觉主角。 */}
            <mesh
              geometry={invertedConeGeo}
              position={[0, R / 2, 0]}
              rotation={[Math.PI, 0, 0]}
            >
              <meshStandardMaterial
                color={
                  isSubtract
                    ? pickColor("zuxuan", "removedCone")
                    : pickColor("zuxuan", "muted")
                }
                transparent
                opacity={isSubtract ? 0.42 : 0.12}
                roughness={0.4}
                side={THREE.DoubleSide}
                depthWrite={false}
              />
            </mesh>

            {/* 倒圆锥轴截面两条主轮廓母线 (教科书清爽素描线) */}
            <Segment3D
              from={toMathVec3(0, 0, 0)}
              to={toMathVec3(-R, R, 0)}
              colorKey={mutedKey}
              lineWidth={1.6}
            />
            <Segment3D
              from={toMathVec3(0, 0, 0)}
              to={toMathVec3(R, R, 0)}
              colorKey={mutedKey}
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
                color={pickColor("zuxuan", "cylinderBody")}
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
                color={pickColor("zuxuan", "cylinderBody")}
                linewidth={2}
              />
            </lineLoop>

            {/* 高度 h 处的挖锥圆柱截面圆环 (等面积环形实体) */}
            {showSection && h < R && !isSubtract && (
              <group position={[0, h, 0]}>
                <mesh geometry={ringCutGeo} rotation={[-Math.PI / 2, 0, 0]}>
                  <meshStandardMaterial
                    color={pickColor("zuxuan", "equalSection")}
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
                    color={pickColor("zuxuan", "equalSectionOutline")}
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
                      color={pickColor("zuxuan", "equalSectionOutline")}
                      linewidth={2.5}
                    />
                  </lineLoop>
                )}
              </group>
            )}

            {/* 辅助线段：外半径 R 与内半径 h (由等腰直角相似得 r_内 = h) */}
            {showAuxLines && !isSubtract && (
              <>
                {/* 垂直轴线 */}
                <Segment3D
                  from={toMathVec3(0, 0, 0)}
                  to={toMathVec3(0, R, 0)}
                  colorKey={mutedKey}
                  lineWidth={1.5}
                  dashed
                />
                {/* 截面中心 O'₂ 到外轮廓 Q₁ (外半径 R) */}
                <Segment3D
                  from={toMathVec3(0, h, 0)}
                  to={toMathVec3(R, h, 0)}
                  colorKey={radiusKey}
                  lineWidth={3}
                />
                {/* 截面中心 O'₂ 到倒圆锥内轮廓 Q₂ (内半径 h) */}
                <Segment3D
                  from={toMathVec3(0, h, 0)}
                  to={toMathVec3(-zuxuan.coneInnerRadius, h, 0)}
                  colorKey={pickColorKey("zuxuan", "height")}
                  lineWidth={3}
                />
                {/* 倒圆锥截面母线 O₂ -> Q₂ (等腰直角斜边，长 √2·h)
                    中性轮廓线：它既不是半球截面半径 r_半，也不是高度 h。
                    历史缺陷：此处曾用 cutRadius(paramTertiary，图例标注为 r_半)，
                    学生按图例会把这条绿斜线读成 r_半 = √(R²−h²)，而它实为 √2·h。 */}
                {h > 0.05 && (
                  <Segment3D
                    from={toMathVec3(0, 0, 0)}
                    to={toMathVec3(-zuxuan.coneInnerRadius, h, 0)}
                    colorKey={mutedKey}
                    lineWidth={2.2}
                  />
                )}

                <Point3D
                  position={toMathVec3(0, 0, 0)}
                  colorKey={mutedKey}
                  radius={0.045}
                />
                <Point3D
                  position={toMathVec3(0, h, 0)}
                  colorKey={pickColorKey("zuxuan", "height")}
                  radius={0.045}
                />
                <Point3D
                  position={toMathVec3(R, h, 0)}
                  colorKey={radiusKey}
                  radius={0.045}
                />
                <Point3D
                  position={toMathVec3(-zuxuan.coneInnerRadius, h, 0)}
                  colorKey={pickColorKey("zuxuan", "height")}
                  radius={0.045}
                />

                {/* KaTeX 纯净数学标注 */}
                <FormulaLabel3D
                  position={toMathVec3(0.04, -0.3, 0)}
                  offset={[0, 0, 0]}
                  tex="O_2"
                />
                <FormulaLabel3D
                  position={toMathVec3(0.2, h + 0.12, 0)}
                  offset={[0, 0, 0]}
                  tex="O'_2"
                />
                <FormulaLabel3D
                  position={toMathVec3(R + 0.2, h + 0.12, 0)}
                  offset={[0, 0, 0]}
                  tex="Q_1"
                />
                <FormulaLabel3D
                  position={toMathVec3(
                    -zuxuan.coneInnerRadius - 0.2,
                    h + 0.12,
                    0,
                  )}
                  offset={[0, 0, 0]}
                  tex="Q_2"
                />
              </>
            )}

            {/* 几何体顶部中文胶囊徽标 */}
            <Html position={[0, R + 0.35, 0]} center distanceFactor={10}>
              <div className="px-3 py-1 rounded-full text-xs font-semibold shadow-md backdrop-blur-md border border-amber-300/70 bg-white/95 text-amber-700 dark:bg-neutral-900/90 dark:text-amber-400 dark:border-neutral-700 whitespace-nowrap select-none">
                {"挖锥圆柱 (V"}
                <sub>挖</sub>
                {" = V"}
                <sub>柱</sub>
                {" − V"}
                <sub>锥</sub>
                {")"}
              </div>
            </Html>
          </group>

          {/* ════════════════ 4. 跨体等高连线 (严格水平，体现高度相等) ════════════════ */}
          {showAuxLines && !isSubtract && (
            <Segment3D
              from={toMathVec3(leftX + zuxuan.hemisphereCutRadius, h, 0)}
              to={toMathVec3(rightX - zuxuan.coneInnerRadius, h, 0)}
              colorKey={pickColorKey("zuxuan", "height")}
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
              color={pickColor("micropyramid", "radius")}
              transparent
              opacity={0.14}
              roughness={0.2}
              metalness={0.05}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>

          {/* 2. 球体经纬线规整细分网格 (与采样单元同一套网格，随密度 n 动态变化) */}
          <mesh>
            <sphereGeometry args={[R, grid.lonSteps, grid.latSteps]} />
            <meshBasicMaterial
              color={pickColor("micropyramid", "radius")}
              transparent
              opacity={0.28}
              wireframe={true}
            />
          </mesh>

          {/* 3. 经典高中立体几何两大基准主轮廓大圆 */}
          {/* 水平赤道大圆 */}
          <lineLoop>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                args={[equatorCirclePoints, 3]}
              />
            </bufferGeometry>
            <lineBasicMaterial
              color={pickColor("micropyramid", "radius")}
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
              color={pickColor("micropyramid", "radius")}
              linewidth={1.8}
              transparent
              opacity={0.4}
            />
          </lineLoop>

          {/* 4. 原位骨架：球心到该网格单元 4 个顶点的侧棱 (与相邻微锥共用) */}
          {showAuxLines &&
            imprintEdges.map(([fromPt, toPt], idx) => (
              <Segment3D
                key={`imprint-edge-${idx}`}
                from={toMathVec3(fromPt[0], fromPt[1], fromPt[2])}
                to={toMathVec3(toPt[0], toPt[1], toPt[2])}
                colorKey={mutedKey}
                lineWidth={1.2}
                dashed
                dashSize={0.08}
                gapSize={0.06}
              />
            ))}

          {/* 5. 球面上留下的底座印记 (抽出前原位的那一格网格) */}
          <lineLoop>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                args={[baseImprintPoints, 3]}
              />
            </bufferGeometry>
            <lineBasicMaterial
              color={pickColor("micropyramid", "microBase")}
              linewidth={1.5}
              transparent
              opacity={0.5}
            />
          </lineLoop>

          {/* 6. 球心特征点与标注 */}
          <Point3D
            position={toMathVec3(0, 0, 0)}
            colorKey={mutedKey}
            radius={0.05}
          />
          <FormulaLabel3D
            position={toMathVec3(0.04, -0.3, 0)}
            offset={[0, 0, 0]}
            tex="O"
          />

          {/* 7. 抽出的代表性微棱锥 (位于斜前方，正对主视角) */}
          {/* 微棱锥侧面：与球半径同族的红 */}
          <mesh geometry={pyramidSideGeo}>
            <meshStandardMaterial
              color={pickColor("micropyramid", "radius")}
              transparent
              opacity={0.45}
              roughness={0.3}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* 微棱锥微底面 ΔSᵢ：琥珀金高亮 */}
          <mesh geometry={pyramidBaseGeo}>
            <meshStandardMaterial
              color={pickColor("micropyramid", "microBase")}
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
              from={toMathVec3(poppedApex[0], poppedApex[1], poppedApex[2])}
              to={toMathVec3(v[0], v[1], v[2])}
              colorKey={pickColorKey("micropyramid", "microEdge")}
              lineWidth={2.8}
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
              color={pickColor("micropyramid", "microBase")}
              linewidth={2.8}
            />
          </lineLoop>

          {showAuxLines && (
            <>
              {/* 锥体的高：抽离后锥顶到微底面中心，长度恒等于球心到弦面的距离
                  (密度 n=16 时约 0.992R，n 增大时趋于 R) */}
              <Segment3D
                from={toMathVec3(poppedApex[0], poppedApex[1], poppedApex[2])}
                to={toMathVec3(
                  poppedCenter[0],
                  poppedCenter[1],
                  poppedCenter[2],
                )}
                colorKey={radiusKey}
                lineWidth={3}
                dashed
                dashSize={0.1}
                gapSize={0.06}
              />

              {/* KaTeX 标注：底面 ΔSᵢ 与高 hᵢ ≈ R (与右屏「采样微锥高趋于 R」口径一致) */}
              <FormulaLabel3D
                position={toMathVec3(
                  poppedCenter[0] + popNormal[0] * 0.26,
                  poppedCenter[1] + popNormal[1] * 0.26,
                  poppedCenter[2] + popNormal[2] * 0.26,
                )}
                offset={[0, 0, 0]}
                tex="\Delta S_i"
              />
              <FormulaLabel3D
                position={toMathVec3(
                  (poppedApex[0] + poppedCenter[0]) / 2 + labelSideOffset[0],
                  (poppedApex[1] + poppedCenter[1]) / 2 + labelSideOffset[1],
                  (poppedApex[2] + poppedCenter[2]) / 2 + labelSideOffset[2],
                )}
                offset={[0, 0, 0]}
                tex="h_i \approx R"
              />
            </>
          )}
        </group>
      )}
    </group>
  );
}
