import { useState, useMemo, useCallback } from "react";
import { ThreePanel } from "@/components/Layout/ThreePanel";
import { ThreeDCanvas } from "@/components/Layout/ThreeDCanvas";
import {
  LeftPanel,
  LeftPanelSection,
  ParamControl,
  MathPanel,
  TabSwitcher,
  SelectGrid,
  Toggle,
  TipCard,
  renderMixedLatex,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import {
  Legend3D,
  CameraRig,
  ThreeViewsPanel,
  ModeSwitchOverlay3D,
} from "@/components/Math3D";
import { use3DViewport } from "@/hooks/use3DViewport";
import type { CameraPreset } from "@/hooks/use3DViewport";
import { solidDistanceMeta } from "@/data/registries/solidGeometry";
import { buildMathQuantities } from "@/data/mathQuantities";
import { buildSolidViews } from "./threeViews/buildSolidViews";
import type { Vec3 } from "@/math3d/vector3";
import type { CuboidVertices } from "@/math3d/spatialAngle";
import { solvePointToPlaneDistance } from "@/math3d/spatialAngle";
import {
  solveSkewLinesDistance,
  solveSideEdgeAndFaceDiagonalDistance,
} from "@/math3d/spatialDistance";
import { MATH_COLORS } from "@/theme";
import CuboidBaseScene from "./CuboidBaseScene";
import SkewPerpendicularModeScene from "./modes/SkewPerpendicularModeScene";
import DistanceModeScene from "./modes/DistanceModeScene";

export type DistanceMode =
  "skewDistance" | "pointPlaneDistance" | "volumeExtrema";

export default function SpatialDistanceAnimation() {
  const [activeMode, setActiveMode] = useState<DistanceMode>("skewDistance");
  const [modelPreset, setModelPreset] = useState<string>("free");
  const [viewMode, setViewMode] = useState<"3d" | "threeViews">("3d");
  const [interactionMode, setInteractionMode] = useState<"orbit" | "drag">(
    "orbit",
  );

  // 核心几何参数 (长宽高 a, b, c 与动点参数 lambda, mu)
  const [params, setParams] = useState<Record<string, number>>({
    a: 3,
    b: 2,
    c: 2,
    lambda: 0.5,
    mu: 0.4,
  });

  // 辅助视觉图层控制开关
  const [showAxes, setShowAxes] = useState(true);
  const [showCoordinates, setShowCoordinates] = useState(false);
  const [showAuxiliary, setShowAuxiliary] = useState(true);
  const [showRightAngles, setShowRightAngles] = useState(true);
  const [showNormals, setShowNormals] = useState(true);
  const [showParallelPlane, setShowParallelPlane] = useState(true);
  const [showCommonPerpAlways, setShowCommonPerpAlways] = useState(false);

  const { preset, cameraPosition, setCameraPreset, controlsRef } =
    use3DViewport("iso");

  const a = params.a ?? 3;
  const b = params.b ?? 2;
  const c = params.c ?? 2;
  const lambda = params.lambda ?? 0.5;
  const mu = params.mu ?? 0.4;

  // 长方体 8 个顶点坐标
  const vertices: CuboidVertices = useMemo(() => {
    const A: Vec3 = { x: 0, y: 0, z: 0 };
    const B: Vec3 = { x: a, y: 0, z: 0 };
    const C: Vec3 = { x: a, y: b, z: 0 };
    const D: Vec3 = { x: 0, y: b, z: 0 };
    const A1: Vec3 = { x: 0, y: 0, z: c };
    const B1: Vec3 = { x: a, y: 0, z: c };
    const C1: Vec3 = { x: a, y: b, z: c };
    const D1: Vec3 = { x: 0, y: b, z: c };
    const E: Vec3 = { x: 0, y: 0, z: lambda * c };

    return { A, B, C, D, A1, B1, C1, D1, E };
  }, [a, b, c, lambda]);

  // 纯数学模型解算
  const isSideEdgeModel = modelPreset === "sideEdge";
  const skewData = useMemo(() => {
    return isSideEdgeModel
      ? solveSideEdgeAndFaceDiagonalDistance(a, b, c, lambda, mu)
      : solveSkewLinesDistance(a, b, c, lambda, mu);
  }, [a, b, c, lambda, mu, isSideEdgeModel]);

  const pointPlaneData = useMemo(() => {
    return solvePointToPlaneDistance(a, b, c, lambda);
  }, [a, b, c, lambda]);

  // 右屏看板数据
  const mathData = useMemo(
    () =>
      buildMathQuantities("anim-solid-distance", params, {
        mode: activeMode,
        preset: modelPreset,
      }),
    [params, activeMode, modelPreset],
  );

  // 典型情景配置 (纯净加粗中文标题，严禁堆砌公式)
  const currentPresets = useMemo(() => {
    const presetsByMode: Record<
      DistanceMode,
      {
        key: string;
        label: string;
        params: Record<string, number>;
      }[]
    > = {
      skewDistance: [
        {
          key: "free",
          label: "自由探索",
          params: { a: 3, b: 2, c: 2, lambda: 0.5, mu: 0.4 },
        },
        {
          key: "cube",
          label: "正方体面对角线",
          params: { a: 2.5, b: 2.5, c: 2.5, lambda: 0.67, mu: 0.33 },
        },
        {
          key: "sideEdge",
          label: "侧棱与面对角线",
          params: { a: 4, b: 3, c: 3, lambda: 0.0, mu: 0.64 },
        },
        {
          key: "goldenPerp",
          label: "公垂线极值点",
          params: {
            a: 3,
            b: 2,
            c: 2,
            lambda: Number(skewData.optimalLambda.toFixed(2)),
            mu: Number(skewData.optimalMu.toFixed(2)),
          },
        },
      ],
      pointPlaneDistance: [
        {
          key: "free",
          label: "自由探索",
          params: { a: 3, b: 2, c: 2, lambda: 0.6, mu: 0.4 },
        },
        {
          key: "cubeThird",
          label: "正方体三分对角线",
          params: { a: 2.5, b: 2.5, c: 2.5, lambda: 1.0, mu: 0.4 },
        },
        {
          key: "midSection",
          label: "中点截面构型",
          params: { a: 3, b: 2, c: 2, lambda: 0.5, mu: 0.4 },
        },
      ],
      volumeExtrema: [
        {
          key: "free",
          label: "自由探索",
          params: { a: 3, b: 2, c: 2, lambda: 0.6, mu: 0.4 },
        },
        {
          key: "maxVolume",
          label: "顶点极大值构型",
          params: { a: 3, b: 2, c: 2, lambda: 1.0, mu: 0.4 },
        },
        {
          key: "midVolume",
          label: "中点半体积分点",
          params: { a: 3, b: 2, c: 2, lambda: 0.5, mu: 0.4 },
        },
      ],
    };
    return presetsByMode[activeMode] ?? presetsByMode.skewDistance;
  }, [activeMode, skewData.optimalLambda, skewData.optimalMu]);

  const handleModelPresetChange = (pKey: string) => {
    setModelPreset(pKey);
    const target = currentPresets.find((p) => p.key === pKey);
    if (target) {
      setParams(target.params);
    }
  };

  const isCubeModel = modelPreset === "cube" || modelPreset === "cubeThird";

  const handleParamChange = (key: string, value: number) => {
    // 若在正方体预设中调节棱长 a，联动更新 b 和 c 保持正方体题设约束
    if (isCubeModel && key === "a") {
      setParams((prev) => ({ ...prev, a: value, b: value, c: value }));
      return;
    }
    setModelPreset("free");
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  // 动点拖拽回调
  const handlePDrag = useCallback((newLambda: number) => {
    setModelPreset("free");
    setParams((prev) => ({ ...prev, lambda: newLambda }));
  }, []);

  const handleQDrag = useCallback((newMu: number) => {
    setModelPreset("free");
    setParams((prev) => ({ ...prev, mu: newMu }));
  }, []);

  const handleEDrag = useCallback((next: Vec3) => {
    setModelPreset("free");
    setParams((prev) => {
      const curC = prev.c ?? 2;
      return { ...prev, lambda: Math.min(1, Math.max(0.01, next.z / curC)) };
    });
  }, []);

  // 三视图正投影数据
  const viewsData = useMemo(() => {
    return buildSolidViews("cuboid", {
      width: a,
      depth: b,
      height: c,
    });
  }, [a, b, c]);

  // 参数配置映射（遵循铁律3：典型情境参数降维，锁定从属参数）
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    return solidDistanceMeta
      .filter((meta) => {
        // 模式二三无第二个动点 mu
        if (
          (activeMode === "pointPlaneDistance" ||
            activeMode === "volumeExtrema") &&
          meta.key === "mu"
        ) {
          return false;
        }
        // 正方体情景下，b 和 c 锁定等于 a，隐藏从属参数，仅保留主控棱长 a
        if (isCubeModel && (meta.key === "b" || meta.key === "c")) {
          return false;
        }
        return true;
      })
      .map((meta) => {
        const isCubeEdge = isCubeModel && meta.key === "a";
        return {
          key: meta.key,
          label: isCubeEdge ? "正方体棱长 a" : meta.label,
          labelFormula: isCubeEdge
            ? `\\text{正方体棱长 } \\color{${MATH_COLORS.paramPrimary}}{a}`
            : meta.labelFormula,
          value: params[meta.key] ?? meta.defaultValue,
          min: meta.min,
          max: meta.max,
          step: meta.step,
          group: meta.group,
          marks: meta.marks,
          importance: meta.importance,
        };
      });
  }, [params, activeMode, isCubeModel]);

  // 高考真题设问随典型情景 100% 动态特化
  const tipCardContent = useMemo(() => {
    if (activeMode === "skewDistance") {
      switch (modelPreset) {
        case "cube":
          return "【初始条件】在正方体 $ABCD-A_1B_1C_1D_1$ 中，考察面对角线 $A_1B$ 与 $AC$（棱长为 $a$）。\n\n【核心设问】\n(1) 求异面直线 $A_1B$ 与 $AC$ 所成的角（证明为 $60^\\circ$）以及公垂线段长度；\n(2) 过直线 $AC$ 作平行于 $A_1B$ 的平面 $ACD_1$，验证两异面直线距离转化为点 $B$ 到该平面的距离。";
        case "sideEdge":
          return "【初始条件】在长方体 $ABCD-A_1B_1C_1D_1$ 中，直线 1 为侧棱 $BB_1$，直线 2 为底面对角线 $AC$。\n\n【核心设问】\n(1) 设动点 $P \\in BB_1, Q \\in AC$，求线段 $PQ$ 最小时两动点的参数解与极小值；\n(2) 证明公垂足 $H_2$ 为原点在对角线 $AC$ 上的正投影，侧棱到截面 $ACC_1A_1$ 的垂线即为公垂线。";
        case "goldenPerp":
          return "【初始条件】长方体中两异面直线上的动点 $P(\\lambda), Q(\\mu)$ 恰处于极值解位置。\n\n【核心设问】\n(1) 检验动线段 $\\vec{PQ}$ 是否同时垂直于两直线方向向量（$\\vec{PQ} \\cdot \\vec{u} = 0$ 且 $\\vec{PQ} \\cdot \\vec{v} = 0$）；\n(2) 比较二元二次型极值分析法与空间向量正投影法在求解公垂线时的等价性。";
        default:
          return "【初始条件】长方体中动点 $P$ 在直线 $l_1$ 上滑动，动点 $Q$ 在直线 $l_2$ 上滑动。\n\n【核心设问】\n(1) 自由拖拽动点 $P, Q$，观察动线段 $PQ$ 的长度变化与极值临界点；\n(2) 开启“化归平行转化平面”开关，观察两异面直线距离如何转化为线面距离与点面距离。";
      }
    }
    if (activeMode === "pointPlaneDistance") {
      switch (modelPreset) {
        case "cubeThird":
          return "【初始条件】在棱长为 $a$ 的正方体中，动点 $E$ 位于侧棱顶点 $A_1$（$\\lambda = 1.0$），截面为 $\\triangle A_1BD$。\n\n【核心设问】\n(1) 求平面 $A_1BD$ 的法向量与原点 $A$ 到该平面的垂线距离 $d$；\n(2) 证明体对角线 $AC_1$ 垂直于截面 $A_1BD$，且截面恰好将体对角线三等分（$d = \\frac{\\sqrt{3}}{3}a$）。";
        case "midSection":
          return "【初始条件】动点 $E$ 位于侧棱 $AA_1$ 的中点（$\\lambda = 0.5$），截面为 $\\triangle BDE$。\n\n【核心设问】\n(1) 求截面 $\\triangle BDE$ 的面积与原点 $A$ 到该平面的距离；\n(2) 比较等体积法 $V_{A-BDE} = V_{E-ABD}$ 与坐标向量投影法的计算效率。";
        default:
          return "【初始条件】长方体底面尺寸为 $a, b$，侧棱高为 $c$，动点 $E$ 在侧棱 $AA_1$ 上滑动（$AE = \\lambda c$）。\n\n【核心设问】\n(1) 建立空间直角坐标系，求平面 $BDE$ 的法向量 $\\vec{n}$ 与原点 $A$ 到平面的垂线距离 $d$；\n(2) 利用三棱锥等体积公式 $V_{A-BDE} = V_{E-ABD}$ 反求高线 $d$，验证向量法与等体积法的对账一致性。";
      }
    }
    // volumeExtrema
    switch (modelPreset) {
      case "maxVolume":
        return "【初始条件】三棱锥 $E-ABD$ 的顶点 $E$ 滑动至侧棱顶端 $A_1$（$\\lambda = 1.0$）。\n\n【核心设问】\n(1) 求三棱锥的最大体积，验证其与长方体总体积的固定比值（$V = \\frac{1}{6}abc$）；\n(2) 分析当底面积固定时，三棱锥体积随高线线性单调递增的几何本质。";
      case "midVolume":
        return "【初始条件】动点 $E$ 位于侧棱中点（$\\lambda = 0.5$）。\n\n【核心设问】\n(1) 计算此时三棱锥体积与长方体容积之比（$\\frac{1}{12}$）；\n(2) 探究截面截长方体所形成的两个多面体体积比。";
      default:
        return "【初始条件】三棱锥 $E-ABD$ 底面 $\\triangle ABD$ 位于长方体底面，顶点 $E$ 沿棱 $AA_1$ 滑动。\n\n【核心设问】\n(1) 探究当分点比例 $\\lambda$ 变化时，三棱锥体积与高线的线性关系；\n(2) 分析底面积不变情况下，棱锥体积与动点空间距离的单调性本质。";
    }
  }, [activeMode, modelPreset]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 1. 模式切换 */}
          <LeftPanelSection title="探究模式维度">
            <TabSwitcher
              tabs={[
                { key: "skewDistance", label: "异面公垂线与极值" },
                { key: "pointPlaneDistance", label: "点面距离" },
                { key: "volumeExtrema", label: "体积极值与轨迹" },
              ]}
              value={activeMode}
              onChange={(key) => {
                setActiveMode(key as DistanceMode);
                setModelPreset("free");
              }}
            />
          </LeftPanelSection>

          {/* 2. 典型情景 */}
          <LeftPanelSection title="典型模型预设">
            <SelectGrid
              items={currentPresets.map((p) => ({
                key: p.key,
                label: p.label,
              }))}
              value={modelPreset}
              onChange={handleModelPresetChange}
              columns={2}
            />
          </LeftPanelSection>

          {/* 3. 参数调节 */}
          <LeftPanelSection title="参数调节">
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
            />
          </LeftPanelSection>

          {/* 4. 辅助图层开关 */}
          {viewMode === "3d" && (
            <LeftPanelSection title="图层控制" compact>
              <div className="grid grid-cols-2 gap-2">
                <Toggle
                  label="坐标系"
                  checked={showAxes}
                  onChange={setShowAxes}
                  size="compact"
                />
                {showAxes && (
                  <Toggle
                    label="数值标注"
                    checked={showCoordinates}
                    onChange={setShowCoordinates}
                    size="compact"
                  />
                )}
                <Toggle
                  label="直角方框"
                  checked={showRightAngles}
                  onChange={setShowRightAngles}
                  size="compact"
                />
                <Toggle
                  label="公垂/法向量"
                  checked={showNormals}
                  onChange={setShowNormals}
                  size="compact"
                />
                {activeMode === "skewDistance" ? (
                  <>
                    <Toggle
                      label="平行转化面"
                      checked={showParallelPlane}
                      onChange={setShowParallelPlane}
                      size="compact"
                    />
                    <Toggle
                      label="公垂线参考"
                      checked={showCommonPerpAlways}
                      onChange={setShowCommonPerpAlways}
                      size="compact"
                    />
                  </>
                ) : (
                  <div className="col-span-2">
                    <Toggle
                      label="三棱锥双高线 (EA 与 AH)"
                      checked={showAuxiliary}
                      onChange={setShowAuxiliary}
                      size="compact"
                    />
                  </div>
                )}
              </div>
            </LeftPanelSection>
          )}

          {/* 5. 视角与三视图投影预设（观察控制） */}
          <LeftPanelSection title="视角预设">
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
                    { key: "iso", label: "立体" },
                    { key: "front", label: "正视" },
                    { key: "top", label: "俯视" },
                    { key: "side", label: "侧视" },
                  ]}
                  value={preset}
                  onChange={(p) => setCameraPreset(p as CameraPreset)}
                />
              )}
            </div>
          </LeftPanelSection>

          {/* 6. 教学导引题设化（置于最底部） */}
          <TipCard variant="info" badge="新高考真题设问与破题导引">
            <div className="whitespace-pre-line leading-relaxed text-[11px]">
              {renderMixedLatex(tipCardContent)}
            </div>
          </TipCard>
        </LeftPanel>
      }
      center={
        <div className="w-full h-full relative flex flex-col bg-white">
          {viewMode === "3d" ? (
            <div className="flex-1 relative">
              <ThreeDCanvas cameraPosition={cameraPosition}>
                <CameraRig
                  ref={controlsRef}
                  enabled={interactionMode === "orbit"}
                />

                {/* 共享长方体基座与顶点标号 */}
                <CuboidBaseScene
                  a={a}
                  b={b}
                  c={c}
                  vertices={vertices}
                  showAxes={showAxes}
                  showCoordinates={showCoordinates}
                />

                {/* 模式一：异面直线公垂线与距离极值 */}
                {activeMode === "skewDistance" && (
                  <SkewPerpendicularModeScene
                    a={a}
                    b={b}
                    c={c}
                    lambda={lambda}
                    mu={mu}
                    skewData={skewData}
                    isSideEdgeModel={isSideEdgeModel}
                    showParallelPlane={showParallelPlane}
                    showCommonPerpAlways={showCommonPerpAlways}
                    showNormals={showNormals}
                    showRightAngles={showRightAngles}
                    showCoordinates={showCoordinates}
                    interactionMode={interactionMode}
                    onPDrag={handlePDrag}
                    onQDrag={handleQDrag}
                  />
                )}

                {/* 模式二/三：点面距离与体积极值 */}
                {(activeMode === "pointPlaneDistance" ||
                  activeMode === "volumeExtrema") && (
                  <DistanceModeScene
                    c={c}
                    lambda={lambda}
                    vertices={vertices}
                    distanceData={pointPlaneData}
                    showAxes={showAxes}
                    showCoordinates={showCoordinates}
                    showAuxiliary={showAuxiliary}
                    showRightAngles={showRightAngles}
                    showNormals={showNormals}
                    interactionMode={interactionMode}
                    onEPointDrag={handleEDrag}
                  />
                )}
              </ThreeDCanvas>

              {/* 右上角：视角漫游 vs 动点交互切换 */}
              <ModeSwitchOverlay3D
                mode={interactionMode}
                onModeChange={setInteractionMode}
              />

              {/* 底端浮动图例 */}
              <div className="absolute bottom-3 left-3 z-10">
                <Legend3D
                  items={
                    activeMode === "skewDistance"
                      ? [
                          {
                            label: "动点 P(λ) / 直线 1",
                            colorKey: "paramPrimary",
                          },
                          {
                            label: "动点 Q(μ) / 直线 2",
                            colorKey: "paramSecondary",
                          },
                          {
                            label: "公垂线段 H₁H₂ / 极值",
                            colorKey: "paramTertiary",
                          },
                          { label: "平行转化平面", colorKey: "accent" },
                        ]
                      : [
                          { label: "动点 E", colorKey: "highlight" },
                          {
                            label: "垂线段 AH / 距离 d",
                            colorKey: "paramPrimary",
                          },
                          { label: "底面 △ABD", colorKey: "secondary" },
                          { label: "截面 △BDE", colorKey: "paramTertiary" },
                        ]
                  }
                />
              </div>
            </div>
          ) : (
            <ThreeViewsPanel
              views={viewsData.views}
              extent={viewsData.extent}
            />
          )}
        </div>
      }
      right={<MathPanel {...mathData} />}
    />
  );
}
