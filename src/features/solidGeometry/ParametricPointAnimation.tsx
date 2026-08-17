import { useState, useMemo } from "react";
import { BufferGeometry, BufferAttribute, DoubleSide } from "three";
import { ThreePanel } from "@/components/Layout/ThreePanel";
import { ThreeDCanvas } from "@/components/Layout/ThreeDCanvas";
import {
  LeftPanel,
  LeftPanelSection,
  ParamControl,
  MathPanel,
  TabSwitcher,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import {
  Scene3DGrid,
  Vector3DArrow,
  Point3D,
  PointLabel3D,
  CompoundLabel3D,
  Legend3D,
  CameraRig,
  ThreeViewsPanel,
} from "@/components/Math3D";
import { Cuboid } from "@/components/Math3D/solids";
import { use3DViewport } from "@/hooks/use3DViewport";
import type { CameraPreset } from "@/hooks/use3DViewport";
import { solidParametricMeta } from "@/data/registries/solidGeometry";
import { buildMathQuantities } from "@/data/mathQuantities";
import { buildSolidViews } from "./threeViews/buildSolidViews";
import { mathToThree } from "@/math3d/coordinateConvention";
import {
  calculateSinglePointAngle,
  calculateSurfacePath,
} from "@/math3d/parametricPoint";
import type { Vec3 } from "@/math3d/vector3";

type ParametricMode =
  "singlePointAngle" | "doublePointDistance" | "surfaceShortestPath";

export default function ParametricPointAnimation() {
  const [activeMode, setActiveMode] =
    useState<ParametricMode>("singlePointAngle");
  const [viewMode, setViewMode] = useState<"3d" | "threeViews">("3d");

  const [params, setParams] = useState<Record<string, number>>({
    a: 4,
    b: 3,
    c: 3,
    lambda: 0.5,
    mu: 0.5,
    targetThetaDeg: 45,
  });

  const { preset, cameraPosition, setCameraPreset, controlsRef } =
    use3DViewport("iso");

  const a = params.a ?? 4;
  const b = params.b ?? 3;
  const c = params.c ?? 3;
  const lambda = params.lambda ?? 0.5;
  const mu = params.mu ?? 0.5;

  // 1. 各顶点坐标计算
  const A: Vec3 = { x: 0, y: 0, z: 0 };
  const B: Vec3 = { x: a, y: 0, z: 0 };
  const C: Vec3 = { x: a, y: b, z: 0 };
  const D: Vec3 = { x: 0, y: b, z: 0 };
  const A1: Vec3 = { x: 0, y: 0, z: c };
  const B1: Vec3 = { x: a, y: 0, z: c };
  const C1: Vec3 = { x: a, y: b, z: c };
  const D1: Vec3 = { x: 0, y: b, z: c };

  // 动点 P 在侧棱 BB1 上
  const P: Vec3 = { x: a, y: 0, z: lambda * c };
  // 动点 Q 在底面对角线 AC 上
  const Q: Vec3 = { x: a * mu, y: b * mu, z: 0 };

  // 2. 计算算法结果
  const resSingle = useMemo(
    () => calculateSinglePointAngle(a, b, c, lambda),
    [a, b, c, lambda],
  );
  const resPath = useMemo(
    () => calculateSurfacePath(a, b, c, lambda),
    [a, b, c, lambda],
  );

  // 3. 看板数据
  const mathData = useMemo(
    () =>
      buildMathQuantities("anim-solid-parametric", params, {
        activeMode,
      }),
    [params, activeMode],
  );

  // 4. 左屏参数配置（按当前模式过滤）
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keysByMode: Record<ParametricMode, string[]> = {
      singlePointAngle: ["a", "b", "c", "lambda", "targetThetaDeg"],
      doublePointDistance: ["a", "b", "c", "lambda", "mu"],
      surfaceShortestPath: ["a", "b", "c", "lambda"],
    };
    const currentKeys = keysByMode[activeMode] ?? ["a", "b", "c", "lambda"];

    return currentKeys
      .map((key) => solidParametricMeta.find((meta) => meta.key === key))
      .filter((meta): meta is NonNullable<typeof meta> => Boolean(meta))
      .map((meta) => ({
        key: meta.key,
        label: meta.label,
        labelFormula: meta.labelFormula,
        value: params[meta.key] ?? meta.defaultValue ?? 0,
        min: meta.min,
        max: meta.max,
        step: meta.step ?? 0.01,
        description: meta.description,
        descriptionFormula: meta.descriptionFormula,
        importance: meta.importance,
        marks: meta.marks,
      }));
  }, [params, activeMode]);

  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setParams({
      a: 4,
      b: 3,
      c: 3,
      lambda: 0.5,
      mu: 0.5,
      targetThetaDeg: 45,
    });
  };

  // 5. 三视图数据
  const viewsData = useMemo(() => {
    return buildSolidViews("cuboid", { width: a, depth: b, height: c });
  }, [a, b, c]);

  // 6. 截面 PAC 的 R3F Mesh buffer geometry (精确映射 three.js 场景坐标)
  const pacGeometry = useMemo(() => {
    const geom = new BufferGeometry();
    const p3 = mathToThree(P);
    const a3 = mathToThree(A);
    const c3 = mathToThree(C);
    const vertices = new Float32Array([...p3, ...a3, ...c3]);
    geom.setAttribute("position", new BufferAttribute(vertices, 3));
    geom.computeVertexNormals();
    return geom;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [P.x, P.y, P.z, A.x, A.y, A.z, C.x, C.y, C.z]);

  // 截面中心与法向量起点
  const centerPAC: Vec3 = {
    x: (P.x + A.x + C.x) / 3,
    y: (P.y + A.y + C.y) / 3,
    z: (P.z + A.z + C.z) / 3,
  };
  const normLen = resSingle.lenN < 1e-9 ? 1 : resSingle.lenN;
  const vecNormalScaled: Vec3 = {
    x: centerPAC.x + (resSingle.nPAC.x / normLen) * 1.8,
    y: centerPAC.y + (resSingle.nPAC.y / normLen) * 1.8,
    z: centerPAC.z + (resSingle.nPAC.z / normLen) * 1.8,
  };

  return (
    <ThreePanel
      left={
        <LeftPanel>
          <LeftPanelSection
            title="探究模式选择"
            subtitle="选择高考空间向量动点典型问题"
          >
            <TabSwitcher
              tabs={[
                { key: "singlePointAngle", label: "棱上动点与空间角" },
                { key: "doublePointDistance", label: "双动点与向量最值" },
                { key: "surfaceShortestPath", label: "表面最短路径" },
              ]}
              value={activeMode}
              onChange={(m) => setActiveMode(m as ParametricMode)}
            />
          </LeftPanelSection>

          <LeftPanelSection
            title="几何与动点参数调节"
            subtitle="拖动滑块或在 3D 场景中直接拖拽动点 P / Q"
          >
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
          </LeftPanelSection>

          <LeftPanelSection title="视图模式与视角预设">
            <div className="flex flex-col gap-2">
              <TabSwitcher
                tabs={[
                  { key: "3d", label: "3D 直观图" },
                  { key: "threeViews", label: "正投影三视图" },
                ]}
                value={viewMode}
                onChange={(v) => setViewMode(v as "3d" | "threeViews")}
              />
              {viewMode === "3d" && (
                <TabSwitcher
                  tabs={[
                    { key: "iso", label: "轴测" },
                    { key: "front", label: "主视" },
                    { key: "top", label: "俯视" },
                    { key: "side", label: "左视" },
                  ]}
                  value={preset}
                  onChange={(p) => setCameraPreset(p as CameraPreset)}
                />
              )}
            </div>
          </LeftPanelSection>
        </LeftPanel>
      }
      center={
        viewMode === "threeViews" ? (
          <ThreeViewsPanel views={viewsData.views} extent={viewsData.extent} />
        ) : (
          <ThreeDCanvas
            cameraPosition={cameraPosition}
            legend={
              <Legend3D
                title="图例"
                items={[
                  { colorKey: "primary", swatch: "area", label: "长方体主体" },
                  {
                    colorKey: "highlight",
                    swatch: "line",
                    label: "动点 P 轨线",
                  },
                  ...(activeMode === "singlePointAngle"
                    ? [
                        {
                          colorKey: "secondary" as const,
                          swatch: "area" as const,
                          label: "截面 PAC & 法向量",
                        },
                        {
                          colorKey: "accent" as const,
                          swatch: "line" as const,
                          label: "连线 DP",
                        },
                      ]
                    : []),
                  ...(activeMode === "doublePointDistance"
                    ? [
                        {
                          colorKey: "secondary" as const,
                          swatch: "line" as const,
                          label: "对角线 AC",
                        },
                        {
                          colorKey: "accent" as const,
                          swatch: "line" as const,
                          label: "动线段 PQ",
                        },
                      ]
                    : []),
                  ...(activeMode === "surfaceShortestPath"
                    ? [
                        {
                          colorKey: "secondary" as const,
                          swatch: "line" as const,
                          label: "最佳折点 P₁",
                        },
                      ]
                    : []),
                ]}
              />
            }
          >
            <CameraRig ref={controlsRef} />
            <Scene3DGrid size={5} />

            {/* 长方体透视骨架 */}
            <Cuboid a={a} b={b} c={c} opacity={0.12} colorKey="primary" />

            {/* 顶点的固定标注 */}
            <PointLabel3D position={A} text="A" />
            <PointLabel3D position={B} text="B" />
            <PointLabel3D position={C} text="C" />
            <PointLabel3D position={D} text="D" />
            <PointLabel3D position={A1} text="A1" />
            <PointLabel3D position={B1} text="B1" />
            <PointLabel3D position={C1} text="C1" />
            <PointLabel3D position={D1} text="D1" />

            {/* 侧棱 BB1 高亮轨迹导轨 */}
            <Vector3DArrow from={B} to={B1} colorKey="highlight" />

            {/* 动点 P：在侧棱 BB1 上垂直拖拽 */}
            <Point3D
              position={P}
              draggable
              constrain={(raw) => ({
                x: a,
                y: 0,
                z: Math.min(c, Math.max(0, raw.z)),
              })}
              onDrag={(next) =>
                setParams((prev) => ({
                  ...prev,
                  lambda: Number((next.z / c).toFixed(2)),
                }))
              }
              colorKey="highlight"
            />
            <PointLabel3D position={P} text="P(λ)" offset={[0.15, 0, 0.1]} />

            {/* 模式一：单动点与空间角及存在性 */}
            {activeMode === "singlePointAngle" && (
              <>
                {/* 截面 PAC 面片 (与 3D 场景坐标精确重合) */}
                <mesh geometry={pacGeometry}>
                  <meshBasicMaterial
                    color="#3B82F6"
                    opacity={0.3}
                    transparent
                    side={DoubleSide}
                  />
                </mesh>
                {/* 截面三条边 */}
                <Vector3DArrow from={A} to={P} colorKey="highlight" />
                <Vector3DArrow from={P} to={C} colorKey="highlight" />
                <Vector3DArrow from={C} to={A} colorKey="highlight" />

                {/* 截面法向量 */}
                {resSingle.lenN > 1e-4 && (
                  <Vector3DArrow
                    from={centerPAC}
                    to={vecNormalScaled}
                    colorKey="secondary"
                  />
                )}

                {/* 动连线 DP */}
                <Vector3DArrow from={D} to={P} colorKey="accent" />
                {/* 探究线 AC1 */}
                <Vector3DArrow from={A} to={C1} colorKey="secondary" />
              </>
            )}

            {/* 模式二：双动点与向量最值 */}
            {activeMode === "doublePointDistance" && (
              <>
                {/* 底面对角线 AC 高亮轨迹导轨 */}
                <Vector3DArrow from={A} to={C} colorKey="secondary" />

                {/* 动点 Q：在 AC 上可向量正交平滑拖拽 */}
                <Point3D
                  position={Q}
                  draggable
                  constrain={(raw) => {
                    const acLenSq = a * a + b * b;
                    const dotVal = raw.x * a + raw.y * b;
                    const t = Math.min(1, Math.max(0, dotVal / acLenSq));
                    return { x: t * a, y: t * b, z: 0 };
                  }}
                  onDrag={(next) => {
                    const acLenSq = a * a + b * b;
                    const t = Math.min(
                      1,
                      Math.max(0, (next.x * a + next.y * b) / acLenSq),
                    );
                    setParams((prev) => ({
                      ...prev,
                      mu: Number(t.toFixed(2)),
                    }));
                  }}
                  colorKey="accent"
                />
                <PointLabel3D
                  position={Q}
                  text="Q(μ)"
                  offset={[0.1, 0.1, -0.1]}
                />

                {/* 动线段 PQ */}
                <Vector3DArrow from={P} to={Q} colorKey="highlight" />
              </>
            )}

            {/* 模式三：表面展开最短路径 */}
            {activeMode === "surfaceShortestPath" && (
              <>
                {/* 折线段 AP 与 PC1 */}
                <Vector3DArrow from={A} to={P} colorKey="highlight" />
                <Vector3DArrow from={P} to={C1} colorKey="highlight" />

                {/* 理论最佳折点 P1 指示 */}
                <Point3D position={resPath.optimalP1} colorKey="secondary" />
                <CompoundLabel3D
                  position={resPath.optimalP1}
                  base="P"
                  subscript="1"
                  offset={[-0.4, 0, 0]}
                />
              </>
            )}
          </ThreeDCanvas>
        )
      }
      right={
        <MathPanel
          quantities={mathData.quantities}
          theorems={mathData.theorems}
          gaokaoPoints={mathData.gaokaoPoints}
          warnings={mathData.warnings}
          title="空间向量与动点存在性、最值看板"
        />
      }
    />
  );
}
