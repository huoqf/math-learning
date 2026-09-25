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

import {
  getSpatialDistancePresets,
  getSpatialDistanceTip,
  type DistanceMode,
} from "./spatialDistancePresets";

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

  // 纯数学模型解算
  const isSideEdgeModel = modelPreset === "sideEdge";
  const isCubeModel = modelPreset === "cube" || modelPreset === "cubeThird";
  const skewData = useMemo(() => {
    return isSideEdgeModel
      ? solveSideEdgeAndFaceDiagonalDistance(a, b, c, lambda, mu)
      : solveSkewLinesDistance(a, b, c, lambda, mu);
  }, [a, b, c, lambda, mu, isSideEdgeModel]);

  const pointPlaneData = useMemo(() => {
    return solvePointToPlaneDistance(a, b, c, lambda);
  }, [a, b, c, lambda]);

  // 几何顶点与动点 (SSOT 绑定纯数学层 pointPlaneData.E，消除 lambda=0 退化不同源)
  const vertices: CuboidVertices = useMemo(() => {
    const A: Vec3 = { x: 0, y: 0, z: 0 };
    const B: Vec3 = { x: a, y: 0, z: 0 };
    const C: Vec3 = { x: a, y: b, z: 0 };
    const D: Vec3 = { x: 0, y: b, z: 0 };
    const A1: Vec3 = { x: 0, y: 0, z: c };
    const B1: Vec3 = { x: a, y: 0, z: c };
    const C1: Vec3 = { x: a, y: b, z: c };
    const D1: Vec3 = { x: 0, y: b, z: c };
    const E: Vec3 = { x: 0, y: 0, z: pointPlaneData.zE };

    return { A, B, C, D, A1, B1, C1, D1, E };
  }, [a, b, c, pointPlaneData]);

  // 右屏看板数据 (SSOT: 将正方体判定显式传入 config，使中右屏同源)
  const isCube =
    isCubeModel || (Math.abs(a - b) < 1e-4 && Math.abs(b - c) < 1e-4);
  const mathData = useMemo(
    () =>
      buildMathQuantities("anim-solid-distance", params, {
        mode: activeMode,
        preset: modelPreset,
        isCube,
      }),
    [params, activeMode, modelPreset, isCube],
  );

  // 典型情景配置 (纯净加粗中文标题，严禁堆砌公式)
  const currentPresets = useMemo(
    () =>
      getSpatialDistancePresets(activeMode, {
        lambda: Number(skewData.optimalLambda.toFixed(2)),
        mu: Number(skewData.optimalMu.toFixed(2)),
      }),
    [activeMode, skewData.optimalLambda, skewData.optimalMu],
  );

  const handleModelPresetChange = (pKey: string) => {
    setModelPreset(pKey);
    const target = currentPresets.find((p) => p.key === pKey);
    if (target) {
      setParams(target.params);
    }
  };

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

  // 高考真题设问随典型情景 100% 动态特化（文案 SSOT 见模块级 getSpatialDistanceTip）
  const tipCardContent = useMemo(
    () => getSpatialDistanceTip(activeMode, modelPreset),
    [activeMode, modelPreset],
  );

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
