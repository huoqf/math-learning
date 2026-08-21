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
  AngleArc3D,
} from "@/components/Math3D";
import { Cuboid } from "@/components/Math3D/solids";
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
import { distance } from "@/math3d/vector3";

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

  // 7. 左屏参数配置与动态裁剪（铁律 3：特定预设下隐藏已锁定的特征点参数，自由探究下全量展开）
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

  // 8. 教学提示配置
  const tipConfig = useMemo(() => {
    switch (activeMode) {
      case "singlePointAngle":
        return {
          variant: "primary" as const,
          formula:
            "\\cos\\theta(\\lambda) = \\frac{|\\vec{n}_{PAC}\\cdot\\vec{n}_0|}{|\\vec{n}_{PAC}||\\vec{n}_0|}",
          text: "设动点坐标 P(a, 0, λc)，利用法向量夹角列方程反求 λ，并检验 λ ∈ [0, 1] 严格判断动点存在性。",
        };
      case "doublePointDistance":
        return {
          variant: "warning" as const,
          formula:
            "|PQ|^2 = (a^2+b^2)\\left(\\mu - \\frac{a^2}{a^2+b^2}\\right)^2 + \\frac{a^2b^2}{a^2+b^2} + \\lambda^2 c^2",
          text: "双参数二次型最值：通过配方法独立求各变量极小，当 λ=0 且 μ=a²/(a²+b²) 时取公垂线最短距离。",
        };
      case "pyramidVolumeExtrema":
        return {
          variant: "primary" as const,
          formula:
            "V_{P-ACD}(\\lambda) = \\frac{1}{3} S_{\\Delta ACD} \\cdot h(\\lambda) = \\frac{1}{6} a b (\\lambda c) \\le V_{\\max}",
          text: "动点三棱锥体积极值：固定底面 △ACD 面积恒为 ab/2，动高 h(λ)=λc 线性单调递增，极值在端点 B₁(λ=1) 处取得。",
        };
      case "surfaceShortestPath":
        return {
          variant: "success" as const,
          formula:
            "L_{\\min} = \\min\\{\\sqrt{(a+b)^2+c^2}, \\sqrt{a^2+(b+c)^2}\\}",
          text: "立体几何表面最短路径：“化曲为平，展成平面”。展开相邻侧面与底面，两点之间直线段最短。",
        };
    }
  }, [activeMode]);

  // 9. 三视图数据
  const viewsData = useMemo(() => {
    return buildSolidViews("cuboid", { width: a, depth: b, height: c });
  }, [a, b, c]);

  // 截面中心与法向量缩放
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

  // 公垂线判断
  const isAtCommonPerp =
    Math.abs(mu - resDouble.optimalMu) < 0.03 && lambda < 0.05;

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
                  description: "存在性与方程求解",
                },
                {
                  key: "doublePointDistance",
                  label: "双动点与距离最值",
                  description: "二次型与公垂线",
                },
                {
                  key: "pyramidVolumeExtrema",
                  label: "动点三棱锥体积极值",
                  description: "动高模型与单调性",
                },
                {
                  key: "surfaceShortestPath",
                  label: "表面最短路径",
                  description: "化曲为平展开图",
                },
              ]}
              value={activeMode}
              onChange={(m) => handleModeChange(m as ParametricMode)}
              columns={2}
            />
          </LeftPanelSection>

          {/* Step 2: 典型高考预设 (2×2 黄金预设规范) */}
          <LeftPanelSection title="典型高考预设">
            <SelectGrid
              items={
                activeMode === "singlePointAngle"
                  ? [
                      {
                        key: "free",
                        label: "自由探究",
                        description: "全参数开放",
                      },
                      {
                        key: "perp",
                        label: "垂直存在性",
                        description: "DP ⊥ AC₁",
                      },
                      {
                        key: "midpoint",
                        label: "棱上中点",
                        description: "λ = 0.5",
                      },
                      {
                        key: "targetAngle",
                        label: "目标二面角",
                        description: `θ = ${targetThetaDeg}°`,
                      },
                    ]
                  : activeMode === "doublePointDistance"
                    ? [
                        {
                          key: "free",
                          label: "自由探究",
                          description: "双参自由滑动",
                        },
                        {
                          key: "commonPerp",
                          label: "公垂线最值",
                          description: "最短异面距",
                        },
                        {
                          key: "vertexDist",
                          label: "顶点对位",
                          description: "B₁ 到 A 点",
                        },
                        {
                          key: "diagMidpoint",
                          label: "中点对位",
                          description: "双棱中点",
                        },
                      ]
                    : activeMode === "pyramidVolumeExtrema"
                      ? [
                          {
                            key: "free",
                            label: "自由探究",
                            description: "动点自由滑动",
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
          <LeftPanelSection
            title="几何与动点参数调节"
            subtitle={
              presetKey === "free"
                ? "拖动滑块或在 3D 场景中直接拖拽动点 P / Q"
                : "当前预设已锁定特征点参数，调参自动切回自由探究"
            }
          >
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
          </LeftPanelSection>

          {/* Step 4: 教学提示 */}
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

          {/* Step 5: 视图与视角 */}
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
              {/* 空间直角坐标系（纯三轴系统，彻底移除地面网格） */}
              <Scene3DGrid size={5.5} showGrid={false} />

              {/* 长方体透视骨架 (尺寸与顶点 100% 精确贴合) */}
              <Cuboid a={a} b={b} c={c} opacity={0.12} colorKey="primary" />

              {/* 顶点文本标注（纯 3D 矢量文字，严格使用 CompoundLabel3D 消除豆腐块） */}
              <PointLabel3D position={A} text="A" offset={[-0.2, -0.2, -0.1]} />
              <PointLabel3D position={B} text="B" offset={[0.2, -0.2, -0.1]} />
              <PointLabel3D position={C} text="C" offset={[0.2, 0.2, -0.1]} />
              <PointLabel3D position={D} text="D" offset={[-0.2, 0.2, -0.1]} />
              <CompoundLabel3D
                position={A1}
                base="A"
                subscript="1"
                offset={[-0.2, -0.2, 0.2]}
              />
              <CompoundLabel3D
                position={B1}
                base="B"
                subscript="1"
                offset={[0.2, -0.2, 0.2]}
              />
              <CompoundLabel3D
                position={C1}
                base="C"
                subscript="1"
                offset={[0.2, 0.2, 0.2]}
              />
              <CompoundLabel3D
                position={D1}
                base="D"
                subscript="1"
                offset={[-0.2, 0.2, 0.2]}
              />

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
                onDrag={(next) => {
                  setPresetKey("free");
                  setParams((prev) => ({
                    ...prev,
                    lambda: Number((next.z / c).toFixed(2)),
                  }));
                }}
                colorKey="highlight"
              />
              <PointLabel3D position={P} text="P" offset={[0.18, 0, 0.1]} />

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
                        tex="\\vec{n}"
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

                  {/* 存在性目标点指示：当未与当前动点 P 重叠时才显示 P_0 辅助点 */}
                  {resSingle.isTargetDihedralExist &&
                    distance(P, resSingle.dihedralTargetP) > 0.25 && (
                      <>
                        <Point3D
                          position={resSingle.dihedralTargetP}
                          colorKey="paramTertiary"
                        />
                        <CompoundLabel3D
                          position={resSingle.dihedralTargetP}
                          base="P"
                          subscript="0"
                          offset={[0.2, 0, 0]}
                        />
                      </>
                    )}

                  {/* 超界虚线导轨延伸指示 */}
                  {!resSingle.isTargetDihedralExist && (
                    <Segment3D
                      from={B1}
                      to={{
                        x: a,
                        y: 0,
                        z: Math.min(
                          c * 1.5,
                          Math.max(c + 0.8, resSingle.dihedralTargetP.z),
                        ),
                      }}
                      colorKey="highlight"
                      dashed
                      lineWidth={1.5}
                    />
                  )}
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
                      setPresetKey("free");
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
                    text="Q"
                    offset={[0.15, 0.15, -0.1]}
                  />

                  {/* 动线段 PQ (纯几何线段，无箭头) */}
                  <Segment3D
                    from={P}
                    to={Q}
                    colorKey={isAtCommonPerp ? "paramTertiary" : "highlight"}
                    lineWidth={isAtCommonPerp ? 3.5 : 3}
                  />

                  {/* 当到达公垂线极值时，渲染双直角方框 */}
                  {isAtCommonPerp && (
                    <>
                      <AngleArc3D
                        vertex={resDouble.optimalFootOnBB1}
                        dirA={{ x: 0, y: 0, z: 1 }}
                        dirB={{
                          x: resDouble.optimalFootOnAC.x - a,
                          y: resDouble.optimalFootOnAC.y,
                          z: 0,
                        }}
                        radius={0.35}
                        isRight
                        colorKey="paramTertiary"
                      />
                    </>
                  )}
                </>
              )}

              {/* 模式三：动点三棱锥体积极值 */}
              {activeMode === "pyramidVolumeExtrema" && (
                <>
                  {/* 底面 △ACD 半透明面片 */}
                  <Polygon3DFace
                    points={[A, C, D]}
                    colorKey="secondary"
                    opacity={0.3}
                  />

                  {/* 底面三边 */}
                  <Segment3D
                    from={A}
                    to={C}
                    colorKey="secondary"
                    lineWidth={2}
                  />
                  <Segment3D
                    from={C}
                    to={D}
                    colorKey="secondary"
                    lineWidth={2}
                  />
                  <Segment3D
                    from={D}
                    to={A}
                    colorKey="secondary"
                    lineWidth={2}
                  />

                  {/* 棱锥三条侧棱 PA, PC, PD */}
                  <Segment3D
                    from={P}
                    to={A}
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
                    from={P}
                    to={D}
                    colorKey="highlight"
                    lineWidth={2.5}
                  />

                  {/* 动高线 PB 垂线段 (纯几何线段，虚线高) */}
                  <Segment3D
                    from={P}
                    to={B}
                    colorKey="paramTertiary"
                    dashed
                    lineWidth={2.5}
                  />
                  {resVolume.heightH > 0.4 && (
                    <FormulaLabel3D
                      position={{
                        x: a + 0.25,
                        y: 0,
                        z: resVolume.heightH / 2,
                      }}
                      tex={`h=${resVolume.heightH.toFixed(1)}`}
                    />
                  )}

                  {/* 垂足 B 处直角方框 */}
                  <AngleArc3D
                    vertex={B}
                    dirA={{ x: 0, y: 0, z: 1 }}
                    dirB={{ x: -1, y: 0, z: 0 }}
                    radius={0.35}
                    isRight
                    colorKey="paramTertiary"
                  />
                </>
              )}

              {/* 模式四：表面展开最短路径 */}
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
                    offset={[-0.3, 0, 0.1]}
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
