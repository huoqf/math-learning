import { useState, useMemo } from "react";
import { ThreePanel } from "@/components/Layout/ThreePanel";
import { ThreeDCanvas } from "@/components/Layout/ThreeDCanvas";
import {
  LeftPanel,
  LeftPanelSection,
  ParamControl,
  MathPanel,
  TabSwitcher,
  SelectGrid,
  TipCard,
  KatexFormula,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import {
  Scene3DGrid,
  Vector3DArrow,
  Segment3D,
  Point3D,
  PointLabel3D,
  CompoundLabel3D,
  FormulaLabel3D,
  Polygon3DFace,
  Legend3D,
  CameraRig,
  ThreeViewsPanel,
  ModeSwitchOverlay3D,
} from "@/components/Math3D";
import { Cuboid } from "@/components/Math3D/solids";
import { use3DViewport } from "@/hooks/use3DViewport";
import type { CameraPreset } from "@/hooks/use3DViewport";
import { solidParametricMeta } from "@/data/registries/solidGeometry";
import { buildMathQuantities } from "@/data/mathQuantities";
import { buildSolidViews } from "./threeViews/buildSolidViews";
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
  const [interactionMode, setInteractionMode] = useState<"orbit" | "drag">(
    "orbit",
  );

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

  // 5. 教学提示配置
  const tipConfig = useMemo(() => {
    switch (activeMode) {
      case "singlePointAngle":
        return {
          variant: "primary" as const,
          formula:
            "\\cos\\theta(\\lambda) = \\frac{|\\vec{n}_{PAC}\\cdot\\vec{n}_0|}{|\\vec{n}_{PAC}||\\vec{n}_0|}",
          text: "设动点坐标 P(a, 0, λc)，利用法向量夹角列方程反求 λ，并检验 λ ∈ [0, 1] 判断动点存在性。",
        };
      case "doublePointDistance":
        return {
          variant: "warning" as const,
          formula:
            "|PQ|^2 = a^2(1-\\mu)^2 + b^2\\mu^2 + \\lambda^2 c^2 \\ge d_{\\min}^2",
          text: "双参数二次型最值：通过配方法独立求各变量极小，当 λ=0 且 μ=a²/(a²+b²) 时取公垂线最小距离。",
        };
      case "surfaceShortestPath":
        return {
          variant: "success" as const,
          formula:
            "L_{\\min} = \\min\\{\\sqrt{(a+b)^2+c^2}, \\sqrt{a^2+(b+c)^2}\\}",
          text: "立体几何表面最短路径：“化曲为平，展成平面”。展开相邻侧面与底面，直线连结起点与终点。",
        };
    }
  }, [activeMode]);

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

  // 6. 三视图数据
  const viewsData = useMemo(() => {
    return buildSolidViews("cuboid", { width: a, depth: b, height: c });
  }, [a, b, c]);

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
          {/* Step 1: 探究模式 (2+1 布局防截断) */}
          <LeftPanelSection title="探究模式">
            <SelectGrid
              items={[
                {
                  key: "singlePointAngle",
                  label: "棱上动点与空间角",
                  description: "存在性与方程求解",
                },
                {
                  key: "doublePointDistance",
                  label: "双动点与向量最值",
                  description: "二次型配方与公垂线",
                },
                {
                  key: "surfaceShortestPath",
                  label: "表面最短路径",
                  description: "展开图与直线路经",
                  fullWidth: true,
                },
              ]}
              value={activeMode}
              onChange={(m) => setActiveMode(m as ParametricMode)}
              columns={2}
            />
          </LeftPanelSection>

          {/* Step 2: 参数调节 */}
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

          {/* Step 3: 教学提示 */}
          <LeftPanelSection title="教学提示与解题通法" compact>
            <TipCard variant={tipConfig.variant}>
              <div className="font-semibold text-xs mb-1">
                <KatexFormula mode="inline" formula={tipConfig.formula} />
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed">
                {tipConfig.text}
              </p>
            </TipCard>
          </LeftPanelSection>

          {/* Step 4: 视图与视角 */}
          <LeftPanelSection title="视图与视角">
            <div className="space-y-2">
              <TabSwitcher
                layout="horizontal"
                tabs={[
                  { key: "3d", label: "3D 直观图" },
                  { key: "threeViews", label: "2D 三视图" },
                ]}
                value={viewMode}
                onChange={(v) => setViewMode(v as "3d" | "threeViews")}
              />
              {viewMode === "3d" && (
                <TabSwitcher
                  layout="horizontal"
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
          <div className="w-full h-full relative">
            <ThreeDCanvas
              cameraPosition={cameraPosition}
              legend={
                <Legend3D
                  title="图例标注"
                  items={[
                    {
                      colorKey: "primary",
                      swatch: "area",
                      label: "长方体主体",
                    },
                    {
                      colorKey: "highlight",
                      swatch: "line",
                      label: "动点 P / 轨迹线",
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
                            label: "动连线 DP",
                          },
                        ]
                      : []),
                    ...(activeMode === "doublePointDistance"
                      ? [
                          {
                            colorKey: "secondary" as const,
                            swatch: "line" as const,
                            label: "对角线 AC 轨迹",
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
              <CameraRig
                ref={controlsRef}
                enabled={interactionMode === "orbit"}
              />
              {/* 空间直角坐标系（纯三轴系统，彻底移除地面网格） */}
              <Scene3DGrid size={5.5} showGrid={false} />

              {/* 长方体透视骨架 */}
              <Cuboid a={a} b={b} c={c} opacity={0.12} colorKey="primary" />

              {/* 顶点文本标注（纯 3D 矢量文字，严格使用 CompoundLabel3D 消除豆腐块） */}
              <PointLabel3D position={A} text="A" />
              <PointLabel3D position={B} text="B" />
              <PointLabel3D position={C} text="C" />
              <PointLabel3D position={D} text="D" />
              <CompoundLabel3D position={A1} base="A" subscript="1" />
              <CompoundLabel3D position={B1} base="B" subscript="1" />
              <CompoundLabel3D position={C1} base="C" subscript="1" />
              <CompoundLabel3D position={D1} base="D" subscript="1" />

              {/* 侧棱 BB1 高亮轨迹导轨 (纯几何线段，无箭头) */}
              <Segment3D
                from={B}
                to={B1}
                colorKey="highlight"
                lineWidth={2.5}
              />

              {/* 动点 P：在侧棱 BB1 上垂直拖拽 */}
              <Point3D
                position={P}
                draggable={interactionMode === "drag"}
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
                  {/* 截面 PAC 半透明面片 */}
                  <Polygon3DFace
                    points={[P, A, C]}
                    colorKey="secondary"
                    opacity={0.25}
                  />

                  {/* 截面三条边 (纯几何线段，绝无箭头) */}
                  <Segment3D
                    from={A}
                    to={P}
                    colorKey="highlight"
                    lineWidth={2.5}
                  />
                  <Segment3D
                    from={P}
                    to={C}
                    colorKey="highlight"
                    lineWidth={2.5}
                  />
                  <Segment3D
                    from={C}
                    to={A}
                    colorKey="highlight"
                    lineWidth={2.5}
                  />

                  {/* 截面法向量 (唯一代数向量箭头) */}
                  {resSingle.lenN > 1e-4 && (
                    <>
                      <Vector3DArrow
                        from={centerPAC}
                        to={vecNormalScaled}
                        colorKey="secondary"
                      />
                      <FormulaLabel3D
                        position={vecNormalScaled}
                        tex="\\vec{n}_{PAC}"
                      />
                    </>
                  )}

                  {/* 动连线 DP (纯几何线段) */}
                  <Segment3D
                    from={D}
                    to={P}
                    colorKey="accent"
                    lineWidth={2.5}
                  />
                  {/* 探究线 AC1 (纯几何线段) */}
                  <Segment3D
                    from={A}
                    to={C1}
                    colorKey="secondary"
                    dashed
                    lineWidth={2}
                  />
                </>
              )}

              {/* 模式二：双动点与向量最值 */}
              {activeMode === "doublePointDistance" && (
                <>
                  {/* 底面对角线 AC 高亮轨迹导轨 (纯几何线段) */}
                  <Segment3D
                    from={A}
                    to={C}
                    colorKey="secondary"
                    lineWidth={2.5}
                  />

                  {/* 动点 Q：在 AC 上可向量正交平滑拖拽 */}
                  <Point3D
                    position={Q}
                    draggable={interactionMode === "drag"}
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

                  {/* 动线段 PQ (纯几何线段，无箭头) */}
                  <Segment3D
                    from={P}
                    to={Q}
                    colorKey="highlight"
                    lineWidth={3}
                  />
                </>
              )}

              {/* 模式三：表面展开最短路径 */}
              {activeMode === "surfaceShortestPath" && (
                <>
                  {/* 折线段 AP 与 PC1 (纯几何线段，无箭头) */}
                  <Segment3D
                    from={A}
                    to={P}
                    colorKey="highlight"
                    lineWidth={3}
                  />
                  <Segment3D
                    from={P}
                    to={C1}
                    colorKey="highlight"
                    lineWidth={3}
                  />

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

            {/* 右上角漫游/交互切换浮层 */}
            <ModeSwitchOverlay3D
              mode={interactionMode}
              onModeChange={setInteractionMode}
            />
          </div>
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
