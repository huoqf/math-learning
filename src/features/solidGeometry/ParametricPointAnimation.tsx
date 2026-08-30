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
  TipCard,
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
import { solidParametricMeta } from "@/data/registries/solidGeometry";
import { buildMathQuantities } from "@/data/mathQuantities";
import { buildSolidViews } from "./threeViews/buildSolidViews";
import {
  calculateSinglePointAngle,
  calculateDoublePointDistance,
  calculatePyramidVolumeExtrema,
  calculateSurfacePath,
} from "@/math3d/parametricPoint";
import type { Vec3 } from "@/math3d/vector3";
import ParametricPointBaseScene from "./ParametricPointBaseScene";
import SinglePointAngleModeScene from "./modes/SinglePointAngleModeScene";
import DoublePointDistanceModeScene from "./modes/DoublePointDistanceModeScene";
import PyramidVolumeModeScene from "./modes/PyramidVolumeModeScene";
import SurfacePathModeScene from "./modes/SurfacePathModeScene";

type ParametricMode =
  | "singlePointAngle"
  | "doublePointDistance"
  | "pyramidVolumeExtrema"
  | "surfaceShortestPath";

export default function ParametricPointAnimation() {
  const [activeMode, setActiveMode] =
    useState<ParametricMode>("singlePointAngle");
  const [presetKey, setPresetKey] = useState<string>("free");
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
  const targetThetaDeg = params.targetThetaDeg ?? 45;

  // 1. 各几何顶点坐标计算 (A 为坐标原点建立直角坐标系 A-xyz)
  // x 轴向前(底面长 a), y 轴向右(底面宽 b), z 轴向上(高 c)
  const A: Vec3 = { x: 0, y: 0, z: 0 };
  const B: Vec3 = { x: a, y: 0, z: 0 };
  const C: Vec3 = { x: a, y: b, z: 0 };
  const D: Vec3 = { x: 0, y: b, z: 0 };
  const A1: Vec3 = { x: 0, y: 0, z: c };
  const B1: Vec3 = { x: a, y: 0, z: c };
  const C1: Vec3 = { x: a, y: b, z: c };
  const D1: Vec3 = { x: 0, y: b, z: c };

  // 动点 P 在侧棱 BB1 上 (z 方向参数化)
  const P: Vec3 = { x: a, y: 0, z: lambda * c };
  // 动点 Q 在底面对角线 AC 上 (参数化)
  const Q: Vec3 = { x: a * mu, y: b * mu, z: 0 };

  // 2. 纯数学算法解算
  const resSingle = useMemo(
    () => calculateSinglePointAngle(a, b, c, lambda, targetThetaDeg),
    [a, b, c, lambda, targetThetaDeg],
  );
  const resDouble = useMemo(
    () => calculateDoublePointDistance(a, b, c, lambda, mu),
    [a, b, c, lambda, mu],
  );
  const resVolume = useMemo(
    () => calculatePyramidVolumeExtrema(a, b, c, lambda),
    [a, b, c, lambda],
  );
  const resPath = useMemo(
    () => calculateSurfacePath(a, b, c, lambda),
    [a, b, c, lambda],
  );

  // 3. 看板数据组装
  const mathData = useMemo(
    () =>
      buildMathQuantities("anim-solid-parametric", params, {
        activeMode,
      }),
    [params, activeMode],
  );

  // 4. 典型预设切换处理 (严格遵照铁律 3：预设切换仅修改参数，不跨模式)
  const handlePresetChange = (pKey: string) => {
    setPresetKey(pKey);
    if (pKey === "free") return;

    if (activeMode === "singlePointAngle") {
      if (pKey === "perp") {
        const rawPerp = (b * b - a * a) / (c * c);
        const perpLambda = Math.max(0, Math.min(1, rawPerp));
        setParams((prev) => ({
          ...prev,
          lambda: Number(perpLambda.toFixed(2)),
        }));
      } else if (pKey === "midpoint") {
        setParams((prev) => ({ ...prev, lambda: 0.5 }));
      } else if (pKey === "targetAngle") {
        if (resSingle.lambdaTargetDihedral !== null) {
          setParams((prev) => ({
            ...prev,
            lambda: resSingle.lambdaTargetDihedral!,
          }));
        } else {
          setParams((prev) => ({ ...prev, lambda: 0.8 }));
        }
      }
    } else if (activeMode === "doublePointDistance") {
      if (pKey === "commonPerp") {
        setParams((prev) => ({
          ...prev,
          lambda: 0,
          mu: Number(resDouble.optimalMu.toFixed(2)),
        }));
      } else if (pKey === "vertexDist") {
        setParams((prev) => ({ ...prev, lambda: 1, mu: 0 }));
      } else if (pKey === "diagMidpoint") {
        setParams((prev) => ({ ...prev, lambda: 0.5, mu: 0.5 }));
      }
    } else if (activeMode === "pyramidVolumeExtrema") {
      if (pKey === "maxVolume") {
        setParams((prev) => ({ ...prev, lambda: 1 }));
      } else if (pKey === "halfVolume") {
        setParams((prev) => ({ ...prev, lambda: 0.5 }));
      } else if (pKey === "degenerate") {
        setParams((prev) => ({ ...prev, lambda: 0 }));
      }
    } else if (activeMode === "surfaceShortestPath") {
      if (pKey === "optimalSide") {
        setParams((prev) => ({
          ...prev,
          lambda: Number(resPath.optimalLambda1.toFixed(2)),
        }));
      } else if (pKey === "optimalBottom") {
        setParams((prev) => ({ ...prev, lambda: 0.4 }));
      } else if (pKey === "midpointPath") {
        setParams((prev) => ({ ...prev, lambda: 0.5 }));
      }
    }
  };

  // 5. 探究模式切换处理
  const handleModeChange = (mode: ParametricMode) => {
    setActiveMode(mode);
    setPresetKey("free");
  };

  // 6. 参数调节回调 (手动拖动滑块时切回 free 模式)
  const handleParamChange = (key: string, value: number) => {
    setPresetKey("free");
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setPresetKey("free");
    setParams({
      a: 4,
      b: 3,
      c: 3,
      lambda: 0.5,
      mu: 0.5,
      targetThetaDeg: 45,
    });
  };

  // 7. 3D 画布内动点拖拽反向求参回调 (铁律 7：拖拽图形改参数，同步切回自由探究)
  const handlePDrag = (z: number) => {
    setPresetKey("free");
    setParams((prev) => ({
      ...prev,
      lambda: Number((z / c).toFixed(2)),
    }));
  };

  const handleQDrag = (muNext: number) => {
    setPresetKey("free");
    setParams((prev) => ({
      ...prev,
      mu: Number(muNext.toFixed(2)),
    }));
  };

  // 8. 左屏参数配置与动态裁剪（铁律 3：特定预设下隐藏已锁定的特征点参数，自由探究下全量展开）
  const mapKeysToConfigs = useCallback(
    (keys: string[]): ParamConfig[] => {
      return keys
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
    },
    [params],
  );

  const paramConfigs = useMemo<ParamConfig[]>(() => {
    // 自由探究模式：全量展开当前模式的所有可调参数
    if (presetKey === "free") {
      const keysByMode: Record<ParametricMode, string[]> = {
        singlePointAngle: ["a", "b", "c", "lambda", "targetThetaDeg"],
        doublePointDistance: ["a", "b", "c", "lambda", "mu"],
        pyramidVolumeExtrema: ["a", "b", "c", "lambda"],
        surfaceShortestPath: ["a", "b", "c", "lambda"],
      };
      return mapKeysToConfigs(
        keysByMode[activeMode] ?? ["a", "b", "c", "lambda"],
      );
    }

    // 特定预设模式：动态裁剪隐藏已被几何约束或特征点锁定的滑块
    if (activeMode === "singlePointAngle") {
      if (presetKey === "perp" || presetKey === "midpoint") {
        // λ 已被锁定，隐藏 λ 滑块，保留几何尺寸与目标二面角
        return mapKeysToConfigs(["a", "b", "c", "targetThetaDeg"]);
      }
      if (presetKey === "targetAngle") {
        // 目标二面角预设：隐藏被反解锁定的 λ，仅允许调节目标角度及尺寸
        return mapKeysToConfigs(["a", "b", "c", "targetThetaDeg"]);
      }
    } else if (activeMode === "doublePointDistance") {
      if (
        presetKey === "commonPerp" ||
        presetKey === "vertexDist" ||
        presetKey === "diagMidpoint"
      ) {
        // λ, μ 均已被特征锁定，隐藏 λ, μ 滑块，保留几何尺寸
        return mapKeysToConfigs(["a", "b", "c"]);
      }
    } else if (activeMode === "pyramidVolumeExtrema") {
      if (
        presetKey === "maxVolume" ||
        presetKey === "halfVolume" ||
        presetKey === "degenerate"
      ) {
        // λ 已被特征位置锁定，隐藏 λ 滑块，保留几何尺寸
        return mapKeysToConfigs(["a", "b", "c"]);
      }
    } else if (activeMode === "surfaceShortestPath") {
      if (
        presetKey === "optimalSide" ||
        presetKey === "optimalBottom" ||
        presetKey === "midpointPath"
      ) {
        // λ 已被最佳展开交点锁定，隐藏 λ 滑块，保留几何尺寸
        return mapKeysToConfigs(["a", "b", "c"]);
      }
    }

    return mapKeysToConfigs(["a", "b", "c", "lambda"]);
  }, [activeMode, presetKey, mapKeysToConfigs]);

  // 9. 教学提示配置（规范化初始条件与探究设问）
  const tipConfig = useMemo(() => {
    switch (activeMode) {
      case "singlePointAngle":
        return {
          variant: "primary" as const,
          badge: "高考大题 · 空间动点存在性与二面角求解",
          condition:
            "长方体 ABCD-A₁B₁C₁D₁ 中侧棱 AA₁ 上动点 P(a, 0, λc) (λ ∈ [0, 1])，截面 PAC 与底面夹角为 θ。",
          question:
            "建立截面 PAC 法向量与底面法向量夹角方程 cosθ(λ) = cosθ_目标，反解动点参数 λ 并严格检验 λ ∈ [0, 1] 判断动点存在性。",
        };
      case "doublePointDistance":
        return {
          variant: "warning" as const,
          badge: "高考压轴 · 双动点空间距离最值与公垂线",
          condition:
            "动点 P 沿棱 AA₁ 滑动 (分比 λ)，动点 Q 沿面对角线 BC 滑动 (分比 μ)。",
          question:
            "展开空间距离二次型函数 |PQ|²(λ, μ)，通过配方法求极值：当 λ=0 且 μ=a²/(a²+b²) 时，线段 PQ 为异面直线公垂线，取得最短空间距离。",
        };
      case "pyramidVolumeExtrema":
        return {
          variant: "success" as const,
          badge: "高考经典 · 动点三棱锥体积极值与单调性",
          condition:
            "三棱锥 P-ACD 中动点 P 沿侧棱 BB₁ 滑动，底面 △ACD 固定于长方体底面。",
          question:
            "固定底面 △ACD 面积为 ab/2，动高 h(λ)=λc 线性单调递增，分析体积函数 V(λ) = 1/6 ab(λc) 的单调性并在顶点 B₁(λ=1) 处取得最大值。",
        };
      case "surfaceShortestPath":
        return {
          variant: "accent" as const,
          badge: "立体几何经典 · 表面最短路径化曲为平",
          condition:
            "在长方体表面寻找从顶点 A 沿外表面爬行至相对顶点 C₁ 的折线最短路径。",
          question:
            "将相邻侧面与底面展成平面，由两点之间线段最短比较不同展开路线长 L = min{√((a+b)²+c²), √(a²+(b+c)²)} 并确定侧面最佳折点。",
        };
    }
  }, [activeMode]);

  // 10. 三视图数据
  const viewsData = useMemo(() => {
    return buildSolidViews("cuboid", { width: a, depth: b, height: c });
  }, [a, b, c]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* Step 1: 探究模式 (2×2 布局防截断) */}
          <LeftPanelSection title="探究模式">
            <SelectGrid
              items={[
                {
                  key: "singlePointAngle",
                  label: "棱上动点与空间角",
                },
                {
                  key: "doublePointDistance",
                  label: "双动点与距离最值",
                },
                {
                  key: "pyramidVolumeExtrema",
                  label: "动点三棱锥体积极值",
                },
                {
                  key: "surfaceShortestPath",
                  label: "表面最短路径",
                },
              ]}
              value={activeMode}
              onChange={(m) => handleModeChange(m as ParametricMode)}
              columns={2}
            />
          </LeftPanelSection>

          {/* Step 2: 典型模型预设 (黄金 2×2 对称网格) */}
          <LeftPanelSection title="典型模型预设">
            <SelectGrid
              items={
                activeMode === "singlePointAngle"
                  ? [
                      {
                        key: "free",
                        label: "自由探索",
                      },
                      {
                        key: "perp",
                        label: "垂直存在性",
                      },
                      {
                        key: "midpoint",
                        label: "棱上中点构型",
                      },
                      {
                        key: "targetAngle",
                        label: "目标二面角",
                      },
                    ]
                  : activeMode === "doublePointDistance"
                    ? [
                        {
                          key: "free",
                          label: "自由探索",
                        },
                        {
                          key: "commonPerp",
                          label: "公垂线最值",
                        },
                        {
                          key: "vertexDist",
                          label: "顶点极值对位",
                        },
                        {
                          key: "diagMidpoint",
                          label: "中点对称对位",
                        },
                      ]
                    : activeMode === "pyramidVolumeExtrema"
                      ? [
                          {
                            key: "free",
                            label: "自由探索",
                          },
                          {
                            key: "maxVolume",
                            label: "体积极大值",
                            description: "到达顶点 B₁",
                          },
                          {
                            key: "halfVolume",
                            label: "等分体积",
                            description: "棱中点 λ=0.5",
                          },
                          {
                            key: "degenerate",
                            label: "底面退化",
                            description: "λ = 0 高为零",
                          },
                        ]
                      : [
                          {
                            key: "free",
                            label: "自由探究",
                            description: "折点自由滑动",
                          },
                          {
                            key: "optimalSide",
                            label: "侧面最佳折点",
                            description: "侧面直线最短",
                          },
                          {
                            key: "optimalBottom",
                            label: "底面展开对比",
                            description: "底侧路线比较",
                          },
                          {
                            key: "midpointPath",
                            label: "中点折线",
                            description: "λ = 0.5 路径",
                          },
                        ]
              }
              value={presetKey}
              onChange={handlePresetChange}
              columns={2}
            />
          </LeftPanelSection>

          {/* Step 3: 参数调节 (根据预设动态裁剪) */}
          <LeftPanelSection title="参数调节">
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
          </LeftPanelSection>

          {/* Step 4: 视图与视角 */}
          <LeftPanelSection title="3D 空间视角预设">
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
                    { key: "iso", label: "轴测直观" },
                    { key: "front", label: "主视正投" },
                    { key: "top", label: "俯视底面" },
                    { key: "side", label: "左视侧面" },
                  ]}
                  value={preset}
                  onChange={(p) => setCameraPreset(p as CameraPreset)}
                />
              )}
            </div>
          </LeftPanelSection>

          {/* Step 5: 教学提示与题设导引（置于左屏底部） */}
          <LeftPanelSection title="教学导引与题设背景" compact>
            <TipCard variant={tipConfig.variant}>
              <div className="flex items-center justify-between font-semibold text-xs mb-1.5 border-b border-black/5 pb-1">
                <span>{tipConfig.badge}</span>
              </div>
              <div className="space-y-1 text-[11px] leading-relaxed">
                <div>
                  <span className="font-semibold text-neutral-800">
                    【初始条件】
                  </span>
                  <span className="text-neutral-600">
                    {tipConfig.condition}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-neutral-800">
                    【探究设问】
                  </span>
                  <span className="text-neutral-600">{tipConfig.question}</span>
                </div>
              </div>
            </TipCard>
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
                            label: "动线段 PQ / 公垂线",
                          },
                        ]
                      : []),
                    ...(activeMode === "pyramidVolumeExtrema"
                      ? [
                          {
                            colorKey: "secondary" as const,
                            swatch: "area" as const,
                            label: "底面 △ACD",
                          },
                          {
                            colorKey: "paramTertiary" as const,
                            swatch: "line" as const,
                            label: "动高线 h(λ)",
                          },
                        ]
                      : []),
                    ...(activeMode === "surfaceShortestPath"
                      ? [
                          {
                            colorKey: "secondary" as const,
                            swatch: "line" as const,
                            label: "理论最佳折点 P₁",
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

              {/* 共享 3D 基底：长方体骨架 + 顶点标注 + 导轨 + 可拖拽动点 P */}
              <ParametricPointBaseScene
                a={a}
                b={b}
                c={c}
                P={P}
                A={A}
                B={B}
                C={C}
                D={D}
                A1={A1}
                B1={B1}
                C1={C1}
                D1={D1}
                interactionMode={interactionMode}
                onPDrag={handlePDrag}
              />

              {/* ═════════ 模式一：单动点与空间角及存在性 ═════════ */}
              {activeMode === "singlePointAngle" && (
                <SinglePointAngleModeScene
                  a={a}
                  c={c}
                  P={P}
                  A={A}
                  C={C}
                  D={D}
                  C1={C1}
                  B1={B1}
                  resSingle={resSingle}
                />
              )}

              {/* ═════════ 模式二：双动点与向量最值 ═════════ */}
              {activeMode === "doublePointDistance" && (
                <DoublePointDistanceModeScene
                  a={a}
                  b={b}
                  lambda={lambda}
                  mu={mu}
                  P={P}
                  Q={Q}
                  A={A}
                  C={C}
                  resDouble={resDouble}
                  interactionMode={interactionMode}
                  onQDrag={handleQDrag}
                />
              )}

              {/* ═════════ 模式三：动点三棱锥体积极值 ═════════ */}
              {activeMode === "pyramidVolumeExtrema" && (
                <PyramidVolumeModeScene
                  a={a}
                  P={P}
                  A={A}
                  B={B}
                  C={C}
                  D={D}
                  resVolume={resVolume}
                />
              )}

              {/* ═════════ 模式四：表面展开最短路径 ═════════ */}
              {activeMode === "surfaceShortestPath" && (
                <SurfacePathModeScene A={A} P={P} C1={C1} resPath={resPath} />
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
